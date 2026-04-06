import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

/**
 * Generate a presigned PUT URL for direct client-to-R2 upload.
 * URL expires in 5 minutes — sufficient for admin uploads.
 * R2 credentials never reach the browser.
 */
export async function generatePresignedUploadUrl(
  folder: 'sites' | 'addons',
  entityId: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string }> {
  const ext = contentType === 'image/webp' ? 'webp' : 'jpg'
  const key = `${folder}/${entityId}/${randomUUID()}.${ext}`
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 })
  return { uploadUrl, key }
}

/**
 * Get the public URL for a stored R2 object key.
 */
export function getPublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

/**
 * Delete an object from R2 by key.
 */
export async function deleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }))
}
