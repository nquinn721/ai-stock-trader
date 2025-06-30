import {
  faChartLine,
  faCheck,
  faExclamationTriangle,
  faGraduationCap,
  faRocket,
  faSeedling,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { usePortfolioStore } from "../stores/StoreContext";
import "./PortfolioCreator.css";

interface PortfolioType {
  key:
    | "DAY_TRADING_PRO"
    | "DAY_TRADING_STANDARD"
    | "SMALL_ACCOUNT_BASIC"
    | "MICRO_ACCOUNT_STARTER";
  name: string;
  initialBalance: number;
  dayTradingEnabled: boolean;
  description: string;
  minBalance: number;
  icon: any;
  features: string[];
  restrictions: string[];
  recommended: string;
}

const PORTFOLIO_TYPES: PortfolioType[] = [
  {
    key: "DAY_TRADING_PRO",
    name: "Professional Day Trader",
    initialBalance: 50000,
    dayTradingEnabled: true,
    description: "For experienced traders with substantial capital",
    minBalance: 25000,
    icon: faRocket,
    features: [
      "Unlimited day trades",
      "Advanced order types",
      "Real-time margin calculations",
      "Professional-grade tools",
      "Priority customer support",
      "Advanced risk management",
    ],
    restrictions: [
      "Must maintain $25,000 minimum",
      "Pattern Day Trading rules apply",
      "Requires trading experience",
    ],
    recommended: "Experienced traders with $50k+ capital",
  },
  {
    key: "DAY_TRADING_STANDARD",
    name: "Standard Day Trader",
    initialBalance: 30000,
    dayTradingEnabled: true,
    description: "Entry-level day trading with reduced capital requirements",
    minBalance: 25000,
    icon: faChartLine,
    features: [
      "Unlimited day trades",
      "Standard order types",
      "Real-time data feeds",
      "Basic risk management",
      "Email support",
      "Educational resources",
    ],
    restrictions: [
      "Must maintain $25,000 minimum",
      "Pattern Day Trading rules apply",
      "Limited to stocks only",
    ],
    recommended: "New day traders with $30k+ capital",
  },
  {
    key: "SMALL_ACCOUNT_BASIC",
    name: "Small Investor",
    initialBalance: 1000,
    dayTradingEnabled: false,
    description: "Perfect for small-scale investing and learning",
    minBalance: 0,
    icon: faSeedling,
    features: [
      "Buy and hold strategies",
      "Basic order types",
      "Educational content",
      "Portfolio tracking",
      "Community support",
      "Low fees",
    ],
    restrictions: [
      "No day trading allowed",
      "3 day trades per 5 business days max",
      "T+2 settlement for cash accounts",
      "Limited to stocks only",
    ],
    recommended: "Beginners with $1k-$10k capital",
  },
  {
    key: "MICRO_ACCOUNT_STARTER",
    name: "Micro Starter",
    initialBalance: 500,
    dayTradingEnabled: false,
    description: "Get started with minimal capital investment",
    minBalance: 0,
    icon: faGraduationCap,
    features: [
      "Learn with real money",
      "Fractional shares available",
      "Basic portfolio tracking",
      "Educational tutorials",
      "Community forums",
      "No minimum balance",
    ],
    restrictions: [
      "No day trading allowed",
      "3 day trades per 5 business days max",
      "T+2 settlement for cash accounts",
      "Limited order types",
      "Stocks only",
    ],
    recommended: "Complete beginners with $500-$1k",
  },
];

interface PortfolioCreatorProps {
  onPortfolioCreated: (portfolio: any) => void;
  onCancel: () => void;
}

const PortfolioCreator: React.FC<PortfolioCreatorProps> = ({
  onPortfolioCreated,
  onCancel,
}) => {
  const portfolioStore = usePortfolioStore();
  const [selectedType, setSelectedType] = useState<PortfolioType | null>(null);
  const [customBalance, setCustomBalance] = useState<string>("");
  const [userId] = useState("user-123"); // TODO: Get from auth context
  const [creating, setCreating] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const handleCreatePortfolio = async () => {
    if (!selectedType) return;

    setCreating(true);
    try {
      const initialBalance = customBalance
        ? parseFloat(customBalance)
        : selectedType.initialBalance;

      // Validate minimum balance for day trading accounts
      if (
        selectedType.dayTradingEnabled &&
        initialBalance < selectedType.minBalance
      ) {
        alert(
          `Day trading accounts require minimum $${selectedType.minBalance.toLocaleString()} balance`
        );
        setCreating(false);
        return;
      }
      const portfolioData = {
        userId: userId,
        portfolioType: selectedType.key,
        initialBalance: initialBalance,
      };

      const portfolio = await portfolioStore.createPortfolio(portfolioData);
      onPortfolioCreated(portfolio);
    } catch (error) {
      console.error("Error creating portfolio:", error);
      alert("Failed to create portfolio. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="portfolio-creator">
      <div className="portfolio-creator-header">
        <h1>Choose Your Trading Account</h1>
        <p>
          Select the account type that best matches your trading style and
          experience level
        </p>
      </div>

      <div className="portfolio-types-grid">
        {PORTFOLIO_TYPES.map((type) => (
          <div
            key={type.key}
            className={`portfolio-type-card ${
              selectedType?.key === type.key ? "selected" : ""
            }`}
            onClick={() => setSelectedType(type)}
          >
            <div className="portfolio-type-header">
              <FontAwesomeIcon
                icon={type.icon}
                className="portfolio-type-icon"
              />
              <h3>{type.name}</h3>
              <div className="portfolio-type-balance">
                {formatCurrency(type.initialBalance)}
              </div>
            </div>

            <p className="portfolio-type-description">{type.description}</p>

            <div className="portfolio-type-features">
              <h4>Key Features:</h4>
              <ul>
                {type.features.slice(0, 3).map((feature, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheck} className="feature-check" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="portfolio-type-actions">
              <button
                className="details-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(showDetails === type.key ? null : type.key);
                }}
              >
                {showDetails === type.key ? "Hide Details" : "View Details"}
              </button>
            </div>

            {selectedType?.key === type.key && (
              <div className="selected-indicator">
                <FontAwesomeIcon icon={faCheck} />
                Selected
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="portfolio-configuration">
          <h3>Configure Your {selectedType.name} Account</h3>

          <div className="configuration-section">
            <label>Initial Balance (Optional)</label>
            <div className="balance-input-group">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                value={customBalance}
                onChange={(e) => setCustomBalance(e.target.value)}
                placeholder={selectedType.initialBalance.toString()}
                min={selectedType.minBalance}
                max="1000000"
              />
            </div>
            <small>
              Default: {formatCurrency(selectedType.initialBalance)}
              {selectedType.minBalance > 0 && (
                <span className="min-balance-note">
                  {" "}
                  (Minimum: {formatCurrency(selectedType.minBalance)})
                </span>
              )}
            </small>
          </div>

          {selectedType.dayTradingEnabled && (
            <div className="day-trading-warning">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <div>
                <strong>Day Trading Rules Apply</strong>
                <p>
                  This account allows unlimited day trades but requires
                  maintaining a minimum balance of{" "}
                  {formatCurrency(selectedType.minBalance)}. Pattern Day Trading
                  rules enforced by the SEC will apply to your account.
                </p>
              </div>
            </div>
          )}

          <div className="account-summary">
            <h4>Account Summary</h4>
            <div className="summary-items">
              <div className="summary-item">
                <span>Account Type:</span>
                <span>{selectedType.name}</span>
              </div>
              <div className="summary-item">
                <span>Starting Balance:</span>
                <span>
                  {formatCurrency(
                    customBalance
                      ? parseFloat(customBalance)
                      : selectedType.initialBalance
                  )}
                </span>
              </div>
              <div className="summary-item">
                <span>Day Trading:</span>
                <span
                  className={
                    selectedType.dayTradingEnabled ? "enabled" : "disabled"
                  }
                >
                  {selectedType.dayTradingEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="summary-item">
                <span>Asset Types:</span>
                <span>Stocks Only</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="portfolio-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {PORTFOLIO_TYPES.find((t) => t.key === showDetails)?.name}{" "}
                Details
              </h3>
              <button onClick={() => setShowDetails(null)}>×</button>
            </div>
            <div className="modal-body">
              {(() => {
                const type = PORTFOLIO_TYPES.find((t) => t.key === showDetails);
                if (!type) return null;

                return (
                  <>
                    <div className="details-section">
                      <h4>All Features</h4>
                      <ul>
                        {type.features.map((feature, index) => (
                          <li key={index}>
                            <FontAwesomeIcon icon={faCheck} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="details-section">
                      <h4>Restrictions</h4>
                      <ul>
                        {type.restrictions.map((restriction, index) => (
                          <li key={index}>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            {restriction}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="details-section">
                      <h4>Recommended For</h4>
                      <p>{type.recommended}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="portfolio-creator-actions">
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="create-btn"
          onClick={handleCreatePortfolio}
          disabled={!selectedType || creating}
        >
          {creating
            ? "Creating..."
            : `Create ${selectedType?.name || "Portfolio"}`}
        </button>
      </div>
    </div>
  );
};

export default PortfolioCreator;
