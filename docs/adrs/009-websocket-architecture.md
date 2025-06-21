# ADR-009: WebSocket Architecture and Real-Time Communication

## Status

Accepted

## Context

The Stock Trading App requires real-time data updates for stock prices, trading signals, and portfolio performance. Users expect immediate feedback on market changes and trading activities without page refreshes.

Key requirements:

- Real-time stock price updates from Yahoo Finance API
- Live trading signal notifications
- Portfolio performance real-time tracking
- WebSocket connection reliability and error handling
- Scalable architecture for multiple concurrent users
- Efficient data transmission and bandwidth usage

## Decision

We will implement a comprehensive WebSocket architecture using Socket.io:

### Technology Stack

- **Backend**: Socket.io with NestJS WebSocket Gateway
- **Frontend**: Socket.io-client with React Context
- **Protocol**: WebSocket with polling fallback
- **Data Format**: JSON for all real-time communications

### Architecture Components

#### Backend WebSocket Gateway

```typescript
@WebSocketGateway({
  cors: { origin: ["http://localhost:3000", "http://localhost:8000"] },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class StockWebSocketGateway {
  // Connection management
  // Event broadcasting
  // Error handling
}
```

#### Frontend Socket Context

```typescript
const SocketContext = createContext({
  socket: null,
  isConnected: false,
  stocks: [],
  tradingSignals: [],
  news: [],
});
```

### Event Types and Data Flow

#### Stock Data Events

- **`stock_updates`**: Bulk stock data (initial load)
- **`stock_update`**: Individual stock price changes
- **`stock_error`**: Error notifications for failed data fetching

#### Trading Events

- **`trading_signal`**: New trading signals and recommendations
- **`portfolio_update`**: Real-time portfolio performance changes

#### System Events

- **`connect`**: Client connection established
- **`disconnect`**: Client disconnection
- **`subscribe_stocks`**: Client requests stock data subscription

### Connection Management

#### Client-Side Features

- **Auto-reconnection**: 5 retry attempts with exponential backoff
- **Connection timeout**: 20-second timeout for initial connection
- **Error handling**: Graceful degradation when WebSocket unavailable
- **State management**: Real-time connection status tracking

#### Server-Side Features

- **Client tracking**: Map of connected clients by socket ID
- **Room management**: Stock-specific subscriptions
- **Error broadcasting**: Send error events to clients
- **Performance monitoring**: Track client count and message frequency

### Data Update Strategy

#### Cron Job Integration

```typescript
@Cron('0 */2 * * * *') // Every 2 minutes
async updateAllStockPrices() {
  // Only update when clients are connected
  if (this.websocketGateway.getConnectedClientsCount() > 0) {
    // Fetch updated stock data
    // Broadcast via WebSocket
  }
}
```

#### Rate Limiting and Optimization

- **Update Frequency**: Stock data every 2 minutes (market hours)
- **Client-Aware Updates**: Skip updates when no clients connected
- **Selective Broadcasting**: Send only changed data when possible
- **Compression**: Use Socket.io compression for large datasets

### Error Handling and Resilience

#### Timeout Management

- **API Timeouts**: 10-15 second timeouts for external API calls
- **WebSocket Timeouts**: 60-second ping timeout, 25-second ping interval
- **Reconnection Logic**: Exponential backoff with maximum delay

#### Fallback Strategies

- **REST API Fallback**: Frontend falls back to polling if WebSocket fails
- **Graceful Degradation**: Display last known data during connection issues
- **Error Notifications**: User-friendly error messages for connection problems

#### Performance Safeguards

- **Connection Limits**: Monitor and limit concurrent connections
- **Message Throttling**: Prevent message flooding
- **Memory Management**: Clean up disconnected client references

### Security Considerations

#### CORS Configuration

```typescript
cors: {
  origin: ['http://localhost:3000', 'http://localhost:8000'],
  credentials: true
}
```

#### Authentication Integration

- **Future Enhancement**: JWT token validation for WebSocket connections
- **Rate Limiting**: Prevent abuse with connection rate limits
- **Origin Validation**: Strict CORS policy enforcement

## Consequences

### Positive

- **Real-time Experience**: Immediate stock price and portfolio updates
- **Reduced Server Load**: Efficient push notifications vs. polling
- **Better User Experience**: Live feedback and instant notifications
- **Scalable Architecture**: Can handle multiple concurrent users
- **Reliability**: Auto-reconnection and error handling

### Negative

- **Complexity**: Additional infrastructure and error handling required
- **Resource Usage**: Persistent connections consume server resources
- **Testing Challenges**: WebSocket testing more complex than REST APIs
- **Browser Compatibility**: Need polling fallback for older browsers

## Implementation Status

### Phase 1: Core WebSocket Infrastructure (Completed)

- [x] Socket.io backend gateway setup
- [x] Frontend Socket context implementation
- [x] Basic connection management
- [x] Stock data event broadcasting

### Phase 2: Performance and Reliability (Completed)

- [x] Connection timeout and error handling
- [x] Auto-reconnection logic
- [x] API timeout protection
- [x] Client-aware cron job updates
- [x] Performance monitoring

### Phase 3: Advanced Features (Planned)

- [ ] Authentication integration
- [ ] Message compression optimization
- [ ] Advanced room management
- [ ] WebSocket load balancing

## Testing Strategy

### Unit Testing

- Mock WebSocket connections for service testing
- Test event broadcasting logic
- Validate error handling scenarios

### Integration Testing

- Test complete WebSocket data flow
- Validate reconnection behavior
- Performance testing with multiple clients

### E2E Testing

```typescript
test("should receive real-time stock updates", async ({ page }) => {
  await page.goto("/");

  // Wait for WebSocket connection
  await page.waitForFunction(() => window.socketConnected);

  // Verify real-time updates
  await expect(page.locator(".stock-price")).toBeVisible();
});
```

## Monitoring and Metrics

### Key Performance Indicators

- **Connection Success Rate**: > 98%
- **Average Reconnection Time**: < 5 seconds
- **Message Delivery Latency**: < 100ms
- **Concurrent Connection Capacity**: Target 1000+ users

### Monitoring Tools

- **Connection Tracking**: Real-time client count monitoring
- **Error Rate Monitoring**: Track connection failures and timeouts
- **Performance Metrics**: Message frequency and response times
- **Resource Usage**: Memory and CPU consumption tracking

## Future Enhancements

### Scalability Improvements

- **Horizontal Scaling**: Redis adapter for multi-instance Socket.io
- **Load Balancing**: Sticky session support for WebSocket connections
- **Caching**: Redis caching for frequently accessed data

### Feature Additions

- **Private Channels**: User-specific portfolio updates
- **Message History**: Store and replay missed messages
- **Advanced Filtering**: Client-side subscription management
- **Mobile Support**: Optimize for mobile WebSocket connections

## References

- [Socket.io Documentation](https://socket.io/docs/)
- [NestJS WebSocket Guide](https://docs.nestjs.com/websockets/gateways)
- [WebSocket Performance Best Practices](https://www.ably.io/blog/websocket-performance)
- [Real-Time Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/)
