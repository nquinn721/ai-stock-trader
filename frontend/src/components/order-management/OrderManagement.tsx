import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useStores } from "../../hooks/useStores";

export interface ConditionalTrigger {
  id: string;
  condition: string;
  value: number;
  field: string;
  logicalOperator?: "AND" | "OR";
}

export interface ConditionalTrigger {
  id: string;
  logicalOperator?: "AND" | "OR";
  condition: string;
  value: number;
}

export interface Order {
  id: number;
  symbol: string;
  orderType: string;
  side: string;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  executedPrice?: number;
  executedQuantity?: number;
  status: string;
  timeInForce: string;
  createdAt: string;
  executedAt?: string;
  commission?: number;
  notes?: string;
  ocoGroupId?: string;
  trailAmount?: number;
  trailPercent?: number;
  fillCount?: number;
  avgExecutionPrice?: number;
  conditionalTriggers?: ConditionalTrigger[];
}

export interface OrderManagementProps {
  portfolioId?: number;
  showPortfolioFilter?: boolean;
}

export const OrderManagement: React.FC<OrderManagementProps> = observer(
  ({ portfolioId, showPortfolioFilter = false }) => {
    const { tradeStore, portfolioStore } = useStores();

    const [activeTab, setActiveTab] = useState<
      "active" | "history" | "conditional" | "execution"
    >("active");
    const [selectedPortfolio, setSelectedPortfolio] = useState<
      number | undefined
    >(portfolioId);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(
      new Set()
    );

    // Filters
    const [symbolFilter, setSymbolFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [orderTypeFilter, setOrderTypeFilter] = useState<string>("");

    useEffect(() => {
      loadOrders();
    }, [activeTab, selectedPortfolio]);

    const loadOrders = async () => {
      if (!selectedPortfolio && !showPortfolioFilter) return;

      setIsLoading(true);
      setError(null);

      try {
        let fetchedOrders: Order[] = [];

        switch (activeTab) {
          case "active":
            if (selectedPortfolio) {
              // Using tradeStore as placeholder - in real app you'd have orderManagementStore
              await tradeStore.fetchTrades(selectedPortfolio);
              fetchedOrders = tradeStore.trades as unknown as Order[];
            } else {
              fetchedOrders = [] as Order[]; // Placeholder
            }
            break;
          case "history":
            if (selectedPortfolio) {
              await tradeStore.fetchTrades(selectedPortfolio);
              fetchedOrders = tradeStore.trades as unknown as Order[];
            }
            break;
          case "conditional":
            if (selectedPortfolio) {
              await tradeStore.fetchTrades(selectedPortfolio);
              const allOrders = tradeStore.trades as unknown as Order[];
              fetchedOrders = allOrders.filter(
                (order: Order) =>
                  order.conditionalTriggers &&
                  order.conditionalTriggers.length > 0
              );
            }
            break;
          case "execution":
            if (selectedPortfolio) {
              await tradeStore.fetchTrades(selectedPortfolio);
              fetchedOrders = tradeStore.trades as unknown as Order[];
            }
            break;
        }

        setOrders(fetchedOrders);
      } catch (err: any) {
        setError(err.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    const handleCancelOrder = async (orderId: number) => {
      try {
        // Placeholder - would normally use orderManagementStore.cancelOrder
        console.log("Cancel order:", orderId);
        await loadOrders(); // Refresh the list
      } catch (err: any) {
        setError(err.message || "Failed to cancel order");
      }
    };

    const handleCancelSelected = async () => {
      try {
        // Placeholder - would normally use orderManagementStore.cancelOrder
        console.log("Cancel selected orders:", Array.from(selectedOrders));
        setSelectedOrders(new Set());
        await loadOrders();
      } catch (err: any) {
        setError(err.message || "Failed to cancel selected orders");
      }
    };

    const handleCancelOCOGroup = async (ocoGroupId: string) => {
      try {
        // Placeholder - would normally use orderManagementStore.cancelOCOGroup
        console.log("Cancel OCO group:", ocoGroupId);
        await loadOrders();
      } catch (err: any) {
        setError(err.message || "Failed to cancel OCO group");
      }
    };

    const toggleOrderSelection = (orderId: number) => {
      const newSelection = new Set(selectedOrders);
      if (newSelection.has(orderId)) {
        newSelection.delete(orderId);
      } else {
        newSelection.add(orderId);
      }
      setSelectedOrders(newSelection);
    };

    const selectAllOrders = () => {
      const activeOrderIds = filteredOrders
        .filter(
          (order) => order.status === "pending" || order.status === "triggered"
        )
        .map((order) => order.id);
      setSelectedOrders(new Set(activeOrderIds));
    };

    const clearSelection = () => {
      setSelectedOrders(new Set());
    };

    // Apply filters
    const filteredOrders = orders.filter((order) => {
      if (
        symbolFilter &&
        !order.symbol.toLowerCase().includes(symbolFilter.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }
      if (orderTypeFilter && order.orderType !== orderTypeFilter) {
        return false;
      }
      return true;
    });

    const formatCurrency = (amount: number | undefined) => {
      return amount ? `$${amount.toFixed(2)}` : "-";
    };

    const formatDateTime = (dateString: string | undefined) => {
      if (!dateString) return "-";
      return new Date(dateString).toLocaleString();
    };

    const getStatusBadgeClass = (status: string) => {
      switch (status.toLowerCase()) {
        case "executed":
          return "status-executed";
        case "pending":
          return "status-pending";
        case "triggered":
          return "status-triggered";
        case "cancelled":
          return "status-cancelled";
        case "expired":
          return "status-expired";
        default:
          return "status-unknown";
      }
    };

    const getSideBadgeClass = (side: string) => {
      return side.toLowerCase() === "buy" ? "side-buy" : "side-sell";
    };

    return (
      <div className="order-management">
        <div className="order-management-header">
          <h2>Order Management</h2>

          {showPortfolioFilter && (
            <div className="portfolio-selector">
              <select
                value={selectedPortfolio || ""}
                onChange={(e) =>
                  setSelectedPortfolio(Number(e.target.value) || undefined)
                }
                className="form-control"
              >
                <option value="">Select Portfolio</option>
                {portfolioStore.portfolios.map((portfolio: any) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="order-tabs">
          <button
            className={`tab-button ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Orders
          </button>
          <button
            className={`tab-button ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Order History
          </button>
          <button
            className={`tab-button ${
              activeTab === "conditional" ? "active" : ""
            }`}
            onClick={() => setActiveTab("conditional")}
          >
            Conditional Orders
          </button>
          <button
            className={`tab-button ${
              activeTab === "execution" ? "active" : ""
            }`}
            onClick={() => setActiveTab("execution")}
          >
            Execution Quality
          </button>
        </div>

        <div className="order-filters">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="filter-input"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="triggered">Triggered</option>
              <option value="executed">Executed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop_loss">Stop Loss</option>
              <option value="stop_limit">Stop Limit</option>
              <option value="trailing_stop">Trailing Stop</option>
              <option value="bracket">Bracket</option>
              <option value="oco">OCO</option>
            </select>
          </div>

          {activeTab === "active" && selectedOrders.size > 0 && (
            <div className="bulk-actions">
              <span>{selectedOrders.size} orders selected</span>
              <button
                onClick={handleCancelSelected}
                className="bulk-cancel-btn"
              >
                Cancel Selected
              </button>
              <button onClick={clearSelection} className="clear-selection-btn">
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-error">
              ×
            </button>
          </div>
        )}

        <div className="order-content">
          {isLoading ? (
            <div className="loading-spinner">Loading orders...</div>
          ) : (
            <>
              {activeTab === "active" && (
                <div className="active-orders">
                  <div className="orders-toolbar">
                    <div className="order-count">
                      {filteredOrders.length} active orders
                    </div>
                    <div className="toolbar-actions">
                      <button
                        onClick={selectAllOrders}
                        className="select-all-btn"
                      >
                        Select All
                      </button>
                      <button onClick={loadOrders} className="refresh-btn">
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              checked={
                                filteredOrders.length > 0 &&
                                selectedOrders.size === filteredOrders.length
                              }
                              onChange={
                                filteredOrders.length > 0 &&
                                selectedOrders.size === filteredOrders.length
                                  ? clearSelection
                                  : selectAllOrders
                              }
                            />
                          </th>
                          <th>Symbol</th>
                          <th>Type</th>
                          <th>Side</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className={
                              selectedOrders.has(order.id) ? "selected" : ""
                            }
                          >
                            <td>
                              {(order.status === "pending" ||
                                order.status === "triggered") && (
                                <input
                                  type="checkbox"
                                  checked={selectedOrders.has(order.id)}
                                  onChange={() =>
                                    toggleOrderSelection(order.id)
                                  }
                                />
                              )}
                            </td>
                            <td className="symbol-cell">{order.symbol}</td>
                            <td>
                              <div className="order-type">
                                {order.orderType
                                  .replace("_", " ")
                                  .toUpperCase()}
                                {order.ocoGroupId && (
                                  <span className="oco-badge">OCO</span>
                                )}
                                {order.trailAmount && (
                                  <span className="trail-badge">TRAIL</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`side-badge ${getSideBadgeClass(
                                  order.side
                                )}`}
                              >
                                {order.side.toUpperCase()}
                              </span>
                            </td>
                            <td>{order.quantity}</td>
                            <td>
                              <div className="price-info">
                                {order.limitPrice && (
                                  <div>
                                    Limit: {formatCurrency(order.limitPrice)}
                                  </div>
                                )}
                                {order.stopPrice && (
                                  <div>
                                    Stop: {formatCurrency(order.stopPrice)}
                                  </div>
                                )}
                                {order.trailAmount && (
                                  <div>Trail: ${order.trailAmount}</div>
                                )}
                                {order.trailPercent && (
                                  <div>Trail: {order.trailPercent}%</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status-badge ${getStatusBadgeClass(
                                  order.status
                                )}`}
                              >
                                {order.status.toUpperCase()}
                              </span>
                            </td>
                            <td>{formatDateTime(order.createdAt)}</td>
                            <td>
                              <div className="order-actions">
                                {(order.status === "pending" ||
                                  order.status === "triggered") && (
                                  <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="cancel-btn"
                                  >
                                    Cancel
                                  </button>
                                )}
                                {order.ocoGroupId && (
                                  <button
                                    onClick={() =>
                                      handleCancelOCOGroup(order.ocoGroupId!)
                                    }
                                    className="cancel-oco-btn"
                                  >
                                    Cancel OCO
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredOrders.length === 0 && (
                      <div className="no-orders">No active orders found</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="order-history">
                  <div className="orders-toolbar">
                    <div className="order-count">
                      {filteredOrders.length} historical orders
                    </div>
                  </div>

                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Type</th>
                          <th>Side</th>
                          <th>Quantity</th>
                          <th>Order Price</th>
                          <th>Executed Price</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Executed</th>
                          <th>Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="symbol-cell">{order.symbol}</td>
                            <td>
                              {order.orderType.replace("_", " ").toUpperCase()}
                            </td>
                            <td>
                              <span
                                className={`side-badge ${getSideBadgeClass(
                                  order.side
                                )}`}
                              >
                                {order.side.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {order.executedQuantity
                                ? `${order.executedQuantity}/${order.quantity}`
                                : order.quantity}
                              {order.fillCount && order.fillCount > 1 && (
                                <span className="fill-count">
                                  ({order.fillCount} fills)
                                </span>
                              )}
                            </td>
                            <td>
                              {order.limitPrice
                                ? formatCurrency(order.limitPrice)
                                : order.stopPrice
                                ? formatCurrency(order.stopPrice)
                                : "Market"}
                            </td>
                            <td>
                              {order.avgExecutionPrice
                                ? formatCurrency(order.avgExecutionPrice)
                                : formatCurrency(order.executedPrice)}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${getStatusBadgeClass(
                                  order.status
                                )}`}
                              >
                                {order.status.toUpperCase()}
                              </span>
                            </td>
                            <td>{formatDateTime(order.createdAt)}</td>
                            <td>{formatDateTime(order.executedAt)}</td>
                            <td>{formatCurrency(order.commission)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredOrders.length === 0 && (
                      <div className="no-orders">No order history found</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "conditional" && (
                <div className="conditional-orders">
                  <div className="orders-toolbar">
                    <div className="order-count">
                      {filteredOrders.length} conditional orders
                    </div>
                  </div>

                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Type</th>
                          <th>Side</th>
                          <th>Quantity</th>
                          <th>Triggers</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="symbol-cell">{order.symbol}</td>
                            <td>
                              {order.orderType.replace("_", " ").toUpperCase()}
                            </td>
                            <td>
                              <span
                                className={`side-badge ${getSideBadgeClass(
                                  order.side
                                )}`}
                              >
                                {order.side.toUpperCase()}
                              </span>
                            </td>
                            <td>{order.quantity}</td>
                            <td>
                              <div className="triggers">
                                {order.conditionalTriggers?.map(
                                  (trigger, index) => (
                                    <div key={trigger.id} className="trigger">
                                      {index > 0 && (
                                        <span className="logical-op">
                                          {trigger.logicalOperator}
                                        </span>
                                      )}
                                      <span className="trigger-condition">
                                        {trigger.field} {trigger.condition}{" "}
                                        {trigger.value}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status-badge ${getStatusBadgeClass(
                                  order.status
                                )}`}
                              >
                                {order.status.toUpperCase()}
                              </span>
                            </td>
                            <td>{formatDateTime(order.createdAt)}</td>
                            <td>
                              {(order.status === "pending" ||
                                order.status === "triggered") && (
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="cancel-btn"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredOrders.length === 0 && (
                      <div className="no-orders">
                        No conditional orders found
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "execution" && (
                <div className="execution-quality">
                  <div className="execution-metrics">
                    <div className="metric-card">
                      <h4>Average Fill Rate</h4>
                      <div className="metric-value">100%</div>
                    </div>
                    <div className="metric-card">
                      <h4>Average Execution Time</h4>
                      <div className="metric-value">0.12s</div>
                    </div>
                    <div className="metric-card">
                      <h4>Average Slippage</h4>
                      <div className="metric-value">0.03%</div>
                    </div>
                    <div className="metric-card">
                      <h4>Average Commission</h4>
                      <div className="metric-value">$1.50</div>
                    </div>
                  </div>

                  <div className="execution-table">
                    <h4>Recent Executions</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Side</th>
                          <th>Quantity</th>
                          <th>Order Price</th>
                          <th>Executed Price</th>
                          <th>Slippage</th>
                          <th>Execution Time</th>
                          <th>Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders
                          .filter((order) => order.status === "executed")
                          .slice(0, 50)
                          .map((order) => {
                            const slippage =
                              order.limitPrice && order.executedPrice
                                ? (Math.abs(
                                    order.executedPrice - order.limitPrice
                                  ) /
                                    order.executedPrice) *
                                  100
                                : 0;

                            return (
                              <tr key={order.id}>
                                <td className="symbol-cell">{order.symbol}</td>
                                <td>
                                  <span
                                    className={`side-badge ${getSideBadgeClass(
                                      order.side
                                    )}`}
                                  >
                                    {order.side.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  {order.executedQuantity || order.quantity}
                                </td>
                                <td>
                                  {order.limitPrice
                                    ? formatCurrency(order.limitPrice)
                                    : "Market"}
                                </td>
                                <td>{formatCurrency(order.executedPrice)}</td>
                                <td>
                                  {slippage > 0
                                    ? `${slippage.toFixed(3)}%`
                                    : "-"}
                                </td>
                                <td>
                                  {order.executedAt && order.createdAt
                                    ? `${(
                                        (new Date(order.executedAt).getTime() -
                                          new Date(order.createdAt).getTime()) /
                                        1000
                                      ).toFixed(2)}s`
                                    : "-"}
                                </td>
                                <td>{formatCurrency(order.commission)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

export default OrderManagement;
