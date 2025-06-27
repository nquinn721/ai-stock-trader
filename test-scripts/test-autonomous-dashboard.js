// Quick test to verify the autonomous trading dashboard navigation and styling
console.log("Testing autonomous trading dashboard...");

// Test if the main page loads
const mainPage = document.querySelector(".dashboard");
if (mainPage) {
  console.log("✓ Main dashboard loaded");
} else {
  console.log("✗ Main dashboard not found");
}

// Test if the Agents button exists
const agentsBtn = document.querySelector(".autonomous-agents-btn");
if (agentsBtn) {
  console.log("✓ Agents button found");
} else {
  console.log("✗ Agents button not found");
}

// Test if live indicator exists
const liveIndicator = document.querySelector(".live-indicator-main");
if (liveIndicator) {
  console.log("✓ Live indicator found in main header");
} else {
  console.log("✗ Live indicator not found in main header");
}

// Test autonomous trading dashboard styles
const autonomousStyles = document.querySelector(
  'style[data-styled="autonomous"]'
);
console.log("Autonomous trading styles loaded:", autonomousStyles ? "✓" : "✗");

console.log("Dashboard test completed!");
