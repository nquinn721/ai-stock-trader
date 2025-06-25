import { makeAutoObservable, runInAction } from "mobx";
import { apiStore } from "./ApiStore";

export interface Recommendation {
  id: string;
  symbol: string;
  type: "buy" | "sell" | "hold";
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  reasoning: string;
  createdAt: string;
  expiresAt: string;
  source: "ai" | "analyst" | "algorithm";
  riskLevel: "low" | "medium" | "high";
  timeHorizon: "short" | "medium" | "long";
  expectedReturn: number;
  stopLoss?: number;
  takeProfit?: number;
  tags: string[];
}

export interface RecommendationFilter {
  symbols?: string[];
  types?: ("buy" | "sell" | "hold")[];
  sources?: ("ai" | "analyst" | "algorithm")[];
  riskLevels?: ("low" | "medium" | "high")[];
  timeHorizons?: ("short" | "medium" | "long")[];
  minConfidence?: number;
  maxAge?: number; // hours
}

export class RecommendationStore {
  recommendations: Recommendation[] = [];
  filteredRecommendations: Recommendation[] = [];
  activeFilter: RecommendationFilter = {};
  isLoading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Fetch all recommendations
  async fetchRecommendations(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const recommendations = await apiStore.get<Recommendation[]>("/recommendations");

      runInAction(() => {
        this.recommendations = recommendations;
        this.applyFilter();
        this.lastUpdated = new Date();
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Failed to fetch recommendations";
        this.isLoading = false;
      });
    }
  }

  // Fetch recommendations for a specific symbol
  async fetchRecommendationsForSymbol(symbol: string): Promise<Recommendation[]> {
    try {
      const recommendations = await apiStore.get<Recommendation[]>(`/recommendations/symbol/${symbol}`);
      
      runInAction(() => {
        // Update existing recommendations for this symbol
        this.recommendations = this.recommendations.filter(r => r.symbol !== symbol).concat(recommendations);
        this.applyFilter();
        this.lastUpdated = new Date();
      });

      return recommendations;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : `Failed to fetch recommendations for ${symbol}`;
      });
      return [];
    }
  }

  // Create a new recommendation
  async createRecommendation(recommendation: Omit<Recommendation, "id" | "createdAt">): Promise<Recommendation | null> {
    try {
      const newRecommendation = await apiStore.post<Recommendation>("/recommendations", recommendation);

      runInAction(() => {
        this.recommendations = [newRecommendation, ...this.recommendations];
        this.applyFilter();
        this.lastUpdated = new Date();
      });

      return newRecommendation;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Failed to create recommendation";
      });
      return null;
    }
  }

  // Update an existing recommendation
  async updateRecommendation(id: string, updates: Partial<Recommendation>): Promise<boolean> {
    try {
      const updatedRecommendation = await apiStore.put<Recommendation>(`/recommendations/${id}`, updates);

      runInAction(() => {
        const index = this.recommendations.findIndex(r => r.id === id);
        if (index !== -1) {
          this.recommendations[index] = updatedRecommendation;
          this.applyFilter();
          this.lastUpdated = new Date();
        }
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Failed to update recommendation";
      });
      return false;
    }
  }

  // Delete a recommendation
  async deleteRecommendation(id: string): Promise<boolean> {
    try {
      await apiStore.delete(`/recommendations/${id}`);

      runInAction(() => {
        this.recommendations = this.recommendations.filter(r => r.id !== id);
        this.applyFilter();
        this.lastUpdated = new Date();
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Failed to delete recommendation";
      });
      return false;
    }
  }

  // Apply filters to recommendations
  applyFilter(filter?: RecommendationFilter): void {
    const activeFilter = filter || this.activeFilter;
    this.activeFilter = activeFilter;

    let filtered = [...this.recommendations];

    // Filter by symbols
    if (activeFilter.symbols && activeFilter.symbols.length > 0) {
      filtered = filtered.filter(r => activeFilter.symbols!.includes(r.symbol));
    }

    // Filter by types
    if (activeFilter.types && activeFilter.types.length > 0) {
      filtered = filtered.filter(r => activeFilter.types!.includes(r.type));
    }

    // Filter by sources
    if (activeFilter.sources && activeFilter.sources.length > 0) {
      filtered = filtered.filter(r => activeFilter.sources!.includes(r.source));
    }

    // Filter by risk levels
    if (activeFilter.riskLevels && activeFilter.riskLevels.length > 0) {
      filtered = filtered.filter(r => activeFilter.riskLevels!.includes(r.riskLevel));
    }

    // Filter by time horizons
    if (activeFilter.timeHorizons && activeFilter.timeHorizons.length > 0) {
      filtered = filtered.filter(r => activeFilter.timeHorizons!.includes(r.timeHorizon));
    }

    // Filter by minimum confidence
    if (activeFilter.minConfidence !== undefined) {
      filtered = filtered.filter(r => r.confidence >= activeFilter.minConfidence!);
    }

    // Filter by max age
    if (activeFilter.maxAge !== undefined) {
      const maxAgeMs = activeFilter.maxAge * 60 * 60 * 1000; // Convert hours to ms
      const cutoffTime = new Date(Date.now() - maxAgeMs);
      filtered = filtered.filter(r => new Date(r.createdAt) >= cutoffTime);
    }

    // Sort by confidence and creation date
    filtered.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    runInAction(() => {
      this.filteredRecommendations = filtered;
    });
  }

  // Clear filters
  clearFilters(): void {
    this.applyFilter({});
  }

  // Get recommendations by symbol
  getRecommendationsForSymbol(symbol: string): Recommendation[] {
    return this.filteredRecommendations.filter(r => r.symbol === symbol);
  }

  // Get top recommendations
  getTopRecommendations(limit: number = 10): Recommendation[] {
    return this.filteredRecommendations.slice(0, limit);
  }

  // Get recommendations by type
  getRecommendationsByType(type: "buy" | "sell" | "hold"): Recommendation[] {
    return this.filteredRecommendations.filter(r => r.type === type);
  }

  // Check if recommendations are expired
  getActiveRecommendations(): Recommendation[] {
    const now = new Date();
    return this.filteredRecommendations.filter(r => new Date(r.expiresAt) > now);
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const total = this.recommendations.length;
    const byType = {
      buy: this.recommendations.filter(r => r.type === "buy").length,
      sell: this.recommendations.filter(r => r.type === "sell").length,
      hold: this.recommendations.filter(r => r.type === "hold").length,
    };
    const byRisk = {
      low: this.recommendations.filter(r => r.riskLevel === "low").length,
      medium: this.recommendations.filter(r => r.riskLevel === "medium").length,
      high: this.recommendations.filter(r => r.riskLevel === "high").length,
    };
    const avgConfidence = total > 0 
      ? this.recommendations.reduce((sum, r) => sum + r.confidence, 0) / total
      : 0;

    return {
      total,
      byType,
      byRisk,
      avgConfidence,
      activeCount: this.getActiveRecommendations().length,
      expiredCount: total - this.getActiveRecommendations().length,
    };
  }

  // Clear error
  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }

  // Refresh recommendations
  async refresh(): Promise<void> {
    await this.fetchRecommendations();
  }
}

export const recommendationStore = new RecommendationStore();