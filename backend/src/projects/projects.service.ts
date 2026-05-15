import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class ProjectsService {
  constructor(private awsService: AwsService, private configService: ConfigService) {}

  private get table() { return this.configService.get<string>('DYNAMODB_TABLE_PROJECTS')!; }
  private get teamGsi() { return this.configService.get<string>('DYNAMODB_GSI_TEAM')!; }

  async create(dto: any, requestingUser: any) {
    const project = {
      projectId: uuidv4(),
      name: dto.name,
      description: dto.description || '',
      teamId: dto.teamId,
      status: 'active',
      createdBy: requestingUser.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.awsService.dynamoDb.send(new PutCommand({ TableName: this.table, Item: project }));
    return project;
  }

  async findAll(requestingUser: any) {
    const role = requestingUser?.role;
    const teamId = requestingUser?.teamId;

    if (role === 'manager') {
      const result = await this.awsService.dynamoDb.send(new ScanCommand({ TableName: this.table }));
      return result.Items ?? [];
    }

    if (!teamId || teamId === 'unassigned') return [];

    const result = await this.awsService.dynamoDb.send(new QueryCommand({
      TableName: this.table,
      IndexName: this.teamGsi,
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: { ':teamId': teamId },
    }));
    return result.Items ?? [];
  }

  async findOne(projectId: string, requestingUser: any) {
    const result = await this.awsService.dynamoDb.send(new GetCommand({ TableName: this.table, Key: { projectId } }));
    if (!result.Item) throw new NotFoundException('Project not found');

    const role = requestingUser?.role;
    const teamId = requestingUser?.teamId;
    if (role === 'employee' && teamId && result.Item['teamId'] !== teamId) {
      throw new ForbiddenException('Access denied');
    }
    return result.Item;
  }

  async update(projectId: string, dto: any) {
    const result = await this.awsService.dynamoDb.send(new UpdateCommand({
      TableName: this.table,
      Key: { projectId },
      UpdateExpression: 'SET #name = :name, description = :desc, teamId = :teamId, #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name', '#status': 'status' },
      ExpressionAttributeValues: {
        ':name': dto.name,
        ':desc': dto.description || '',
        ':teamId': dto.teamId,
        ':status': dto.status || 'active',
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }));
    return result.Attributes;
  }

  async remove(projectId: string) {
    await this.awsService.dynamoDb.send(new DeleteCommand({ TableName: this.table, Key: { projectId } }));
    return { deleted: true };
  }
}
