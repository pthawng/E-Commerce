// Simple script to generate a Gmail OAuth2 refresh token
// Usage:
// 1. Set environment variables:
//    GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI (optional, default: http://localhost)
// 2. Run: node scripts/get-gmail-refresh-token.js

/* eslint-disable no-console */



const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = '93719572272-aamp7pl2d12r2qp5m4o5lonba7ms3pti.apps.googleusercontent.com'; 
const CLIENT_SECRET = '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';
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET in environment variables.');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// You can adjust scopes if needed, but these are typical for sending email via Gmail
const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('🔗 Authorize this app by visiting this URL:\n');
  console.log(authUrl);
  console.log('\nAfter granting permission, you will be redirected to a URL like:');
  console.log('  http://localhost/?code=4/xxx&scope=...\n');
  console.log('Copy the "code" value from that URL and paste it below.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('❌ Error while trying to retrieve access token:', err.message || err);
        process.exit(1);
      }

      console.log('\n✅ Token received:');
      console.log(JSON.stringify(token, null, 2));

      if (token.refresh_token) {
        console.log('\n🔁 Your GMAIL_REFRESH_TOKEN value (put this in .env):');
        console.log(token.refresh_token);
      } else {
        console.log(
          '\n⚠️ No refresh_token in response. Make sure you used "access_type=offline" and "prompt=consent".',
        );
      }

      process.exit(0);
    });
  });
}

getAccessToken();
