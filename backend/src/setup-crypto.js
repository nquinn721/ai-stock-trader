// CRITICAL: Setup crypto global before any imports
// This is a JavaScript file to ensure it's always available in the final build

console.log('🔧 Setting up crypto global...');

// Setup crypto global for TypeORM and other dependencies
if (typeof global !== 'undefined' && typeof global.crypto === 'undefined') {
  try {
    const { webcrypto } = require('crypto');
    global.crypto = webcrypto;
    console.log('✓ Crypto global setup successful');
  } catch (error) {
    console.error('✗ Failed to setup crypto global:', error.message);
  }
}

// Ensure crypto functions are available
if (
  typeof global !== 'undefined' &&
  global.crypto &&
  typeof global.crypto.randomUUID === 'undefined'
) {
  try {
    const crypto = require('crypto');
    global.crypto.randomUUID = () => crypto.randomUUID();
    console.log('✓ Crypto randomUUID setup successful');
  } catch (error) {
    console.error('✗ Failed to setup crypto.randomUUID:', error.message);
  }
}

console.log('✅ Crypto setup completed');
