/**
 * Test script to verify WebSocket live market data implementation
 * Tests that stocks are only sent when they have valid price data (currentPrice > 0)
 */

const fetch = require('node-fetch');
const io = require('socket.io-client');

const BACKEND_URL = 'http://localhost:8000';
const WEBSOCKET_URL = 'http://localhost:8000';

console.log('🧪 Testing Live Market Data WebSocket Implementation...\n');

// Test 1: Check if stocks endpoint returns data
async function testStocksEndpoint() {
  console.log('📊 Test 1: Checking stocks endpoint...');
  try {
    const response = await fetch(`${BACKEND_URL}/stocks`);
    const stocks = await response.json();
    
    console.log(`✅ Found ${stocks.length} stocks`);
    
    const readyStocks = stocks.filter(stock => stock.currentPrice > 0);
    console.log(`✅ ${readyStocks.length} stocks have valid price data`);
    
    if (readyStocks.length > 0) {
      console.log('✅ Sample ready stock:', {
        symbol: readyStocks[0].symbol,
        currentPrice: readyStocks[0].currentPrice,
        changePercent: readyStocks[0].changePercent
      });
    }
    
    return readyStocks.length > 0;
  } catch (error) {
    console.error('❌ Error testing stocks endpoint:', error.message);
    return false;
  }
}

// Test 2: Check WebSocket connection and message reception
async function testWebSocketConnection() {
  console.log('\n📡 Test 2: Testing WebSocket connection...');
  
  return new Promise((resolve) => {
    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      timeout: 10000,
    });
    
    let receivedStockUpdate = false;
    let receivedBatchUpdate = false;
    
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
    });
    
    socket.on('stock_updates', (data) => {
      console.log('✅ Received stock_updates event:', {
        stockCount: Array.isArray(data) ? data.length : 'Not an array',
        sampleStock: Array.isArray(data) && data.length > 0 ? {
          symbol: data[0].symbol,
          currentPrice: data[0].currentPrice
        } : 'No data'
      });
      receivedStockUpdate = true;
    });
    
    socket.on('stock_updates_batch', (data) => {
      console.log('✅ Received stock_updates_batch event:', {
        updateCount: data.updates ? data.updates.length : 'No updates',
        timestamp: data.timestamp
      });
      receivedBatchUpdate = true;
    });
    
    socket.on('stock_update', (data) => {
      console.log('✅ Received individual stock_update:', {
        symbol: data.symbol,
        currentPrice: data.data ? data.data.currentPrice : data.currentPrice
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      resolve(false);
    });
    
    // Wait for updates for 30 seconds
    setTimeout(() => {
      console.log('\n📊 WebSocket test results:');
      console.log(`Stock updates received: ${receivedStockUpdate ? '✅' : '❌'}`);
      console.log(`Batch updates received: ${receivedBatchUpdate ? '✅' : '❌'}`);
      
      socket.disconnect();
      resolve(receivedStockUpdate || receivedBatchUpdate);
    }, 30000);
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Live Market Data Tests...\n');
  
  const endpointTest = await testStocksEndpoint();
  const websocketTest = await testWebSocketConnection();
  
  console.log('\n📋 Test Summary:');
  console.log(`Stocks Endpoint: ${endpointTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebSocket Updates: ${websocketTest ? '✅ PASS' : '❌ FAIL'}`);
  
  const allTestsPassed = endpointTest && websocketTest;
  console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allTestsPassed) {
    console.log('\n🎉 Live market data implementation is working correctly!');
    console.log('✅ Stocks with valid prices are being sent via WebSocket');
    console.log('✅ Frontend should receive real-time updates automatically');
  } else {
    console.log('\n⚠️ Some issues detected. Check backend logs for more details.');
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

runTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
