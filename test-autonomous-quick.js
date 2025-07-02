#!/usr/bin/env node

console.log("🚀 Testing Autonomous Trading System - Quick Test");
console.log("================================================");

const baseUrl = "http://localhost:8000/api";

// Simple fetch wrapper for testing
async function testRequest(endpoint, options = {}) {
  try {
    const url = `${baseUrl}${endpoint}`;
    console.log(`📡 Testing: ${options.method || "GET"} ${endpoint}`);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      timeout: 10000,
      ...options,
    });

    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    console.log(`✅ Status: ${response.status}`);
    if (response.status >= 200 && response.status < 300) {
      console.log(
        `📋 Response:`,
        typeof jsonData === "object"
          ? JSON.stringify(jsonData, null, 2)
          : jsonData
      );
      return { success: true, data: jsonData, status: response.status };
    } else {
      console.log(`❌ Error:`, jsonData);
      return { success: false, data: jsonData, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  // Test 1: Health check
  console.log("\n🔧 Test 1: Backend Health Check");
  console.log("--------------------------------");
  const health = await testRequest("/health");

  if (!health.success) {
    console.log("❌ Backend is not running. Please start the backend first.");
    return;
  }

  // Test 2: Get portfolios
  console.log("\n📊 Test 2: Get Portfolios");
  console.log("-------------------------");
  const portfolios = await testRequest("/paper-trading/portfolios");

  if (!portfolios.success) {
    console.log("❌ Could not get portfolios");
    return;
  }

  console.log(`Found ${portfolios.data.length} portfolios`);

  // Test 3: Create Auto Trading Order
  console.log("\n📋 Test 3: Create Auto Trading Order");
  console.log("------------------------------------");

  const orderData = {
    symbol: "AAPL",
    action: "BUY",
    quantity: 10,
    orderType: "LIMIT",
    limitPrice: 145.0,
    stopLossPrice: 135.0,
    takeProfitPrice: 160.0,
    confidence: 0.85,
    reasoning: ["Strong technical indicators", "Positive earnings outlook"],
    riskLevel: "MEDIUM",
    expiryMinutes: 1440,
  };

  const createOrder = await testRequest("/paper-trading/auto-orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

  if (!createOrder.success) {
    console.log("❌ Could not create auto trading order");
    console.log(
      "This might be normal if the endpoint is not yet fully implemented"
    );
    return;
  }

  console.log("✅ Auto trading order created!");
  const orderId = createOrder.data.id;

  // Test 4: Assign Order to Portfolio
  if (portfolios.data.length > 0 && orderId) {
    console.log("\n🎯 Test 4: Assign Order to Portfolio");
    console.log("------------------------------------");

    const assignData = {
      portfolioId: portfolios.data[0].id,
      strategyRules: {
        maxPositionPercent: 15,
        riskTolerance: "MEDIUM",
        allowDayTrading: false,
      },
    };

    const assignOrder = await testRequest(
      `/paper-trading/auto-orders/${orderId}/assign`,
      {
        method: "POST",
        body: JSON.stringify(assignData),
      }
    );

    if (assignOrder.success) {
      console.log("✅ Order assigned to portfolio!");

      // Test 5: Process Orders
      console.log("\n⚡ Test 5: Process Approved Orders");
      console.log("---------------------------------");

      const processOrders = await testRequest(
        "/paper-trading/auto-orders/process",
        {
          method: "POST",
        }
      );

      if (processOrders.success) {
        console.log("✅ Orders processed!");
      }
    }
  }

  // Test 6: Get All Orders
  console.log("\n📋 Test 6: Get All Auto Trading Orders");
  console.log("--------------------------------------");
  const allOrders = await testRequest("/paper-trading/auto-orders");

  if (allOrders.success) {
    console.log(`✅ Retrieved ${allOrders.data.length} auto trading orders`);

    if (allOrders.data.length > 0) {
      console.log("Recent orders:");
      allOrders.data.slice(0, 3).forEach((order, i) => {
        console.log(
          `  ${i + 1}. ${order.symbol} ${order.action} ${order.quantity} - Status: ${order.status}`
        );
      });
    }
  }

  console.log("\n🎉 Autonomous Trading System Test Complete!");
  console.log("==========================================");
}

// Run if fetch is available (Node 18+) or if running in browser
if (typeof fetch !== "undefined") {
  runTests().catch(console.error);
} else {
  console.log(
    "❌ This test requires Node.js 18+ or a browser environment with fetch support"
  );
  console.log(
    "Alternative: Run `node --experimental-fetch test-autonomous-quick.js` or use the original test script"
  );
}
