import React from 'react';
import { FinanceTemplate } from './components/FinanceTemplate';
import { FinancialDataProvider } from './context/FinancialDataContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary fallbackTitle="Sistema Zyconomes — Recuperação Automática">
      <FinancialDataProvider>
        <FinanceTemplate />
      </FinancialDataProvider>
    </ErrorBoundary>
  );
}

export default App;
