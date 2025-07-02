#!/usr/bin/env node

const http = require("http");

// Test if backend is running
function testBackend() {
  console.log("🔧 Testing if backend is running...");

  const options = {
    hostname: "localhost",
    port: 8000,
    path: "/api/health",
    method: "GET",
    timeout: 5000,
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Backend health check: ${res.statusCode}`);

    if (res.statusCode === 200) {
      console.log("🚀 Backend is running, testing trade endpoint...");
      testTradeEndpoint();
    } else {
      console.log("❌ Backend health check failed");
    }
  });

  req.on("error", (err) => {
    console.log("❌ Backend is not running:", err.message);
  });

  req.on("timeout", () => {
    console.log("⏰ Backend health check timed out");
    req.destroy();
  });

  req.setTimeout(5000);
  req.end();
}

function testTradeEndpoint() {
  const postData = JSON.stringify({
    portfolioId: 1,
    symbol: "AAPL",
    quantity: 10,
    action: "buy",
  });

  const options = {
    hostname: "localhost",
    port: 8000,
    path: "/api/paper-trading/trade",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
    timeout: 10000,
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Trade endpoint response: ${res.statusCode}`);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log("✅ Trade executed successfully!");
        console.log("Response:", data);
      } else {
        console.log("❌ Trade execution failed");
        console.log("Error response:", data);
      }
    });
  });

  req.on("error", (err) => {
    console.log("❌ Trade request failed:", err.message);
  });

  req.on("timeout", () => {
    console.log("⏰ Trade request timed out");
    req.destroy();
  });

  req.setTimeout(10000);
  req.write(postData);
  req.end();
}

testBackend();
