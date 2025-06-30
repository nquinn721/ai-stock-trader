const io = require("socket.io-client");

console.log("🔌 Testing WebSocket connection to backend...");

const socket = io("http://localhost:8000", {
  transports: ["polling", "websocket"],
  timeout: 10000,
  autoConnect: true,
  forceNew: true,
});

socket.on("connect", () => {
  console.log("✅ Connected successfully!");
  console.log("🔌 Socket ID:", socket.id);

  // Test requesting stock updates
  socket.emit("request_stock_updates");
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
});

socket.on("stock_updates", (data) => {
  console.log("📊 Received stock updates:", data?.length || 0, "stocks");
});

socket.on("stock_update", (data) => {
  console.log("📈 Received stock update:", data?.symbol);
});

// Keep the script running for 10 seconds
setTimeout(() => {
  console.log("🔌 Test completed. Disconnecting...");
  socket.disconnect();
  process.exit(0);
}, 10000);
