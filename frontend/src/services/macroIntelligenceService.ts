import { FRONTEND_API_CONFIG } from "../config/api.config";
import { apiStore } from "../stores/ApiStore";

const API_BASE_URL = FRONTEND_API_CONFIG.backend.baseUrl;

export interface EconomicIndicator {
  indicator: string;
  value: number;
  previousValue: number;
  forecast: number;
  impact: "low" | "medium" | "high";
  trend: "rising" | "falling" | "stable";
}

export interface EconomicAnalysis {
  country: string;
  overallHealth: number;
  indicators: EconomicIndicator[];
  trends: {
    gdpGrowth: number;
    inflation: number;
    unemployment: number;
    productivity: number;
  };
  risks: string[];
  opportunities: string[];
  outlook: "positive" | "neutral" | "negative";
  confidence: number;
  timestamp: Date;
}

export interface MonetaryPolicyAnalysis {
  centralBank: string;
  currentStance: "dovish" | "neutral" | "hawkish";
  rateExpectations: {
    nextMeeting: number;
    sixMonth: number;
    oneYear: number;
  };
  qeProbability: number;
  policyConsistency: number;
  marketImpact: {
    equities: "positive" | "neutral" | "negative";
    bonds: "positive" | "neutral" | "negative";
    currency: "positive" | "neutral" | "negative";
  };
}

export interface GeopoliticalRisk {
  region: string;
  overallRisk: number;
  politicalStability: number;
  conflictRisk: number;
  tradeRisk: number;
  sanctions: boolean;
  marketImpact: "low" | "medium" | "high";
  keyEvents: string[];
}

export interface MacroDashboardData {
  country: string;
  economic: any;
  recession: any;
  political: any;
  businessCycle: any;
  timestamp: Date;
}

export interface GlobalOverviewData {
  majorEconomies: Array<{
    country: string;
    economic: any;
    recession: any;
    stability: any;
  }>;
  globalRisks: string[];
  opportunities: string[];
  timestamp: Date;
}

class MacroIntelligenceService {
  /**
   * Get comprehensive economic analysis for a country
   */
  async getEconomicAnalysis(country: string): Promise<EconomicAnalysis> {
    const response = await apiStore.get<EconomicAnalysis>(
      `/api/macro-intelligence/economic/analysis/${country}`
    );
    return response;
  }

  /**
   * Get inflation forecast for a region
   */
  async getInflationForecast(region: string, timeframe: string = "1Y") {
    const response = await apiStore.get(
      `/api/macro-intelligence/inflation-forecast?region=${region}&timeframe=${timeframe}`
    );
    return response;
  }

  /**
   * Get GDP growth forecast for a country
   */
  async getGDPForecast(country: string) {
    const response = await apiStore.get(
      `/api/macro-intelligence/gdp-forecast?country=${country}`
    );
    return response;
  }

  /**
   * Get recession probability for a country
   */
  async getRecessionProbability(country: string) {
    const response = await apiStore.get(
      `/api/macro-intelligence/recession-probability?country=${country}`
    );
    return response;
  }

  /**
   * Get QE probability assessment for a central bank
   */
  async getQEProbability(centralBank: string) {
    const response = await apiStore.get(
      `/api/macro-intelligence/monetary-policy/qe-assessment?centralBank=${centralBank}`
    );
    return response;
  }

  /**
   * Get political stability score for a country
   */
  async getPoliticalStability(country: string) {
    const response = await apiStore.get(
      `/api/macro-intelligence/geopolitical/political-stability?country=${country}`
    );
    return response;
  }

  /**
   * Get diplomatic tension analysis for a region
   */
  async getDiplomaticTensions(region: string) {
    const response = await apiStore.get(
      `/api/macro-intelligence/geopolitical/diplomatic-tensions?region=${region}`
    );
    return response;
  }

  /**
   * Get comprehensive macro dashboard data for a country
   */
  async getMacroDashboard(country: string): Promise<MacroDashboardData> {
    const response = await apiStore.get<MacroDashboardData>(
      `/api/macro-intelligence/comprehensive-analysis?country=${country}`
    );
    return response;
  }

  /**
   * Get global macroeconomic overview
   */
  async getGlobalOverview(): Promise<GlobalOverviewData> {
    const response = await apiStore.get<GlobalOverviewData>(
      `/api/macro-intelligence/comprehensive-analysis?country=GLOBAL`
    );
    return response;
  }

  /**
   * Get system health and status
   */
  async getSystemHealth() {
    const response = await apiStore.get(
      `/api/macro-intelligence/comprehensive-analysis?country=US`
    );
    return response;
  }

  /**
   * Get combined economic, monetary, and geopolitical data for dashboard
   * This method aggregates multiple API calls for a comprehensive view
   */
  async getDashboardData(country: string): Promise<{
    economic: EconomicAnalysis;
    monetary: MonetaryPolicyAnalysis;
    geopolitical: GeopoliticalRisk[];
  }> {
    try {
      // Get macro dashboard data first
      const dashboardData = await this.getMacroDashboard(country);

      // Transform backend data to frontend interfaces
      const economic: EconomicAnalysis = {
        country: dashboardData.country,
        overallHealth: dashboardData.economic?.overallHealth || 75,
        indicators: dashboardData.economic?.indicators || [],
        trends: dashboardData.economic?.trends || {
          gdpGrowth: 0,
          inflation: 0,
          unemployment: 0,
          productivity: 0,
        },
        risks: dashboardData.economic?.risks || [],
        opportunities: dashboardData.economic?.opportunities || [],
        outlook: dashboardData.economic?.outlook || "neutral",
        confidence: dashboardData.economic?.confidence || 70,
        timestamp: new Date(dashboardData.timestamp),
      };

      // Create mock monetary policy data (can be replaced with real API when available)
      const monetary: MonetaryPolicyAnalysis = {
        centralBank:
          country === "US" ? "Federal Reserve" : `${country} Central Bank`,
        currentStance: "neutral",
        rateExpectations: {
          nextMeeting: 5.25,
          sixMonth: 5.0,
          oneYear: 4.5,
        },
        qeProbability: 15,
        policyConsistency: 87,
        marketImpact: {
          equities: "neutral",
          bonds: "positive",
          currency: "neutral",
        },
      };

      // Create mock geopolitical data (can be replaced with real API when available)
      const geopolitical: GeopoliticalRisk[] = [
        {
          region: "Europe",
          overallRisk: 65,
          politicalStability: dashboardData.political?.score || 72,
          conflictRisk: 58,
          tradeRisk: 45,
          sanctions: true,
          marketImpact: "medium",
          keyEvents: ["Ukraine conflict", "Energy crisis", "Election cycles"],
        },
        {
          region: "Asia-Pacific",
          overallRisk: 55,
          politicalStability: 68,
          conflictRisk: 42,
          tradeRisk: 38,
          sanctions: false,
          marketImpact: "low",
          keyEvents: ["Trade negotiations", "Supply chain shifts"],
        },
      ];

      return { economic, monetary, geopolitical };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  }
}

export const macroIntelligenceService = new MacroIntelligenceService();
export default macroIntelligenceService;
