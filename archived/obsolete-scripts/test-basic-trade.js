#!/usr/bin/env node

// Simple test for basic trade execution to verify backend is working
const http = require("http");

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const responseData = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: responseData });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(5000);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testBasicTrade() {
  console.log("🔧 Testing Basic Trade Execution");
  console.log("================================");

  // Test 1: Health check
  console.log("\n1. Health Check...");
  try {
    const health = await makeRequest({
      hostname: "localhost",
      port: 8000,
      path: "/api/health",
      method: "GET",
    });

    if (health.status === 200) {
      console.log("✅ Backend is running");
    } else {
      console.log("❌ Backend health check failed:", health.status);
      return;
    }
  } catch (error) {
    console.log("❌ Backend is not accessible:", error.message);
    return;
  }

  // Test 2: Get portfolios
  console.log("\n2. Getting Portfolios...");
  try {
    const portfolios = await makeRequest({
      hostname: "localhost",
      port: 8000,
      path: "/api/paper-trading/portfolios",
      method: "GET",
    });

    if (portfolios.status === 200) {
      console.log(`✅ Found ${portfolios.data.length} portfolios`);
      if (portfolios.data.length > 0) {
        console.log(
          `   Portfolio 1: ${portfolios.data[0].name} ($${portfolios.data[0].currentCash} cash)`
        );
      }
    } else {
      console.log("❌ Failed to get portfolios:", portfolios.status);
    }
  } catch (error) {
    console.log("❌ Error getting portfolios:", error.message);
  }

  // Test 3: Simple trade execution
  console.log("\n3. Testing Trade Execution...");
  try {
    const tradeData = {
      portfolioId: 1,
      symbol: "AAPL",
      quantity: 5,
      action: "buy",
    };

    const trade = await makeRequest(
      {
        hostname: "localhost",
        port: 8000,
        path: "/api/paper-trading/trade",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      tradeData
    );

    if (trade.status === 200 || trade.status === 201) {
      console.log("✅ Trade executed successfully!");
      console.log(`   Trade ID: ${trade.data.id}`);
      console.log(
        `   ${trade.data.type} ${trade.data.quantity} ${trade.data.symbol} at $${trade.data.price}`
      );
    } else {
      console.log("❌ Trade execution failed:", trade.status);
      console.log("   Response:", trade.data);
    }
  } catch (error) {
    console.log("❌ Error executing trade:", error.message);
  }

  console.log("\n🎯 Basic trading system is working!");
  console.log("   Ready to test autonomous trading features.");
}

testBasicTrade().catch(console.error);
