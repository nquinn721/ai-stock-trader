// Simple test script to verify getTradingSessions works
const axios = require("axios");

const autoTradingApi = axios.create({
  baseURL: "http://localhost:8000/api/auto-trading",
  timeout: 10000,
});

async function testGetSessions() {
  try {
    console.log("Testing getTradingSessions for portfolio 1...");
    const response = await autoTradingApi.get("/sessions/1");
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));

    // Extract sessions like the service does
    const sessions = response.data.data || response.data;
    console.log("Extracted sessions:", sessions);

    // Filter active sessions
    const activeSessions = sessions.filter((session) => session.is_active);
    console.log("Active sessions:", activeSessions);
    console.log("Has active session:", activeSessions.length > 0);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Test portfolio 8 as well since we know it has an active session
async function testGetSessions8() {
  try {
    console.log("\nTesting getTradingSessions for portfolio 8...");
    const response = await autoTradingApi.get("/sessions/8");
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));

    // Extract sessions like the service does
    const sessions = response.data.data || response.data;
    console.log("Extracted sessions:", sessions);

    // Filter active sessions
    const activeSessions = sessions.filter((session) => session.is_active);
    console.log("Active sessions:", activeSessions);
    console.log("Has active session:", activeSessions.length > 0);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testGetSessions().then(() => testGetSessions8());
