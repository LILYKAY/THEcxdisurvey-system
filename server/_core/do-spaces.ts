import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "nyc3",
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY || "",
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY || "",
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || "survey-system";

export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!process.env.DO_SPACES_ACCESS_KEY || !process.env.DO_SPACES_SECRET_KEY) {
    throw new Error(
      "DigitalOcean Spaces credentials not configured (DO_SPACES_ACCESS_KEY, DO_SPACES_SECRET_KEY)"
    );
  }

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
  });

  await s3Client.send(command);

  const url = `https://${BUCKET_NAME}.nyc3.digitaloceanspaces.com/${key}`;

  return { key, url };
}

export async function storageGet(
  key: string,
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  if (!process.env.DO_SPACES_ACCESS_KEY || !process.env.DO_SPACES_SECRET_KEY) {
    throw new Error(
      "DigitalOcean Spaces credentials not configured (DO_SPACES_ACCESS_KEY, DO_SPACES_SECRET_KEY)"
    );
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return { key, url };
}
