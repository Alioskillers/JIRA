import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class UsersService {
  constructor(
    private awsService: AwsService,
    private configService: ConfigService,
  ) {}

  private get table() {
    return this.configService.get<string>('DYNAMODB_TABLE_USERS')!;
  }

  private get teamGsi() {
    return this.configService.get<string>('DYNAMODB_GSI_TEAM')!;
  }

  private get userPoolId() {
    return this.configService.get<string>('COGNITO_USER_POOL_ID')!;
  }

  async create(dto: any) {
    const userId = uuidv4();

    await this.awsService.cognito.send(new AdminCreateUserCommand({
      UserPoolId: this.userPoolId,
      Username: dto.email,
      TemporaryPassword: dto.password,
      UserAttributes: [
        { Name: 'email', Value: dto.email },
        { Name: 'name', Value: dto.name },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:role', Value: dto.role },
        { Name: 'custom:teamId', Value: dto.teamId || 'unassigned' },
      ],
      MessageAction: 'SUPPRESS',
    }));

    const user = {
      userId,
      email: dto.email,
      name: dto.name,
      role: dto.role,
      teamId: dto.teamId || 'unassigned',
      createdAt: new Date().toISOString(),
    };

    await this.awsService.dynamoDb.send(new PutCommand({
      TableName: this.table,
      Item: user,
    }));

    return user;
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

  async findOne(userId: string) {
    const result = await this.awsService.dynamoDb.send(new GetCommand({
      TableName: this.table,
      Key: { userId },
    }));
    if (!result.Item) throw new NotFoundException('User not found');
    return result.Item;
  }

  async update(userId: string, dto: any) {
    const expressions: string[] = [];
    const attrNames: Record<string, string> = {};
    const attrValues: Record<string, any> = {};

    if (dto.name) {
      expressions.push('#name = :name');
      attrNames['#name'] = 'name';
      attrValues[':name'] = dto.name;
    }
    if (dto.role) {
      expressions.push('#role = :role');
      attrNames['#role'] = 'role';
      attrValues[':role'] = dto.role;
    }
    if (dto.teamId !== undefined) {
      expressions.push('teamId = :teamId');
      attrValues[':teamId'] = dto.teamId;
    }

    expressions.push('updatedAt = :updatedAt');
    attrValues[':updatedAt'] = new Date().toISOString();

    const result = await this.awsService.dynamoDb.send(new UpdateCommand({
      TableName: this.table,
      Key: { userId },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(attrNames).length ? attrNames : undefined,
      ExpressionAttributeValues: attrValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes;
  }

  async remove(userId: string) {
    const user = await this.findOne(userId);

    await this.awsService.cognito.send(new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: user['email'],
    }));

    await this.awsService.dynamoDb.send(new DeleteCommand({
      TableName: this.table,
      Key: { userId },
    }));

    return { deleted: true };
  }
}
