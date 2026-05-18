/**
 * Lambda function unit tests
 * Tests image-resize, assignment-worker, and daily-digest handlers
 */

// ─── image-resize ─────────────────────────────────────────────────────────

const mockS3Send = jest.fn();
const mockSharpInstance = {
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized-image')),
};

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({ send: mockS3Send })),
  GetObjectCommand: jest.fn(input => ({ input })),
  PutObjectCommand: jest.fn(input => ({ input })),
}));

jest.mock('sharp', () => jest.fn(() => mockSharpInstance));

describe('Lambda: image-resize', () => {
  let handler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.S3_RESIZED_BUCKET = 'mini-jira-resized-test';
    process.env.AWS_REGION = 'us-east-1';

    const chunks = [Buffer.from('original-image')];
    interface MockStream { on: jest.Mock }
    const mockStream: MockStream = {
      on: jest.fn((event: string, cb: (arg?: Buffer) => void): MockStream => {
        if (event === 'data') cb(chunks[0]);
        if (event === 'end') cb();
        return mockStream;
      }),
    };
    mockS3Send.mockResolvedValue({ Body: mockStream });

    handler = require('../../lambdas/image-resize/index');
  });

  it('resizes image to 300×300 and saves to resized bucket', async () => {
    const event = {
      Records: [{
        s3: {
          bucket: { name: 'mini-jira-originals-test' },
          object: { key: 'tasks/task-001/image.jpg' },
        },
      }],
    };

    await handler.handler(event);

    expect(mockSharpInstance.resize).toHaveBeenCalledWith(300, 300, { fit: 'cover', position: 'center' });
    expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 85 });
    expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    expect(mockS3Send).toHaveBeenCalledTimes(2); // GET + PUT
  });

  it('saves resized image to the resized bucket with same key', async () => {
    const event = {
      Records: [{
        s3: {
          bucket: { name: 'mini-jira-originals-test' },
          object: { key: 'tasks/task-001/photo.png' },
        },
      }],
    };

    await handler.handler(event);

    const putCall = mockS3Send.mock.calls[1][0];
    expect(putCall.input.Bucket).toBe('mini-jira-resized-test');
    expect(putCall.input.Key).toBe('tasks/task-001/photo.png');
    expect(putCall.input.ContentType).toBe('image/jpeg');
  });

  it('handles URL-encoded S3 key with + signs', async () => {
    const event = {
      Records: [{
        s3: {
          bucket: { name: 'mini-jira-originals-test' },
          object: { key: 'tasks/task+001/my+image.jpg' },
        },
      }],
    };

    await handler.handler(event);

    const getCall = mockS3Send.mock.calls[0][0];
    expect(getCall.input.Key).toBe('tasks/task 001/my image.jpg');
  });
});

// ─── assignment-worker ────────────────────────────────────────────────────

const mockDynamoSend = jest.fn();
const mockCwSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({})),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockDynamoSend })) },
  PutCommand: jest.fn(input => ({ input })),
}));

jest.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: jest.fn(() => ({ send: mockCwSend })),
  PutMetricDataCommand: jest.fn(input => ({ input })),
}));

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid-001') }));

