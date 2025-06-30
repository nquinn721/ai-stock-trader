import React from "react";

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

interface TradeConfirmationProps {
  tradeForm: TradeFormData;
  currentStock: Stock;
  executing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  formatCurrency: (amount: number) => string;
}

const TradeConfirmation: React.FC<TradeConfirmationProps> = ({
  tradeForm,
  currentStock,
  executing,
  onConfirm,
  onCancel,
  formatCurrency,
}) => {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-dialog">
        <h3>Confirm Trade</h3>
        <div className="confirmation-details">
          <p>
            <strong>Action:</strong> {tradeForm.type.toUpperCase()}
          </p>
          <p>
            <strong>Symbol:</strong> {tradeForm.symbol}
          </p>
          <p>
            <strong>Quantity:</strong> {tradeForm.quantity} shares
          </p>
          <p>
            <strong>Price:</strong> {formatCurrency(currentStock.currentPrice)}{" "}
            per share
          </p>
          <p>
            <strong>
              Estimated {tradeForm.type === "buy" ? "Cost" : "Proceeds"}:
            </strong>{" "}
            {formatCurrency(
              currentStock.currentPrice * parseInt(tradeForm.quantity)
            )}
          </p>
        </div>
        <div className="confirmation-buttons">
          <button
            className="confirm-btn"
            onClick={onConfirm}
            disabled={executing}
          >
            {executing ? "Executing..." : "Confirm Trade"}
          </button>
          <button
            className="cancel-btn"
            onClick={onCancel}
            disabled={executing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeConfirmation;
