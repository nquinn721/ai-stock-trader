/**
 * Test script for Strategy Builder API endpoints
 * Tests the core functionality of the autonomous trading strategy builder
 */

const axios = require("axios");

const BASE_URL = "http://localhost:8000";

// Test configuration
const testConfig = {
  userId: "test-user-001",
  strategy: {
    name: "Test Moving Average Strategy",
    description: "A simple moving average crossover strategy for testing",
    components: [
      {
        id: "ma_fast",
        type: "indicator",
        name: "Moving Average (Fast)",
        category: "trend",
        parameters: {
          period: 10,
          source: "close",
        },
        position: { x: 100, y: 100 },
      },
      {
        id: "ma_slow",
        type: "indicator",
        name: "Moving Average (Slow)",
        category: "trend",
        parameters: {
          period: 30,
          source: "close",
        },
        position: { x: 100, y: 200 },
      },
      {
        id: "entry_condition",
        type: "condition",
        name: "MA Crossover Entry",
        category: "entry",
        parameters: {
          condition: "crossover",
          fast_ma: "ma_fast",
          slow_ma: "ma_slow",
        },
        position: { x: 300, y: 150 },
      },
    ],
    connections: [
      { from: "ma_fast", to: "entry_condition" },
      { from: "ma_slow", to: "entry_condition" },
    ],
    riskRules: [
      {
        id: "position_size",
        type: "position_size",
        parameters: {
          maxPercentage: 10,
          method: "fixed_percentage",
        },
      },
      {
        id: "stop_loss",
        type: "stop_loss",
        parameters: {
          percentage: 2,
        },
      },
    ],
    symbols: ["AAPL", "MSFT"],
    timeframe: "1h",
  },
};

// Helper function to make API calls with error handling
async function apiCall(method, endpoint, data = null, params = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 10000,
      ...params,
    };

    if (data) {
      config.data = data;
      config.headers = {
        "Content-Type": "application/json",
        ...config.headers,
      };
    }

    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0,
    };
  }
}

// Test functions
async function testComponentLibrary() {
  console.log("\n🧪 Testing Component Library...");
  const result = await apiCall("GET", "/api/strategy-builder/components");

  if (result.success) {
    console.log("✅ Component library retrieved successfully");
    console.log(`   Found ${result.data.indicators?.length || 0} indicators`);
    console.log(`   Found ${result.data.conditions?.length || 0} conditions`);
    console.log(`   Found ${result.data.actions?.length || 0} actions`);
    return true;
  } else {
    console.log("❌ Failed to retrieve component library");
    console.log(`   Error: ${result.error}`);
    return false;
  }
}

async function testCreateStrategy() {
  console.log("\n🧪 Testing Strategy Creation...");
  const strategyData = {
    ...testConfig.strategy,
    userId: testConfig.userId,
  };

  const result = await apiCall(
    "POST",
    "/api/strategy-builder/strategies",
    strategyData
  );

  if (result.success) {
    console.log("✅ Strategy created successfully");
    console.log(`   Strategy ID: ${result.data.id}`);
    console.log(`   Name: ${result.data.name}`);
    return result.data;
  } else {
    console.log("❌ Failed to create strategy");
    console.log(`   Error: ${result.error}`);
    return null;
  }
}

async function testValidateStrategy(strategy) {
  if (!strategy) return false;

  console.log("\n🧪 Testing Strategy Validation...");
  const result = await apiCall(
    "POST",
    `/api/strategy-builder/strategies/${strategy.id}/validate`
  );

  if (result.success) {
    console.log("✅ Strategy validation completed");
    console.log(`   Is Valid: ${result.data.isValid}`);
    if (result.data.errors?.length > 0) {
      console.log(`   Errors: ${result.data.errors.join(", ")}`);
    }
    if (result.data.warnings?.length > 0) {
      console.log(`   Warnings: ${result.data.warnings.join(", ")}`);
    }
    return result.data.isValid;
  } else {
    console.log("❌ Failed to validate strategy");
    console.log(`   Error: ${result.error}`);
    return false;
  }
}

