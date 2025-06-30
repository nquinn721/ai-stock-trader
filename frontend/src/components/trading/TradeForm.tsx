import {
  faArrowDown,
  faArrowUp,
  faBolt,
  faCalculator,
  faHashtag,
  faSearch,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import StockAutocomplete from "../StockAutocomplete";

interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
}

interface TradeFormData {
  symbol: string;
  type: "buy" | "sell";
  quantity: string;
}

interface TradeFormProps {
  tradeForm: TradeFormData;
  onFormChange: (form: TradeFormData) => void;
  stocks: { symbol: string; name: string }[];
  currentStock: Stock | undefined;
  executing: boolean;
  isValidTrade: boolean;
  onSubmit: () => void;
  formatCurrency: (amount: number) => string;
}

const TradeForm: React.FC<TradeFormProps> = ({
  tradeForm,
  onFormChange,
  stocks,
  currentStock,
  executing,
  isValidTrade,
  onSubmit,
  formatCurrency,
}) => {
  const handleSymbolChange = (symbol: string) => {
    onFormChange({ ...tradeForm, symbol });
  };

  const handleQuantityChange = (quantity: string) => {
    onFormChange({ ...tradeForm, quantity });
  };

  const handleTypeChange = (type: "buy" | "sell") => {
    onFormChange({ ...tradeForm, type });
  };

  return (
    <div className="trading-form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            <FontAwesomeIcon icon={faSearch} />
            Stock Symbol
          </label>
          <StockAutocomplete
            stocks={stocks}
            value={tradeForm.symbol}
            onChange={handleSymbolChange}
            placeholder="Search symbol or name..."
            disabled={executing}
            className="symbol-autocomplete"
          />
        </div>
        <div className="form-group quantity-group">
          <label className="form-label">
            <FontAwesomeIcon icon={faHashtag} />
            Quantity
          </label>
          <input
            type="number"
            placeholder="Shares"
            value={tradeForm.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            min="1"
            max="10000"
            className="quantity-input"
            disabled={executing}
          />
        </div>
      </div>

      {/* Stock Info Display */}
      {currentStock && (
        <div className="stock-info-card">
          <div className="stock-header">
            <div className="stock-identity">
              <span className="stock-symbol">{currentStock.symbol}</span>
              <span className="stock-name">{currentStock.name}</span>
            </div>
            <div className="stock-price">
              <span className="current-price">
                {formatCurrency(currentStock.currentPrice)}
              </span>
              <span
                className={`price-change ${
                  currentStock.changePercent >= 0 ? "positive" : "negative"
                }`}
              >
                <i
                  className={`fas fa-arrow-${
                    currentStock.changePercent >= 0 ? "up" : "down"
                  }`}
                ></i>
                {currentStock.changePercent >= 0 ? "+" : ""}
                {currentStock.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {tradeForm.quantity && parseInt(tradeForm.quantity) > 0 && (
            <div className="trade-estimate">
              <div className="estimate-row">
                <span className="estimate-label">
                  <FontAwesomeIcon icon={faCalculator} />
                  Estimated {tradeForm.type === "buy" ? "Cost" : "Proceeds"}
                </span>
                <span className="estimate-amount">
                  {formatCurrency(
                    currentStock.currentPrice * parseInt(tradeForm.quantity)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trading Actions */}
      <div className="trading-actions">
        <div className="trade-type-buttons">
          <button
            className={`trade-type-btn buy ${
              tradeForm.type === "buy" ? "active" : ""
            }`}
            onClick={() => handleTypeChange("buy")}
            disabled={executing}
          >
            <FontAwesomeIcon icon={faArrowUp} />
            BUY
          </button>
          <button
            className={`trade-type-btn sell ${
              tradeForm.type === "sell" ? "active" : ""
            }`}
            onClick={() => handleTypeChange("sell")}
            disabled={executing}
          >
            <FontAwesomeIcon icon={faArrowDown} />
            SELL
          </button>
        </div>

        <button
          className="execute-trade-btn"
          onClick={onSubmit}
          disabled={executing || !isValidTrade}
        >
          {executing ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              Executing...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faBolt} />
              {`${tradeForm.type.toUpperCase()} ${
                tradeForm.quantity || "0"
              } ${tradeForm.symbol || "STOCK"}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TradeForm;
