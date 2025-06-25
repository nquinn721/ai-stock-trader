export enum FilterType {
  PRICE = "price",
  VOLUME = "volume",
  MARKET_CAP = "market_cap",
  TECHNICAL = "technical",
  FUNDAMENTAL = "fundamental",
  PATTERN = "pattern",
}

export enum FilterOperator {
  GREATER_THAN = "gt",
  LESS_THAN = "lt",
  EQUALS = "eq",
  BETWEEN = "between",
  ABOVE = "above",
  BELOW = "below",
  CROSSES_ABOVE = "crosses_above",
  CROSSES_BELOW = "crosses_below",
}

export interface FilterCriteria {
  id: string;
  type: FilterType;
  field: string;
  operator: FilterOperator;
  value: number | string;
  value2?: number;
  logicalOperator?: "AND" | "OR";
}

export interface ScanCriteria {
  filters: FilterCriteria[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  includePreMarket?: boolean;
  includeAfterHours?: boolean;
}

export interface ScreenerTemplate {
  id: number;
  name: string;
  description?: string;
  category?: string;
  criteria: ScanCriteria;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanMatch {
  id: string;
  symbol: string;
  name: string;
  price: number;
  volume: number;
  marketCap?: number;
  matchStrength: number;
  criteriaMet: string[];
  timestamp: Date;
}

export interface MarketAlert {
  id: number;
  userId: number;
  name: string;
  criteria: ScanCriteria;
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  notificationMethod: "EMAIL" | "PUSH" | "SMS";
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanRequest extends ScanCriteria {
  saveAsTemplate?: boolean;
  templateName?: string;
}

export interface BacktestRequest {
  criteria: ScanCriteria;
  startDate: string;
  endDate: string;
}

export interface BacktestResult {
  success: boolean;
  totalMatches: number;
  avgMatchStrength: number;
  period: string;
  performanceMetrics: {
    totalReturns: number;
    avgReturn: number;
    winRate: number;
    maxDrawdown: number;
  };
  historicalMatches: {
    date: string;
    matches: number;
    avgReturn: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: Date;
}
