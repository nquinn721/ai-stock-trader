import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { action, makeObservable, observable, runInAction } from "mobx";
import {
  FRONTEND_API_CONFIG,
  getFrontendHttpConfig,
} from "../config/api.config";

export class ApiStore {
  private axiosInstance: AxiosInstance;
  isLoading = false;
  error: string | null = null;

  constructor() {
    // Initialize axios instance first, before making observable
    this.axiosInstance = axios.create({
      baseURL: FRONTEND_API_CONFIG.backend.baseUrl,
      timeout: getFrontendHttpConfig().timeout,
    });

    // Make only specific properties observable
    makeObservable(this, {
      isLoading: observable,
      error: observable,
      clearError: action,
      setLoading: action,
    });

    this.setupAxiosInterceptors();
  }

  private setupAxiosInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        runInAction(() => {
          this.isLoading = true;
          this.error = null;
        });
        return config;
      },
      (error: any) => {
        runInAction(() => {
          this.isLoading = false;
          this.error = error.message;
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        runInAction(() => {
          this.isLoading = false;
        });
        return response;
      },
      (error: any) => {
        runInAction(() => {
          this.isLoading = false;
          this.error =
            error.response?.data?.message ||
            error.message ||
            "Unknown error occurred";
        });
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(url);
      // Ensure response exists before accessing data
      if (!response) {
        throw new Error("No response received from API");
      }
      // Handle cases where response.data might be undefined
      return response.data !== undefined ? response.data : ({} as T);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(
        url,
        data
      );
      // Ensure response exists before accessing data
      if (!response) {
        throw new Error("No response received from API");
      }
      // Handle cases where response.data might be undefined
      return response.data !== undefined ? response.data : ({} as T);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(
        url,
        data
      );
      // Ensure response exists before accessing data
      if (!response) {
        throw new Error("No response received from API");
      }
      // Handle cases where response.data might be undefined
      return response.data !== undefined ? response.data : ({} as T);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(url);
      // Ensure response exists before accessing data
      if (!response) {
        throw new Error("No response received from API");
      }
      // Handle cases where response.data might be undefined
      return response.data !== undefined ? response.data : ({} as T);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.patch(
        url,
        data
      );
      // Ensure response exists before accessing data
      if (!response) {
        throw new Error("No response received from API");
      }
      // Handle cases where response.data might be undefined
      return response.data !== undefined ? response.data : ({} as T);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: any) {
    console.error("API Error:", error);
    runInAction(() => {
      this.error =
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred";
    });
  }

  clearError() {
    this.error = null;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }
}

export const apiStore = new ApiStore();
