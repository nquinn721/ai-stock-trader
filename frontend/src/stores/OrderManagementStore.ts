import { makeAutoObservable, runInAction } from "mobx";
import { ApiStore } from "./ApiStore";

export interface Order {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT";
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: "PENDING" | "FILLED" | "PARTIALLY_FILLED" | "CANCELLED" | "REJECTED";
  timeInForce: "DAY" | "GTC" | "IOC" | "FOK";
  createdAt: Date;
  updatedAt: Date;
  filledQuantity: number;
  averageFillPrice?: number;
  portfolioId: string;
}

export interface BracketOrder {
  parentOrderId: string;
  takeProfitPrice: number;
  stopLossPrice: number;
  quantity: number;
}

export interface OCOOrder {
  symbol: string;
  quantity: number;
  side: "BUY" | "SELL";
  stopPrice: number;
  limitPrice: number;
  timeInForce: "DAY" | "GTC";
}

export interface ConditionalOrder {
  symbol: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  quantity: number;
  price?: number;
  condition: {
    field: string;
    operator: ">" | "<" | ">=" | "<=" | "=";
    value: number;
  };
  timeInForce: "DAY" | "GTC";
}

export interface OrderRequest {
  symbol: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT";
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: "DAY" | "GTC" | "IOC" | "FOK";
  portfolioId: string;
}

export interface OrderFill {
  id: string;
  orderId: string;
  quantity: number;
  price: number;
  timestamp: Date;
  commission: number;
}

export interface OrderStatus {
  orderId: string;
  status: string;
  filledQuantity: number;
  remainingQuantity: number;
  averageFillPrice?: number;
  lastFill?: OrderFill;
}

export class OrderManagementStore {
  // Orders data
  orders: Order[] = [];
  selectedOrders: Set<string> = new Set();
  orderHistory: Order[] = [];

  // Order status tracking
  pendingOrders: Order[] = [];
  filledOrders: Order[] = [];
  cancelledOrders: Order[] = [];

  // Real-time status
  orderStatuses: Map<string, OrderStatus> = new Map();

