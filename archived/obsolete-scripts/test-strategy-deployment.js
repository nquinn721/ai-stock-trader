#!/usr/bin/env node

const axios = require("axios");

const BASE_URL = "http://localhost:8000/api";

async function testStrategyDeployment() {
  console.log("🧪 Testing Strategy Deployment for Portfolio Auto Trading\n");

  try {
    // 1. Get available portfolios
    console.log("1️⃣ Fetching available portfolios...");
    const portfoliosResponse = await axios.get(
      `${BASE_URL}/paper-trading/portfolios`
    );
    const portfolios = portfoliosResponse.data;

    console.log(`   Found ${portfolios.length} portfolios:`);
    portfolios.forEach((p) => {
      console.log(`   - Portfolio ${p.id}: ${p.name}`);
      console.log(
        `     💰 Balance: $${parseFloat(p.currentCash).toLocaleString()}`
      );
      console.log(
        `     📋 Assigned Strategy: ${p.assignedStrategyName || "None"}`
      );
      console.log(`     🔄 Is Active: ${p.isActive}`);
      console.log("");
    });

    // 2. Check current active strategies
    console.log("2️⃣ Checking current active strategies...");
    const activeStrategiesResponse = await axios.get(
      `${BASE_URL}/auto-trading/autonomous/strategies/active`
    );
    const activeStrategies = activeStrategiesResponse.data.data || [];

    console.log(`   Found ${activeStrategies.length} active strategies:`);
    if (activeStrategies.length === 0) {
      console.log("   ❌ No strategies currently running");
    } else {
      activeStrategies.forEach((s) => {
        console.log(`   - Strategy ${s.id}: ${s.strategyId} (${s.status})`);
      });
    }
    console.log("");

    // 3. Test starting trading for a portfolio with assigned strategy
    const portfolioWithStrategy = portfolios.find(
      (p) =>
        p.assignedStrategyName &&
        !activeStrategies.some((s) => s.id.includes(p.id))
    );

    if (!portfolioWithStrategy) {
      console.log(
        "❌ No portfolio found with assigned strategy that is not already active"
      );
      return;
    }

    console.log(
      `3️⃣ Testing auto-deployment for Portfolio ${portfolioWithStrategy.id}...`
    );
    console.log(`   Portfolio: ${portfolioWithStrategy.name}`);
    console.log(
      `   Assigned Strategy: ${portfolioWithStrategy.assignedStrategyName}`
    );
    console.log(
      `   Balance: $${parseFloat(portfolioWithStrategy.currentCash).toLocaleString()}`
    );
    console.log("");

    // 4. Start trading session
    console.log("4️⃣ Starting trading session...");
    const sessionData = {
      portfolio_id: String(portfolioWithStrategy.id),
      session_name: `Test Auto Trading - ${new Date().toLocaleString()}`,
      config: {
        max_daily_trades: 50,
        max_position_size: 20,
        daily_loss_limit: 5,
        enable_risk_management: true,
        trading_hours: {
          start: "09:30",
          end: "16:00",
          timezone: "US/Eastern",
        },
        allowed_symbols: [],
        excluded_symbols: [],
      },
    };

    const sessionResponse = await axios.post(
      `${BASE_URL}/auto-trading/sessions/start`,
      sessionData
    );

    if (sessionResponse.data.success) {
      console.log(
        `   ✅ Trading session created: ${sessionResponse.data.data.id}`
      );
    } else {
      console.log(
        `   ❌ Failed to create session: ${sessionResponse.data.message}`
      );
    }

    // 5. Auto-deploy strategy
    console.log("5️⃣ Auto-deploying strategy...");
    const deployResponse = await axios.post(
      `${BASE_URL}/auto-trading/autonomous/portfolios/${portfolioWithStrategy.id}/auto-deploy`
    );

    if (deployResponse.data.success) {
      console.log(`   ✅ Strategy auto-deployed successfully`);
      console.log(`   📊 Strategy ID: ${deployResponse.data.data.strategyId}`);
      console.log(
        `   🎯 Strategy Name: ${deployResponse.data.data.strategy?.name || "Unknown"}`
      );
    } else {
      console.log(
        `   ❌ Failed to auto-deploy strategy: ${deployResponse.data.error}`
      );
    }

    // 6. Check active strategies again
    console.log("\n6️⃣ Checking active strategies after deployment...");
    const finalStrategiesResponse = await axios.get(
      `${BASE_URL}/auto-trading/autonomous/strategies/active`
    );
    const finalActiveStrategies = finalStrategiesResponse.data.data || [];

    console.log(`   Found ${finalActiveStrategies.length} active strategies:`);
    finalActiveStrategies.forEach((s) => {
      console.log(`   - Strategy ${s.id}: ${s.strategyId} (${s.status})`);
      console.log(`     📈 Portfolio: ${s.config?.portfolioId || "Unknown"}`);
    });

    console.log("\n🎉 Test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);

    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes(
        "already has an active trading session"
      )
    ) {
      console.log(
        "\n💡 Portfolio already has an active session. This is expected if testing multiple times."
      );
      console.log(
        "   The strategy deployment logic should handle this case gracefully."
      );
    }
  }
}

// Run the test
testStrategyDeployment().catch(console.error);
