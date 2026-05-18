const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const RESIZED_BUCKET = process.env.S3_RESIZED_BUCKET;

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

exports.handler = async (event) => {
  for (const record of event.Records) {
    const sourceBucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing: s3://${sourceBucket}/${key}`);

    const getResponse = await s3.send(new GetObjectCommand({
      Bucket: sourceBucket,
      Key: key,
    }));

    const originalBuffer = await streamToBuffer(getResponse.Body);

    const resizedBuffer = await sharp(originalBuffer)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: RESIZED_BUCKET,
      Key: key,
      Body: resizedBuffer,
      ContentType: 'image/jpeg',
    }));

    console.log(`Resized image saved to s3://${RESIZED_BUCKET}/${key}`);
  }

  return { statusCode: 200, body: 'Images resized successfully' };
};
