// scripts/generate-qr.js

// 1. Install dependency before running this script:
//    npm install qrcode

const QRCode = require('qrcode');
const path = require('path');

const onboardUrl = 'https://gurupg-nestpilot.dhigrowth.com/onboard';
const outputFile = path.join(__dirname, 'onboard-qr.png');

QRCode.toFile(
  outputFile,
  onboardUrl,
  {
    type: 'png',
    width: 400,          // size of QR (px)
    margin: 2,           // white border
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to generate QR code:', err);
      process.exit(1);
    }
    console.log(`QR code generated at: ${outputFile}`);
    console.log('When scanned, it will open:', onboardUrl);
  }
);