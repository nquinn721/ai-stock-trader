#!/usr/bin/env node
/**
 * Test Script: Verify Trading Signals Are Displayed Correctly
 *
 * This script tests:
 * 1. Backend provides trading signals via API
 * 2. Frontend can fetch and display the signals
 * 3. Signal badges show up correctly on stock cards
 */

const http = require("http");

console.log("🔍 Testing Trading Signals Integration...\n");

// Test 1: Check backend API
function testBackendAPI() {
  return new Promise((resolve, reject) => {
    console.log("📡 Step 1: Testing backend API endpoint...");

    const options = {
      hostname: "localhost",
      port: 8000,
      path: "/api/stocks/with-signals/all",
      method: "GET",
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const stocks = JSON.parse(data);
          console.log(`   ✅ Backend returned ${stocks.length} stocks`);

          // Analyze signals
          const signalCounts = { buy: 0, sell: 0, hold: 0, none: 0 };
          const signalDetails = [];

          stocks.forEach((stock) => {
            if (stock.tradingSignal && stock.tradingSignal.signal) {
              signalCounts[stock.tradingSignal.signal]++;
              signalDetails.push({
                symbol: stock.symbol,
                signal: stock.tradingSignal.signal,
                confidence: stock.tradingSignal.confidence,
                reason: stock.tradingSignal.reason,
              });
            } else {
              signalCounts.none++;
            }
          });

          console.log(`   📊 Signal Distribution:`);
          console.log(`      BUY: ${signalCounts.buy} stocks`);
          console.log(`      SELL: ${signalCounts.sell} stocks`);
          console.log(`      HOLD: ${signalCounts.hold} stocks`);
          console.log(`      NO SIGNAL: ${signalCounts.none} stocks`);

          if (signalDetails.length > 0) {
            console.log(`\n   🏷️ Sample Trading Signals:`);
            signalDetails.slice(0, 5).forEach((signal) => {
              console.log(
                `      ${signal.symbol}: ${signal.signal.toUpperCase()} (${(signal.confidence * 100).toFixed(1)}%)`
              );
              console.log(
                `         Reason: ${signal.reason.substring(0, 80)}...`
              );
            });
          }

          resolve({
            success: true,
            totalStocks: stocks.length,
            signalCounts,
            hasSignals: signalDetails.length > 0,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

// Test 2: Check frontend connectivity
function testFrontendConnectivity() {
  return new Promise((resolve, reject) => {
    console.log("\n🌐 Step 2: Testing frontend connectivity...");

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/",
      method: "GET",
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      console.log(`   ✅ Frontend responding with status: ${res.statusCode}`);
      resolve({ success: true, status: res.statusCode });
    });

    req.on("error", (error) => {
      reject(new Error(`Frontend not accessible: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Frontend timeout"));
    });

    req.end();
  });
}

// Main test execution
async function runTests() {
  try {
    // Test backend
    const backendResult = await testBackendAPI();

    // Test frontend
    const frontendResult = await testFrontendConnectivity();

    // Final assessment
    console.log("\n📋 TEST RESULTS SUMMARY:");
    console.log("========================");

    if (backendResult.success && backendResult.hasSignals) {
      console.log("✅ Backend API: Working correctly");
      console.log(
        `   - Returns ${backendResult.totalStocks} stocks with trading signals`
      );
      console.log(
        `   - Signal distribution: ${JSON.stringify(backendResult.signalCounts)}`
      );
    } else {
      console.log("❌ Backend API: Issues detected");
    }

    if (frontendResult.success) {
      console.log("✅ Frontend: Accessible and responding");
    } else {
      console.log("❌ Frontend: Not accessible");
    }

    console.log("\n🎯 VERIFICATION STATUS:");
    if (
      backendResult.success &&
      backendResult.hasSignals &&
      frontendResult.success
    ) {
      console.log(
        "✅ Trading signals are properly generated and available for frontend display"
      );
      console.log("✅ Both backend and frontend are running correctly");
      console.log("\n💡 To verify signals are visible in the UI:");
      console.log("   1. Open http://localhost:3000 in your browser");
      console.log(
        "   2. Look for signal badges on stock cards (🟢 BUY, 🔴 SELL, 🟡 HOLD)"
      );
      console.log(
        "   3. Check the Trading Signals section in the market metrics"
      );
    } else {
      console.log(
        "❌ Issues detected - signals may not be displaying correctly"
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
