import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../../src/projects/projects.service';
import {
  mockAwsService, mockConfigService, mockDynamoDb,
  managerUser, frontendEmployee, backendEmployee,
} from '../mocks/aws.mock';

const frontendProject = {
  projectId: 'project-frontend-001',
  name: 'Frontend Redesign',
  description: 'Complete UI overhaul',
  teamId: 'team-frontend-001',
  status: 'active',
  createdBy: managerUser.userId,
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
};

const backendProject = {
  projectId: 'project-backend-001',
  name: 'API v2',
  description: 'New REST API',
  teamId: 'team-backend-001',
  status: 'active',
  createdBy: managerUser.userId,
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectsService(mockAwsService as any, mockConfigService as any);
  });

  describe('create', () => {
    it('creates project with correct fields and active status', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({});
      const result = await service.create(
        { name: 'New Project', description: 'Desc', teamId: 'team-frontend-001' },
        managerUser,
      );
      expect(result.name).toBe('New Project');
      expect(result.status).toBe('active');
      expect(result.createdBy).toBe(managerUser.userId);
      expect(result.projectId).toBeDefined();
    });
  });

  describe('findAll — role-based visibility', () => {
    it('manager sees ALL projects via Scan', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [frontendProject, backendProject] });
      const result = await service.findAll(managerUser);
      expect(result).toHaveLength(2);
    });

    it('employee sees ONLY their team projects via GSI', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [frontendProject] });
      const result = await service.findAll(frontendEmployee);
      expect(result).toHaveLength(1);
      expect(result[0].teamId).toBe(frontendEmployee.teamId);
    });

    it('employee with unassigned team gets empty list without DynamoDB call', async () => {
      const result = await service.findAll({ ...frontendEmployee, teamId: 'unassigned' });
      expect(result).toHaveLength(0);
      expect(mockDynamoDb.send).not.toHaveBeenCalled();
    });

    it('Backend employee does NOT see Frontend projects', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Items: [backendProject] });
      const result = await service.findAll(backendEmployee);
      expect(result.find((p: any) => p.projectId === 'project-frontend-001')).toBeUndefined();
    });
  });

  describe('findOne — team isolation', () => {
    it('manager reads any project', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendProject });
      const result = await service.findOne('project-frontend-001', managerUser);
      expect(result.projectId).toBe('project-frontend-001');
    });

    it('employee reads their own team project', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendProject });
      const result = await service.findOne('project-frontend-001', frontendEmployee);
      expect(result.projectId).toBe('project-frontend-001');
    });

    it('employee CANNOT read a project from another team', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: frontendProject });
      await expect(service.findOne('project-frontend-001', backendEmployee))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws 404 for missing project', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Item: undefined });
      await expect(service.findOne('ghost', managerUser))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates fields and stamps updatedAt', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({ Attributes: { ...frontendProject, name: 'Renamed' } });
      const result = await service.update('project-frontend-001', { name: 'Renamed', description: '', teamId: 'team-frontend-001' });
      expect(result!.name).toBe('Renamed');
      const call = mockDynamoDb.send.mock.calls[0][0];
      expect(call.input.ExpressionAttributeValues[':updatedAt']).toBeDefined();
    });
  });

  describe('remove', () => {
    it('deletes project and returns deleted:true', async () => {
      mockDynamoDb.send.mockResolvedValueOnce({});
      const result = await service.remove('project-frontend-001');
      expect(result.deleted).toBe(true);
    });
  });
});
