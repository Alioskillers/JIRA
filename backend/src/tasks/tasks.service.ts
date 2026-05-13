import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand, QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectVersionsCommand } from '@aws-sdk/client-s3';
import { PublishCommand } from '@aws-sdk/client-sns';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { AwsService } from '../aws/aws.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private awsService: AwsService,
    private configService: ConfigService,
    private metricsService: MetricsService,
  ) {}

  private get table() { return this.configService.get<string>('DYNAMODB_TABLE_TASKS')!; }
  private get teamGsi() { return this.configService.get<string>('DYNAMODB_GSI_TEAM')!; }
  private get originsBucket() { return this.configService.get<string>('S3_ORIGINALS_BUCKET')!; }
  private get resizedBucket() { return this.configService.get<string>('S3_RESIZED_BUCKET')!; }
  private get snsTopicArn() { return this.configService.get<string>('SNS_TASK_TOPIC_ARN')!; }
  private get presignExpires() { return parseInt(this.configService.get<string>('S3_PRESIGNED_URL_EXPIRES')!, 10); }

  async create(dto: any, imageBuffer: Buffer | null, imageExt: string | null, requestingUser: any) {
    const taskId = uuidv4();
    let imageKey: string | null = null;

    if (imageBuffer && imageExt) {
      imageKey = `tasks/${taskId}/${uuidv4()}.${imageExt}`;
      await this.awsService.s3.send(new PutObjectCommand({
        Bucket: this.originsBucket,
        Key: imageKey,
        Body: imageBuffer,
      }));
    }

    const task = {
      taskId,
      title: dto.title,
      description: dto.description || '',
      status: dto.status || 'todo',
      priority: dto.priority || 'medium',
      deadline: dto.deadline,
      assigneeId: dto.assigneeId,
      assigneeName: dto.assigneeName,
      teamId: dto.teamId,
      projectId: dto.projectId || null,
      imageKey,
      resizedImageKey: imageKey,
      imageVersions: imageKey ? [imageKey] : [],
      createdBy: requestingUser.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLog: [],
    };

    await this.awsService.dynamoDb.send(new PutCommand({ TableName: this.table, Item: task }));

    await this.awsService.sns.send(new PublishCommand({
      TopicArn: this.snsTopicArn,
      Message: JSON.stringify({
        type: 'TASK_ASSIGNED',
        taskId,
        taskTitle: task.title,
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        assigneeEmail: dto.assigneeEmail || '',
        teamId: task.teamId,
        teamName: dto.teamName || '',
        deadline: task.deadline,
        priority: task.priority,
        managerName: requestingUser.name || requestingUser.email,
      }),
      MessageAttributes: {
        type: { DataType: 'String', StringValue: 'TASK_ASSIGNED' },
      },
    }));

    await this.metricsService.publishMetric('TasksCreated', 1);

    return task;
  }

  async findAll(requestingUser: any) {
    let items: any[];
    const role = requestingUser?.role;
    const teamId = requestingUser?.teamId;

    if (role === 'manager') {
      const result = await this.awsService.dynamoDb.send(new ScanCommand({ TableName: this.table }));
      items = result.Items ?? [];
    } else if (teamId && teamId !== 'unassigned') {
      const result = await this.awsService.dynamoDb.send(new QueryCommand({
        TableName: this.table,
        IndexName: this.teamGsi,
        KeyConditionExpression: 'teamId = :teamId',
        ExpressionAttributeValues: { ':teamId': teamId },
      }));
      items = result.Items ?? [];
    } else {
      // User has no team assigned yet — return empty list
      this.logger.warn(`User ${requestingUser?.userId} has no teamId, returning empty tasks`);
      items = [];
    }

    return Promise.all(items.map(item => this.attachPresignedUrl(item)));
  }

  async findOne(taskId: string, requestingUser: any) {
    const result = await this.awsService.dynamoDb.send(new GetCommand({ TableName: this.table, Key: { taskId } }));
    if (!result.Item) throw new NotFoundException('Task not found');

    const role = requestingUser?.role;
    const teamId = requestingUser?.teamId;
    if (role === 'employee' && teamId && result.Item['teamId'] !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    return this.attachPresignedUrl(result.Item);
  }

  async updateStatus(taskId: string, newStatus: string, requestingUser: any) {
    const task = await this.findOne(taskId, requestingUser);
    const now = new Date().toISOString();

    const auditEntry = {
      action: 'STATUS_CHANGE',
      userId: requestingUser.userId,
      userName: requestingUser.name || requestingUser.email,
      fromStatus: task['status'],
      toStatus: newStatus,
      timestamp: now,
    };

    const result = await this.awsService.dynamoDb.send(new UpdateCommand({
      TableName: this.table,
      Key: { taskId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, auditLog = list_append(if_not_exists(auditLog, :empty), :entry)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':updatedAt': now,
        ':entry': [auditEntry],
        ':empty': [],
      },
      ReturnValues: 'ALL_NEW',
    }));

    if (newStatus === 'done') {
      await this.metricsService.publishMetricWithDimension('TasksClosed', 1, 'TeamId', task['teamId']);

      const createdAt = new Date(task['createdAt']).getTime();
      const timeToClose = (Date.now() - createdAt) / (1000 * 60 * 60);
      await this.metricsService.publishMetricWithDimension('TimeToCloseHours', timeToClose, 'TeamId', task['teamId']);
    }

    return result.Attributes;
  }

  async update(taskId: string, dto: any, imageBuffer: Buffer | null, imageExt: string | null) {
    const task = await this.awsService.dynamoDb.send(new GetCommand({ TableName: this.table, Key: { taskId } }));
    if (!task.Item) throw new NotFoundException('Task not found');

    let imageKey = task.Item['imageKey'];
    const imageVersions = task.Item['imageVersions'] || [];

    if (imageBuffer && imageExt) {
      if (imageKey) imageVersions.push(imageKey);
      imageKey = `tasks/${taskId}/${uuidv4()}.${imageExt}`;
      await this.awsService.s3.send(new PutObjectCommand({
        Bucket: this.originsBucket,
        Key: imageKey,
        Body: imageBuffer,
      }));
      if (!imageVersions.includes(imageKey)) imageVersions.push(imageKey);
    }

    const result = await this.awsService.dynamoDb.send(new UpdateCommand({
      TableName: this.table,
      Key: { taskId },
      UpdateExpression: 'SET title = :title, description = :desc, #status = :status, priority = :priority, deadline = :deadline, assigneeId = :assigneeId, assigneeName = :assigneeName, teamId = :teamId, projectId = :projectId, imageKey = :imageKey, resizedImageKey = :resizedImageKey, imageVersions = :imageVersions, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':title': dto.title,
        ':desc': dto.description || '',
        ':status': dto.status || task.Item['status'],
        ':priority': dto.priority || task.Item['priority'],
        ':deadline': dto.deadline || task.Item['deadline'],
        ':assigneeId': dto.assigneeId || task.Item['assigneeId'],
        ':assigneeName': dto.assigneeName || task.Item['assigneeName'],
        ':teamId': dto.teamId || task.Item['teamId'],
        ':projectId': dto.projectId || task.Item['projectId'],
        ':imageKey': imageKey,
        ':resizedImageKey': imageKey,
        ':imageVersions': imageVersions,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }));
    return result.Attributes;
  }

  async remove(taskId: string) {
    const task = await this.awsService.dynamoDb.send(new GetCommand({ TableName: this.table, Key: { taskId } }));
    if (!task.Item) throw new NotFoundException('Task not found');

    const versions: string[] = task.Item['imageVersions'] || [];
    for (const key of versions) {
      try {
        const listResult = await this.awsService.s3.send(new ListObjectVersionsCommand({
          Bucket: this.originsBucket,
          Prefix: key,
        }));
        const allVersions = [...(listResult.Versions || []), ...(listResult.DeleteMarkers || [])];
        for (const v of allVersions) {
          await this.awsService.s3.send(new DeleteObjectCommand({
            Bucket: this.originsBucket,
            Key: v.Key!,
            VersionId: v.VersionId,
          }));
        }
      } catch (err: any) {
        this.logger.warn(`S3 delete failed for key ${key}: ${err?.message}`);
      }
    }

    await this.awsService.dynamoDb.send(new DeleteCommand({ TableName: this.table, Key: { taskId } }));
    return { deleted: true };
  }

  async findByTeam(teamId: string) {
    const result = await this.awsService.dynamoDb.send(new QueryCommand({
      TableName: this.table,
      IndexName: this.teamGsi,
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: { ':teamId': teamId },
    }));
    return Promise.all((result.Items ?? []).map(item => this.attachPresignedUrl(item)));
  }

  private async attachPresignedUrl(item: any) {
    if (!item.imageKey) return item;

    // Use HeadObject to verify the file exists before generating the URL.
    // Try resized bucket first (Lambda-processed); fall back to originals.
    for (const bucket of [this.resizedBucket, this.originsBucket]) {
      try {
        await this.awsService.s3.send(new HeadObjectCommand({ Bucket: bucket, Key: item.imageKey }));
        const url = await getSignedUrl(
          this.awsService.s3,
          new GetObjectCommand({ Bucket: bucket, Key: item.imageKey }),
          { expiresIn: this.presignExpires },
        );
        this.logger.debug(`Image URL generated from bucket=${bucket} key=${item.imageKey}`);
        return { ...item, imageUrl: url };
      } catch {
        // Object not in this bucket — try the next one
      }
    }

    this.logger.warn(`Image not found in any bucket for key=${item.imageKey}`);
    return item;
  }
}
