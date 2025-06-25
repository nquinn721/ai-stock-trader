import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { StoreProvider } from '../stores/StoreContext';
import { RootStore } from '../stores/RootStore';

// Mock FontAwesome icons
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => {
    const iconName = typeof icon === 'string' ? icon : 
                    typeof icon === 'object' && icon.iconName ? icon.iconName :
                    'mock-icon';
    return <i data-testid={`fa-icon-${iconName}`} {...props} />;
  },
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
    getRiskMetrics: jest.fn(),
    getBenchmarkComparison: jest.fn(),
    getPerformanceAttribution: jest.fn(),
    placeOrder: jest.fn(),
    executeOrder: jest.fn(),
    addToWatchlist: jest.fn(),
    removeFromWatchlist: jest.fn(),
  }),
}));

// Create a mock RootStore for testing
const createMockStore = (): RootStore => {
  const mockStore = new RootStore();
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
      {children}
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

// Mock FontAwesome icons
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => (
    <i data-testid={`fa-icon-${icon}`} {...props} />
  ),
}));

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, createMockStore };
