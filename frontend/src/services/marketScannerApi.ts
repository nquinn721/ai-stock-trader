import axios from "axios";
import { FRONTEND_API_CONFIG } from "../config/api.config";
import {
  ApiResponse,
  BacktestRequest,
  BacktestResult,
  MarketAlert,
  ScanCriteria,
  ScanMatch,
  ScreenerTemplate,
} from "../types/marketScanner";

const API_BASE_URL = FRONTEND_API_CONFIG.backend.baseUrl;

class MarketScannerApi {
  private baseURL = `${API_BASE_URL}/market-scanner`;

  async scanMarket(criteria: ScanCriteria): Promise<ApiResponse<ScanMatch[]>> {
    const response = await axios.post(`${this.baseURL}/scan`, criteria);
    return response.data;
  }

  async scanWithPreset(
    templateId: number
  ): Promise<ApiResponse<ScanMatch[]> & { template: ScreenerTemplate }> {
    const response = await axios.get(
      `${this.baseURL}/scan/preset/${templateId}`
    );
    return response.data;
  }

  async getTemplates(
    isPublic?: boolean
  ): Promise<ApiResponse<ScreenerTemplate[]>> {
    const params =
      isPublic !== undefined ? { public: isPublic.toString() } : {};
    const response = await axios.get(`${this.baseURL}/templates`, { params });
    return response.data;
  }

  async getPresetTemplates(): Promise<ApiResponse<ScreenerTemplate[]>> {
    const response = await axios.get(`${this.baseURL}/templates/presets`);
    return response.data;
  }

  async createTemplate(
    template: Partial<ScreenerTemplate>
  ): Promise<ApiResponse<ScreenerTemplate>> {
    const response = await axios.post(`${this.baseURL}/templates`, template);
    return response.data;
  }

  async updateTemplate(
    id: number,
    template: Partial<ScreenerTemplate>
  ): Promise<ApiResponse<ScreenerTemplate>> {
    const response = await axios.put(
      `${this.baseURL}/templates/${id}`,
      template
    );
    return response.data;
  }

  async deleteTemplate(id: number): Promise<ApiResponse<void>> {
    const response = await axios.delete(`${this.baseURL}/templates/${id}`);
    return response.data;
  }

  async getUserAlerts(userId: number): Promise<ApiResponse<MarketAlert[]>> {
    const response = await axios.get(`${this.baseURL}/alerts/user/${userId}`);
    return response.data;
  }

  async createAlert(
    alert: Partial<MarketAlert>
  ): Promise<ApiResponse<MarketAlert>> {
    const response = await axios.post(`${this.baseURL}/alerts`, alert);
    return response.data;
  }

  async updateAlert(
    id: number,
    alert: Partial<MarketAlert>
  ): Promise<ApiResponse<MarketAlert>> {
    const response = await axios.put(`${this.baseURL}/alerts/${id}`, alert);
    return response.data;
  }

  async deleteAlert(id: number): Promise<ApiResponse<void>> {
    const response = await axios.delete(`${this.baseURL}/alerts/${id}`);
    return response.data;
  }

  async backtestScreener(
    request: BacktestRequest
  ): Promise<ApiResponse<BacktestResult>> {
    const response = await axios.post(`${this.baseURL}/backtest`, request);
    return response.data;
  }

  async exportResults(criteria: ScanCriteria): Promise<ApiResponse<string>> {
    const response = await axios.post(`${this.baseURL}/export`, criteria);
    return response.data;
  }

  async getStatus(): Promise<
    ApiResponse<{
      isScanning: boolean;
      lastScanTime: Date | null;
      activeAlerts: number;
      availableTemplates: number;
    }>
  > {
    const response = await axios.get(`${this.baseURL}/status`);
    return response.data;
  }
}

export const marketScannerApi = new MarketScannerApi();
