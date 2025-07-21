import React, { createContext, useContext, useState, useEffect } from 'react';

interface HelpContextType {
  isHelpEnabled: boolean;
  toggleHelp: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHelpEnabled, setIsHelpEnabled] = useState(() => {
    const saved = localStorage.getItem('help-enabled');
    return saved !== null ? JSON.parse(saved) : true; // Default to enabled
  });

  useEffect(() => {
    localStorage.setItem('help-enabled', JSON.stringify(isHelpEnabled));
  }, [isHelpEnabled]);

  const toggleHelp = () => {
    setIsHelpEnabled(prev => !prev);
  };

  return (
    <HelpContext.Provider value={{ isHelpEnabled, toggleHelp }}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};