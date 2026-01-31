import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Account, Transaction, Loan, Goal, Investment, GroupExpense, Friend } from '@/lib/database';

interface AppContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  accounts: Account[];
  friends: Friend[];
  transactions: Transaction[];
  loans: Loan[];
  goals: Goal[];
  investments: Investment[];
  groupExpenses: GroupExpense[];
  totalBalance: number;
  currency: string;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currency] = useState('USD');

  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const friends = useLiveQuery(() => db.friends.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []) || [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const investments = useLiveQuery(() => db.investments.toArray(), []) || [];
  const groupExpenses = useLiveQuery(() => db.groupExpenses.toArray(), []) || [];

  const totalBalance = accounts
    .filter(acc => acc.isActive)
    .reduce((sum, acc) => sum + acc.balance, 0);

  const refreshData = () => {
    // Force re-query
    db.accounts.toArray();
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        accounts,
        friends,
        transactions,
        loans,
        goals,
        investments,
        groupExpenses,
        totalBalance,
        currency,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};