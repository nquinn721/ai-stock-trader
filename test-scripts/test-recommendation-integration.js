/**
 * Integration Test: S19+S29B Recommendation System
 * Tests the full end-to-end integration of AI-powered trading recommendations
 */

const API_BASE_URL = "http://localhost:8000";

async function testRecommendationIntegration() {
  console.log("🚀 Testing S19+S29B Recommendation Integration...\n");

  // Test 1: Basic S19 Recommendation
  console.log("📊 Test 1: Basic S19 Recommendation");
  try {
    const response = await fetch(`${API_BASE_URL}/ml/recommendation/AAPL`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPrice: 220.0,
        portfolioContext: {
          currentHoldings: 0,
          availableCash: 10000,
          riskTolerance: "MEDIUM",
        },
      }),
    });

    if (response.ok) {
      const recommendation = await response.json();
      console.log("✅ S19 Basic Recommendation Success");
      console.log(`   - Action: ${recommendation.action}`);
      console.log(
        `   - Confidence: ${(recommendation.confidence * 100).toFixed(1)}%`
      );
      console.log(`   - Risk Level: ${recommendation.riskLevel}`);
      console.log(
        `   - Reasoning: ${recommendation.reasoning?.slice(0, 2).join(", ")}`
      );
    } else {
      console.log("❌ S19 Basic Recommendation Failed:", response.status);
    }
  } catch (error) {
    console.log("❌ S19 Basic Recommendation Error:", error.message);
  }

  console.log("");

  // Test 2: Enhanced S19+S29B Recommendation
  console.log("🧠 Test 2: Enhanced S19+S29B Recommendation");
  try {
    const response = await fetch(
      `${API_BASE_URL}/ml/recommendation/enhanced/AAPL`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPrice: 220.0,
          portfolioContext: {
            currentHoldings: 0,
            availableCash: 10000,
            riskTolerance: "HIGH",
          },
          timeHorizon: "1W",
          ensembleOptions: {
            timeframes: ["1h", "1d"],
            ensembleMethod: "meta_learning",
            confidenceThreshold: 0.7,
          },
        }),
      }
    );

    if (response.ok) {
      const enhancedRecommendation = await response.json();
      console.log("✅ S19+S29B Enhanced Recommendation Success");
      console.log(`   - Action: ${enhancedRecommendation.action}`);
      console.log(
        `   - Confidence: ${(enhancedRecommendation.confidence * 100).toFixed(
          1
        )}%`
      );
      console.log(
        `   - Composite Score: ${enhancedRecommendation.compositeScore}`
      );
      console.log(
        `   - Ensemble Confidence: ${(
          enhancedRecommendation.enhancedMetrics.ensembleConfidence * 100
        ).toFixed(1)}%`
      );
      console.log(
        `   - Signal Strength: ${(
          enhancedRecommendation.enhancedMetrics.signalStrength * 100
        ).toFixed(1)}%`
      );
      console.log(
        `   - S19 Used: ${enhancedRecommendation.integrationMetadata.s19Used}`
      );
      console.log(
        `   - S29B Used: ${enhancedRecommendation.integrationMetadata.s29bUsed}`
      );
      console.log(
        `   - Integration Method: ${enhancedRecommendation.integrationMetadata.integrationMethod}`
      );
    } else {
      console.log(
        "❌ S19+S29B Enhanced Recommendation Failed:",
        response.status
      );
    }
  } catch (error) {
    console.log("❌ S19+S29B Enhanced Recommendation Error:", error.message);
  }

  console.log("");

  // Test 3: Different Symbols
  console.log("📈 Test 3: Testing Different Symbols");
  const symbols = ["MSFT", "GOOGL", "TSLA"];

  for (const symbol of symbols) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ml/recommendation/${symbol}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPrice: 150.0,
          }),
        }
      );

      if (response.ok) {
        const recommendation = await response.json();
        console.log(
          `✅ ${symbol}: ${recommendation.action} (${(
            recommendation.confidence * 100
          ).toFixed(1)}%)`
        );
      } else {
        console.log(`❌ ${symbol}: Failed (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${symbol}: Error - ${error.message}`);
    }
  }

  console.log("\n🎉 Integration Test Complete!");
}

// Run the test
testRecommendationIntegration().catch(console.error);
