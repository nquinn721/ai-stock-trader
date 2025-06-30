/**
 * Comprehensive Production Test Suite
 * Tests all major ML/AI and trading intelligence features
 *
 * This script validates that all advanced modules are working:
 * - AutoTrading (S40 series)
 * - BehavioralFinance (S49)
 * - MultiAsset (S41, S43)
 * - DataIntelligence (S48)
 * - EconomicIntelligence (S50)
 * - MarketMaking (S51)
 */

const axios = require("axios");

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:8000";
const API_BASE = `${BASE_URL}/api`;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  results: [],
};

// Test runner utility
async function runTest(name, testFunction) {
  console.log(`🧪 Testing: ${name}`);
  try {
    const result = await testFunction();
    console.log(`✅ ${name}: PASSED`);
    testResults.passed++;
    testResults.results.push({ name, status: "PASSED", result });
    return result;
  } catch (error) {
    console.log(`❌ ${name}: FAILED - ${error.message}`);
    testResults.failed++;
    testResults.results.push({ name, status: "FAILED", error: error.message });
    return null;
  }
}

// Core Infrastructure Tests
async function testHealthCheck() {
  const response = await axios.get(`${BASE_URL}/health`);
  if (response.status !== 200)
    throw new Error(`Health check failed: ${response.status}`);
  return response.data;
}

async function testStocksEndpoint() {
  const response = await axios.get(`${API_BASE}/stocks`);
  if (response.status !== 200)
    throw new Error(`Stocks endpoint failed: ${response.status}`);
  if (!Array.isArray(response.data))
    throw new Error("Stocks endpoint should return array");
  if (response.data.length === 0)
    throw new Error("Stocks endpoint returned empty array");
  return { stockCount: response.data.length, sampleStock: response.data[0] };
}

// AutoTrading Tests (S40 series)
async function testAutoTradingHealth() {
  const response = await axios.get(`${API_BASE}/auto-trading/status/health`);
  if (response.status !== 200)
    throw new Error(`AutoTrading health failed: ${response.status}`);
  if (!response.data.success)
    throw new Error("AutoTrading health check returned unsuccessful");
  return response.data;
}

async function testAutoTradingStrategies() {
  const response = await axios.get(`${API_BASE}/strategy-builder/templates`);
  if (response.status !== 200)
    throw new Error(`Strategy templates failed: ${response.status}`);
  return { templateCount: response.data.length };
}

async function testAutoTradingComponents() {
  const response = await axios.get(`${API_BASE}/strategy-builder/components`);
  if (response.status !== 200)
    throw new Error(`Strategy components failed: ${response.status}`);
  return response.data;
}

// Behavioral Finance Tests (S49)
async function testBehavioralFinanceFearGreed() {
  const response = await axios.get(
    `${API_BASE}/behavioral-finance/fear-greed-index`
  );
  if (response.status !== 200)
    throw new Error(`Fear-Greed index failed: ${response.status}`);
  if (typeof response.data.overallIndex !== "number")
    throw new Error("Fear-Greed index missing");
  return response.data;
}

async function testBehavioralFinanceSentimentCycle() {
  const response = await axios.get(
    `${API_BASE}/behavioral-finance/sentiment-cycle`
  );
  if (response.status !== 200)
    throw new Error(`Sentiment cycle failed: ${response.status}`);
  return response.data;
}

async function testBehavioralFinanceCognitiveBias() {
  const response = await axios.get(
    `${API_BASE}/behavioral-finance/cognitive-biases/AAPL`
  );
  if (response.status !== 200)
    throw new Error(`Cognitive bias failed: ${response.status}`);
  return response.data;
}

async function testBehavioralFinanceHerdingBehavior() {
  const response = await axios.get(
    `${API_BASE}/behavioral-finance/herding-behavior/AAPL`
  );
  if (response.status !== 200)
    throw new Error(`Herding behavior failed: ${response.status}`);
  return response.data;
}

// Multi-Asset Tests (S41, S43)
async function testMultiAssetSupportedAssets() {
  const response = await axios.get(`${API_BASE}/multi-asset/supported-assets`);
  if (response.status !== 200)
    throw new Error(`Multi-asset supported assets failed: ${response.status}`);
  const required = ["stocks", "crypto", "forex", "commodities"];
  for (const assetClass of required) {
    if (!response.data[assetClass])
      throw new Error(`Missing asset class: ${assetClass}`);
  }
  return response.data;
}

async function testMultiAssetCorrelations() {
  const response = await axios.get(
    `${API_BASE}/multi-asset/correlation-matrix?timeframe=1W`
  );
  if (response.status !== 200)
    throw new Error(`Multi-asset correlations failed: ${response.status}`);
  return response.data;
}

