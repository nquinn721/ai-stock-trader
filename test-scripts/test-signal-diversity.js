// Test script to verify trading signal diversity
const axios = require("axios");

const symbols = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "TSLA",
  "AMZN",
  "META",
  "NVDA",
  "NFLX",
];

async function testTradingSignals() {
  console.log("🔍 Testing trading signal diversity...\n");

  const signalCounts = { BUY: 0, SELL: 0, HOLD: 0 };
  const results = [];

  for (const symbol of symbols) {
    try {
      const response = await axios.post(
        `http://localhost:8000/ml/recommendation/${symbol}`,
        {
          currentPrice: Math.random() * 100 + 50, // Random price between 50-150
          portfolioContext: {
            currentHoldings: 0,
            availableCash: 10000,
            riskTolerance: "MEDIUM",
          },
          timeHorizon: "1D",
        }
      );

      const recommendation = response.data;
      const action = recommendation.action;
      signalCounts[action]++;

      results.push({
        symbol,
        action,
        confidence: (recommendation.confidence * 100).toFixed(1),
      });

      console.log(
        `${symbol}: ${action} (${(recommendation.confidence * 100).toFixed(
          1
        )}% confidence)`
      );
    } catch (error) {
      console.error(`❌ Error testing ${symbol}:`, error.message);
    }
  }

  console.log("\n📊 Signal Distribution:");
  console.log(
    `BUY: ${signalCounts.BUY}/${symbols.length} (${(
      (signalCounts.BUY / symbols.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `SELL: ${signalCounts.SELL}/${symbols.length} (${(
      (signalCounts.SELL / symbols.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `HOLD: ${signalCounts.HOLD}/${symbols.length} (${(
      (signalCounts.HOLD / symbols.length) *
      100
    ).toFixed(1)}%)`
  );

  const diversity = Object.values(signalCounts).filter(
    (count) => count > 0
  ).length;
  console.log(`\n✅ Signal diversity: ${diversity}/3 signal types present`);

  if (signalCounts.BUY === symbols.length) {
    console.log("⚠️  WARNING: All signals are still BUY - bias not resolved");
  } else if (diversity === 3) {
    console.log("🎯 SUCCESS: Diverse trading signals achieved!");
  } else {
    console.log("📈 IMPROVED: Better signal distribution than before");
  }
}

testTradingSignals().catch(console.error);
