import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { code, clientId, clientSecret, redirectUri } = req.body;
  if (!code || !clientId || !clientSecret || !redirectUri) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    return res.status(200).json(tokens);
  } catch (err: unknown) {
    return res.status(500).json({ error: (err as Error).message || 'Failed to exchange code for tokens' });
  }
} 