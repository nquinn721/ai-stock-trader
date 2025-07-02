#!/usr/bin/env node

const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testStrategyDisplay() {
  console.log("🔍 Testing Strategy Display Logic");

  try {
    // Test portfolios endpoint
    console.log("\n📁 Testing portfolios endpoint...");
    const portfoliosResponse = await axios.get(`${BASE_URL}/api/portfolios`);
    const portfolios = portfoliosResponse.data;
    console.log(`✅ Found ${portfolios.length} portfolios`);

    // Show portfolio strategy assignments
    portfolios.forEach((portfolio) => {
      console.log(
        `   Portfolio ${portfolio.id}: assignedStrategyName = "${portfolio.assignedStrategyName || "null"}"`
      );
    });

    // Test active strategies endpoint
    console.log("\n🎯 Testing active strategies endpoint...");
    const strategiesResponse = await axios.get(
      `${BASE_URL}/api/auto-trading/active-strategies`
    );
    console.log(
      `✅ Active strategies response success: ${strategiesResponse.data.success}`
    );
    console.log(
      `   Active strategies count: ${strategiesResponse.data.data?.length || 0}`
    );

    if (strategiesResponse.data.data?.length > 0) {
      strategiesResponse.data.data.forEach((strategy) => {
        console.log(
          `   Strategy: id="${strategy.id}", strategyId="${strategy.strategyId}", status="${strategy.status}"`
        );
      });
    } else {
      console.log("   No active strategies found");
    }

    // Test trading sessions for each portfolio
    console.log("\n📊 Testing trading sessions for each portfolio...");
    for (const portfolio of portfolios) {
      try {
        const sessionsResponse = await axios.get(
          `${BASE_URL}/api/auto-trading/sessions/${portfolio.id}`
        );
        const sessions = sessionsResponse.data;
        const activeSessions = sessions.filter((session) => session.is_active);
        console.log(
          `   Portfolio ${portfolio.id}: ${activeSessions.length} active sessions out of ${sessions.length} total`
        );
      } catch (err) {
        console.log(
          `   Portfolio ${portfolio.id}: Error loading sessions - ${err.message}`
        );
      }
    }

    // Simulate frontend logic
    console.log("\n🧠 Simulating Frontend Strategy Display Logic:");
    const portfolioStatuses = {};

    // Initialize portfolio statuses
    portfolios.forEach((portfolio) => {
      portfolioStatuses[String(portfolio.id)] = {
        portfolioId: String(portfolio.id),
        isActive: false,
        activeStrategies: [],
        activeSessions: [],
        hasActiveSession: false,
        assignedStrategyName: portfolio.assignedStrategyName,
        strategyAssignedAt: portfolio.strategyAssignedAt,
      };
    });

    // Process active strategies
    if (strategiesResponse.data.data?.length > 0) {
      strategiesResponse.data.data.forEach((strategy) => {
        let portfolioId = null;

        if (strategy.id.includes("autonomous-strategy-")) {
          portfolioId = strategy.id.replace("autonomous-strategy-", "");
        } else if (strategy.strategyId.includes("autonomous-strategy-")) {
          portfolioId = strategy.strategyId.replace("autonomous-strategy-", "");
        } else if (strategy.id.includes("-")) {
          portfolioId = strategy.id.split("-").pop() || null;
        } else if (strategy.strategyId.includes("-")) {
          portfolioId = strategy.strategyId.split("-").pop() || null;
        } else {
          const portfolio = portfolios.find(
            (p) =>
              p.assignedStrategyName === strategy.strategyId ||
              String(p.id) === strategy.strategyId
          );
          if (portfolio) {
            portfolioId = String(portfolio.id);
          }
        }

        if (portfolioId && portfolioStatuses[portfolioId]) {
          portfolioStatuses[portfolioId].activeStrategies.push(strategy);
          if (strategy.status === "running" && strategy.strategyId) {
            portfolioStatuses[portfolioId].assignedStrategyName =
              strategy.strategyId;
          }
        }
      });
    }

    // Load trading sessions and determine active status
    for (const portfolioId of Object.keys(portfolioStatuses)) {
      try {
        const sessionsResponse = await axios.get(
          `${BASE_URL}/api/auto-trading/sessions/${portfolioId}`
        );
        const sessions = sessionsResponse.data;
        const activeSessions = sessions.filter((session) => session.is_active);

        portfolioStatuses[portfolioId].activeSessions = activeSessions;
        portfolioStatuses[portfolioId].hasActiveSession =
          activeSessions.length > 0;
        portfolioStatuses[portfolioId].isActive = activeSessions.length > 0;
      } catch (err) {
        portfolioStatuses[portfolioId].activeSessions = [];
        portfolioStatuses[portfolioId].hasActiveSession = false;
        portfolioStatuses[portfolioId].isActive = false;
      }
    }

    // Display final portfolio status results
    console.log("\n📋 Final Portfolio Status Results:");
    Object.values(portfolioStatuses).forEach((status) => {
      console.log(`   Portfolio ${status.portfolioId}:`);
      console.log(`     - isActive: ${status.isActive}`);
      console.log(
        `     - assignedStrategyName: "${status.assignedStrategyName || "null"}"`
      );
      console.log(`     - activeStrategies: ${status.activeStrategies.length}`);
      console.log(`     - hasActiveSession: ${status.hasActiveSession}`);
      console.log(
        `     - Display Status: ${status.isActive ? "Active" : "Inactive"}`
      );
      console.log(
        `     - Display Strategy: ${status.assignedStrategyName || "No strategy assigned"}`
      );
    });

    console.log("\n✅ Strategy Display Test Complete");
  } catch (error) {
    console.error("❌ Strategy Display Test Failed:", error.message);
  }
}

testStrategyDisplay();
