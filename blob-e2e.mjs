import { put, del } from '@vercel/blob';
import fs from 'fs';
import { config } from 'dotenv';
config({ path: '.env' });

async function runTest() {
  console.log('🧪 Starting Vercel Blob E2E Test...');
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not defined');
    }
    
    // 1. Create a dummy image file (1x1 transparent PNG)
    const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    
    console.log('📤 Uploading test avatar image to Vercel Blob...');
    const blob = await put('e2e-test-avatar.png', dummyImageBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'image/png'
    });
    
    console.log('✅ Upload successful!');
    console.log('🔗 Public URL:', blob.url);
    
    // 2. Fetch the URL to ensure it is publicly accessible
    console.log('📥 Verifying public accessibility...');
    const res = await fetch(blob.url);
    if (!res.ok) {
      throw new Error(`Failed to fetch uploaded blob. Status: ${res.status}`);
    }
    console.log('✅ Verification successful! File is publicly readable.');
    
    // 3. Delete the test blob
    console.log('🗑️ Deleting test blob to clean up...');
    await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    console.log('✅ Cleanup successful!');
    
    console.log('🎉 Vercel Blob E2E test passed! The thegoldenforkemployeemanage-blob bucket is perfectly configured.');
    process.exit(0);
  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
    process.exit(1);
  }
}

runTest();
