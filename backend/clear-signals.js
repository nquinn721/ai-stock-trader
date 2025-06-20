// Simple script to clear all trading signals for testing live data generation
const { execSync } = require('child_process');

console.log('🧹 Clearing all trading signals to force fresh generation...');

try {
  // Delete all trading signals from the database
  // This assumes you have a MySQL/database setup
  console.log('Note: You would need to run this SQL command in your database:');
  console.log('DELETE FROM trading_signal WHERE 1=1;');
  console.log('Or use the API endpoint to clear signals programmatically.');
  
  console.log('✅ Signal clearing script prepared.');
} catch (error) {
  console.error('❌ Error:', error.message);
}
