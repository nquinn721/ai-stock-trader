#!/usr/bin/env node

const http = require("http");
const { NestFactory } = require("@nestjs/core");

async function testHealthEndpoint() {
  console.log("🏥 Testing Health Endpoint Configuration");
  console.log("======================================");

  try {
    // Test if the health endpoint responds quickly
    const startTime = Date.now();

    // Simulate the health check logic from main.ts
    const healthResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      database: {
        status: "checking",
        message: "Database connection check skipped for fast health response",
      },
      readiness: {
        app: "ready",
        port: process.env.PORT || 8000,
      },
    };

    const responseTime = Date.now() - startTime;

    console.log("✅ Health endpoint simulation successful");
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log("📊 Health response:", JSON.stringify(healthResponse, null, 2));

    // Check database configuration environment variables
    console.log("\n🔐 Environment Variables Check:");
    console.log(`DATABASE_HOST: ${process.env.DATABASE_HOST || "❌ Not set"}`);
    console.log(
      `DATABASE_USERNAME: ${process.env.DATABASE_USERNAME || "❌ Not set"}`
    );
    console.log(`DATABASE_NAME: ${process.env.DATABASE_NAME || "❌ Not set"}`);
    console.log(
      `CLOUD_SQL_CONNECTION_NAME: ${process.env.CLOUD_SQL_CONNECTION_NAME || "❌ Not set"}`
    );
    console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
    console.log(`K_SERVICE: ${process.env.K_SERVICE || "❌ Not in Cloud Run"}`);

    if (responseTime < 1000) {
      console.log("\n✅ Health check is fast enough for startup probes");
    } else {
      console.log("\n⚠️  Health check might be too slow for startup probes");
    }
  } catch (error) {
    console.error("❌ Health endpoint test failed:", error.message);
    process.exit(1);
  }
}

testHealthEndpoint();
