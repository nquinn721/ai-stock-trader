// Polyfill for crypto global in Node.js environments
// This fixes the "crypto is not defined" error in Cloud Run deployments

if (typeof global !== 'undefined' && typeof global.crypto === 'undefined') {
  try {
    const { webcrypto } = require('crypto');
    global.crypto = webcrypto;
  } catch (error) {
    console.warn('Failed to polyfill crypto global:', error.message);
  }
}

export {};
