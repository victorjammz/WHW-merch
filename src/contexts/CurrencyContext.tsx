import { createContext, useContext, ReactNode } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';

interface CurrencyContextType {
  currency: string;
  formatPrice: (price: number) => string;
  getCurrencySymbol: (currency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$'
};

const CURRENCY_NAMES: Record<string, string> = {
  GBP: 'British Pound',
  EUR: 'Euro',
  USD: 'US Dollar'
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { settings } = useUserSettings();
  const currency = settings?.currency || 'GBP';

  const getCurrencySymbol = (currencyCode: string): string => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  };

  const formatPrice = (price: number): string => {
    const symbol = getCurrencySymbol(currency);
    
    // Format based on currency preferences
    switch (currency) {
      case 'EUR':
        return `${symbol}${price.toFixed(2)}`;
      case 'GBP':
        return `${symbol}${price.toFixed(2)}`;
      case 'USD':
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