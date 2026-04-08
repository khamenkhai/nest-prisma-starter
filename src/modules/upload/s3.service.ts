import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class UploadS3Service {
  private readonly s3client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3client = new S3Client({
      region: this.configService.getOrThrow('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(
    fileName: string,
    file: Buffer | Uint8Array | Readable,
    contentType: string,
  ): Promise<{ key: string }> {
    const bucket = this.configService.getOrThrow('AWS_S3_BUCKET');

    const key = `${Date.now()}-${fileName}`;

    const upload = new Upload({
      client: this.s3client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      },
    });

    await upload.done();

    return { key };
  }

  async getPresignedUrl(key: string): Promise<string> {
    const bucket = this.configService.getOrThrow('AWS_S3_BUCKET');

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    // The URL will expire in 1 hour (3600 seconds)
    return await getSignedUrl(this.s3client, command, { expiresIn: 3600 });
  }
}
