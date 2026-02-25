import { Client } from "minio";
import dotenv from "dotenv";

dotenv.config();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export const bucketName = process.env.MINIO_BUCKET || "vlow-agents";

// Public URL for constructing file download links
// e.g. https://minio.dayamedialangit.co.id
export const minioPublicUrl =
  process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT || "localhost"}:${process.env.MINIO_PORT || 9000}`;

/**
 * Build a public URL for a file in MinIO
 * @param {string} objectName - path within bucket, e.g. "knowledge/abc123/file.pdf"
 * @returns {string} public URL
 */
export const getPublicFileUrl = (objectName) => {
  return `${minioPublicUrl}/${bucketName}/${objectName}`;
};

export const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, "us-east-1");

      // Set Policy Read-Only Public
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`✅ MinIO Bucket '${bucketName}' siap.`);
    }
  } catch (err) {
    console.error("❌ MinIO Connection Error:", err.message);
  }
};

export default minioClient;
