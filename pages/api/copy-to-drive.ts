import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuth } from 'firebase-admin/auth';
import { Readable } from 'stream';
import { db, storage } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Use the shared Firebase Admin instance with proper credentials
const bucket = storage.bucket();

function extractFirebaseFilePath(url: string): string | null {
  if (url.includes('/o/')) {
    const match = url.match(/\/o\/(.+?)(\?|$)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  } else if (url.includes('storage.googleapis.com/')) {
    const match = url.match(/storage.googleapis.com\/[\w.-]+\/(.+)/);
    if (match && match[1]) return decodeURIComponent(match[1].split('?')[0]);
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  console.log('Headers:', req.headers);
  const { templateUrl, templateType, accessToken, fileName, folderId } = req.body;
  if (!templateUrl || !templateType || !accessToken || !fileName) {
    console.error('Missing required fields:', { templateUrl, templateType, accessToken, fileName });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let urlToUse: string = templateUrl;
  // Always try to generate a signed URL for DOCX files stored in Firebase Storage
  if (templateType === 'docx' && (templateUrl.includes('firebasestorage.googleapis.com') || templateUrl.includes('storage.googleapis.com'))) {
    try {
      const filePath = extractFirebaseFilePath(templateUrl);
      if (filePath) {
        const file = bucket.file(filePath);
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 10 * 60 * 1000, // 10 minutes
        });
        urlToUse = signedUrl;
      } else {
        return res.status(400).json({ error: 'Could not extract file path from URL', url: templateUrl });
      }
    } catch (err: unknown) {
      console.error('Failed to generate signed URL', err);
      return res.status(500).json({ error: 'Failed to generate signed URL', details: (err as Error).message });
    }
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth });

  try {
    if (templateType === 'gdoc') {
      const match = templateUrl.match(/\/d\/([\w-]+)/);
      if (!match) return res.status(400).json({ error: 'Invalid Google Doc URL' });
      const fileId = match[1];
      const copyRes = await drive.files.copy({
        fileId,
        requestBody: {
          name: fileName,
          parents: folderId ? [folderId] : undefined,
        },
        fields: 'id',
      });
      const newFileId = copyRes.data.id;
      const docUrl = `https://docs.google.com/document/d/${newFileId}/edit`;
      // Save draft record in Firestore
      let uid: string | null = null;
      try {
        const idTokenRaw = req.headers.authorization?.split('Bearer ')[1] || accessToken;
        const idToken = typeof idTokenRaw === 'string' ? idTokenRaw : '';
        console.log('ID Token for Firestore:', idToken);
        if (idToken) {
          const decoded = await getAuth().verifyIdToken(idToken);
          uid = decoded.uid;
          console.log('Decoded UID:', uid);
        }
      } catch (err) {
        console.error('Token verification error:', err);
        // ignore, fallback to no draft save
      }
      if (uid && newFileId) {
        await db.collection('users').doc(uid).collection('drafts').doc(newFileId).set({
          fileId: newFileId,
          fileName,
          docUrl,
          templateType,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (uid && !newFileId) {
        return res.status(500).json({ error: 'Failed to create draft: missing file ID.' });
      }
      return res.status(200).json({ docUrl });
    } else if (templateType === 'docx') {
      const docxRes = await fetch(urlToUse);
      if (!docxRes.ok) {
        const text = await docxRes.text();
        return res.status(500).json({ error: `request to ${urlToUse} failed, reason: ${text}` });
      }
      const arrayBuffer = await docxRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = Readable.from(buffer);
      const uploadRes = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'application/vnd.google-apps.document',
          parents: folderId ? [folderId] : undefined,
        },
        media: {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          body: stream,
        },
        fields: 'id',
      });
      const newFileId = uploadRes.data.id;
      const docUrl = `https://docs.google.com/document/d/${newFileId}/edit`;
      // Save draft record in Firestore
      let uid: string | null = null;
      try {
        const idTokenRaw = req.headers.authorization?.split('Bearer ')[1] || accessToken;
        const idToken = typeof idTokenRaw === 'string' ? idTokenRaw : '';
        console.log('ID Token for Firestore:', idToken);
        if (idToken) {
          const decoded = await getAuth().verifyIdToken(idToken);
          uid = decoded.uid;
          console.log('Decoded UID:', uid);
        }
      } catch (err) {
        console.error('Token verification error:', err);
        // ignore, fallback to no draft save
      }
      if (uid && newFileId) {
        await db.collection('users').doc(uid).collection('drafts').doc(newFileId).set({
          fileId: newFileId,
          fileName,
          docUrl,
          templateType,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (uid && !newFileId) {
        return res.status(500).json({ error: 'Failed to create draft: missing file ID.' });
      }
      return res.status(200).json({ docUrl });
    } else {
      return res.status(400).json({ error: 'Invalid template type' });
    }
  } catch (err: unknown) {
    console.error('General error in copy-to-drive:', err);
    return res.status(500).json({ error: (err as Error).message || 'Unknown error' });
  }
} 