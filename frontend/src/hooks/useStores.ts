import { useContext } from 'react';
import { StoreContext } from '../stores/StoreContext';

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return context;
};
