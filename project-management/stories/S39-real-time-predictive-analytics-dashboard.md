# S39 - Real-Time Predictive Analytics Dashboard

**Epic**: E28 - Automated Trading & AI Enhancement
**Priority**: High
**Story Points**: 13
**Status**: TODO
**Assigned**: Full Stack Team
**Sprint**: 11

## 📝 Story Description

Build an advanced real-time predictive analytics dashboard with ML prediction overlays on charts and live market insights for perfect trade timing. This dashboard will provide traders with cutting-edge AI-powered predictions directly integrated into their charting interface, enabling precise entry and exit timing.

## 🎯 Business Value

- **Perfect Timing**: ML prediction overlays help traders time entries and exits with precision
- **Real-time Intelligence**: Live sentiment and regime detection provide immediate market context
- **Competitive Edge**: Advanced predictive visualizations differentiate from standard charting tools
- **Reduced Risk**: Confidence intervals and probability metrics help manage trading risk
- **Increased Success Rate**: Multi-timeframe predictions improve trading accuracy

## 📋 Acceptance Criteria

### ✅ ML Prediction Overlays
- [ ] Display ML predictions for next 1H, 4H, and 1D timeframes on price charts
- [ ] Show confidence intervals as shaded regions around predictions
- [ ] Color-code predictions by confidence level (high=green, medium=yellow, low=red)
- [ ] Include breakout probability indicators on chart
- [ ] Update predictions in real-time as new data arrives

### ✅ Real-time Sentiment Integration
- [ ] Live sentiment analysis feed from news and social media
- [ ] Sentiment score overlay on charts with historical tracking
- [ ] News event markers on timeline showing impact on sentiment
- [ ] Multi-source sentiment aggregation (news, social, analyst reports)
- [ ] Real-time sentiment alerts for significant changes

### ✅ Market Regime Detection
- [ ] Real-time bull/bear/sideways market regime identification
- [ ] Visual regime indicators on charts and dashboard
- [ ] Regime transition alerts and notifications
- [ ] Historical regime overlay for context
- [ ] Regime-specific trading recommendations

### ✅ Predictive Risk Analytics
- [ ] Real-time volatility predictions with confidence bands
- [ ] Drawdown probability estimates
- [ ] Support/resistance level predictions
- [ ] Price target probability distributions
- [ ] Risk-adjusted position sizing recommendations

### ✅ Multi-timeframe Analysis
- [ ] Simultaneous predictions across multiple timeframes
- [ ] Timeframe alignment indicators (all bullish/bearish/mixed)
- [ ] Cross-timeframe confirmation signals
- [ ] Intraday vs. daily trend comparison
- [ ] Scalping opportunity identification

## 🔧 Technical Implementation

### Backend Enhancements

```typescript
// PredictiveAnalyticsService
@Injectable()
export class PredictiveAnalyticsService {
  async getRealTimePredictions(symbol: string): Promise<PredictionData> {
    const [predictions, sentiment, regime] = await Promise.all([
      this.marketPredictionService.getMultiTimeframePredictions(symbol),
      this.sentimentAnalysisService.getLiveSentiment(symbol),
      this.marketRegimeService.getCurrentRegime(symbol)
    ]);

    return {
      symbol,
      timestamp: new Date(),
      predictions: {
        oneHour: predictions.oneHour,
        fourHour: predictions.fourHour,
        oneDay: predictions.oneDay
      },
      sentiment,
      regime,
      riskMetrics: await this.calculateRiskMetrics(symbol)
    };
  }

  async streamPredictions(symbol: string): Promise<Observable<PredictionUpdate>> {
    return interval(30000).pipe( // Update every 30 seconds
      switchMap(() => this.getRealTimePredictions(symbol)),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      )
    );
  }
}

// Enhanced WebSocket for streaming predictions
@WebSocketGateway()
export class PredictiveAnalyticsGateway {
  @SubscribeMessage('subscribe-predictions')
  handlePredictionSubscription(
    @MessageBody() data: { symbol: string },
    @ConnectedSocket() client: Socket
  ) {
    this.predictiveAnalyticsService
      .streamPredictions(data.symbol)
      .subscribe(prediction => {
        client.emit('prediction-update', prediction);
      });
  }
}
```

### Frontend Components

