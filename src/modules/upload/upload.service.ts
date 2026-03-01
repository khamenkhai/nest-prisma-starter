import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class UploadService {
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

    async uploadFile(fileName: string, file: Buffer | Uint8Array | ReadableStream, contentType: string): Promise<string> {

        const bucket = this.configService.getOrThrow('AWS_S3_BUCKET');
        const region = this.configService.getOrThrow('AWS_S3_REGION');
        const key = `nest-starter/${fileName}`;

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

        return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }
}