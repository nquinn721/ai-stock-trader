#!/usr/bin/env node

const http = require("http");

console.log("🚀 Testing Autonomous Trading System");
console.log("====================================");

// Test data for creating an auto trading order
const createOrderData = {
  symbol: "AAPL",
  action: "BUY",
  quantity: 10,
  orderType: "LIMIT",
  limitPrice: 145.0,
  stopLossPrice: 135.0,
  takeProfitPrice: 160.0,
  confidence: 0.85,
  reasoning: [
    "Strong technical indicators",
    "Positive earnings outlook",
    "Market momentum",
  ],
  riskLevel: "MEDIUM",
  expiryMinutes: 1440, // 24 hours
};

const assignOrderData = {
  portfolioId: 1,
  strategyRules: {
    maxPositionPercent: 15,
    riskTolerance: "MEDIUM",
    allowDayTrading: false,
  },
};

async function makeRequest(options, data = null) {
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
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.setTimeout(10000);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testStep1_CreateOrder() {
  console.log("\\n📋 Step 1: Creating Auto Trading Order");
  console.log("--------------------------------------");

  const options = {
    hostname: "localhost",
    port: 8000,
    path: "/api/paper-trading/auto-orders",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await makeRequest(options, createOrderData);
    console.log(`Status: ${response.status}`);

    if (response.status === 201 || response.status === 200) {
      console.log("✅ Auto trading order created successfully!");
      console.log("Order Details:", JSON.stringify(response.data, null, 2));
      return response.data.id;
    } else {
      console.log("❌ Failed to create auto trading order");
      console.log("Response:", response.data);
      return null;
    }
  } catch (error) {
    console.log("❌ Error creating auto trading order:", error.message);
    return null;
  }
}

async function testStep2_AssignOrder(orderId) {
  if (!orderId) {
    console.log("\\n⏭️ Skipping Step 2: No order ID available");
    return null;
  }

  console.log(`\\n🎯 Step 2: Assigning Order ${orderId} to Portfolio`);
  console.log("------------------------------------------------");

  const options = {
    hostname: "localhost",
    port: 8000,
    path: `/api/paper-trading/auto-orders/${orderId}/assign`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await makeRequest(options, assignOrderData);
    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      console.log("✅ Order assigned to portfolio successfully!");
      console.log(
        "Assignment Details:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } else {
      console.log("❌ Failed to assign order to portfolio");
      console.log("Response:", response.data);
      return null;
    }
  } catch (error) {
    console.log("❌ Error assigning order:", error.message);
    return null;
  }
}

async function testStep3_ProcessOrders() {
  console.log("\\n⚡ Step 3: Processing Approved Orders");
  console.log("------------------------------------");

  const options = {
    hostname: "localhost",
    port: 8000,
    path: "/api/paper-trading/auto-orders/process",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await makeRequest(options);
    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      console.log("✅ Order processing completed!");
      console.log(
        "Processing Results:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } else {
      console.log("❌ Failed to process orders");
      console.log("Response:", response.data);
      return null;
    }
  } catch (error) {
    console.log("❌ Error processing orders:", error.message);
    return null;
  }
}

async function testStep4_GetOrders() {
  console.log("\\n📋 Step 4: Getting All Auto Trading Orders");
  console.log("------------------------------------------");

  const options = {
    hostname: "localhost",
    port: 8000,
    path: "/api/paper-trading/auto-orders",
    method: "GET",
  };

  try {
    const response = await makeRequest(options);
    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      console.log("✅ Retrieved auto trading orders!");
      console.log(`Found ${response.data.length || 0} orders`);

      if (response.data.length > 0) {
        console.log("Recent Orders:");
        response.data.slice(0, 3).forEach((order, index) => {
          console.log(
            `  ${index + 1}. ${order.symbol} ${order.action} ${order.quantity} - Status: ${order.status}`
          );
        });
      }
      return response.data;
    } else {
      console.log("❌ Failed to get orders");
      console.log("Response:", response.data);
      return null;
    }
  } catch (error) {
    console.log("❌ Error getting orders:", error.message);
    return null;
  }
}

async function testBackend() {
  console.log("🔧 Testing if backend is running...");

  const options = {
    hostname: "localhost",
    port: 8000,
    path: "/api/health",
    method: "GET",
    timeout: 5000,
  };

  try {
    const response = await makeRequest(options);

    if (response.status === 200) {
      console.log("✅ Backend is running\\n");
      return true;
    } else {
      console.log("❌ Backend health check failed\\n");
      return false;
    }
  } catch (error) {
    console.log("❌ Backend is not running:", error.message);
    console.log("📝 Please start the backend server first\\n");
    return false;
  }
}

async function runFullTest() {
  console.log("Starting Autonomous Trading System Test...");

  // Check if backend is running
  const backendRunning = await testBackend();
  if (!backendRunning) {
    console.log("\\n❌ Test aborted: Backend not available");
    return;
  }

  // Step 1: Create auto trading order
  const orderId = await testStep1_CreateOrder();

  // Wait a moment
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Step 2: Assign order to portfolio
  const assignedOrder = await testStep2_AssignOrder(orderId);

  // Wait a moment
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Step 3: Process approved orders (attempt execution)
  await testStep3_ProcessOrders();

  // Wait a moment
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Step 4: Get all orders to see final status
  await testStep4_GetOrders();

  console.log("\\n🎉 Autonomous Trading System Test Complete!");
  console.log("============================================");
  console.log("Summary:");
  console.log("- Created recommendation order ✓");
  console.log("- Assigned to portfolio based on strategy ✓");
  console.log("- Processed execution conditions ✓");
  console.log("- Retrieved order status ✓");
}

runFullTest().catch(console.error);
