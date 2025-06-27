import { HybridSignal } from "../types";

export interface TraditionalSignal {
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  indicators: {
    rsi: number;
    macd: number;
    bollingerBands: number;
    movingAverage: number;
  };
  reasoning: string[];
  timestamp: string;
  price: number;
}

export interface AISignal {
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  modelType: "dqn" | "ppo" | "lstm" | "ensemble";
  features: {
    technicalScore: number;
    sentimentScore: number;
    volumeScore: number;
    momentumScore: number;
  };
  reasoning: string[];
  timestamp: string;
  price: number;
}

export interface HybridSignalConfig {
  traditionalWeight: number; // 0-1
  aiWeight: number; // 0-1
  confidenceThreshold: number; // minimum confidence to generate signal
  divergenceThreshold: number; // max allowed difference between signals
  enableDisagreementAlert: boolean;
}

class HybridSignalService {
  private config: HybridSignalConfig = {
    traditionalWeight: 0.4,
    aiWeight: 0.6,
    confidenceThreshold: 0.65,
    divergenceThreshold: 0.3,
    enableDisagreementAlert: true,
  };

  updateConfig(newConfig: Partial<HybridSignalConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  generateHybridSignal(
    traditional: TraditionalSignal,
    ai: AISignal
  ): HybridSignal | null {
    // Validate inputs
    if (traditional.symbol !== ai.symbol) {
      console.error("Symbol mismatch between traditional and AI signals");
      return null;
    }

    // Calculate weighted confidence
    const weightedConfidence =
      traditional.confidence * this.config.traditionalWeight +
      ai.confidence * this.config.aiWeight;

    // Check if confidence meets threshold
    if (weightedConfidence < this.config.confidenceThreshold) {
      return null;
    }

    // Detect signal divergence
    const hasDivergence = this.detectDivergence(traditional, ai);

    if (hasDivergence && this.config.enableDisagreementAlert) {
      console.warn(`Signal divergence detected for ${traditional.symbol}`);
    }

    // Determine final action
    const finalAction = this.determineAction(
      traditional,
      ai,
      weightedConfidence
    );

    // Combine reasoning
    const combinedReasoning = [
      ...traditional.reasoning.map((r) => `Traditional: ${r}`),
      ...ai.reasoning.map((r) => `AI: ${r}`),
    ];

    if (hasDivergence) {
      combinedReasoning.push(
        "⚠️ Traditional and AI signals diverge - proceeding with weighted decision"
      );
    }

    return {
      source: "combined",
      action: finalAction,
      confidence: weightedConfidence,
      reasoning: combinedReasoning,
      weight: 1.0, // Full weight for combined signal
      timestamp: new Date().toISOString(),
      symbol: traditional.symbol,
      price: traditional.price,
    };
  }

  private detectDivergence(
    traditional: TraditionalSignal,
    ai: AISignal
  ): boolean {
    // Different actions indicate divergence
    if (traditional.action !== ai.action) {
      return true;
    }

    // Significant confidence difference
    const confidenceDiff = Math.abs(traditional.confidence - ai.confidence);
    return confidenceDiff > this.config.divergenceThreshold;
  }

  private determineAction(
    traditional: TraditionalSignal,
    ai: AISignal,
    weightedConfidence: number
  ): "buy" | "sell" | "hold" {
    // If both agree, use their action
    if (traditional.action === ai.action) {
      return traditional.action;
    }

    // If they disagree, use the one with higher confidence
    // unless it's a hold signal, then use the more decisive one
    if (traditional.action === "hold" && ai.action !== "hold") {
      return ai.confidence > 0.7 ? ai.action : "hold";
    }

    if (ai.action === "hold" && traditional.action !== "hold") {
      return traditional.confidence > 0.7 ? traditional.action : "hold";
    }

    // Both have decisive actions but disagree - use higher confidence
    return traditional.confidence > ai.confidence
      ? traditional.action
      : ai.action;
  }

  // Generate signals for portfolio optimization
  generatePortfolioSignals(
    traditionalSignals: TraditionalSignal[],
    aiSignals: AISignal[]
  ): HybridSignal[] {
    const hybridSignals: HybridSignal[] = [];

    // Match signals by symbol
    for (const traditional of traditionalSignals) {
      const matchingAI = aiSignals.find(
        (ai) => ai.symbol === traditional.symbol
      );

      if (matchingAI) {
        const hybrid = this.generateHybridSignal(traditional, matchingAI);
        if (hybrid) {
          hybridSignals.push(hybrid);
        }
      } else {
        // Only traditional signal available
        if (traditional.confidence > this.config.confidenceThreshold) {
          hybridSignals.push({
            source: "human",
            action: traditional.action,
            confidence: traditional.confidence * this.config.traditionalWeight,
            reasoning: traditional.reasoning,
            weight: this.config.traditionalWeight,
            timestamp: traditional.timestamp,
            symbol: traditional.symbol,
            price: traditional.price,
          });
        }
      }
    }

    // Handle AI signals without traditional counterparts
    for (const ai of aiSignals) {
      const hasTraditional = traditionalSignals.some(
        (t) => t.symbol === ai.symbol
      );

      if (!hasTraditional && ai.confidence > this.config.confidenceThreshold) {
        hybridSignals.push({
          source: "ai",
          action: ai.action,
          confidence: ai.confidence * this.config.aiWeight,
          reasoning: ai.reasoning,
          weight: this.config.aiWeight,
          timestamp: ai.timestamp,
          symbol: ai.symbol,
          price: ai.price,
        });
      }
    }

    return hybridSignals.sort((a, b) => b.confidence - a.confidence);
  }

  // Score signals for decision making
  scoreSignal(signal: HybridSignal): number {
    let score = signal.confidence * signal.weight;

    // Bonus for combined signals
    if (signal.source === "combined") {
      score *= 1.1;
    }

    // Penalty for low confidence
    if (signal.confidence < 0.7) {
      score *= 0.9;
    }

    return Math.min(score, 1.0);
  }

  // Get configuration for UI display
  getConfig(): HybridSignalConfig {
    return { ...this.config };
  }
}

export const hybridSignalService = new HybridSignalService();
