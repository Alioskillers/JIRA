const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { v4: uuidv4 } = require('uuid');

const region = process.env.AWS_REGION || 'us-east-1';
const dynamoClient = new DynamoDBClient({ region });
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const cloudwatch = new CloudWatchClient({ region });

const ACTIVITY_TABLE = process.env.DYNAMODB_TABLE_ACTIVITY;
const CW_NAMESPACE = process.env.CW_NAMESPACE;

exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      // SQS message body contains the SNS notification wrapper
      const sqsBody = JSON.parse(record.body);
      const message = typeof sqsBody.Message === 'string'
        ? JSON.parse(sqsBody.Message)
        : sqsBody;

      const { taskId, assigneeId, teamId, taskTitle } = message;

      console.log(`Processing task assignment: taskId=${taskId}, assigneeId=${assigneeId}, teamId=${teamId}`);

      await dynamo.send(new PutCommand({
        TableName: ACTIVITY_TABLE,
        Item: {
          logId: uuidv4(),
          type: 'TASK_ASSIGNED',
          taskId,
          taskTitle: taskTitle || '',
          assigneeId,
          teamId,
          timestamp: new Date().toISOString(),
        },
      }));

      await cloudwatch.send(new PutMetricDataCommand({
        Namespace: CW_NAMESPACE,
        MetricData: [{
          MetricName: 'TasksAssignedPerTeam',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
          Dimensions: [{ Name: 'TeamId', Value: teamId }],
        }],
      }));

      console.log(`Activity logged and metric published for teamId=${teamId}`);
    } catch (err) {
      console.error('Error processing SQS record:', err, record);
    }
  }

  return { statusCode: 200 };
};
