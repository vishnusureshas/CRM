import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const s3Client =
  env.S3_BUCKET && env.S3_ACCESS_KEY
    ? new S3Client({
        region: env.S3_REGION || 'us-east-1',
        endpoint: env.S3_ENDPOINT || undefined,
        forcePathStyle: !!env.S3_ENDPOINT,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY,
          secretAccessKey: env.S3_SECRET_KEY,
        },
      })
    : null;

export const isS3Enabled = () => !!s3Client;
