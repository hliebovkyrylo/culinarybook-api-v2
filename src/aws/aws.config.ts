import { S3 } from '@aws-sdk/client-s3';

const accessKeyId = process.env.AWS_ACCESS_KEY_ID as string;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY as string;

export const s3 = new S3({
  region: 'eu-north-1',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});