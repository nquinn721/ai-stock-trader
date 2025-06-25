import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useAutoTradingStore } from "../../stores/StoreContext";
import { AutoTrade } from "../../types/autoTrading.types";
import "./AutoTradeHistory.css";

interface AutoTradeHistoryProps {
  portfolioId?: string;
  maxItems?: number;
}

const AutoTradeHistory: React.FC<AutoTradeHistoryProps> = observer(
  ({ portfolioId, maxItems = 50 }) => {
    const autoTradingStore = useAutoTradingStore();
    const [filterStatus, setFilterStatus] = useState<"all" | "executed" | "pending" | "failed">("all");
    const [sortBy, setSortBy] = useState<"timestamp" | "symbol" | "pnl">("timestamp");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Mock data for demonstration - in real app this would come from the store
    const generateMockTrades = (): AutoTrade[] => {
      const symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NFLX", "NVDA"];
      const statuses: AutoTrade["status"][] = ["executed", "pending", "failed"];
      const trades: AutoTrade[] = [];

      for (let i = 0; i < maxItems; i++) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const action = Math.random() > 0.5 ? "buy" : "sell";
        const quantity = Math.floor(Math.random() * 100) + 1;
        const price = 50 + Math.random() * 200;
        const pnl = status === "executed" ? (Math.random() - 0.5) * 1000 : 0;

        trades.push({
          id: `trade_${i + 1}`,
          sessionId: `session_${Math.floor(i / 10) + 1}`,
          ruleId: `rule_${Math.floor(Math.random() * 5) + 1}`,
          portfolioId: portfolioId || "default",
          symbol,
          type: action,
          action,
          quantity,
          triggerPrice: price * (0.95 + Math.random() * 0.1),
          price,
          status,
          pnl: status === "executed" ? pnl : undefined,
          executedAt: status === "executed" ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          reason: `Automated ${action} based on rule trigger`
        });
      }

      return trades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    };

    const [trades, setTrades] = useState<AutoTrade[]>([]);

    useEffect(() => {
      // In real implementation, this would fetch from autoTradingStore
      setTrades(generateMockTrades());
    }, [portfolioId, maxItems]);

    const filteredAndSortedTrades = trades
      .filter(trade => {
        if (filterStatus === "all") return true;
        return trade.status === filterStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case "timestamp":
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case "symbol":
            comparison = a.symbol.localeCompare(b.symbol);
            break;
          case "pnl":
            const aPnl = a.pnl || 0;
            const bPnl = b.pnl || 0;
            comparison = aPnl - bPnl;
            break;
        }
        
        return sortOrder === "asc" ? comparison : -comparison;
      });

    const getStatusColor = (status: AutoTrade["status"]) => {
      switch (status) {
        case "executed": return "success";
        case "pending": return "warning";
        case "failed": return "error";
        default: return "default";
      }
    };

    const getActionColor = (action: string) => {
      return action === "buy" ? "buy" : "sell";
    };

    const formatPnL = (pnl?: number) => {
      if (pnl === undefined) return "—";
      const formatted = `$${Math.abs(pnl).toFixed(2)}`;
      return pnl >= 0 ? `+${formatted}` : `-${formatted}`;
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const totalPnL = trades
      .filter(t => t.status === "executed" && t.pnl !== undefined)
      .reduce((sum, t) => sum + (t.pnl || 0), 0);

    const executedTrades = trades.filter(t => t.status === "executed").length;
    const pendingTrades = trades.filter(t => t.status === "pending").length;
    const failedTrades = trades.filter(t => t.status === "failed").length;

    return (
      <div className="auto-trade-history">
        <div className="history-header">
          <div className="header-title">
            <h3>Auto Trade History</h3>
            <span className="trade-count">{filteredAndSortedTrades.length} trades</span>
          </div>

          <div className="header-stats">
            <div className="stat">
              <span className="stat-label">Total P&L</span>
              <span className={`stat-value ${totalPnL >= 0 ? "positive" : "negative"}`}>
                {formatPnL(totalPnL)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Executed</span>
              <span className="stat-value">{executedTrades}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{pendingTrades}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Failed</span>
              <span className="stat-value">{failedTrades}</span>
            </div>
          </div>
        </div>

        <div className="history-controls">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Trades</option>
              <option value="executed">Executed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="sort-group">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="timestamp">Date</option>
              <option value="symbol">Symbol</option>
              <option value="pnl">P&L</option>
            </select>
            <button
              className={`sort-order ${sortOrder}`}
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {autoTradingStore.error && (
          <div className="error-message">
            Error loading trade history: {autoTradingStore.error}
          </div>
        )}

        <div className="trades-table">
          {filteredAndSortedTrades.length === 0 ? (
            <div className="no-trades">
              <div className="no-trades-content">
                <h4>No trades found</h4>
                <p>
                  {filterStatus === "all"
                    ? "No automated trades have been executed yet."
                    : `No ${filterStatus} trades found.`}
                </p>
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>P&L</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTrades.map((trade) => (
                  <tr key={trade.id} className="trade-row">
                    <td className="date-cell">
                      {formatDate(trade.executedAt || trade.createdAt)}
                    </td>
                    <td className="symbol-cell">
                      <span className="symbol">{trade.symbol}</span>
                    </td>
                    <td className="action-cell">
                      <span className={`action ${getActionColor(trade.action)}`}>
                        {trade.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="quantity-cell">
                      {trade.quantity.toLocaleString()}
                    </td>
                    <td className="price-cell">
                      ${trade.price.toFixed(2)}
                    </td>
                    <td className="value-cell">
                      ${(trade.quantity * trade.price).toLocaleString()}
                    </td>
                    <td className="pnl-cell">
                      <span className={`pnl ${trade.pnl !== undefined ? (trade.pnl >= 0 ? "positive" : "negative") : ""}`}>
                        {formatPnL(trade.pnl)}
                      </span>
                    </td>
                    <td className="status-cell">
                      <span className={`status ${getStatusColor(trade.status)}`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {autoTradingStore.isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>Loading trade history...</span>
          </div>
        )}
      </div>
    );
  }
);

export default AutoTradeHistory;
