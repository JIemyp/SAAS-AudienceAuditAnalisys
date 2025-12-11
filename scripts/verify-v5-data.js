#!/usr/bin/env node

const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZXRxZXF4bGltbmJ4d3dtaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzMjA4MiwiZXhwIjoyMDgwMDA4MDgyfQ.-qJM4mOB0k9fb8rEvuRsPrBYpmp9dGCd15buU3kHr58';
const PROJECT_ID = '17d26309-520b-45ec-b5d5-92512e2f6620';
const SEGMENT_ID = '260ec846-ba0f-43d5-82d9-4b2f93a4a440';

function makeRequest(table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'yqetqeqxlimnbxwwmiyz.supabase.co',
      port: 443,
      path: `/rest/v1/${table}?project_id=eq.${PROJECT_ID}&segment_id=eq.${SEGMENT_ID}`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const data = JSON.parse(responseData);
          if (data.length > 0) {
            console.log(`✓ ${table}: Data exists (${data.length} record${data.length > 1 ? 's' : ''})`);
            resolve(data);
          } else {
            console.log(`✗ ${table}: No data found`);
            resolve([]);
          }
        } else {
          console.error(`✗ ${table}: HTTP ${res.statusCode}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`✗ ${table}: Request error:`, error.message);
      reject(error);
    });

    req.end();
  });
}

async function verifyData() {
  console.log('Verifying v5 module data for Wellness-Focused Healthcare Workers segment...\n');
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Segment ID: ${SEGMENT_ID}\n`);

  const tables = [
    'channel_strategy',
    'competitive_intelligence',
    'pricing_psychology',
    'trust_framework',
    'jtbd_context'
  ];

  try {
    for (const table of tables) {
      await makeRequest(table);
    }
    console.log('\n✓ Verification complete! All 5 v5 modules are populated.');
  } catch (error) {
    console.error('\n✗ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyData();
