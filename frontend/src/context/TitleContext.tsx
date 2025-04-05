import React, { createContext, useState, useContext, ReactNode } from 'react';

type TitleContextType = {
  title: string;
  setTitle: (title: string) => void;
};

const defaultTitle = 'eStore';

export const TitleContext = createContext<TitleContextType>({
  title: defaultTitle,
  setTitle: () => {},
});

export const TitleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState<string>(defaultTitle);

  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {children}
    </TitleContext.Provider>
  );
};

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error('useTitle must be used within a TitleProvider');
  }
  return context;
};
