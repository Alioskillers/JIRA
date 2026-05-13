import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class TeamsService {
  constructor(private awsService: AwsService, private configService: ConfigService) {}

  private get table() { return this.configService.get<string>('DYNAMODB_TABLE_TEAMS')!; }
  private get usersTable() { return this.configService.get<string>('DYNAMODB_TABLE_USERS')!; }
  private get teamGsi() { return this.configService.get<string>('DYNAMODB_GSI_TEAM')!; }

  async create(dto: any) {
    const team = { teamId: uuidv4(), name: dto.name, description: dto.description || '', createdAt: new Date().toISOString() };
    await this.awsService.dynamoDb.send(new PutCommand({ TableName: this.table, Item: team }));
    return team;
  }

  async findAll() {
    const result = await this.awsService.dynamoDb.send(new ScanCommand({ TableName: this.table }));
    return result.Items ?? [];
  }

  async findOne(teamId: string) {
    const result = await this.awsService.dynamoDb.send(new GetCommand({ TableName: this.table, Key: { teamId } }));
    if (!result.Item) throw new NotFoundException('Team not found');

    const members = await this.awsService.dynamoDb.send(new QueryCommand({
      TableName: this.usersTable,
      IndexName: this.teamGsi,
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: { ':teamId': teamId },
    }));

    return { ...result.Item, members: members.Items ?? [] };
  }

  async update(teamId: string, dto: any) {
    const result = await this.awsService.dynamoDb.send(new UpdateCommand({
      TableName: this.table,
      Key: { teamId },
      UpdateExpression: 'SET #name = :name, description = :desc, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': dto.name,
        ':desc': dto.description || '',
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }));
    return result.Attributes;
  }

  async remove(teamId: string) {
    await this.awsService.dynamoDb.send(new DeleteCommand({ TableName: this.table, Key: { teamId } }));
    return { deleted: true };
  }
}
