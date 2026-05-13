const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const region = process.env.AWS_REGION || 'us-east-1';
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const sns = new SNSClient({ region });

const TASKS_TABLE = process.env.DYNAMODB_TABLE_TASKS;
const SNS_DIGEST_TOPIC_ARN = process.env.SNS_DIGEST_TOPIC_ARN;

exports.handler = async () => {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Running daily digest for date: ${today}`);

  const result = await dynamo.send(new ScanCommand({
    TableName: TASKS_TABLE,
    FilterExpression: 'begins_with(deadline, :today) AND #status <> :done',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':today': today, ':done': 'done' },
  }));

  const tasks = result.Items || [];
  console.log(`Found ${tasks.length} tasks due today`);

  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };

  const publishResults = await Promise.allSettled(tasks.map(task => {
    const emoji = priorityEmoji[task.priority] ?? '⚪';
    const emailBody = [
      `Hi ${task.assigneeName},`,
      ``,
      `This is your daily reminder from Mini Jira. You have a task due today.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `  TASK DUE TODAY`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `  Title    : ${task.title}`,
      `  Priority : ${emoji} ${task.priority.toUpperCase()}`,
      `  Status   : ${task.status.toUpperCase()}`,
      `  Deadline : ${today}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      task.description ? `Description:\n${task.description}\n` : '',
      `Please log in to Mini Jira to update or complete this task before the end of day.`,
      ``,
      `— The Mini Jira Team`,
    ].filter(Boolean).join('\n');

    return sns.send(new PublishCommand({
      TopicArn: SNS_DIGEST_TOPIC_ARN,
      Subject: `[Mini Jira] Task Due Today: ${task.title}`,
      Message: emailBody,
      MessageAttributes: {
        taskId: { DataType: 'String', StringValue: task.taskId },
        assigneeId: { DataType: 'String', StringValue: task.assigneeId },
        teamId: { DataType: 'String', StringValue: task.teamId },
      },
    }));
  }));

  const succeeded = publishResults.filter(r => r.status === 'fulfilled').length;
  const failed = publishResults.filter(r => r.status === 'rejected').length;

  console.log(`Digest complete: ${succeeded} published, ${failed} failed`);

  return { statusCode: 200, body: JSON.stringify({ tasksFound: tasks.length, succeeded, failed }) };
};
