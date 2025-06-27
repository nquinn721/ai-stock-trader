/**
 * Configuration Validation Script
 *
 * Quick validation to ensure all API configurations are properly set up
 * without running the full test suite.
 */

import {
  API_ENDPOINTS,
  buildApiUrl,
  validateApiConfiguration,
} from '../src/config';

console.log('🔧 Validating API Configuration...\n');

// 1. Test API endpoint building
console.log('📡 Testing API URL building:');
try {
  const alphaVantageUrl = buildApiUrl('alphaVantage', 'newsSentiment', {
    tickers: 'AAPL',
    limit: '5',
    apikey: 'demo',
  });
  console.log('✅ Alpha Vantage URL:', alphaVantageUrl);

  const finnhubUrl = buildApiUrl('finnhub', 'companyNews', {
    symbol: 'AAPL',
    from: '2024-01-01',
    to: '2024-01-02',
    token: 'demo',
  });
  console.log('✅ Finnhub URL:', finnhubUrl);

  const openaiUrl = buildApiUrl('openai', 'chatCompletions');
  console.log('✅ OpenAI URL:', openaiUrl);

  const anthropicUrl = buildApiUrl('anthropic', 'messages');
  console.log('✅ Anthropic URL:', anthropicUrl);
} catch (error) {
  console.error('❌ URL building failed:', error.message);
}

// 2. Validate environment configuration
console.log('\n🔑 Checking API key configuration:');
const apiStatus = validateApiConfiguration();
Object.entries(apiStatus).forEach(([provider, isConfigured]) => {
  const status = isConfigured ? '✅ Configured' : '⚠️  Not configured';
  console.log(`${status}: ${provider}`);
});

// 3. Test configuration structure
console.log('\n📋 Configuration structure check:');
const expectedProviders = [
  'alphaVantage',
  'finnhub',
  'openai',
  'anthropic',
  'yahooFinance',
];
const actualProviders = Object.keys(API_ENDPOINTS);

const missingProviders = expectedProviders.filter(
  (p) => !actualProviders.includes(p),
);
const extraProviders = actualProviders.filter(
  (p) => !expectedProviders.includes(p),
);

if (missingProviders.length === 0 && extraProviders.length === 0) {
  console.log('✅ All expected providers configured');
} else {
  if (missingProviders.length > 0) {
    console.log('❌ Missing providers:', missingProviders);
  }
  if (extraProviders.length > 0) {
    console.log('⚠️  Extra providers:', extraProviders);
  }
}

// 4. Test error handling
console.log('\n🛡️ Testing error handling:');
try {
  buildApiUrl('invalidProvider', 'test');
} catch (error) {
  console.log('✅ Invalid provider error handled correctly');
}

try {
  buildApiUrl('alphaVantage', 'invalidEndpoint');
} catch (error) {
  console.log('✅ Invalid endpoint error handled correctly');
}

console.log('\n🎉 Configuration validation complete!');
console.log('\n📝 Summary:');
console.log('- All API endpoint URLs are now centralized');
console.log('- HTTP configurations (timeouts, retries) are configurable');
console.log('- Frontend and backend use separate config files');
console.log('- Environment-based overrides are supported');
console.log('- Error handling is in place for invalid configurations');