  // UI state
  isLoading: boolean = false;
  error: string | null = null;
  selectedPortfolioId: string | null = null;

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
  }

  // Basic order operations
  async placeOrder(orderRequest: OrderRequest): Promise<Order> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const order = await this.apiStore.post<Order>(
        "/order-management/orders",
        orderRequest
      );

      runInAction(() => {
        this.orders.push(order);
        this.pendingOrders.push(order);
        this.isLoading = false;
      });

      return order;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to place order";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async placeBracketOrder(bracketOrder: BracketOrder): Promise<Order> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const order = await this.apiStore.post<Order>(
        "/order-management/orders/bracket",
        bracketOrder
      );

      runInAction(() => {
        this.orders.push(order);
        this.pendingOrders.push(order);
        this.isLoading = false;
      });

      return order;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to place bracket order";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async placeOCOOrder(ocoOrder: OCOOrder): Promise<Order> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const order = await this.apiStore.post<Order>(
        "/order-management/orders/oco",
        ocoOrder
      );

      runInAction(() => {
        this.orders.push(order);
        this.pendingOrders.push(order);
        this.isLoading = false;
      });

      return order;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to place OCO order";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async placeConditionalOrder(
    conditionalOrder: ConditionalOrder
  ): Promise<Order> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const order = await this.apiStore.post<Order>(
        "/order-management/orders/conditional",
        conditionalOrder
      );

      runInAction(() => {
        this.orders.push(order);
        this.pendingOrders.push(order);
        this.isLoading = false;
      });

      return order;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to place conditional order";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      await this.apiStore.delete(`/order-management/orders/${orderId}`);

      runInAction(() => {
        const orderIndex = this.orders.findIndex(
          (order) => order.id === orderId
        );
        if (orderIndex >= 0) {
          const order = this.orders[orderIndex];
          order.status = "CANCELLED";
          order.updatedAt = new Date();

          // Move from pending to cancelled
          this.pendingOrders = this.pendingOrders.filter(
            (o) => o.id !== orderId
          );
          this.cancelledOrders.push(order);
        }
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to cancel order";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async cancelMultipleOrders(orderIds: string[]): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      await this.apiStore.post("/order-management/orders/cancel-multiple", {
        orderIds,
      });

      runInAction(() => {
        orderIds.forEach((orderId) => {
          const orderIndex = this.orders.findIndex(
            (order) => order.id === orderId
          );
          if (orderIndex >= 0) {
            const order = this.orders[orderIndex];
            order.status = "CANCELLED";
            order.updatedAt = new Date();

            // Move from pending to cancelled
            this.pendingOrders = this.pendingOrders.filter(
              (o) => o.id !== orderId
            );
            this.cancelledOrders.push(order);
          }
        });
        this.selectedOrders.clear();
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to cancel multiple orders";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Order fetching
  async fetchOrders(portfolioId?: string): Promise<Order[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const endpoint = portfolioId
        ? `/order-management/orders?portfolioId=${portfolioId}`
        : "/order-management/orders";

      const orders = await this.apiStore.get<Order[]>(endpoint);

      runInAction(() => {
        this.orders = orders;
        this.categorizeOrders();
        this.isLoading = false;
      });

      return orders;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch orders";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchOrderHistory(
    portfolioId?: string,
    days?: number
  ): Promise<Order[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      let endpoint = "/order-management/orders/history";
      const params = [];

      if (portfolioId) params.push(`portfolioId=${portfolioId}`);
      if (days) params.push(`days=${days}`);

      if (params.length > 0) {
        endpoint += `?${params.join("&")}`;
      }

      const orders = await this.apiStore.get<Order[]>(endpoint);

      runInAction(() => {
        this.orderHistory = orders;
        this.isLoading = false;
      });

      return orders;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch order history";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    try {
      const status = await this.apiStore.get<OrderStatus>(
        `/order-management/orders/${orderId}/status`
      );

      runInAction(() => {
        this.orderStatuses.set(orderId, status);
      });

      return status;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to get order status";
      });
      throw error;
    }
  }

  // Order modification
  async modifyOrder(
    orderId: string,
    updates: Partial<OrderRequest>
  ): Promise<Order> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const order = await this.apiStore.put<Order>(
        `/order-management/orders/${orderId}`,
        updates
      );

      runInAction(() => {
        const orderIndex = this.orders.findIndex((o) => o.id === orderId);
        if (orderIndex >= 0) {
          this.orders[orderIndex] = order;
        }
        this.categorizeOrders();
        this.isLoading = false;
      });

      return order;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to modify order";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Order selection
  toggleOrderSelection(orderId: string): void {
    runInAction(() => {
      if (this.selectedOrders.has(orderId)) {
        this.selectedOrders.delete(orderId);
      } else {
        this.selectedOrders.add(orderId);
      }
    });
  }

  selectAllOrders(): void {
    runInAction(() => {
      this.orders.forEach((order) => {
        this.selectedOrders.add(order.id);
      });
    });
  }

  deselectAllOrders(): void {
    runInAction(() => {
      this.selectedOrders.clear();
    });
  }

  // Portfolio selection
  setSelectedPortfolio(portfolioId: string): void {
    runInAction(() => {
      this.selectedPortfolioId = portfolioId;
    });
    this.fetchOrders(portfolioId);
  }

  // Utility methods
  private categorizeOrders(): void {
    this.pendingOrders = this.orders.filter(
      (order) =>
        order.status === "PENDING" || order.status === "PARTIALLY_FILLED"
    );
    this.filledOrders = this.orders.filter(
      (order) => order.status === "FILLED"
    );
    this.cancelledOrders = this.orders.filter(
      (order) => order.status === "CANCELLED" || order.status === "REJECTED"
    );
  }

  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }

  clearAllData(): void {
    runInAction(() => {
      this.orders = [];
      this.selectedOrders.clear();
      this.orderHistory = [];
      this.pendingOrders = [];
      this.filledOrders = [];
      this.cancelledOrders = [];
      this.orderStatuses.clear();
      this.selectedPortfolioId = null;
      this.error = null;
    });
  }

  // Computed getters
  get hasOrders(): boolean {
    return this.orders.length > 0;
  }

  get hasPendingOrders(): boolean {
    return this.pendingOrders.length > 0;
  }

  get hasSelectedOrders(): boolean {
    return this.selectedOrders.size > 0;
  }

  get selectedOrdersArray(): Order[] {
    return this.orders.filter((order) => this.selectedOrders.has(order.id));
  }

  get pendingOrdersCount(): number {
    return this.pendingOrders.length;
  }

  get filledOrdersCount(): number {
    return this.filledOrders.length;
  }

  get cancelledOrdersCount(): number {
    return this.cancelledOrders.length;
  }

  getOrdersForSymbol(symbol: string): Order[] {
    return this.orders.filter((order) => order.symbol === symbol);
  }

  getOrderById(orderId: string): Order | undefined {
    return this.orders.find((order) => order.id === orderId);
  }
}