async function testMultiAssetArbitrage() {
  const response = await axios.get(
    `${API_BASE}/multi-asset/arbitrage-opportunities`
  );
  if (response.status !== 200)
    throw new Error(`Multi-asset arbitrage failed: ${response.status}`);
  return response.data;
}

// Data Intelligence Tests (S48)
async function testDataIntelligenceHealth() {
  try {
    const response = await axios.get(`${API_BASE}/data-intelligence/health`);
    if (response.status !== 200)
      throw new Error(`Data intelligence health failed: ${response.status}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Data Intelligence module may not be fully integrated");
    }
    throw error;
  }
}

// Economic Intelligence Tests (S50)
async function testEconomicIntelligenceHealth() {
  try {
    const response = await axios.get(
      `${API_BASE}/economic-intelligence/health`
    );
    if (response.status !== 200)
      throw new Error(
        `Economic intelligence health failed: ${response.status}`
      );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(
        "Economic Intelligence module may not be fully integrated"
      );
    }
    throw error;
  }
}

// Market Making Tests (S51)
async function testMarketMakingHealth() {
  try {
    const response = await axios.get(`${API_BASE}/market-making/health`);
    if (response.status !== 200)
      throw new Error(`Market making health failed: ${response.status}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Market Making module may not be fully integrated");
    }
    throw error;
  }
}

// Advanced Feature Tests
async function testAdvancedMLFeatures() {
  // Test ML prediction endpoint
  try {
    const response = await axios.get(`${API_BASE}/ml/predictions/AAPL`);
    if (response.status !== 200)
      throw new Error(`ML predictions failed: ${response.status}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("ML predictions endpoint may not be implemented");
    }
    throw error;
  }
}

async function testWebSocketSupport() {
  // Basic WebSocket connectivity test (simplified)
  try {
    const response = await axios.get(`${API_BASE}/websocket/status`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("WebSocket status endpoint not available");
    }
    throw error;
  }
}

// Main test execution
async function runComprehensiveTests() {
  console.log("🚀 Stock Trading App - Comprehensive Production Test Suite");
  console.log("=".repeat(60));
  console.log(`Testing against: ${BASE_URL}`);
  console.log("=".repeat(60));

  // Core Infrastructure
  console.log("\n📊 Core Infrastructure Tests");
  await runTest("Health Check", testHealthCheck);
  await runTest("Stocks Endpoint", testStocksEndpoint);

  // AutoTrading System (S40 series)
  console.log("\n🤖 AutoTrading System Tests");
  await runTest("AutoTrading Health", testAutoTradingHealth);
  await runTest("Strategy Templates", testAutoTradingStrategies);
  await runTest("Strategy Components", testAutoTradingComponents);

  // Behavioral Finance (S49)
  console.log("\n🧠 Behavioral Finance Tests");
  await runTest("Fear & Greed Index", testBehavioralFinanceFearGreed);
  await runTest("Market Sentiment Cycle", testBehavioralFinanceSentimentCycle);
  await runTest("Cognitive Bias Analysis", testBehavioralFinanceCognitiveBias);
  await runTest(
    "Herding Behavior Detection",
    testBehavioralFinanceHerdingBehavior
  );

  // Multi-Asset Intelligence (S41, S43)
  console.log("\n🌐 Multi-Asset Intelligence Tests");
  await runTest("Supported Assets", testMultiAssetSupportedAssets);
  await runTest("Correlation Matrix", testMultiAssetCorrelations);
  await runTest("Arbitrage Opportunities", testMultiAssetArbitrage);

  // Advanced ML/AI Modules
  console.log("\n🔬 Advanced ML/AI Module Tests");
  await runTest("Data Intelligence Health", testDataIntelligenceHealth);
  await runTest("Economic Intelligence Health", testEconomicIntelligenceHealth);
  await runTest("Market Making Health", testMarketMakingHealth);

  // Advanced Features
  console.log("\n⚡ Advanced Feature Tests");
  await runTest("ML Predictions", testAdvancedMLFeatures);
  await runTest("WebSocket Support", testWebSocketSupport);

  // Results Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  console.log(
    `🎯 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`
  );

  if (testResults.failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults.results
      .filter((r) => r.status === "FAILED")
      .forEach((result) => {
        console.log(`   - ${result.name}: ${result.error}`);
      });
  }

  console.log("\n✨ Test suite completed!");

  // Return results for programmatic use
  return testResults;
}

// Execute if run directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests, testResults };