describe('Lambda: assignment-worker', () => {
  let handler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.DYNAMODB_TABLE_ACTIVITY = 'ActivityLog';
    process.env.CW_NAMESPACE = 'MiniJira';

    mockDynamoSend.mockResolvedValue({});
    mockCwSend.mockResolvedValue({});

    handler = require('../../lambdas/assignment-worker/index');
  });

  const makeSqsEvent = (message: object) => ({
    Records: [{
      body: JSON.stringify({
        Message: JSON.stringify(message),
      }),
    }],
  });

  it('writes ActivityLog entry to DynamoDB on task assignment', async () => {
    const event = makeSqsEvent({
      taskId: 'task-001',
      taskTitle: 'Design Page',
      assigneeId: 'employee-001',
      teamId: 'team-frontend-001',
    });

    await handler.handler(event);

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    const putCall = mockDynamoSend.mock.calls[0][0];
    expect(putCall.input.Item.type).toBe('TASK_ASSIGNED');
    expect(putCall.input.Item.taskId).toBe('task-001');
    expect(putCall.input.Item.teamId).toBe('team-frontend-001');
    expect(putCall.input.Item.logId).toBe('mock-uuid-001');
  });

  it('publishes TasksAssignedPerTeam CloudWatch metric with TeamId dimension', async () => {
    const event = makeSqsEvent({
      taskId: 'task-001',
      assigneeId: 'employee-001',
      teamId: 'team-frontend-001',
    });

    await handler.handler(event);

    expect(mockCwSend).toHaveBeenCalledTimes(1);
    const cwCall = mockCwSend.mock.calls[0][0];
    const metric = cwCall.input.MetricData[0];
    expect(metric.MetricName).toBe('TasksAssignedPerTeam');
    expect(metric.Dimensions[0]).toEqual({ Name: 'TeamId', Value: 'team-frontend-001' });
    expect(metric.Value).toBe(1);
  });

  it('handles multiple SQS records in one batch', async () => {
    const event = {
      Records: [
        { body: JSON.stringify({ Message: JSON.stringify({ taskId: 't1', assigneeId: 'e1', teamId: 'team-1' }) }) },
        { body: JSON.stringify({ Message: JSON.stringify({ taskId: 't2', assigneeId: 'e2', teamId: 'team-2' }) }) },
      ],
    };

    await handler.handler(event);

    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
    expect(mockCwSend).toHaveBeenCalledTimes(2);
  });

  it('continues processing remaining records if one fails', async () => {
    mockDynamoSend
      .mockRejectedValueOnce(new Error('DynamoDB error'))
      .mockResolvedValueOnce({});

    const event = {
      Records: [
        { body: JSON.stringify({ Message: JSON.stringify({ taskId: 't1', assigneeId: 'e1', teamId: 'team-1' }) }) },
        { body: JSON.stringify({ Message: JSON.stringify({ taskId: 't2', assigneeId: 'e2', teamId: 'team-2' }) }) },
      ],
    };

    await expect(handler.handler(event)).resolves.toBeDefined();
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });
});

// ─── daily-digest ─────────────────────────────────────────────────────────

const mockDigestDynamoSend = jest.fn();
const mockSnsSend = jest.fn();

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn(() => ({ send: mockSnsSend })),
  PublishCommand: jest.fn(input => ({ input })),
}));

describe('Lambda: daily-digest', () => {
  let handler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.DYNAMODB_TABLE_TASKS = 'Tasks';
    process.env.SNS_DIGEST_TOPIC_ARN = 'arn:aws:sns:us-east-1:123:digest-topic';

    mockSnsSend.mockResolvedValue({});
  });

  it('scans for tasks due today and publishes one SNS message per task', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockDigestDynamoSend.mockResolvedValueOnce({
      Items: [
        { taskId: 't1', title: 'Fix Bug', assigneeName: 'Sara', priority: 'high', status: 'inprogress', deadline: today },
        { taskId: 't2', title: 'Write Tests', assigneeName: 'Omar', priority: 'medium', status: 'todo', deadline: today },
      ],
    });

    jest.mock('@aws-sdk/lib-dynamodb', () => ({
      DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockDigestDynamoSend })) },
      ScanCommand: jest.fn(input => ({ input })),
    }));

    handler = require('../../lambdas/daily-digest/index');
    await handler.handler({});

    expect(mockSnsSend).toHaveBeenCalledTimes(2);
  });

  it('SNS message mentions assignee name, task title, and priority', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockDigestDynamoSend.mockResolvedValueOnce({
      Items: [{ taskId: 't1', title: 'Deploy v2', assigneeName: 'Sara', priority: 'critical', status: 'todo', deadline: today }],
    });

    jest.mock('@aws-sdk/lib-dynamodb', () => ({
      DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockDigestDynamoSend })) },
      ScanCommand: jest.fn(input => ({ input })),
    }));

    handler = require('../../lambdas/daily-digest/index');
    await handler.handler({});

    const snsCall = mockSnsSend.mock.calls[0][0];
    expect(snsCall.input.Message).toContain('Sara');
    expect(snsCall.input.Message).toContain('Deploy v2');
    expect(snsCall.input.Message).toContain('critical');
    expect(snsCall.input.Subject).toContain('Deploy v2');
  });
});
