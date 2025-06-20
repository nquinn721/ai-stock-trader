import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { CreateTradeRequest } from "../types";
import "./QuickTrade.css";

const QuickTrade: React.FC = () => {
  const { stocks } = useSocket();
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell",
    quantity: "",
  });
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchPortfolioId();
  }, []);

  const fetchPortfolioId = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/paper-trading/portfolios"
      );
      const portfolios = response.data;

      if (portfolios.length > 0) {
        setPortfolioId(portfolios[0].id);
      }
    } catch (error) {
      console.error("Error fetching portfolio ID:", error);
    }
  };

  const executeTrade = async () => {
    if (!portfolioId) return;

    try {
      setExecuting(true);
      const tradeData: CreateTradeRequest = {
        portfolioId,
        symbol: tradeForm.symbol.toUpperCase(),
        type: tradeForm.type,
        quantity: parseInt(tradeForm.quantity),
      };

      await axios.post("http://localhost:8000/paper-trading/trade", tradeData);

      // Reset form
      setTradeForm({ symbol: "", type: "buy", quantity: "" });

      // Show success message
      window.alert(
        `${tradeForm.type.toUpperCase()} order executed successfully!`
      );

      // Trigger portfolio refresh (you can emit an event here if needed)
      window.dispatchEvent(new CustomEvent("portfolio-updated"));
    } catch (error: any) {
      console.error("Error executing trade:", error);
      window.alert(error.response?.data?.message || "Error executing trade");
    } finally {
      setExecuting(false);
    }
  };

  const isValidTrade = () => {
    return (
      tradeForm.symbol && tradeForm.quantity && parseInt(tradeForm.quantity) > 0
    );
  };

  return (
    <div className="quick-trade-container">
      <h2>Quick Trade</h2>
      <div className="quick-trade-form">
        {" "}
        <div className="trade-input-group">
          <select
            value={tradeForm.symbol}
            onChange={(e) =>
              setTradeForm({ ...tradeForm, symbol: e.target.value })
            }
            className="symbol-select"
          >
            <option value="">Select Symbol</option>
            {stocks.map((stock) => (
              <option key={stock.symbol} value={stock.symbol}>
                {stock.symbol} - {stock.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Qty"
            value={tradeForm.quantity}
            onChange={(e) =>
              setTradeForm({ ...tradeForm, quantity: e.target.value })
            }
            min="1"
            className="quantity-input"
          />
        </div>
        <div className="trade-type-buttons">
          <button
            className={`trade-type-btn buy ${
              tradeForm.type === "buy" ? "active" : ""
            }`}
            onClick={() => setTradeForm({ ...tradeForm, type: "buy" })}
          >
            BUY
          </button>
          <button
            className={`trade-type-btn sell ${
              tradeForm.type === "sell" ? "active" : ""
            }`}
            onClick={() => setTradeForm({ ...tradeForm, type: "sell" })}
          >
            SELL
          </button>
        </div>
        <button
          className="execute-trade-btn"
          onClick={executeTrade}
          disabled={executing || !isValidTrade() || !portfolioId}
        >
          {executing
            ? "Executing..."
            : `${tradeForm.type.toUpperCase()} ${tradeForm.quantity || "0"} ${
                tradeForm.symbol || "Stock"
              }`}
        </button>
      </div>
    </div>
  );
};

export default QuickTrade;
