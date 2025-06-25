import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { StoreProvider } from '../stores/StoreContext';
import { RootStore } from '../stores/RootStore';
import { NotificationProvider } from '../context/NotificationContext';
import { SocketProvider } from '../context/SocketContext';

// Mock FontAwesome icons
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => {
    const iconName = typeof icon === 'string' ? icon : 
                    typeof icon === 'object' && icon.iconName ? icon.iconName :
                    'mock-icon';
    return <i data-testid={`fa-icon-${iconName}`} {...props} />;
  },
}));

// Mock FontAwesome icons library
jest.mock('@fortawesome/free-solid-svg-icons', () => ({
  faChevronUp: { prefix: 'fas', iconName: 'chevron-up' },
  faChevronDown: { prefix: 'fas', iconName: 'chevron-down' },
  faSearch: { prefix: 'fas', iconName: 'search' },
  faArrowUp: { prefix: 'fas', iconName: 'arrow-up' },
  faArrowDown: { prefix: 'fas', iconName: 'arrow-down' },
  faBolt: { prefix: 'fas', iconName: 'bolt' },
  faCalculator: { prefix: 'fas', iconName: 'calculator' },
  faChartLine: { prefix: 'fas', iconName: 'chart-line' },
  faCogs: { prefix: 'fas', iconName: 'cogs' },
  faHashtag: { prefix: 'fas', iconName: 'hashtag' },
  faSpinner: { prefix: 'fas', iconName: 'spinner' },
  faWallet: { prefix: 'fas', iconName: 'wallet' },
  faZap: { prefix: 'fas', iconName: 'zap' },
}));

// Mock the NotificationContext
jest.mock('../context/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
  useNotification: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    preferences: [],
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAsDismissed: jest.fn(),
    bulkMarkAsRead: jest.fn(),
    bulkMarkAsDismissed: jest.fn(),
    updatePreferences: jest.fn(),
    clearNotifications: jest.fn(),
  }),
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    preferences: [],
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAsDismissed: jest.fn(),
    bulkMarkAsRead: jest.fn(),
    bulkMarkAsDismissed: jest.fn(),
    updatePreferences: jest.fn(),
    clearNotifications: jest.fn(),
  }),
}));

// Mock the SocketContext
jest.mock('../context/SocketContext', () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => children,
  useSocket: () => ({
    socket: null,
    isConnected: false,
    stocks: [],
    tradingSignals: [],
    news: [],
    portfolioUpdates: new Map(),
    allPortfolios: [],
    subscribeToPortfolio: jest.fn(),
    unsubscribeFromPortfolio: jest.fn(),
    requestAllPortfolios: jest.fn(),
    getPortfolioPerformance: jest.fn(),
    getPositionDetails: jest.fn(),
    getPortfolioAnalytics: jest.fn(),
    getSectorAllocation: jest.fn(),
    getPerformanceAttribution: jest.fn(),
    getRiskMetrics: jest.fn(),
    getBenchmarkComparison: jest.fn(),
    getRebalancingSuggestions: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getOrderBook: jest.fn(),
  }),
}));

// Mock the recommendation service
jest.mock('../services/recommendationService', () => ({
  __esModule: true,
  default: {
    getQuickRecommendation: jest.fn().mockResolvedValue({
      recommendation: 'HOLD',
      confidence: 0.75,
      reasoning: 'Market conditions are neutral'
    }),
  },
}));

// Mock axios specifically for API calls
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  }),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
}));

// Create a mock RootStore for testing
const createMockStore = (): RootStore => {
  const mockStore = new RootStore();
  
  // Ensure all stores are properly initialized
  mockStore.stockStore.stocks = mockStore.stockStore.stocks || [];
  mockStore.portfolioStore.portfolios = mockStore.portfolioStore.portfolios || [];
  
  // Mock the initializeDefaultPortfolio method if it doesn't exist
  if (!mockStore.portfolioStore.initializeDefaultPortfolio) {
    mockStore.portfolioStore.initializeDefaultPortfolio = jest.fn().mockResolvedValue(undefined);
  }
  
  // Mock stocksWithSignals if it doesn't exist
  if (!mockStore.stockStore.stocksWithSignals) {
    Object.defineProperty(mockStore.stockStore, 'stocksWithSignals', {
      get: () => mockStore.stockStore.stocks.map(stock => ({ ...stock, tradingSignal: null })),
      configurable: true
    });
  }
  
  return mockStore;
};

interface AllTheProvidersProps {
  children: React.ReactNode;
  store?: RootStore;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  store = createMockStore() 
}) => {
  return (
    <StoreProvider store={store}>
      <NotificationProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </NotificationProvider>
    </StoreProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { store?: RootStore }
) => {
  const { store, ...renderOptions } = options || {};
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders store={store}>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Legacy function for backward compatibility
export const renderWithStoreProvider = (ui: React.ReactElement, options = {}) => {
  return customRender(ui, options);
};


// Re-export everything
export * from '@testing-library/react';
export { customRender as render, createMockStore };
