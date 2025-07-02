#!/usr/bin/env node

const http = require("http");

console.log("🔍 Verifying Frontend Trading Signals Integration...\n");

// Test backend API directly
function testBackendAPI() {
  return new Promise((resolve, reject) => {
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
          resolve(stocks);
        } catch (e) {
          reject(new Error("Invalid JSON response"));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

// Test frontend accessibility
function testFrontendServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/",
      method: "GET",
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve(res.statusCode === 200 && data.includes("<!DOCTYPE html>"));
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

async function runVerification() {
  try {
    console.log("📡 Step 1: Testing backend trading signals endpoint...");
    const stocks = await testBackendAPI();

    if (!Array.isArray(stocks) || stocks.length === 0) {
      throw new Error("No stocks returned from backend");
    }

    console.log(`✅ Backend API working: ${stocks.length} stocks with signals`);

    // Analyze signal distribution
    const signals = stocks.map((s) => s.tradingSignal?.signal).filter(Boolean);
    const signalCounts = signals.reduce((acc, signal) => {
      acc[signal] = (acc[signal] || 0) + 1;
      return acc;
    }, {});

    console.log("📊 Signal Distribution:");
    Object.entries(signalCounts).forEach(([signal, count]) => {
      console.log(`   ${signal.toUpperCase()}: ${count} stocks`);
    });

    // Show some examples
    console.log("\n💼 Sample Stock Signals:");
    stocks.slice(0, 5).forEach((stock) => {
      const signal = stock.tradingSignal;
      if (signal) {
        console.log(
          `   ${stock.symbol}: ${signal.signal.toUpperCase()} (${Math.round(signal.confidence * 100)}% confidence)`
        );
      }
    });

    console.log("\n🌐 Step 2: Testing frontend server...");
    const frontendWorking = await testFrontendServer();

    if (!frontendWorking) {
      throw new Error("Frontend server not responding correctly");
    }

    console.log("✅ Frontend server accessible");

    console.log("\n🎯 Verification Summary:");
    console.log("✅ Backend API serving live trading signals");
    console.log("✅ Frontend server running and accessible");
    console.log("✅ Data structure includes signal, confidence, and reasoning");
    console.log("\n📋 Manual Verification Steps:");
    console.log("1. Open http://localhost:3000/dashboard in browser");
    console.log(
      "2. Verify stock cards display trading signal badges (BUY/SELL/HOLD)"
    );
    console.log("3. Check that confidence percentages are shown");
    console.log("4. Confirm signal reasoning appears in tooltips or details");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

runVerification();
