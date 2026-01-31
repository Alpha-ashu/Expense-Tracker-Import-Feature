import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/lib/database';
import { Plus, Wallet, CreditCard, Banknote, Smartphone, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const Accounts: React.FC = () => {
  const { accounts, currency } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleDeleteAccount = async (id: number) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await db.accounts.delete(id);
      toast.success('Account deleted successfully');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    await db.accounts.update(id, { isActive: !isActive });
    toast.success(`Account ${!isActive ? 'activated' : 'deactivated'}`);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Wallet className="text-blue-500" size={24} />;
      case 'card':
        return <CreditCard className="text-purple-500" size={24} />;
      case 'cash':
        return <Banknote className="text-green-500" size={24} />;
      case 'wallet':
        return <Smartphone className="text-orange-500" size={24} />;
      default:
        return <Wallet className="text-gray-500" size={24} />;
    }
  };

  const totalBalance = accounts.filter(a => a.isActive).reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts & Wallets</h2>
          <p className="text-gray-500 mt-1">Manage your payment sources</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      <div className="bg-blue-600 p-6 rounded-xl text-white">
        <p className="text-sm opacity-90">Total Balance</p>
        <p className="text-4xl font-bold mt-2">{formatCurrency(totalBalance)}</p>
        <p className="text-sm opacity-90 mt-2">{accounts.filter(a => a.isActive).length} active accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <div
            key={account.id}
            className={`bg-white p-6 rounded-xl border-2 transition-all ${
              account.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                {getAccountIcon(account.type)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(account.id!, account.isActive)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={account.isActive ? 'Deactivate' : 'Activate'}
                >
                  {account.isActive ? (
                    <Eye size={16} className="text-gray-600" />
                  ) : (
                    <EyeOff size={16} className="text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => setEditingAccount(account.id!)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteAccount(account.id!)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{account.name}</h3>
            <p className="text-sm text-gray-500 capitalize mb-3">{account.type}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
          <Wallet className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts yet</h3>
          <p className="text-gray-500 mb-4">Add your first account to start tracking your finances</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Account
          </button>
        </div>
      )}

      {showAddModal && (
        <AddAccountModal
          onClose={() => setShowAddModal(false)}
          currency={currency}
        />
      )}

      {editingAccount && (
        <EditAccountModal
          accountId={editingAccount}
          onClose={() => setEditingAccount(null)}
          currency={currency}
        />
      )}
    </div>
  );
};

interface AddAccountModalProps {
  onClose: () => void;
  currency: string;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, currency }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as 'bank' | 'card' | 'cash' | 'wallet',
    balance: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.accounts.add({
        ...formData,
        currency,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('Account added successfully');
      onClose();
    } catch (error) {
      console.error('Failed to add account:', error);
      toast.error('Failed to add account');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Add New Account</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Chase Checking"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank">Bank Account</option>
              <option value="card">Credit/Debit Card</option>
              <option value="cash">Cash</option>
              <option value="wallet">Digital Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
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
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditAccountModalProps {
  accountId: number;
  onClose: () => void;
  currency: string;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ accountId, onClose, currency }) => {
  const [account, setAccount] = useState<any>(null);

  React.useEffect(() => {
    db.accounts.get(accountId).then(setAccount);
  }, [accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.accounts.update(accountId, {
      name: account.name,
      type: account.type,
      balance: account.balance,
    });
    toast.success('Account updated successfully');
    onClose();
  };

  if (!account) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Edit Account</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={account.name}
              onChange={(e) => setAccount({ ...account, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              value={account.type}
              onChange={(e) => setAccount({ ...account, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank">Bank Account</option>
              <option value="card">Credit/Debit Card</option>
              <option value="cash">Cash</option>
              <option value="wallet">Digital Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={account.balance}
              onChange={(e) => setAccount({ ...account, balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};