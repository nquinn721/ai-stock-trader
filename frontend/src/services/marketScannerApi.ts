import { FRONTEND_API_CONFIG } from "../config/api.config";
import { apiStore } from "../stores/ApiStore";
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
  async scanMarket(criteria: ScanCriteria): Promise<ApiResponse<ScanMatch[]>> {
    const response = await apiStore.post<ApiResponse<ScanMatch[]>>(
      "/api/market-scanner/scan",
      criteria
    );
    return response;
  }

  async scanWithPreset(
    templateId: number
  ): Promise<ApiResponse<ScanMatch[]> & { template: ScreenerTemplate }> {
    const response = await apiStore.get<
      ApiResponse<ScanMatch[]> & { template: ScreenerTemplate }
    >(`/api/market-scanner/scan/preset/${templateId}`);
    return response;
  }

  async getTemplates(
    isPublic?: boolean
  ): Promise<ApiResponse<ScreenerTemplate[]>> {
    let endpoint = `/api/market-scanner/templates`;
    if (isPublic !== undefined) {
      endpoint += `?public=${isPublic.toString()}`;
    }
    const response =
      await apiStore.get<ApiResponse<ScreenerTemplate[]>>(endpoint);
    return response;
  }

  async getPresetTemplates(): Promise<ApiResponse<ScreenerTemplate[]>> {
    const response = await apiStore.get<ApiResponse<ScreenerTemplate[]>>(
      `/api/market-scanner/templates/presets`
    );
    return response;
  }

  async createTemplate(
    template: Partial<ScreenerTemplate>
  ): Promise<ApiResponse<ScreenerTemplate>> {
    const response = await apiStore.post<ApiResponse<ScreenerTemplate>>(
      `/api/market-scanner/templates`,
      template
    );
    return response;
  }

  async updateTemplate(
    id: number,
    template: Partial<ScreenerTemplate>
  ): Promise<ApiResponse<ScreenerTemplate>> {
    const response = await apiStore.put<ApiResponse<ScreenerTemplate>>(
      `/api/market-scanner/templates/${id}`,
      template
    );
    return response;
  }

  async deleteTemplate(id: number): Promise<ApiResponse<void>> {
    const response = await apiStore.delete<ApiResponse<void>>(
      `/api/market-scanner/templates/${id}`
    );
    return response;
  }

  async getUserAlerts(userId: number): Promise<ApiResponse<MarketAlert[]>> {
    const response = await apiStore.get<ApiResponse<MarketAlert[]>>(
      `/api/market-scanner/alerts/user/${userId}`
    );
    return response;
  }

  async createAlert(
    alert: Partial<MarketAlert>
  ): Promise<ApiResponse<MarketAlert>> {
    const response = await apiStore.post<ApiResponse<MarketAlert>>(
      `/api/market-scanner/alerts`,
      alert
    );
    return response;
  }

  async updateAlert(
    id: number,
    alert: Partial<MarketAlert>
  ): Promise<ApiResponse<MarketAlert>> {
    const response = await apiStore.put<ApiResponse<MarketAlert>>(
      `/api/market-scanner/alerts/${id}`,
      alert
    );
    return response;
  }

  async deleteAlert(id: number): Promise<ApiResponse<void>> {
    const response = await apiStore.delete<ApiResponse<void>>(
      `/api/market-scanner/alerts/${id}`
    );
    return response;
  }

  async backtestScreener(
    request: BacktestRequest
  ): Promise<ApiResponse<BacktestResult>> {
    const response = await apiStore.post<ApiResponse<BacktestResult>>(
      `/api/market-scanner/backtest`,
      request
    );
    return response;
  }

  async exportResults(criteria: ScanCriteria): Promise<ApiResponse<string>> {
    const response = await apiStore.post<ApiResponse<string>>(
      `/api/market-scanner/export`,
      criteria
    );
    return response;
  }

  async getStatus(): Promise<
    ApiResponse<{
      isScanning: boolean;
      lastScanTime: Date | null;
      activeAlerts: number;
      availableTemplates: number;
    }>
  > {
    const response = await apiStore.get<
      ApiResponse<{
        isScanning: boolean;
        lastScanTime: Date | null;
        activeAlerts: number;
        availableTemplates: number;
      }>
    >(`/api/market-scanner/status`);
    return response;
  }
}

export const marketScannerApi = new MarketScannerApi();
