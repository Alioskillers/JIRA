import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import { SQSClient } from '@aws-sdk/client-sqs';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class AwsService {
  public readonly dynamoDb: DynamoDBDocumentClient;
  public readonly s3: S3Client;
  public readonly sns: SNSClient;
  public readonly sqs: SQSClient;
  public readonly cloudWatch: CloudWatchClient;
  public readonly cognito: CognitoIdentityProviderClient;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION')!;
    const clientConfig = { region };

    const dynamoClient = new DynamoDBClient(clientConfig);
    this.dynamoDb = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: { removeUndefinedValues: true },
    });

    this.s3 = new S3Client(clientConfig);
    this.sns = new SNSClient(clientConfig);
    this.sqs = new SQSClient(clientConfig);
    this.cloudWatch = new CloudWatchClient(clientConfig);
    this.cognito = new CognitoIdentityProviderClient({
      region: this.configService.get<string>('COGNITO_REGION')!,
    });
  }
}