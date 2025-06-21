import axios, { AxiosResponse } from "axios";
import { makeAutoObservable, runInAction } from "mobx";

export interface ApiConfig {
  baseURL: string;
  timeout: number;
}

export class ApiStore {
  private config: ApiConfig = {
    baseURL: "http://localhost:8000",
    timeout: 10000,
  };

  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.setupAxiosInterceptors();
  }

  private setupAxiosInterceptors() {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        runInAction(() => {
          this.isLoading = true;
          this.error = null;
        });
        return config;
      },
      (error) => {
        runInAction(() => {
          this.isLoading = false;
          this.error = error.message;
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response) => {
        runInAction(() => {
          this.isLoading = false;
        });
        return response;
      },
      (error) => {
        runInAction(() => {
          this.isLoading = false;
          this.error = error.response?.data?.message || error.message;
        });
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(
        `${this.config.baseURL}${url}`,
        { timeout: this.config.timeout }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.post(
        `${this.config.baseURL}${url}`,
        data,
        { timeout: this.config.timeout }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.put(
        `${this.config.baseURL}${url}`,
        data,
        { timeout: this.config.timeout }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.delete(
        `${this.config.baseURL}${url}`,
        { timeout: this.config.timeout }
      );
      return response.data;
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
