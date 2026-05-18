// Centralised AWS mock — imported by all test files

export const mockDynamoDb = {
  send: jest.fn(),
};

export const mockS3 = {
  send: jest.fn(),
};

export const mockSns = {
  send: jest.fn(),
};

export const mockCognito = {
  send: jest.fn(),
};

export const mockCloudWatch = {
  send: jest.fn(),
};

export const mockAwsService = {
  dynamoDb: mockDynamoDb,
  s3: mockS3,
  sns: mockSns,
  cognito: mockCognito,
  cloudWatch: mockCloudWatch,
};

export const mockMetricsService = {
  publishMetric: jest.fn().mockResolvedValue(undefined),
  publishMetricWithDimension: jest.fn().mockResolvedValue(undefined),
};

export const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      DYNAMODB_TABLE_TASKS: 'Tasks',
      DYNAMODB_TABLE_USERS: 'Users',
      DYNAMODB_TABLE_TEAMS: 'Teams',
      DYNAMODB_TABLE_PROJECTS: 'Projects',
      DYNAMODB_TABLE_COMMENTS: 'Comments',
      DYNAMODB_TABLE_ACTIVITY: 'ActivityLog',
      DYNAMODB_GSI_TEAM: 'teamId-index',
      DYNAMODB_GSI_ASSIGNEE: 'assigneeId-index',
      S3_ORIGINALS_BUCKET: 'mini-jira-originals-test',
      S3_RESIZED_BUCKET: 'mini-jira-resized-test',
      S3_PRESIGNED_URL_EXPIRES: '3600',
      SNS_TASK_TOPIC_ARN: 'arn:aws:sns:us-east-1:123:task-topic',
      COGNITO_USER_POOL_ID: 'us-east-1_TEST',
      COGNITO_CLIENT_ID: 'test-client-id',
      CW_NAMESPACE: 'MiniJira',
    };
    return config[key];
  }),
};

// Fixture users
export const managerUser = {
  userId: 'manager-001',
  email: 'ali@mini-jira.com',
  name: 'Ali',
  role: 'manager',
  teamId: 'unassigned',
};

export const frontendEmployee = {
  userId: 'employee-sara-001',
  email: 'sara@mini-jira.com',
  name: 'Sara',
  role: 'employee',
  teamId: 'team-frontend-001',
};

export const backendEmployee = {
  userId: 'employee-omar-001',
  email: 'omar@mini-jira.com',
  name: 'Omar',
  role: 'employee',
  teamId: 'team-backend-001',
};

export const frontendTask = {
  taskId: 'task-frontend-001',
  title: 'Design Landing Page',
  description: 'Create the new landing page design',
  status: 'todo',
  priority: 'high',
  deadline: '2026-05-20',
  assigneeId: frontendEmployee.userId,
  assigneeName: frontendEmployee.name,
  teamId: frontendEmployee.teamId,
  projectId: 'project-001',
  imageKey: null,
  resizedImageKey: null,
  imageVersions: [],
  createdBy: managerUser.userId,
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
  auditLog: [],
};

export const backendTask = {
  taskId: 'task-backend-001',
  title: 'Set Up API Gateway',
  description: 'Configure API Gateway for microservices',
  status: 'todo',
  priority: 'medium',
  deadline: '2026-05-22',
  assigneeId: backendEmployee.userId,
  assigneeName: backendEmployee.name,
  teamId: backendEmployee.teamId,
  projectId: 'project-001',
  imageKey: null,
  resizedImageKey: null,
  imageVersions: [],
  createdBy: managerUser.userId,
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
  auditLog: [],
};
