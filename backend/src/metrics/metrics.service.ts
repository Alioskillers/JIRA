import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Cron } from '@nestjs/schedule';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class MetricsService {
  constructor(private awsService: AwsService, private configService: ConfigService) {}

  private get namespace() { return this.configService.get<string>('CW_NAMESPACE')!; }
  private get tasksTable() { return this.configService.get<string>('DYNAMODB_TABLE_TASKS')!; }

  async publishMetric(metricName: string, value: number) {
    await this.awsService.cloudWatch.send(new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: 'Count',
        Timestamp: new Date(),
      }],
    }));
  }

  async publishMetricWithDimension(metricName: string, value: number, dimName: string, dimValue: string) {
    await this.awsService.cloudWatch.send(new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: [{ Name: dimName, Value: dimValue }],
      }],
    }));
  }

  @Cron('0 6 * * *')
  async checkOverdueTasks() {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.awsService.dynamoDb.send(new ScanCommand({
      TableName: this.tasksTable,
      FilterExpression: 'deadline < :today AND #status <> :done',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':today': today, ':done': 'done' },
    }));

    const count = result.Items?.length ?? 0;
    if (count > 0) {
      await this.publishMetric('OverdueTasks', count);
    }
  }

  async getSummary() {
    return { namespace: this.namespace, message: 'Metrics published to CloudWatch' };
  }
}
