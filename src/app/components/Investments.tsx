import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/lib/database';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

export const Investments: React.FC = () => {
  const { investments, currency } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const portfolioStats = useMemo(() => {
    const totalInvested = investments.reduce((sum, i) => sum + i.totalInvested, 0);
    const currentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    const assetAllocation = investments.reduce((acc: any, inv) => {
      if (!acc[inv.assetType]) {
        acc[inv.assetType] = 0;
      }
      acc[inv.assetType] += inv.currentValue;
      return acc;
    }, {});

    const chartData = Object.entries(assetAllocation).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    return { totalInvested, currentValue, profitLoss, profitLossPercent, chartData };
  }, [investments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investments</h2>
          <p className="text-gray-500 mt-1">Track your investment portfolio</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Investment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600 p-6 rounded-xl text-white">
          <p className="text-sm opacity-90 mb-2">Total Invested</p>
          <p className="text-3xl font-bold">{formatCurrency(portfolioStats.totalInvested)}</p>
        </div>
        <div className="bg-blue-600 p-6 rounded-xl text-white">
          <p className="text-sm opacity-90 mb-2">Current Value</p>
          <p className="text-3xl font-bold">{formatCurrency(portfolioStats.currentValue)}</p>
        </div>
        <div className={`${portfolioStats.profitLoss >= 0 ? 'bg-green-600' : 'bg-red-600'} p-6 rounded-xl text-white`}>
          <p className="text-sm opacity-90 mb-2">Profit/Loss</p>
          <p className="text-3xl font-bold">
            {portfolioStats.profitLoss >= 0 ? '+' : ''}{formatCurrency(portfolioStats.profitLoss)}
          </p>
          <p className="text-sm opacity-90 mt-1">
            {portfolioStats.profitLoss >= 0 ? '+' : ''}{portfolioStats.profitLossPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={portfolioStats.chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {portfolioStats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
            <div className="space-y-3">
              {[...investments]
                .sort((a, b) => ((b.profitLoss / b.totalInvested) - (a.profitLoss / a.totalInvested)))
                .slice(0, 5)
                .map(inv => {
                  const plPercent = (inv.profitLoss / inv.totalInvested) * 100;
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{inv.assetName}</p>
                        <p className="text-sm text-gray-500 capitalize">{inv.assetType}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${inv.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {inv.profitLoss >= 0 ? '+' : ''}{formatCurrency(inv.profitLoss)}
                        </p>
                        <p className={`text-sm ${inv.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {investments.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{inv.assetName}</div>
                    <div className="text-sm text-gray-500">{new Date(inv.purchaseDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 capitalize">
                      {inv.assetType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {inv.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(inv.buyPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(inv.currentPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(inv.currentValue)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${
                    inv.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className="flex items-center justify-end gap-1">
                      {inv.profitLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {inv.profitLoss >= 0 ? '+' : ''}{formatCurrency(inv.profitLoss)}
                    </div>
                    <div className="text-xs">
                      {inv.profitLoss >= 0 ? '+' : ''}{((inv.profitLoss / inv.totalInvested) * 100).toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {investments.length === 0 && (
          <div className="p-12 text-center">
            <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No investments yet</h3>
            <p className="text-gray-500 mb-4">Start tracking your investment portfolio</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Investment
            </button>
          </div>
        )}
      </div>

      {showAddModal && <AddInvestmentModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

const AddInvestmentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    assetType: 'stock' as 'stock' | 'crypto' | 'forex' | 'gold' | 'silver' | 'other',
    assetName: '',
    quantity: 0,
    buyPrice: 0,
    currentPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalInvested = formData.quantity * formData.buyPrice;
    const currentValue = formData.quantity * formData.currentPrice;
    const profitLoss = currentValue - totalInvested;

    await db.investments.add({
      ...formData,
      totalInvested,
      currentValue,
      profitLoss,
      purchaseDate: new Date(formData.purchaseDate),
      lastUpdated: new Date(),
    });

    toast.success('Investment added successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Add Investment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
            <select
              value={formData.assetType}
              onChange={(e) => setFormData({ ...formData, assetType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="stock">Stock</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="forex">Forex</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
            <input
              type="text"
              value={formData.assetName}
              onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., AAPL, Bitcoin, Gold Bar"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.buyPrice || ''}
                onChange={(e) => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.currentPrice || ''}
              onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              Total Investment: <span className="font-semibold">${(formData.quantity * formData.buyPrice).toFixed(2)}</span>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Current Value: <span className="font-semibold">${(formData.quantity * formData.currentPrice).toFixed(2)}</span>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};