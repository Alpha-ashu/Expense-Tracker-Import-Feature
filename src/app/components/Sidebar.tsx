import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CreditCard,
  Target,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  Calculator,
  ArrowRightLeft,
  CalendarDays,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'loans', label: 'Loans & EMIs', icon: CreditCard },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'groups', label: 'Group Expenses', icon: Users },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<{ onOpenTransfer?: () => void; onOpenTaxCalculator?: () => void }> = ({
  onOpenTransfer,
  onOpenTaxCalculator,
}) => {
  const { currentPage, setCurrentPage } = useApp();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">FinanceLife</h1>
        <p className="text-sm text-gray-500 mt-1">Your Financial OS</p>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-4">Quick Actions</p>
          <button
            onClick={onOpenTransfer}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowRightLeft size={20} />
            <span className="font-medium">Transfer Money</span>
          </button>
          <button
            onClick={onOpenTaxCalculator}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Calculator size={20} />
            <span className="font-medium">Calculate Tax</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-600 p-4 rounded-lg text-white">
          <p className="text-sm font-medium">Privacy First</p>
          <p className="text-xs mt-1">Your data stays on your device</p>
        </div>
      </div>
    </div>
  );
};