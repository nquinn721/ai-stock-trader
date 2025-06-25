#!/usr/bin/env node

/**
 * Test script to verify NO MOCK DATA policy compliance
 * and fix for biased BUY signals in trading recommendations
 */

const axios = require("axios");

const API_BASE = "http://localhost:8000";

async function testRecommendationFix() {
  console.log("🧪 Testing Trading Recommendation Fix");
  console.log("=".repeat(50));

  const testSymbols = ["AAPL", "GOOGL", "TSLA", "MSFT", "AMZN"];
  const results = [];

  for (const symbol of testSymbols) {
    try {
      console.log(`\n📊 Testing ${symbol}...`);

      const response = await axios.post(
        `${API_BASE}/ml/recommendation/${symbol}`,
        {
          currentPrice: 150.0,
          portfolioContext: {
            currentHoldings: 0,
            availableCash: 10000,
            riskTolerance: "MEDIUM",
          },
          timeHorizon: "1D",
        },
        {
          timeout: 10000,
        }
      );

      const recommendation = response.data;

      console.log(`   Action: ${recommendation.action}`);
      console.log(
        `   Confidence: ${(recommendation.confidence * 100).toFixed(1)}%`
      );
      console.log(`   Risk Level: ${recommendation.riskLevel}`);
      console.log(
        `   Reasoning: ${
          recommendation.reasoning[0] || "No reasoning provided"
        }`
      );

      results.push({
        symbol,
        action: recommendation.action,
        confidence: recommendation.confidence,
        riskLevel: recommendation.riskLevel,
        hasRealData:
          recommendation.metrics?.marketPrediction?.hasRealData !== false,
      });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        symbol,
        action: "ERROR",
        confidence: 0,
        riskLevel: "HIGH",
        error: error.message,
      });
    }
  }

  console.log("\n📈 Summary Results:");
  console.log("=".repeat(50));

  const actionCounts = { BUY: 0, SELL: 0, HOLD: 0, ERROR: 0 };

  results.forEach((result) => {
    actionCounts[result.action]++;
    console.log(
      `${result.symbol}: ${result.action} (${(result.confidence * 100).toFixed(
        1
      )}% confidence)`
    );
  });

  console.log("\n📊 Action Distribution:");
  console.log(`BUY signals: ${actionCounts.BUY}`);
  console.log(`HOLD signals: ${actionCounts.HOLD}`);
  console.log(`SELL signals: ${actionCounts.SELL}`);
  console.log(`Errors: ${actionCounts.ERROR}`);

  // Validate fix
  console.log("\n✅ Validation:");
  if (actionCounts.BUY === testSymbols.length) {
    console.log(
      "❌ ISSUE PERSISTS: Still showing all BUY signals - bias not fixed"
    );
  } else if (actionCounts.HOLD > actionCounts.BUY) {
    console.log("✅ SUCCESS: Conservative HOLD approach implemented");
    console.log(
      "✅ NO MOCK DATA policy working - returning low confidence when no real data"
    );
  } else {
    console.log(
      "⚠️  PARTIAL FIX: Signals are more diverse but may still need adjustment"
    );
  }

  console.log("\n🔍 NO MOCK DATA Policy Compliance:");
  const noMockDataCompliant = results.every(
    (r) => r.action === "HOLD" && r.confidence <= 0.2
  );

  if (noMockDataCompliant) {
    console.log(
      "✅ Fully compliant - returning conservative recommendations when no real data"
    );
  } else {
    console.log("⚠️  Check individual responses for compliance details");
  }
}

// Run the test
testRecommendationFix().catch(console.error);
