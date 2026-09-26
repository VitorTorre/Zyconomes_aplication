import React from 'react';
import { FinanceTemplate } from './components/FinanceTemplate';
import { FinancialDataProvider } from './context/FinancialDataContext';

export function App() {
  return (
    <FinancialDataProvider>
      <FinanceTemplate />
    </FinancialDataProvider>
  );
}

export default App;