async function testGetStrategies() {
  console.log("\n🧪 Testing Get User Strategies...");
  const result = await apiCall(
    "GET",
    "/api/strategy-builder/strategies",
    null,
    {
      params: { userId: testConfig.userId },
    }
  );

  if (result.success) {
    console.log("✅ Retrieved user strategies successfully");
    console.log(`   Found ${result.data.length} strategies`);
    return true;
  } else {
    console.log("❌ Failed to retrieve strategies");
    console.log(`   Error: ${result.error}`);
    return false;
  }
}

async function testBacktest(strategy) {
  if (!strategy) return false;

  console.log("\n🧪 Testing Strategy Backtesting...");
  const backtestParams = {
    startDate: "2024-01-01",
    endDate: "2024-06-01",
    initialCapital: 10000,
    symbols: ["AAPL"],
  };

  const result = await apiCall(
    "POST",
    `/api/strategy-builder/strategies/${strategy.id}/backtest`,
    backtestParams
  );

  if (result.success) {
    console.log("✅ Backtest completed successfully");
    console.log(`   Total Return: ${result.data.totalReturn}%`);
    console.log(`   Sharpe Ratio: ${result.data.sharpeRatio}`);
    console.log(`   Max Drawdown: ${result.data.maxDrawdown}%`);
    return true;
  } else {
    console.log("❌ Backtest failed");
    console.log(`   Error: ${result.error}`);
    return false;
  }
}

async function testMarketplace() {
  console.log("\n🧪 Testing Strategy Marketplace...");
  const result = await apiCall(
    "GET",
    "/api/strategy-builder/marketplace/strategies"
  );

  if (result.success) {
    console.log("✅ Retrieved marketplace strategies successfully");
    console.log(`   Found ${result.data.length} public strategies`);
    return true;
  } else {
    console.log("❌ Failed to retrieve marketplace strategies");
    console.log(`   Error: ${result.error}`);
    return false;
  }
}

async function testTemplates() {
  console.log("\n🧪 Testing Strategy Templates...");
  const result = await apiCall("GET", "/api/strategy-builder/templates");

  if (result.success) {
    console.log("✅ Retrieved strategy templates successfully");
    console.log(`   Found ${result.data.length} templates`);
    return true;
  } else {
    console.log("❌ Failed to retrieve templates");
    console.log(`   Error: ${result.error}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting Strategy Builder API Tests");
  console.log("=====================================");

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  const tests = [
    { name: "Component Library", fn: testComponentLibrary },
    { name: "Strategy Templates", fn: testTemplates },
    { name: "Marketplace", fn: testMarketplace },
    { name: "Get Strategies", fn: testGetStrategies },
  ];

  // Run basic tests first
  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Test strategy creation and dependent features
  results.total++;
  const strategy = await testCreateStrategy();
  if (strategy) {
    results.passed++;

    // Test dependent features
    const dependentTests = [
      { name: "Strategy Validation", fn: () => testValidateStrategy(strategy) },
      { name: "Strategy Backtesting", fn: () => testBacktest(strategy) },
    ];

    for (const test of dependentTests) {
      results.total++;
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  } else {
    results.failed++;
  }

  // Print summary
  console.log("\n📊 Test Results Summary");
  console.log("=======================");
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`
  );

  if (results.failed === 0) {
    console.log(
      "\n🎉 All tests passed! Strategy Builder API is working correctly."
    );
  } else {
    console.log(
      "\n⚠️  Some tests failed. Please check the API implementation."
    );
  }
}

// Check if server is running before running tests
async function checkServer() {
  console.log("🔍 Checking if backend server is running...");
  try {
    const response = await axios.get(`${BASE_URL}/api`, { timeout: 5000 });
    console.log("✅ Backend server is running");
    return true;
  } catch (error) {
    console.log("❌ Backend server is not running or not accessible");
    console.log("   Please start the backend server with: npm run start:dev");
    return false;
  }
}

// Run the tests
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
})();
