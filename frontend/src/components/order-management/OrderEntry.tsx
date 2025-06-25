import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../hooks/useStores';

export interface OrderEntryProps {
  symbol: string;
  portfolioId: number;
  currentPrice?: number;
  onOrderSubmitted?: (orderId: number) => void;
  onClose?: () => void;
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP_LOSS = 'stop_loss',
  TAKE_PROFIT = 'take_profit',
  STOP_LIMIT = 'stop_limit',
  TRAILING_STOP = 'trailing_stop',
  BRACKET = 'bracket',
  OCO = 'oco',
  IF_TOUCHED = 'if_touched',
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum TimeInForce {
  DAY = 'day',
  GTC = 'gtc',
  IOC = 'ioc',
  FOK = 'fok',
}

interface ConditionalTrigger {
  id: string;
  type: 'price' | 'time' | 'indicator' | 'volume';
  condition: 'greater_than' | 'less_than' | 'equals' | 'between';
  value: number | string;
  value2?: number;
  field: string;
  logicalOperator?: 'AND' | 'OR';
}

export const OrderEntry: React.FC<OrderEntryProps> = observer(({
  symbol,
  portfolioId,
  currentPrice = 0,
  onOrderSubmitted,
  onClose,
}) => {
  const { orderManagementStore, stockStore } = useStores();
  
  // Basic order fields
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [side, setSide] = useState<OrderSide>(OrderSide.BUY);
  const [quantity, setQuantity] = useState<number>(100);
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice);
  const [stopPrice, setStopPrice] = useState<number>(currentPrice * 0.95);
  const [timeInForce, setTimeInForce] = useState<TimeInForce>(TimeInForce.DAY);
  const [notes, setNotes] = useState<string>('');
  
  // Advanced order fields
  const [trailAmount, setTrailAmount] = useState<number>(0);
  const [trailPercent, setTrailPercent] = useState<number>(0);
  const [profitTargetPrice, setProfitTargetPrice] = useState<number>(currentPrice * 1.1);
  const [stopLossPrice, setStopLossPrice] = useState<number>(currentPrice * 0.9);
  
  // Conditional triggers
  const [conditionalTriggers, setConditionalTriggers] = useState<ConditionalTrigger[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (currentPrice > 0) {
      setLimitPrice(currentPrice);
      setStopPrice(currentPrice * 0.95);
      setProfitTargetPrice(currentPrice * 1.1);
      setStopLossPrice(currentPrice * 0.9);
    }
  }, [currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const orderData = {
        portfolioId,
        symbol,
        orderType,
        side,
        quantity,
        limitPrice: orderType === OrderType.LIMIT || orderType === OrderType.STOP_LIMIT ? limitPrice : undefined,
        stopPrice: orderType === OrderType.STOP_LOSS || orderType === OrderType.STOP_LIMIT || orderType === OrderType.TRAILING_STOP ? stopPrice : undefined,
        timeInForce,
        notes: notes || undefined,
        trailAmount: orderType === OrderType.TRAILING_STOP ? trailAmount : undefined,
        trailPercent: orderType === OrderType.TRAILING_STOP ? trailPercent : undefined,
        profitTargetPrice: orderType === OrderType.BRACKET ? profitTargetPrice : undefined,
        stopLossPrice: orderType === OrderType.BRACKET ? stopLossPrice : undefined,
        conditionalTriggers: conditionalTriggers.length > 0 ? conditionalTriggers : undefined,
      };

      let result;
      
      switch (orderType) {
        case OrderType.BRACKET:
          result = await orderManagementStore.createBracketOrder({
            portfolioId,
            symbol,
            side,
            quantity,
            entryPrice: limitPrice,
            stopLossPrice,
            profitTargetPrice,
          });
          break;
        case OrderType.OCO:
          result = await orderManagementStore.createOCOOrder({
            portfolioId,
            symbol,
            quantity,
            limitPrice,
            stopPrice,
          });
          break;
        case OrderType.TRAILING_STOP:
          result = await orderManagementStore.createTrailingStopOrder({
            portfolioId,
            symbol,
            quantity,
            trailAmount: trailAmount > 0 ? trailAmount : undefined,
            trailPercent: trailPercent > 0 ? trailPercent : undefined,
          });
          break;
        default:
          if (conditionalTriggers.length > 0) {
            result = await orderManagementStore.createConditionalOrder(orderData, conditionalTriggers);
          } else {
            result = await orderManagementStore.createOrder(orderData);
          }
          break;
      }

      if (result && onOrderSubmitted) {
        const orderId = typeof result === 'object' && 'id' in result ? result.id : 
                      typeof result === 'object' && 'entryOrder' in result ? result.entryOrder.id : 0;
        onOrderSubmitted(orderId);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit order');
    } finally {
      setIsLoading(false);
    }
  };

  const addConditionalTrigger = () => {
    const newTrigger: ConditionalTrigger = {
      id: `trigger_${Date.now()}`,
      type: 'price',
      condition: 'greater_than',
      value: currentPrice,
      field: 'price',
    };
    setConditionalTriggers([...conditionalTriggers, newTrigger]);
  };

  const removeConditionalTrigger = (id: string) => {
    setConditionalTriggers(conditionalTriggers.filter(t => t.id !== id));
  };

  const updateConditionalTrigger = (id: string, updates: Partial<ConditionalTrigger>) => {
    setConditionalTriggers(conditionalTriggers.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const estimatedCost = side === OrderSide.BUY ? quantity * (limitPrice || currentPrice) : 0;
  const estimatedProceeds = side === OrderSide.SELL ? quantity * (limitPrice || currentPrice) : 0;

  return (
    <div className="order-entry">
      <div className="order-entry-header">
        <h3>Place Order - {symbol}</h3>
        {currentPrice > 0 && (
          <div className="current-price">
            Current Price: ${currentPrice.toFixed(2)}
          </div>
        )}
        {onClose && (
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Basic Order Fields */}
        <div className="form-row">
          <div className="form-group">
            <label>Order Type</label>
            <select 
              value={orderType} 
              onChange={(e) => setOrderType(e.target.value as OrderType)}
              className="form-control"
            >
              <option value={OrderType.MARKET}>Market</option>
              <option value={OrderType.LIMIT}>Limit</option>
              <option value={OrderType.STOP_LOSS}>Stop Loss</option>
              <option value={OrderType.STOP_LIMIT}>Stop Limit</option>
              <option value={OrderType.TRAILING_STOP}>Trailing Stop</option>
              <option value={OrderType.BRACKET}>Bracket Order</option>
              <option value={OrderType.OCO}>OCO Order</option>
            </select>
          </div>

          <div className="form-group">
            <label>Side</label>
            <div className="side-buttons">
              <button
                type="button"
                className={`side-button buy ${side === OrderSide.BUY ? 'active' : ''}`}
                onClick={() => setSide(OrderSide.BUY)}
              >
                BUY
              </button>
              <button
                type="button"
                className={`side-button sell ${side === OrderSide.SELL ? 'active' : ''}`}
                onClick={() => setSide(OrderSide.SELL)}
              >
                SELL
              </button>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="form-control"
              required
            />
          </div>

          {(orderType === OrderType.LIMIT || orderType === OrderType.STOP_LIMIT || orderType === OrderType.BRACKET) && (
            <div className="form-group">
              <label>Limit Price</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(Number(e.target.value))}
                step="0.01"
                min="0"
                className="form-control"
                required
              />
            </div>
          )}

          {(orderType === OrderType.STOP_LOSS || orderType === OrderType.STOP_LIMIT || orderType === OrderType.TRAILING_STOP || orderType === OrderType.OCO) && (
            <div className="form-group">
              <label>Stop Price</label>
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(Number(e.target.value))}
                step="0.01"
                min="0"
                className="form-control"
                required
              />
            </div>
          )}
        </div>

        {/* Trailing Stop Specific Fields */}
        {orderType === OrderType.TRAILING_STOP && (
          <div className="form-row">
            <div className="form-group">
              <label>Trail Amount ($)</label>
              <input
                type="number"
                value={trailAmount}
                onChange={(e) => setTrailAmount(Number(e.target.value))}
                step="0.01"
                min="0"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Trail Percent (%)</label>
              <input
                type="number"
                value={trailPercent}
                onChange={(e) => setTrailPercent(Number(e.target.value))}
                step="0.1"
                min="0"
                max="100"
                className="form-control"
              />
            </div>
          </div>
        )}

        {/* Bracket Order Specific Fields */}
        {orderType === OrderType.BRACKET && (
          <div className="bracket-order-fields">
            <div className="form-row">
              <div className="form-group">
                <label>Profit Target Price</label>
                <input
                  type="number"
                  value={profitTargetPrice}
                  onChange={(e) => setProfitTargetPrice(Number(e.target.value))}
                  step="0.01"
                  min="0"
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stop Loss Price</label>
                <input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(Number(e.target.value))}
                  step="0.01"
                  min="0"
                  className="form-control"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Time in Force</label>
            <select 
              value={timeInForce} 
              onChange={(e) => setTimeInForce(e.target.value as TimeInForce)}
              className="form-control"
            >
              <option value={TimeInForce.DAY}>Day</option>
              <option value={TimeInForce.GTC}>Good Till Cancelled</option>
              <option value={TimeInForce.IOC}>Immediate or Cancel</option>
              <option value={TimeInForce.FOK}>Fill or Kill</option>
            </select>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="advanced-section">
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="advanced-options">
              {/* Conditional Triggers */}
              <div className="conditional-triggers">
                <div className="section-header">
                  <h4>Conditional Triggers</h4>
                  <button type="button" onClick={addConditionalTrigger} className="add-trigger-btn">
                    Add Trigger
                  </button>
                </div>
                
                {conditionalTriggers.map((trigger, index) => (
                  <div key={trigger.id} className="trigger-row">
                    <select
                      value={trigger.type}
                      onChange={(e) => updateConditionalTrigger(trigger.id, { type: e.target.value as any })}
                      className="form-control-sm"
                    >
                      <option value="price">Price</option>
                      <option value="volume">Volume</option>
                      <option value="time">Time</option>
                      <option value="indicator">Indicator</option>
                    </select>
                    
                    <select
                      value={trigger.condition}
                      onChange={(e) => updateConditionalTrigger(trigger.id, { condition: e.target.value as any })}
                      className="form-control-sm"
                    >
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="equals">Equals</option>
                      <option value="between">Between</option>
                    </select>
                    
                    <input
                      type="number"
                      value={trigger.value}
                      onChange={(e) => updateConditionalTrigger(trigger.id, { value: Number(e.target.value) })}
                      className="form-control-sm"
                      placeholder="Value"
                    />
                    
                    {index > 0 && (
                      <select
                        value={trigger.logicalOperator || 'AND'}
                        onChange={(e) => updateConditionalTrigger(trigger.id, { logicalOperator: e.target.value as any })}
                        className="form-control-sm"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeConditionalTrigger(trigger.id)}
                      className="remove-trigger-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-control"
                  placeholder="Optional order notes..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h4>Order Summary</h4>
          <div className="summary-row">
            <span>Order Type:</span>
            <span>{orderType.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="summary-row">
            <span>Side:</span>
            <span className={side}>{side.toUpperCase()}</span>
          </div>
          <div className="summary-row">
            <span>Quantity:</span>
            <span>{quantity} shares</span>
          </div>
          {estimatedCost > 0 && (
            <div className="summary-row">
              <span>Estimated Cost:</span>
              <span>${estimatedCost.toFixed(2)}</span>
            </div>
          )}
          {estimatedProceeds > 0 && (
            <div className="summary-row">
              <span>Estimated Proceeds:</span>
              <span>${estimatedProceeds.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            className={`submit-button ${side}`}
          >
            {isLoading ? 'Submitting...' : `${side.toUpperCase()} ${quantity} ${symbol}`}
          </button>
        </div>
      </form>
    </div>
  );
});

export default OrderEntry;