```tsx
// PredictiveChart Component
const PredictiveChart: React.FC<{symbol: string}> = ({ symbol }) => {
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  useEffect(() => {
    const socket = io();
    
    socket.emit('subscribe-predictions', { symbol });
    socket.on('prediction-update', (data: PredictionData) => {
      setPredictions(data);
      updateChartOverlays(data);
    });

    return () => socket.disconnect();
  }, [symbol]);

  const updateChartOverlays = (data: PredictionData) => {
    // Add prediction overlays to chart
    const overlays = [
      createPredictionLine(data.predictions.oneHour, '1H', '#00ff00'),
      createPredictionLine(data.predictions.fourHour, '4H', '#ffff00'),
      createPredictionLine(data.predictions.oneDay, '1D', '#ff6600'),
      createConfidenceRegion(data.predictions),
      createSentimentOverlay(data.sentiment)
    ];
    
    setChartData(prev => [...prev, ...overlays]);
  };

  return (
    <div className="predictive-chart-container">
      <TradingViewChart 
        symbol={symbol}
        overlays={chartData}
        predictions={predictions}
      />
      <PredictionPanel predictions={predictions} />
      <SentimentPanel sentiment={predictions?.sentiment} />
      <RegimeIndicator regime={predictions?.regime} />
    </div>
  );
};

// Multi-timeframe Prediction Panel
const PredictionPanel: React.FC<{predictions: PredictionData}> = ({ predictions }) => {
  if (!predictions) return <div>Loading predictions...</div>;

  return (
    <div className="prediction-panel">
      <h3>AI Predictions</h3>
      {Object.entries(predictions.predictions).map(([timeframe, pred]) => (
        <div key={timeframe} className="prediction-row">
          <span className="timeframe">{timeframe.toUpperCase()}</span>
          <span className={`direction ${pred.direction}`}>
            {pred.direction === 'bullish' ? '↗️' : pred.direction === 'bearish' ? '↘️' : '→'}
          </span>
          <span className="target-price">${pred.targetPrice.toFixed(2)}</span>
          <span className="confidence">
            {(pred.confidence * 100).toFixed(0)}%
          </span>
          <span className="probability">
            {(pred.probability * 100).toFixed(0)}% prob
          </span>
        </div>
      ))}
    </div>
  );
};

// Real-time Sentiment Display
const SentimentPanel: React.FC<{sentiment: SentimentData}> = ({ sentiment }) => {
  const getSentimentColor = (score: number) => {
    if (score > 0.5) return '#00ff00';
    if (score < -0.5) return '#ff0000';
    return '#ffff00';
  };

  return (
    <div className="sentiment-panel">
      <h4>Live Sentiment</h4>
      <div className="sentiment-score" style={{color: getSentimentColor(sentiment?.score || 0)}}>
        {sentiment?.score?.toFixed(2) || 'N/A'}
      </div>
      <div className="sentiment-sources">
        <span>News: {sentiment?.news?.score?.toFixed(2)}</span>
        <span>Social: {sentiment?.social?.score?.toFixed(2)}</span>
        <span>Analyst: {sentiment?.analyst?.score?.toFixed(2)}</span>
      </div>
      <div className="recent-events">
        {sentiment?.recentEvents?.map(event => (
          <div key={event.id} className="sentiment-event">
            <span className="event-time">{event.timestamp}</span>
            <span className="event-impact">{event.impact}</span>
            <span className="event-text">{event.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Integration with Existing ML Services

```typescript
// Enhanced MarketPredictionService integration
interface MultiTimeframePrediction {
  oneHour: {
    direction: 'bullish' | 'bearish' | 'neutral';
    targetPrice: number;
    confidence: number;
    probability: number;
    timeHorizon: Date;
  };
  fourHour: Similar;
  oneDay: Similar;
}

// Integration points:
// - MarketPredictionService (S29A)
// - SentimentAnalysisService (S28A) 
// - EnsembleSystemsService (S29D)
// - PatternRecognitionService (S28C)
```

## 🧪 Testing Implementation

```typescript
// Unit Tests
describe('PredictiveAnalyticsService', () => {
  it('should generate multi-timeframe predictions', async () => {
    const predictions = await service.getRealTimePredictions('AAPL');
    
    expect(predictions.predictions.oneHour).toBeDefined();
    expect(predictions.predictions.fourHour).toBeDefined();
    expect(predictions.predictions.oneDay).toBeDefined();
    expect(predictions.sentiment).toBeDefined();
    expect(predictions.regime).toBeDefined();
  });

  it('should stream prediction updates', async () => {
    const stream = await service.streamPredictions('AAPL');
    const updates = [];
    
    stream.pipe(take(3)).subscribe(update => updates.push(update));
    
    await new Promise(resolve => setTimeout(resolve, 100000));
    expect(updates.length).toBe(3);
  });
});

// Integration Tests
describe('Predictive Dashboard Integration', () => {
  it('should update chart overlays with new predictions', async () => {
    render(<PredictiveChart symbol="AAPL" />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Predictions')).toBeInTheDocument();
      expect(screen.getByText('Live Sentiment')).toBeInTheDocument();
    });
  });
});

// E2E Tests
describe('Real-time Predictions', () => {
  it('should display live predictions on chart', async () => {
    await page.goto('/dashboard');
    await page.click('[data-testid="stock-AAPL"]');
    await page.click('[data-testid="predictive-mode"]');
    
    await expect(page.locator('[data-testid="prediction-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="sentiment-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="regime-indicator"]')).toBeVisible();
  });
});
```

## 🚀 Implementation Plan

### Phase 1: Core Prediction Infrastructure (Week 1)
- Enhance WebSocket infrastructure for ML streaming
- Integrate multi-timeframe predictions
- Build prediction data aggregation service

### Phase 2: Chart Integration (Week 1-2)
- Implement prediction overlays on charts
- Add confidence interval visualizations
- Create real-time chart updates

### Phase 3: Sentiment & Regime Detection (Week 2)
- Integrate live sentiment analysis
- Add market regime detection
- Implement real-time alerts

### Phase 4: Advanced Analytics (Week 2-3)
- Add risk metrics and probability distributions
- Implement multi-timeframe alignment
- Create advanced prediction panels

### Phase 5: Testing & Optimization (Week 3)
- Performance optimization for real-time updates
- Comprehensive testing suite
- User experience refinements

---

*This story transforms standard charting into an AI-powered predictive analytics platform, providing traders with unprecedented market intelligence and timing precision.*