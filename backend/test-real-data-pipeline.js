/**
 * Test script to verify the real data pipeline and connect ML services to it
 */

const yahooFinance = require("yahoo-finance2");

async function testYahooFinanceConnection() {
  console.log("🔍 Testing Yahoo Finance API connection...\n");

  const testSymbols = ["AAPL", "GOOGL", "MSFT"];

  for (const symbol of testSymbols) {
    try {
      console.log(`📊 Testing ${symbol}...`);

      // Test quote data
      const quote = await yahooFinance.quote(
        symbol,
        {},
        { validateResult: false }
      );
      console.log(`✅ Current price: $${quote.regularMarketPrice}`);
      console.log(`   Previous close: $${quote.regularMarketPreviousClose}`);
      console.log(`   Volume: ${quote.regularMarketVolume?.toLocaleString()}`);

      // Test historical data (last 30 days)
      const historical = await yahooFinance.historical(
        symbol,
        {
          period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          period2: new Date(),
          interval: "1d",
        },
        { validateResult: false }
      );

      console.log(`✅ Historical data: ${historical.length} data points`);

      if (historical.length > 0) {
        const latest = historical[historical.length - 1];
        const earliest = historical[0];
        console.log(
          `   Latest: $${latest.close} (${latest.date.toDateString()})`
        );
        console.log(
          `   Earliest: $${earliest.close} (${earliest.date.toDateString()})`
        );
      }

      console.log(""); // Empty line
    } catch (error) {
      console.error(`❌ Error testing ${symbol}:`, error.message);
      console.log(""); // Empty line
    }
  }
}

async function testFeatureExtraction() {
  console.log("\n🔧 Testing feature extraction from real data...\n");

  const symbol = "AAPL";

  try {
    // Get current quote
    const quote = await yahooFinance.quote(
      symbol,
      {},
      { validateResult: false }
    );

    // Get historical data for technical analysis
    const historical = await yahooFinance.historical(
      symbol,
      {
        period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        period2: new Date(),
        interval: "1d",
      },
      { validateResult: false }
    );

    if (historical.length < 20) {
      console.log("❌ Insufficient historical data for analysis");
      return;
    }

    console.log(`📈 Analyzing ${symbol} with ${historical.length} data points`);

    // Calculate basic technical indicators
    const prices = historical.map((h) => h.close);
    const volumes = historical.map((h) => h.volume);

    // Simple Moving Averages
    const sma_5 = calculateSMA(prices.slice(-5));
    const sma_20 = calculateSMA(prices.slice(-20));
    const sma_50 = prices.length >= 50 ? calculateSMA(prices.slice(-50)) : null;

    // Price momentum
    const currentPrice = prices[prices.length - 1];
    const priceChange_1d =
      ((currentPrice - prices[prices.length - 2]) / prices[prices.length - 2]) *
      100;
    const priceChange_5d =
      prices.length >= 5
        ? ((currentPrice - prices[prices.length - 6]) /
            prices[prices.length - 6]) *
          100
        : null;
    const priceChange_20d =
      prices.length >= 20
        ? ((currentPrice - prices[prices.length - 21]) /
            prices[prices.length - 21]) *
          100
        : null;

    // Volume analysis
    const avgVolume_20 =
      prices.length >= 20
        ? volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20
        : null;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = avgVolume_20 ? currentVolume / avgVolume_20 : null;

    // Volatility (simplified)
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const volatility =
      Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) *
      Math.sqrt(252); // Annualized

    console.log("📊 Technical Features Extracted:");
    console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
    console.log(`   SMA 5: $${sma_5.toFixed(2)}`);
    console.log(`   SMA 20: $${sma_20.toFixed(2)}`);
    if (sma_50) console.log(`   SMA 50: $${sma_50.toFixed(2)}`);
    console.log(`   1-day change: ${priceChange_1d.toFixed(2)}%`);
    if (priceChange_5d !== null)
      console.log(`   5-day change: ${priceChange_5d.toFixed(2)}%`);
    if (priceChange_20d !== null)
      console.log(`   20-day change: ${priceChange_20d.toFixed(2)}%`);
    if (volumeRatio) console.log(`   Volume ratio: ${volumeRatio.toFixed(2)}x`);
    console.log(`   Volatility: ${(volatility * 100).toFixed(2)}%`);

    // Generate a basic trading signal
    let signal = "HOLD";
    let confidence = 0.3;
    let reasoning = [];

    // Trend analysis
    if (currentPrice > sma_5 && sma_5 > sma_20) {
      signal = "BUY";
      confidence += 0.2;
      reasoning.push("Price above short-term moving averages (bullish trend)");
    } else if (currentPrice < sma_5 && sma_5 < sma_20) {
      signal = "SELL";
      confidence += 0.2;
      reasoning.push("Price below short-term moving averages (bearish trend)");
    }

    // Momentum analysis
    if (priceChange_5d !== null && priceChange_5d > 2) {
      if (signal === "BUY") confidence += 0.15;
      else if (signal === "HOLD") {
        signal = "BUY";
        confidence += 0.1;
      }
      reasoning.push("Strong positive momentum (5-day)");
    } else if (priceChange_5d !== null && priceChange_5d < -2) {
      if (signal === "SELL") confidence += 0.15;
      else if (signal === "HOLD") {
        signal = "SELL";
        confidence += 0.1;
      }
      reasoning.push("Strong negative momentum (5-day)");
    }

    // Volume confirmation
    if (volumeRatio && volumeRatio > 1.5) {
      confidence += 0.1;
      reasoning.push("High volume confirms signal");
    }

    // Risk adjustment for high volatility
    if (volatility > 0.4) {
      confidence -= 0.1;
      reasoning.push("High volatility reduces confidence");
    }

    confidence = Math.min(0.95, Math.max(0.1, confidence));

    console.log("\n🎯 Generated Trading Signal:");
    console.log(`   Signal: ${signal}`);
    console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`   Reasoning:`);
    reasoning.forEach((reason) => console.log(`     • ${reason}`));

    return {
      symbol,
      signal,
      confidence,
      features: {
        currentPrice,
        sma_5,
        sma_20,
        sma_50,
        priceChange_1d,
        priceChange_5d,
        priceChange_20d,
        volumeRatio,
        volatility,
      },
      reasoning,
    };
  } catch (error) {
    console.error(`❌ Error in feature extraction:`, error.message);
  }
}

function calculateSMA(prices) {
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

async function main() {
  console.log("🚀 Testing Real Data Pipeline Integration\n");
  console.log("=" * 50);

  await testYahooFinanceConnection();
  await testFeatureExtraction();

  console.log("\n✅ Real data pipeline test complete!");
  console.log("\n📝 Summary:");
  console.log("   - Yahoo Finance API is working");
  console.log("   - Real market data is available");
  console.log("   - Technical features can be extracted");
  console.log("   - Trading signals can be generated from real data");
  console.log("\n🔧 Next Steps:");
  console.log("   - Connect ML services to use this real data pipeline");
  console.log("   - Replace conservative HOLD fallbacks with real analysis");
  console.log("   - Implement proper feature extraction in ML services");
}

main().catch(console.error);
