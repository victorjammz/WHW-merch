import { createContext, useContext, ReactNode } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';

interface CurrencyContextType {
  currency: string;
  formatPrice: (price: number) => string;
  getCurrencySymbol: (currency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹'
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  JPY: 'Japanese Yen', 
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee'
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { settings } = useUserSettings();
  const currency = settings?.currency || 'USD';

  const getCurrencySymbol = (currencyCode: string): string => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  };

  const formatPrice = (price: number): string => {
    const symbol = getCurrencySymbol(currency);
    
    // Format based on currency preferences
    switch (currency) {
      case 'EUR':
        return `${price.toFixed(2)}${symbol}`;
      case 'GBP':
        return `${symbol}${price.toFixed(2)}`;
      case 'USD':
      case 'CAD':
      case 'AUD':
        return `${symbol}${price.toFixed(2)}`;
      case 'JPY':
      case 'CNY':
        return `${symbol}${Math.round(price)}`;
      case 'INR':
        return `${symbol}${price.toFixed(2)}`;
      default:
        return `${symbol}${price.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        formatPrice,
        getCurrencySymbol
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export { CURRENCY_SYMBOLS, CURRENCY_NAMES };