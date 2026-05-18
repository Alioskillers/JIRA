import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from '../../src/tasks/tasks.service';
import {
  mockAwsService, mockConfigService, mockMetricsService,
  mockDynamoDb, mockSns, mockS3,
  managerUser, frontendEmployee, backendEmployee,
  frontendTask, backendTask,
} from '../mocks/aws.mock';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasksService(
      mockAwsService as any,
      mockConfigService as any,
      mockMetricsService as any,
    );
  });

  // ─── ROLE-BASED ACCESS: findAll ───────────────────────────────────────────

  describe('findAll — role-based visibility', () => {
    it('manager sees ALL tasks via Scan (no team filter)', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [frontendTask, backendTask] });

      const result = await service.findAll(managerUser);

      expect(result).toHaveLength(2);
      expect(result.find((t: any) => t.taskId === 'task-frontend-001')).toBeDefined();
      expect(result.find((t: any) => t.taskId === 'task-backend-001')).toBeDefined();
    });

    it('employee sees ONLY their team tasks via GSI query', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [frontendTask] });

      const result = await service.findAll(frontendEmployee);

      expect(result).toHaveLength(1);
      expect(result[0].taskId).toBe('task-frontend-001');
    });

    it('employee on Backend team does NOT see Frontend tasks', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [backendTask] });

      const result = await service.findAll(backendEmployee);

      expect(result).toHaveLength(1);
      expect(result[0].taskId).toBe('task-backend-001');
      expect(result.find((t: any) => t.taskId === 'task-frontend-001')).toBeUndefined();
    });

    it('user with no team gets empty list without hitting DynamoDB', async () => {
      const noTeamUser = { ...frontendEmployee, teamId: 'unassigned' };

      const result = await service.findAll(noTeamUser);

      expect(result).toHaveLength(0);
      expect(mockDynamoDb.send).not.toHaveBeenCalled();
    });

    it('employee GSI query uses correct teamId-index and KeyConditionExpression', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [] });

      await service.findAll(frontendEmployee);

      const call = mockDynamoDb.send.mock.calls[0][0];
      expect(call.input.IndexName).toBe('teamId-index');
      expect(call.input.KeyConditionExpression).toContain('teamId');
      expect(call.input.ExpressionAttributeValues[':teamId']).toBe(frontendEmployee.teamId);
    });
  });

  // ─── TEAM ISOLATION: findOne ──────────────────────────────────────────────

  describe('findOne — team isolation', () => {
    it('manager can fetch any task regardless of team', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendTask });

      const result = await service.findOne('task-frontend-001', managerUser);

      expect(result.taskId).toBe('task-frontend-001');
    });

    it('employee can fetch their own team task', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendTask });

      const result = await service.findOne('task-frontend-001', frontendEmployee);

      expect(result.taskId).toBe('task-frontend-001');
    });

    it('employee CANNOT fetch a task from another team — throws 403', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendTask });

      await expect(service.findOne('task-frontend-001', backendEmployee))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws 404 for non-existent task', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: undefined });

      await expect(service.findOne('ghost-id', managerUser))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── TASK CREATION ───────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      title: 'New Feature',
      description: 'Build it',
      priority: 'high',
      deadline: '2026-05-30',
      assigneeId: frontendEmployee.userId,
      assigneeName: frontendEmployee.name,
      assigneeEmail: frontendEmployee.email,
      teamId: frontendEmployee.teamId,
      teamName: 'Frontend',
    };

    it('saves task to DynamoDB with correct fields', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({});
      mockSns.send.mockResolvedValueOnce({});

      const result = await service.create(dto, null, null, managerUser);

      expect(result.title).toBe('New Feature');
      expect(result.status).toBe('todo');
      expect(result.createdBy).toBe(managerUser.userId);
      expect(result.teamId).toBe(frontendEmployee.teamId);
      expect(result.taskId).toBeDefined();
      expect(result.auditLog).toEqual([]);
    });

    it('publishes SNS notification on task creation', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({});
      mockSns.send.mockResolvedValueOnce({});

      await service.create(dto, null, null, managerUser);

      expect(mockSns.send).toHaveBeenCalledTimes(1);
    });

    it('SNS message has correct TASK_ASSIGNED type and fields', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({});
      mockSns.send.mockResolvedValueOnce({});

      await service.create(dto, null, null, managerUser);

      const snsCall = mockSns.send.mock.calls[0][0];
      const message = JSON.parse(snsCall.input.Message);
      expect(message.type).toBe('TASK_ASSIGNED');
      expect(message.assigneeId).toBe(frontendEmployee.userId);
      expect(message.teamId).toBe(frontendEmployee.teamId);
      expect(message.managerName).toBeTruthy();
    });

    it('publishes TasksCreated CloudWatch metric', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({});
      mockSns.send.mockResolvedValueOnce({});

      await service.create(dto, null, null, managerUser);

      expect(mockMetricsService.publishMetric).toHaveBeenCalledWith('TasksCreated', 1);
    });

    it('uploads image to S3 and stores imageKey when image provided', async () => {
      mockS3.send.mockResolvedValueOnce({});
      mockDynamoDb.send.mockResolvedValueOnce({});
      mockSns.send.mockResolvedValueOnce({});

      const result = await service.create(dto, Buffer.from('img'), 'jpg', managerUser);

      expect(result.imageKey).toMatch(/^tasks\/.+\/.+\.jpg$/);
      expect(mockS3.send).toHaveBeenCalledTimes(1);
    });

    it('does NOT call S3 when no image provided', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({});
      mockSns.send.mockResolvedValueOnce({});

      await service.create(dto, null, null, managerUser);

      expect(mockS3.send).not.toHaveBeenCalled();
    });
  });

  // ─── STATUS LIFECYCLE ─────────────────────────────────────────────────────

  describe('updateStatus — task lifecycle', () => {
    it.each([
      ['todo', 'inprogress'],
      ['inprogress', 'inreview'],
      ['inreview', 'done'],
      ['done', 'todo'],
    ])('allows status transition %s → %s', async (from, to) => {
      const task = { ...frontendTask, status: from };
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: task })
        .mockResolvedValueOnce({ Attributes: { ...task, status: to } });

      const result = await service.updateStatus(task.taskId, to, frontendEmployee);

      expect(result!.status).toBe(to);
    });

    it('appends audit log entry on status change', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: frontendTask })
        .mockResolvedValueOnce({ Attributes: { ...frontendTask, status: 'inprogress' } });

      await service.updateStatus(frontendTask.taskId, 'inprogress', frontendEmployee);

      const updateCall = mockDynamoDb.send.mock.calls[1][0];
      expect(updateCall.input.UpdateExpression).toContain('auditLog');
      const entry = updateCall.input.ExpressionAttributeValues[':entry'][0];
      expect(entry.fromStatus).toBe('todo');
      expect(entry.toStatus).toBe('inprogress');
      expect(entry.userId).toBe(frontendEmployee.userId);
    });

    it('publishes TasksClosed metric when moved to done', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: { ...frontendTask, status: 'inreview' } })
        .mockResolvedValueOnce({ Attributes: { ...frontendTask, status: 'done' } });

      await service.updateStatus(frontendTask.taskId, 'done', frontendEmployee);

      expect(mockMetricsService.publishMetricWithDimension)
        .toHaveBeenCalledWith('TasksClosed', 1, 'TeamId', frontendEmployee.teamId);
    });

    it('publishes TimeToCloseHours metric when moved to done', async () => {
      const old = { ...frontendTask, status: 'inreview', createdAt: new Date(Date.now() - 3_600_000 * 5).toISOString() };
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: old })
        .mockResolvedValueOnce({ Attributes: { ...old, status: 'done' } });

      await service.updateStatus(old.taskId, 'done', frontendEmployee);

      const calls = mockMetricsService.publishMetricWithDimension.mock.calls;
      const timeCall = calls.find((c: any) => c[0] === 'TimeToCloseHours');
      expect(timeCall).toBeDefined();
      expect(timeCall[1]).toBeGreaterThan(0);
    });

    it('employee CANNOT change status of another team\'s task', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendTask });

      await expect(service.updateStatus(frontendTask.taskId, 'inprogress', backendEmployee))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ─── TASK UPDATE ──────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates task fields and returns updated item', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: frontendTask })
        .mockResolvedValueOnce({ Attributes: { ...frontendTask, title: 'Updated' } });

      const result = await service.update(frontendTask.taskId, { title: 'Updated' }, null, null);

      expect(result!.title).toBe('Updated');
    });

    it('replacing image keeps old key in imageVersions array', async () => {
      const withImg = { ...frontendTask, imageKey: 'tasks/t1/old.jpg', imageVersions: ['tasks/t1/old.jpg'] };
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: withImg })
        .mockResolvedValueOnce({ Attributes: withImg });
      mockS3.send.mockResolvedValueOnce({});

      await service.update(withImg.taskId, { title: 'X' }, Buffer.from('new'), 'jpg');

      const updateCall = mockDynamoDb.send.mock.calls[1][0];
      const versions = updateCall.input.ExpressionAttributeValues[':imageVersions'];
      expect(versions).toContain('tasks/t1/old.jpg');
    });
  });

  // ─── TASK DELETION ────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes task record from DynamoDB', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: frontendTask })
        .mockResolvedValueOnce({});

      const result = await service.remove(frontendTask.taskId);

      expect(result.deleted).toBe(true);
    });

    it('deletes all S3 image versions on task deletion', async () => {
      const withImgs = { ...frontendTask, imageVersions: ['tasks/t1/v1.jpg', 'tasks/t1/v2.jpg'] };
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: withImgs })
        .mockResolvedValueOnce({});
      mockS3.send
        .mockResolvedValueOnce({ Versions: [{ Key: 'tasks/t1/v1.jpg', VersionId: 'v1' }], DeleteMarkers: [] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ Versions: [{ Key: 'tasks/t1/v2.jpg', VersionId: 'v2' }], DeleteMarkers: [] })
        .mockResolvedValueOnce({});

      await service.remove(withImgs.taskId);

      expect(mockS3.send).toHaveBeenCalledTimes(4);
    });

    it('throws 404 for non-existent task', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: undefined });

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});
