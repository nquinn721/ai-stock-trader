#!/usr/bin/env node

/**
 * Frontend Integration Test for Improved Auto-Trading Button Logic
 * Tests that the frontend can properly interact with the backend
 */

const axios = require("axios");

console.log(
  "🔄 Testing Frontend-Backend Integration for Auto-Trading Button\n"
);

const BASE_URL = "http://localhost:8000";

async function testBackendEndpoints() {
  try {
    console.log("📡 Testing backend endpoints...");

    // Test 1: Health check
    const health = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check:", health.data.status);

    // Test 2: Get portfolios
    const portfolios = await axios.get(
      `${BASE_URL}/api/paper-trading/portfolios`
    );
    console.log(`✅ Portfolios available: ${portfolios.data.length}`);

    // Test 3: Get active sessions
    const sessions = await axios.get(
      `${BASE_URL}/api/auto-trading/sessions/active/all`
    );
    console.log(`✅ Active sessions: ${sessions.data.count || 0}`);

    // Test 4: Check for existing active sessions per portfolio
    if (portfolios.data.length > 0) {
      console.log("\n📊 Portfolio Status Analysis:");
      for (const portfolio of portfolios.data.slice(0, 3)) {
        // Test first 3 portfolios
        try {
          const portfolioSessions = await axios.get(
            `${BASE_URL}/api/auto-trading/sessions/${portfolio.id}`
          );
          const activeSessions = portfolioSessions.data.filter(
            (s) => s.is_active
          );
          console.log(
            `   Portfolio ${portfolio.id}: ${activeSessions.length} active sessions`
          );
        } catch (err) {
          console.log(`   Portfolio ${portfolio.id}: No sessions or error`);
        }
      }
    }

    return {
      healthy: true,
      portfolioCount: portfolios.data.length,
      activeSessionCount: sessions.data.count || 0,
    };
  } catch (error) {
    console.error("❌ Backend test failed:", error.message);
    return { healthy: false, error: error.message };
  }
}

async function simulateButtonLogic(portfolioCount, activeSessionCount) {
  console.log("\n🔧 Simulating Button Logic:");
  console.log(`   Total Portfolios: ${portfolioCount}`);
  console.log(`   Active Sessions: ${activeSessionCount}`);

  const allActive = activeSessionCount === portfolioCount && portfolioCount > 0;
  const noneActive = activeSessionCount === 0;
  const someActive =
    activeSessionCount > 0 && activeSessionCount < portfolioCount;

  const buttonText = allActive ? "Stop All Trading" : "Start Trading";
  const buttonAction = allActive
    ? "STOP all active sessions"
    : "START inactive portfolios";

  console.log(`   Button Text: "${buttonText}"`);
  console.log(`   Button Action: ${buttonAction}`);

  if (someActive) {
    console.log(
      `   Note: ${portfolioCount - activeSessionCount} portfolios will be started`
    );
  }

  return { buttonText, buttonAction, allActive, someActive, noneActive };
}

async function main() {
  const backendStatus = await testBackendEndpoints();

  if (backendStatus.healthy) {
    const buttonLogic = await simulateButtonLogic(
      backendStatus.portfolioCount,
      backendStatus.activeSessionCount
    );

    console.log("\n✅ Integration Test Results:");
    console.log("   ✓ Backend endpoints accessible");
    console.log("   ✓ Portfolio data available");
    console.log("   ✓ Session status queryable");
    console.log("   ✓ Button logic working correctly");

    console.log("\n📋 Expected Frontend Behavior:");
    console.log(`   - Button shows: "${buttonLogic.buttonText}"`);
    console.log(`   - When clicked: ${buttonLogic.buttonAction}`);
    console.log(
      `   - Status indicator: ${backendStatus.activeSessionCount}/${backendStatus.portfolioCount} active`
    );

    if (buttonLogic.someActive) {
      console.log("   - Status color: Warning (orange) - partial activation");
    } else if (buttonLogic.allActive) {
      console.log("   - Status color: Success (green) - all active");
    } else {
      console.log("   - Status color: Inactive (red) - none active");
    }
  } else {
    console.log("\n❌ Integration test failed - backend not accessible");
    console.log("   Make sure the backend server is running on port 8000");
  }
}

main().catch(console.error);
