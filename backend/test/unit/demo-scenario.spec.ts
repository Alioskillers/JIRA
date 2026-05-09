/**
 * Demo Scenario Tests
 *
 * Verifies the exact demo requirement:
 *   Manager Ali creates Task A → Sara (Frontend team)
 *   Manager Ali creates Task B → Omar (Backend team)
 *   Sara logs in → sees ONLY Task A
 *   Omar logs in → sees ONLY Task B
 *   Ali logs in → sees BOTH tasks, can filter by team
 */

import { TasksService } from '../../src/tasks/tasks.service';
import {
  mockAwsService, mockConfigService, mockMetricsService,
  mockDynamoDb, mockSns,
  managerUser, frontendEmployee, backendEmployee,
  frontendTask, backendTask,
} from '../mocks/aws.mock';
import { ForbiddenException } from '@nestjs/common';

describe('Demo Scenario — Ali / Sara / Omar', () => {
  let tasksService: TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    tasksService = new TasksService(
      mockAwsService as any,
      mockConfigService as any,
      mockMetricsService as any,
    );
  });

  it('Step 1 — Ali creates Task A and assigns to Sara (Frontend team)', async () => {
    mockDynamoDb.send.mockResolvedValueOnce({});
    mockSns.send.mockResolvedValueOnce({});

    const taskA = await tasksService.create(
      {
        title: 'Design Landing Page',
        description: 'Task A for Sara',
        priority: 'high',
        deadline: '2026-05-20',
        assigneeId: frontendEmployee.userId,
        assigneeName: frontendEmployee.name,
        assigneeEmail: frontendEmployee.email,
        teamId: frontendEmployee.teamId,
        teamName: 'Frontend',
      },
      null,
      null,
      managerUser,
    );

    expect(taskA.assigneeId).toBe(frontendEmployee.userId);
    expect(taskA.teamId).toBe(frontendEmployee.teamId);
    expect(taskA.createdBy).toBe(managerUser.userId);
    expect(mockSns.send).toHaveBeenCalledTimes(1); // notification sent
  });

  it('Step 2 — Ali creates Task B and assigns to Omar (Backend team)', async () => {
    mockDynamoDb.send.mockResolvedValueOnce({});
    mockSns.send.mockResolvedValueOnce({});

    const taskB = await tasksService.create(
      {
        title: 'Set Up API Gateway',
        description: 'Task B for Omar',
        priority: 'medium',
        deadline: '2026-05-22',
        assigneeId: backendEmployee.userId,
        assigneeName: backendEmployee.name,
        assigneeEmail: backendEmployee.email,
        teamId: backendEmployee.teamId,
        teamName: 'Backend',
      },
      null,
      null,
      managerUser,
    );

    expect(taskB.assigneeId).toBe(backendEmployee.userId);
    expect(taskB.teamId).toBe(backendEmployee.teamId);
  });

  it('Step 3 — Sara logs in and sees ONLY Task A (her Frontend team task)', async () => {
    // DynamoDB GSI query returns only frontend tasks for Sara
    mockDynamoDb.send.mockResolvedValueOnce({ Items: [frontendTask] });

    const saraTasks = await tasksService.findAll(frontendEmployee);

    expect(saraTasks).toHaveLength(1);
    expect(saraTasks[0].taskId).toBe(frontendTask.taskId);
    expect(saraTasks[0].teamId).toBe(frontendEmployee.teamId);
  });

  it('Step 3b — Sara CANNOT access Task B by guessing Omar\'s task ID', async () => {
    // Backend task belongs to a different team
    mockDynamoDb.send.mockResolvedValueOnce({ Item: backendTask });

    await expect(tasksService.findOne(backendTask.taskId, frontendEmployee))
      .rejects.toThrow(ForbiddenException);
  });

  it('Step 4 — Omar logs in and sees ONLY Task B (his Backend team task)', async () => {
    mockDynamoDb.send.mockResolvedValueOnce({ Items: [backendTask] });

    const omarTasks = await tasksService.findAll(backendEmployee);

    expect(omarTasks).toHaveLength(1);
    expect(omarTasks[0].taskId).toBe(backendTask.taskId);
    expect(omarTasks[0].teamId).toBe(backendEmployee.teamId);
  });

  it('Step 4b — Omar CANNOT access Task A by guessing Sara\'s task ID', async () => {
    mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendTask });

    await expect(tasksService.findOne(frontendTask.taskId, backendEmployee))
      .rejects.toThrow(ForbiddenException);
  });

  it('Step 5 — Ali logs in and sees BOTH tasks across all teams', async () => {
    mockDynamoDb.send.mockResolvedValueOnce({ Items: [frontendTask, backendTask] });

    const aliTasks = await tasksService.findAll(managerUser);

    expect(aliTasks).toHaveLength(2);
    expect(aliTasks.find(t => t.taskId === frontendTask.taskId)).toBeDefined();
    expect(aliTasks.find(t => t.taskId === backendTask.taskId)).toBeDefined();
  });

  it('Step 5b — Ali can filter tasks by Frontend team', async () => {
    mockDynamoDb.send.mockResolvedValueOnce({ Items: [frontendTask] });

    const frontendTasks = await tasksService.findByTeam(frontendEmployee.teamId);

    expect(frontendTasks).toHaveLength(1);
    expect(frontendTasks[0].teamId).toBe(frontendEmployee.teamId);
  });

  it('Step 5c — Ali can filter tasks by Backend team', async () => {
    mockDynamoDb.send.mockResolvedValueOnce({ Items: [backendTask] });

    const backendTasks = await tasksService.findByTeam(backendEmployee.teamId);

    expect(backendTasks).toHaveLength(1);
    expect(backendTasks[0].teamId).toBe(backendEmployee.teamId);
  });

  it('Step 6 — Sara moves Task A from todo → inprogress (status update)', async () => {
    mockDynamoDb.send
      .mockResolvedValueOnce({ Item: frontendTask })
      .mockResolvedValueOnce({ Attributes: { ...frontendTask, status: 'inprogress' } });

    const updated = await tasksService.updateStatus(frontendTask.taskId, 'inprogress', frontendEmployee);

    expect(updated!.status).toBe('inprogress');
  });

  it('Step 7 — Omar CANNOT move Sara\'s task (cross-team status update blocked)', async () => {
    mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendTask });

    await expect(
      tasksService.updateStatus(frontendTask.taskId, 'inprogress', backendEmployee),
    ).rejects.toThrow(ForbiddenException);
  });
});
