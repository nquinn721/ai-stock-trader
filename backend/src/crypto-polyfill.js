// CRITICAL: Crypto polyfill for Node.js environments
// This file must be imported FIRST before any other modules
// to ensure crypto global is available for TypeORM and other dependencies

if (typeof global !== 'undefined') {
  if (typeof global.crypto === 'undefined') {
    try {
      const { webcrypto } = require('crypto');
      global.crypto = webcrypto;
      console.log('✓ Crypto global polyfill applied successfully');
    } catch (error) {
      console.error('✗ Failed to polyfill crypto global:', error.message);
    }
  }

  // Also ensure crypto functions are available
  if (typeof global.crypto.randomUUID === 'undefined') {
    try {
      const crypto = require('crypto');
      global.crypto.randomUUID = () => crypto.randomUUID();
      console.log('✓ Crypto randomUUID polyfill applied');
    } catch (error) {
      console.error('✗ Failed to polyfill crypto.randomUUID:', error.message);
    }
  }
}

export {};
