import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getPrismaClient } from "../utils/prismaClient.js";
import { getS3Client } from "../utils/s3Client.js";
import type { Context } from "hono";
import type { Env } from "../types/env.js";

class FileService {
  private ctx: Context<{ Bindings: Env }>;
  private prisma: ReturnType<typeof getPrismaClient>;

  constructor(ctx: Context<{ Bindings: Env }>) {
    this.ctx = ctx;
    this.prisma = getPrismaClient(ctx.env);
  }

  async upload(file: File) {
    const env = this.ctx.env;
    const s3 = getS3Client(env);
    const key = `${Date.now()}-${file.name}`;
    const bodyArrayBuffer = await file.arrayBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: new Uint8Array(bodyArrayBuffer),
        ContentType: file.type || "application/octet-stream",
      })
    );

    const url = `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${key}`;

    const record = await this.prisma.file.create({
      data: {
        key,
        url,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      },
    });

    return record;
  }
}

export default FileService;
