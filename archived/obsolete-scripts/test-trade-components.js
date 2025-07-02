#!/usr/bin/env node

/**
 * TEST SPECIFIC TRADE EXECUTION COMPONENTS
 *
 * This script tests individual components of the trade execution
 * to identify exactly where the 500 error is coming from.
 */

const BASE_URL = "http://localhost:8000/api";

async function testIndividualComponents() {
  console.log("🔍 TESTING INDIVIDUAL COMPONENTS");
  console.log("=================================\n");

  try {
    // 1. Test portfolio access
    console.log("1️⃣ Testing portfolio access...");
    const portfoliosResponse = await fetch(
      `${BASE_URL}/paper-trading/portfolios`
    );
    if (portfoliosResponse.ok) {
      const portfolios = await portfoliosResponse.json();
      console.log(`✅ Portfolios accessible: ${portfolios.length} found`);
      console.log(
        `   First portfolio: ${portfolios[0]?.name} (ID: ${portfolios[0]?.id})`
      );
    } else {
      console.log(`❌ Portfolios request failed: ${portfoliosResponse.status}`);
      return;
    }

    // 2. Test stock access
    console.log("\n2️⃣ Testing stock data access...");
    const stocksResponse = await fetch(`${BASE_URL}/stocks`);
    if (stocksResponse.ok) {
      const stocks = await stocksResponse.json();
      console.log(`✅ Stocks accessible: ${stocks.length} found`);
      console.log(
        `   AAPL price: $${stocks.find((s) => s.symbol === "AAPL")?.currentPrice || "not found"}`
      );
    } else {
      console.log(`❌ Stocks request failed: ${stocksResponse.status}`);
      return;
    }

    // 3. Test the simplest possible trade data
    console.log("\n3️⃣ Testing minimal trade data...");

    const minimalTradeData = {
      symbol: "AAPL",
      type: "buy",
      quantity: 1,
      userId: "user-123",
    };

    console.log("Trade data:", JSON.stringify(minimalTradeData, null, 2));

    // 4. Attempt trade execution with verbose output
    console.log("\n4️⃣ Attempting trade execution...");

    const response = await fetch(`${BASE_URL}/paper-trading/trade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(minimalTradeData),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, [...response.headers.entries()]);

    const responseText = await response.text();
    console.log(`Response body: ${responseText}`);

    if (response.ok) {
      console.log("🎉 TRADE EXECUTION SUCCESSFUL!");
      try {
        const tradeResult = JSON.parse(responseText);
        console.log("Trade result:", tradeResult);
      } catch (e) {
        console.log("Could not parse response as JSON");
      }
    } else {
      console.log("❌ TRADE EXECUTION FAILED");

      // Try to get more error details
      try {
        const errorJson = JSON.parse(responseText);
        console.log("Error details:", errorJson);
      } catch (e) {
        console.log("Raw error text:", responseText);
      }
    }

    // 5. Check if anything was recorded anyway
    console.log("\n5️⃣ Checking if anything was recorded...");
    const checkPortfoliosResponse = await fetch(
      `${BASE_URL}/paper-trading/portfolios`
    );
    if (checkPortfoliosResponse.ok) {
      const updatedPortfolios = await checkPortfoliosResponse.json();
      const portfolioWithTrades = updatedPortfolios.find(
        (p) => p.trades && p.trades.length > 0
      );
      if (portfolioWithTrades) {
        console.log(
          `✅ Found ${portfolioWithTrades.trades.length} trades in portfolio ${portfolioWithTrades.name}`
        );
      } else {
        console.log("❌ No trades found in any portfolio");
      }
    }
  } catch (error) {
    console.error("💥 CRITICAL ERROR:", error);
  }
}

// Run the test
testIndividualComponents().catch(console.error);
