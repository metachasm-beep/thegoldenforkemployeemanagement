import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Service Account credentials not found in environment variables.');
  }

  // Format private key correctly if it comes from env with escaped newlines
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: formattedPrivateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: 'v4', auth: client as any });
  
  return googleSheets;
}

export const SPREADSHEET_ID = '1KfrhCvh9ENdLq8pkkDb42wPiQJfyVPd9tDTwHzX3g2A';
