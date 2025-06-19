import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Stock, TradingSignal, News } from '../types';

interface SocketContextType {
  socket: any;
  isConnected: boolean;
  stocks: Stock[];
  tradingSignals: TradingSignal[];
  news: News[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  stocks: [],
  tradingSignals: [],
  news: [],
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [news, setNews] = useState<News[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      newSocket.emit('subscribe_stocks');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('stock_updates', (data: Stock[]) => {
      setStocks(data);
    });

    newSocket.on('stock_update', ({ symbol, data }: { symbol: string; data: Stock }) => {
      setStocks(prev => 
        prev.map(stock => 
          stock.symbol === symbol ? { ...stock, ...data } : stock
        )
      );
    });

    newSocket.on('trading_signal', (signal: TradingSignal) => {
      setTradingSignals(prev => [signal, ...prev.slice(0, 9)]); // Keep last 10 signals
    });

    newSocket.on('news_update', (newsItem: News) => {
      setNews(prev => [newsItem, ...prev.slice(0, 19)]); // Keep last 20 news items
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    stocks,
    tradingSignals,
    news,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
