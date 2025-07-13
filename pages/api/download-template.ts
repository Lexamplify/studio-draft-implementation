import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '@/lib/firebase-admin';

// Use the shared Firebase Admin instance with proper credentials
const bucket = storage.bucket();

function extractFirebaseFilePath(url: string): string | null {
  if (url.includes('/o/')) {
    const match = url.match(/\/o\/(.+?)(\?|$)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  } else if (url.includes('storage.googleapis.com/')) {
    const match = url.match(/storage.googleapis.com\/[\w.-]+\/(.+)/);
    if (match && match[1]) return decodeURIComponent(match[1].split('?')[0]);
  } else if (!url.startsWith('http')) {
    // Assume it's a direct storage path
    return url;
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { storageUrl, storagePath } = req.body;
  const filePath = storagePath || extractFirebaseFilePath(storageUrl);
  if (!filePath) {
    return res.status(400).json({ error: 'Missing or invalid storageUrl/storagePath' });
  }
  try {
    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();
    const filename = metadata.name ? metadata.name.split('/').pop() : 'document.docx';
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      responseDisposition: `attachment; filename=\"${filename}\"`,
    });
    return res.status(200).json({ signedUrl });
  } catch (err: unknown) {
    return res.status(500).json({ error: (err as Error).message || 'Failed to generate signed URL' });
  }
} 