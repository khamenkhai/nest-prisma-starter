import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  private readonly s3client: S3Client;
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3client = new S3Client({
      region: this.configService.getOrThrow('AWS_S3_REGION'),
      // endpoint: this.configService.getOrThrow('MINIO_ENDPOINT'),// optional
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: true,
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
    if (!key) {
      return '';
    }

    const bucket = this.configService.getOrThrow('AWS_S3_BUCKET');

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    // The URL will expire in 1 hour (3600 seconds)
    return await getSignedUrl(this.s3client, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string): Promise<void> {
    if (!key) {
      return;
    }

    const bucket = this.configService.getOrThrow('AWS_S3_BUCKET');

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3client.send(command);
      this.logger.log(`Successfully deleted file: ${key}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete file ${key}: ${error.message}`);
      throw error;
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    const deletePromises = keys.map((key) => this.deleteFile(key));
    await Promise.all(deletePromises);
  }

  async updateFile(
    oldKey: string,
    fileName: string,
    file: Buffer | Uint8Array | Readable,
    contentType: string,
  ): Promise<{ key: string }> {
    // Delete the old file first
    if (oldKey) {
      await this.deleteFile(oldKey);
    }

    // Upload the new file
    return await this.uploadFile(fileName, file, contentType);
  }

  async fileExists(key: string): Promise<boolean> {
    if (!key) {
      return false;
    }

    const bucket = this.configService.getOrThrow('AWS_S3_BUCKET');

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }
}
