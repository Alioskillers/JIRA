import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class UploadService {
  constructor(private awsService: AwsService, private configService: ConfigService) {}

  async getPresignedPutUrl(ext: string) {
    const key = `tasks/temp/${uuidv4()}.${ext}`;
    const bucket = this.configService.get<string>('S3_ORIGINALS_BUCKET')!;
    const expires = parseInt(this.configService.get<string>('S3_PRESIGNED_URL_EXPIRES')!, 10);

    const url = await getSignedUrl(
      this.awsService.s3,
      new PutObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: expires },
    );

    return { uploadUrl: url, key };
  }
}
