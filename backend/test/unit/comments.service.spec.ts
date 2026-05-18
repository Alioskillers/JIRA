import { ForbiddenException } from '@nestjs/common';
import { CommentsService } from '../../src/comments/comments.service';
import {
  mockAwsService, mockConfigService, mockDynamoDb,
  managerUser, frontendEmployee, backendEmployee, frontendTask,
} from '../mocks/aws.mock';

describe('CommentsService', () => {
  let service: CommentsService;
  let mockTasksService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTasksService = { findOne: jest.fn() };
    service = new CommentsService(mockAwsService as any, mockConfigService as any, mockTasksService);
  });

  describe('create', () => {
    it('employee posts comment on their own team task', async () => {
      mockTasksService.findOne.mockResolvedValueOnce(frontendTask);
      mockDynamoDb.send.mockResolvedValueOnce({});

      const result = await service.create(frontendTask.taskId, { content: 'LGTM!' }, frontendEmployee);

      expect(result.content).toBe('LGTM!');
      expect(result.authorId).toBe(frontendEmployee.userId);
      expect(result.authorName).toBe(frontendEmployee.name);
      expect(result.authorRole).toBe('employee');
      expect(result.taskId).toBe(frontendTask.taskId);
      expect(result.commentId).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('manager can comment on any task', async () => {
      mockTasksService.findOne.mockResolvedValueOnce(frontendTask);
      mockDynamoDb.send.mockResolvedValueOnce({});

      const result = await service.create(frontendTask.taskId, { content: 'Manager note' }, managerUser);

      expect(result.authorRole).toBe('manager');
    });

    it('employee CANNOT comment on another team task', async () => {
      mockTasksService.findOne.mockRejectedValueOnce(new ForbiddenException('Access denied'));

      await expect(
        service.create(frontendTask.taskId, { content: 'Hack' }, backendEmployee),
      ).rejects.toThrow(ForbiddenException);

      expect(mockDynamoDb.send).not.toHaveBeenCalled();
    });

    it('writes comment to DynamoDB Comments table', async () => {
      mockTasksService.findOne.mockResolvedValueOnce(frontendTask);
      mockDynamoDb.send.mockResolvedValueOnce({});

      await service.create(frontendTask.taskId, { content: 'Test' }, frontendEmployee);

      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
      const call = mockDynamoDb.send.mock.calls[0][0];
      expect(call.input.TableName).toBe('Comments');
    });
  });

  describe('findByTask', () => {
    it('employee reads comments on their team task', async () => {
      mockTasksService.findOne.mockResolvedValueOnce(frontendTask);
      mockDynamoDb.send.mockResolvedValueOnce({
        Items: [{ commentId: 'c1', content: 'A' }, { commentId: 'c2', content: 'B' }],
      });

      const result = await service.findByTask(frontendTask.taskId, frontendEmployee);

      expect(result).toHaveLength(2);
    });

    it('manager reads comments on any task', async () => {
      mockTasksService.findOne.mockResolvedValueOnce(frontendTask);
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [{ commentId: 'c1' }] });

      const result = await service.findByTask(frontendTask.taskId, managerUser);

      expect(result).toHaveLength(1);
    });

    it('employee CANNOT read comments on another team task', async () => {
      mockTasksService.findOne.mockRejectedValueOnce(new ForbiddenException('Access denied'));

      await expect(service.findByTask(frontendTask.taskId, backendEmployee))
        .rejects.toThrow(ForbiddenException);
    });

    it('returns empty array when task has no comments', async () => {
      mockTasksService.findOne.mockResolvedValueOnce(frontendTask);
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [] });

      const result = await service.findByTask(frontendTask.taskId, frontendEmployee);

      expect(result).toHaveLength(0);
    });
  });
});
