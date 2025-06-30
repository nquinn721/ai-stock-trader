const axios = require("axios");

const API_BASE_URL = "http://localhost:8000/api";

async function testPortfolioCreation() {
  console.log("Testing portfolio creation fix...");

  try {
    // Test 1: Create portfolio with correct data structure
    const portfolioData = {
      userId: "test-user-123",
      portfolioType: "SMALL_ACCOUNT_BASIC",
      initialBalance: 1000,
    };

    console.log(
      "Sending request with data:",
      JSON.stringify(portfolioData, null, 2)
    );

    const response = await axios.post(
      `${API_BASE_URL}/paper-trading/portfolios`,
      portfolioData
    );

    console.log("✅ Portfolio creation successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error("❌ Portfolio creation failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
}

async function testValidationErrors() {
  console.log("\nTesting validation errors...");

  try {
    // Test invalid data to confirm validation is working
    const invalidData = {
      userId: "", // Invalid: empty string
      portfolioType: "INVALID_TYPE", // Invalid: not in enum
    };

    console.log(
      "Sending invalid request with data:",
      JSON.stringify(invalidData, null, 2)
    );

    await axios.post(`${API_BASE_URL}/paper-trading/portfolios`, invalidData);

    console.log("❌ Validation should have failed but didn't");
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log("✅ Validation correctly rejected invalid data");
      console.log("Validation errors:", error.response.data);
    } else {
      console.error("❌ Unexpected error:", error.message);
    }
  }
}

async function runTests() {
  try {
    await testPortfolioCreation();
    await testValidationErrors();
    console.log("\n🎉 All tests completed");
  } catch (error) {
    console.log("\n💥 Tests failed");
    process.exit(1);
  }
}

runTests();
