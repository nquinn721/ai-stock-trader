# S25: Advanced Order Management System Implementation Guide

## Overview

This document outlines the implementation of a comprehensive order management system that supports conditional orders, stop-loss orders, and take-profit orders with automatic execution based on real-time market data.

## Feature Requirements

### 1. Order Types

#### **Entry Orders**

- **Functionality**: Place buy orders that execute when stock price reaches a specified entry level
- **Use Case**: "Buy AAPL when price drops to $150"
- **Execution**: Automatic market buy when target price is reached

#### **Stop-Loss Orders**

- **Functionality**: Automatically sell positions when price drops to stop-loss level
- **Use Case**: "Sell my AAPL position if price drops to $140"
- **Execution**: Automatic market sell to limit losses

#### **Take-Profit Orders**

- **Functionality**: Automatically sell positions when price reaches profit target
- **Use Case**: "Sell my AAPL position when price reaches $180"
- **Execution**: Automatic market sell to lock in profits

### 2. System Architecture

#### **Backend Components**

1. **Order Entity** (`src/entities/order.entity.ts`)

   ```typescript
   enum OrderType {
     ENTRY = "ENTRY",
     STOP_LOSS = "STOP_LOSS",
     TAKE_PROFIT = "TAKE_PROFIT",
   }

   enum OrderStatus {
     PENDING = "PENDING",
     TRIGGERED = "TRIGGERED",
     EXECUTED = "EXECUTED",
     CANCELLED = "CANCELLED",
     EXPIRED = "EXPIRED",
   }

   @Entity("orders")
   export class Order {
     @PrimaryGeneratedColumn()
     id: number;

     @Column()
     portfolioId: number;

     @Column()
     symbol: string;

     @Column({ type: "enum", enum: OrderType })
     type: OrderType;

     @Column({ type: "enum", enum: OrderStatus })
     status: OrderStatus;

     @Column({ type: "decimal", precision: 10, scale: 2 })
     triggerPrice: number;

     @Column({ type: "int" })
     quantity: number;

     @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
     executedPrice: number;

     @Column({ nullable: true })
     executedAt: Date;

     @Column({ nullable: true })
     positionId: number; // For stop-loss and take-profit orders

     @CreateDateColumn()
     createdAt: Date;

     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

2. **Order Service** (`src/modules/order-management/order.service.ts`)

   ```typescript
   @Injectable()
   export class OrderService {
     // Create new order
     async createOrder(createOrderDto: CreateOrderDto): Promise<Order>;

     // Cancel pending order
     async cancelOrder(orderId: number): Promise<void>;

     // Get orders for portfolio
     async getPortfolioOrders(portfolioId: number): Promise<Order[]>;

     // Check all pending orders against current prices
     async checkOrderTriggers(): Promise<void>;

     // Execute triggered order
     private async executeOrder(order: Order): Promise<void>;
   }
   ```

3. **Order Monitor Service** (`src/modules/order-management/order-monitor.service.ts`)
   ```typescript
   @Injectable()
   export class OrderMonitorService {
     // Background service that monitors prices and triggers orders
     @Cron('*/30 * * * * *') // Check every 30 seconds
     async monitorOrders(): Promise<void>

     // Check if order should be triggered based on current price
     private shouldTriggerOrder(order: Order, currentPrice: number): boolean
   }
   ```

#### **Frontend Components**

1. **Order Creation Form**

   - Order type selection (Entry/Stop-Loss/Take-Profit)
   - Stock symbol input with autocomplete
   - Trigger price input
   - Quantity input
   - Portfolio selection

2. **Order Management Panel**

   - List of active orders
   - Order status indicators
   - Cancel order functionality
   - Order history

3. **Position-Linked Orders**
   - Automatic stop-loss/take-profit creation when buying stocks
   - Visual indicators on position cards showing active orders
   - Quick order modification from position view

### 3. Implementation Plan

#### **Phase 1: Backend Foundation**

- [ ] Create Order entity and database migration
- [ ] Implement OrderService with basic CRUD operations
- [ ] Add order validation logic
- [ ] Create order DTOs and interfaces

#### **Phase 2: Order Execution Engine**

- [ ] Implement OrderMonitorService with cron-based price checking
- [ ] Add order trigger logic for different order types
- [ ] Integrate with existing paper trading service for execution
- [ ] Add comprehensive error handling and logging

#### **Phase 3: WebSocket Integration**

- [ ] Add order status updates to WebSocket gateway
- [ ] Implement real-time order notifications
- [ ] Update portfolio performance when orders execute
- [ ] Add order events to WebSocket streams

#### **Phase 4: Frontend Implementation**

- [ ] Create order creation UI components
- [ ] Implement order management dashboard
- [ ] Add order status indicators to portfolio views
- [ ] Integrate WebSocket order updates

#### **Phase 5: Advanced Features**

- [ ] Order expiration dates
- [ ] Bracket orders (entry + stop-loss + take-profit in one)
- [ ] Trailing stop-loss orders
- [ ] Order templates and quick actions

### 4. Technical Considerations

#### **Price Monitoring**

- Use existing stock price WebSocket updates
- Implement efficient order checking (only check orders for stocks with price changes)
- Consider price precision and rounding for trigger logic

#### **Execution Logic**

```typescript
// Example trigger logic
private shouldTriggerOrder(order: Order, currentPrice: number): boolean {
  switch (order.type) {
    case OrderType.ENTRY:
      // Buy when price drops to or below entry level
      return currentPrice <= order.triggerPrice;

    case OrderType.STOP_LOSS:
      // Sell when price drops to or below stop level
      return currentPrice <= order.triggerPrice;

    case OrderType.TAKE_PROFIT:
      // Sell when price rises to or above profit level
      return currentPrice >= order.triggerPrice;

    default:
      return false;
  }
}
```

#### **Database Optimization**

- Index orders by status and symbol for efficient monitoring
- Use database-level constraints for data integrity
- Consider order archival for performance

#### **Error Handling**

- Handle insufficient funds for entry orders
- Handle insufficient shares for stop-loss/take-profit orders
- Implement retry logic for failed executions
- Log all order events for audit trail

### 5. User Experience Flow

#### **Creating an Entry Order**

1. User selects "Entry Order" from order menu
2. Enters symbol, entry price, and quantity
3. System validates sufficient cash if triggered
4. Order added to pending orders queue
5. Real-time monitoring begins

#### **Automatic Execution**

1. Stock price reaches trigger level
2. Order status updates to "TRIGGERED"
3. System executes market order
4. Portfolio updated with new position
5. WebSocket notification sent to user
6. Order status updates to "EXECUTED"

#### **Stop-Loss Protection**

1. User buys stock position
2. Optionally creates stop-loss order at same time
3. Stop-loss monitors position value
4. Automatic sell when stop price reached
5. User receives notification of execution

### 6. Testing Strategy

#### **Unit Tests**

- Order service methods
- Trigger logic for different order types
- Price monitoring calculations
- Order validation rules

#### **Integration Tests**

- Order execution with paper trading service
- WebSocket order notifications
- Database order persistence
- Portfolio updates after order execution

#### **E2E Tests**

- Complete order lifecycle (create → monitor → execute)
- User interface order management
- Real-time order status updates
- Portfolio integration scenarios

### 7. Success Metrics

- **Order Execution Accuracy**: 100% of triggered orders execute correctly
- **Response Time**: Orders trigger within 30 seconds of price reaching target
- **User Adoption**: 60%+ of users create at least one conditional order
- **Risk Management**: Stop-loss orders effectively limit portfolio losses
- **System Reliability**: 99.9% uptime for order monitoring service

### 8. Future Enhancements

- **Advanced Order Types**: OCO (One-Cancels-Other), Fill-or-Kill
- **Multi-Leg Orders**: Complex strategies with multiple conditions
- **Risk Management**: Position sizing based on risk percentage
- **Algorithm Integration**: ML-based optimal entry/exit suggestions
- **Mobile Notifications**: Push notifications for order executions

## Implementation Dependencies

- ✅ S23: Live Portfolio Performance Tracking (completed)
- Real-time stock price data (existing)
- WebSocket infrastructure (existing)
- Paper trading system (existing)

## Estimated Timeline

- **Phase 1-2**: 2-3 weeks (Backend foundation and execution engine)
- **Phase 3-4**: 1-2 weeks (WebSocket and frontend implementation)
- **Phase 5**: 1 week (Advanced features and polish)
- **Total**: 4-6 weeks for complete implementation

This advanced order management system will significantly enhance the trading platform by providing professional-grade order execution capabilities while maintaining the simplicity of paper trading.
