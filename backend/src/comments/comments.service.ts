import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { AwsService } from '../aws/aws.service';
import { TasksService } from '../tasks/tasks.service';

const COMMENTS_TASKID_GSI = 'taskId-index';

@Injectable()
export class CommentsService {
  constructor(
    private awsService: AwsService,
    private configService: ConfigService,
    private tasksService: TasksService,
  ) {}

  private get table() { return this.configService.get<string>('DYNAMODB_TABLE_COMMENTS')!; }

  async create(taskId: string, dto: any, requestingUser: any) {
    const task = await this.tasksService.findOne(taskId, requestingUser);

    if (requestingUser.role === 'employee' && task['teamId'] !== requestingUser.teamId) {
      throw new ForbiddenException('Access denied');
    }

    const comment = {
      commentId: uuidv4(),
      taskId,
      content: dto.content,
      authorId: requestingUser.userId,
      authorName: requestingUser.name || requestingUser.email,
      authorRole: requestingUser.role,
      createdAt: new Date().toISOString(),
    };

    await this.awsService.dynamoDb.send(new PutCommand({ TableName: this.table, Item: comment }));
    return comment;
  }

  async findByTask(taskId: string, requestingUser: any) {
    const task = await this.tasksService.findOne(taskId, requestingUser);

    if (requestingUser.role === 'employee' && task['teamId'] !== requestingUser.teamId) {
      throw new ForbiddenException('Access denied');
    }

    // Try GSI first (taskId-index); fall back to Scan if GSI doesn't exist yet
    try {
      const result = await this.awsService.dynamoDb.send(new QueryCommand({
        TableName: this.table,
        IndexName: COMMENTS_TASKID_GSI,
        KeyConditionExpression: 'taskId = :taskId',
        ExpressionAttributeValues: { ':taskId': taskId },
      }));
      return result.Items ?? [];
    } catch {
      // GSI not yet created — fall back to Scan with filter
      const result = await this.awsService.dynamoDb.send(new ScanCommand({
        TableName: this.table,
        FilterExpression: 'taskId = :taskId',
        ExpressionAttributeValues: { ':taskId': taskId },
      }));
      return result.Items ?? [];
    }
  }
}
