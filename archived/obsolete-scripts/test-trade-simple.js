const fetch = require("node-fetch");

async function testTrade() {
  try {
    console.log("🧪 Testing simple trade execution...");

    const response = await fetch(
      "http://localhost:8000/api/paper-trading/trade",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-123",
          symbol: "AAPL",
          type: "buy",
          quantity: 1,
        }),
        timeout: 15000, // 15 second timeout
      }
    );

    console.log("📊 Response status:", response.status);
    console.log("📊 Response headers:", response.headers.raw());

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Trade executed successfully:", data);
    } else {
      const errorText = await response.text();
      console.error("❌ Trade failed:", response.status, errorText);
    }
  } catch (error) {
    console.error("💥 Request failed:", error.message);
  }
}

testTrade()
  .then(() => {
    console.log("🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("🚨 Unexpected error:", error);
    process.exit(1);
  });
