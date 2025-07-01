#!/usr/bin/env node

/**
 * DEBUG TRADE EXECUTION - Autonomous Trading System
 *
 * This script diagnoses why no trades are being executed despite having
 * active auto trading sessions and strategies.
 */

const BASE_URL = "http://localhost:8000/api";

async function testTradeExecution() {
  console.log("🔍 DEBUGGING TRADE EXECUTION ISSUES");
  console.log("=====================================\n");

  try {
    // 1. Check if we can get a portfolio
    console.log("1️⃣ TESTING PORTFOLIO ACCESS");
    const portfoliosResponse = await fetch(
      `${BASE_URL}/paper-trading/portfolios`
    );
    const portfolios = await portfoliosResponse.json();

    if (portfolios.length === 0) {
      console.log("❌ No portfolios found");
      return;
    }

    const testPortfolio = portfolios[0];
    console.log(
      `✅ Using portfolio: ${testPortfolio.name} (ID: ${testPortfolio.id})`
    );
    console.log(`   Cash: $${testPortfolio.currentCash}`);
    console.log(`   Active: ${testPortfolio.isActive}`);
    console.log(`   Strategy: ${testPortfolio.assignedStrategyName}`);

    // 2. Test stock data access
    console.log("\n2️⃣ TESTING STOCK DATA ACCESS");
    const stocksResponse = await fetch(`${BASE_URL}/stocks`);
    const stocks = await stocksResponse.json();

    if (stocks.length === 0) {
      console.log("❌ No stock data available");
      return;
    }

    const testStock = stocks[0];
    console.log(
      `✅ Using stock: ${testStock.symbol} - $${testStock.currentPrice}`
    );

    // 3. Test manual trade execution
    console.log("\n3️⃣ TESTING MANUAL TRADE EXECUTION");

    const tradeData = {
      symbol: testStock.symbol,
      type: "buy",
      quantity: 1,
      userId: "user-123",
    };

    console.log(
      `Attempting to buy 1 share of ${testStock.symbol} at $${testStock.currentPrice}...`
    );

    const tradeResponse = await fetch(
      `${BASE_URL}/paper-trading/portfolios/${testPortfolio.id}/trade`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tradeData),
      }
    );

    console.log(`Trade request status: ${tradeResponse.status}`);

    if (tradeResponse.ok) {
      const tradeResult = await tradeResponse.json();
      console.log("✅ TRADE EXECUTED SUCCESSFULLY!");
      console.log(`   Trade ID: ${tradeResult.id}`);
      console.log(`   Symbol: ${tradeResult.symbol}`);
      console.log(`   Quantity: ${tradeResult.quantity}`);
      console.log(`   Price: $${tradeResult.price}`);
      console.log(`   Total: $${tradeResult.totalValue}`);
    } else {
      const errorText = await tradeResponse.text();
      console.log("❌ TRADE EXECUTION FAILED");
      console.log(`   Status: ${tradeResponse.status}`);
      console.log(`   Error: ${errorText}`);

      // Try to parse as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.log(
          `   Details: ${errorJson.message || errorJson.error || "No additional details"}`
        );
      } catch (e) {
        console.log(`   Raw error: ${errorText}`);
      }
    }

    // 4. Check if trade was recorded
    console.log("\n4️⃣ CHECKING TRADE RECORDING");
    const updatedPortfolioResponse = await fetch(
      `${BASE_URL}/paper-trading/portfolios/${testPortfolio.id}`
    );
    const updatedPortfolio = await updatedPortfolioResponse.json();

    console.log(`Portfolio trades count: ${updatedPortfolio.trades.length}`);
    console.log(`Portfolio cash: $${updatedPortfolio.currentCash}`);
    console.log(`Portfolio positions: ${updatedPortfolio.positions.length}`);

    // 5. Test auto-trading recommendation engine
    console.log("\n5️⃣ TESTING AUTO-TRADING RECOMMENDATIONS");
    try {
      const recommendationResponse = await fetch(
        `${BASE_URL}/auto-trading/recommend/${testStock.symbol}`
      );
      if (recommendationResponse.ok) {
        const recommendation = await recommendationResponse.json();
        console.log("✅ Recommendation engine working");
        console.log(`   Action: ${recommendation.action}`);
        console.log(`   Confidence: ${recommendation.confidence}%`);
        console.log(`   Risk: ${recommendation.riskLevel}`);
      } else {
        console.log("⚠️ Recommendation engine not accessible");
      }
    } catch (e) {
      console.log("⚠️ Recommendation engine error:", e.message);
    }

    // 6. Check autonomous strategy deployment
    console.log("\n6️⃣ CHECKING AUTONOMOUS STRATEGY DEPLOYMENT");
    try {
      const strategiesResponse = await fetch(
        `${BASE_URL}/auto-trading/strategies/active/user-123`
      );
      if (strategiesResponse.ok) {
        const strategies = await strategiesResponse.json();
        console.log(`Active autonomous strategies: ${strategies.length}`);
        if (strategies.length > 0) {
          strategies.forEach((strategy, index) => {
            console.log(
              `   Strategy ${index + 1}: ${strategy.strategyId} (${strategy.status})`
            );
          });
        } else {
          console.log("⚠️ No active autonomous strategies deployed");
          console.log(
            "   This may be why no trades are happening automatically"
          );
        }
      }
    } catch (e) {
      console.log("⚠️ Could not check autonomous strategies:", e.message);
    }

    // 7. Check trading sessions
    console.log("\n7️⃣ CHECKING TRADING SESSIONS");
    try {
      const sessionsResponse = await fetch(
        `${BASE_URL}/auto-trading/sessions/${testPortfolio.id}`
      );
      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();
        const activeSessions = sessions.filter((s) => s.is_active);
        console.log(`Active trading sessions: ${activeSessions.length}`);
        if (activeSessions.length > 0) {
          activeSessions.forEach((session, index) => {
            console.log(`   Session ${index + 1}: ${session.session_name}`);
            console.log(`      Trades: ${session.total_trades || 0}`);
            console.log(`      P&L: $${session.total_pnl || 0}`);
            console.log(`      AI Enabled: ${session.ai_enabled || false}`);
          });
        }
      }
    } catch (e) {
      console.log("⚠️ Could not check trading sessions:", e.message);
    }
  } catch (error) {
    console.log("❌ CRITICAL ERROR DURING TESTING");
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }

  console.log("\n🔍 DIAGNOSIS COMPLETE");
  console.log("=====================");
}

// Run the test
testTradeExecution().catch(console.error);
