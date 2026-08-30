import { put, del } from '@vercel/blob';
import fs from 'fs';
import { config } from 'dotenv';
config({ path: '.env' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function runTest() {
  console.log('🧪 Starting Vercel Blob E2E Test (Private)...');
  try {
    const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    
    console.log('📤 Uploading test avatar image as private...');
    const blob = await put('e2e-test-avatar.png', dummyImageBuffer, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'image/png'
    });
    
    console.log('✅ Upload successful! URL:', blob.url);
    console.log('🗑️ Deleting test blob...');
    await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    console.log('✅ Cleanup successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
    process.exit(1);
  }
}
runTest();
