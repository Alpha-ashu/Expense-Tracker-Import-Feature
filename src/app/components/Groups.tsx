import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/lib/database';
import { Plus, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export const Groups: React.FC = () => {
  const { groupExpenses, accounts, currency } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

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
          <h2 className="text-2xl font-bold text-gray-900">Group Expenses</h2>
          <p className="text-gray-500 mt-1">Split bills fairly with friends</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Group Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groupExpenses.map(expense => {
          const totalPaid = expense.members.filter(m => m.paid).reduce((sum, m) => sum + m.share, 0);
          const totalUnpaid = expense.totalAmount - totalPaid;

          return (
            <div key={expense.id} className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{expense.name}</h3>
                  <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(expense.totalAmount)}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Payment Progress</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totalPaid)} / {formatCurrency(expense.totalAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(totalPaid / expense.totalAmount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Members & Shares</p>
                {expense.members.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        member.paid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.paid ? 'Paid' : 'Pending'}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(member.share)}</p>
                  </div>
                ))}
              </div>

              {expense.items && expense.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                  {expense.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {groupExpenses.length === 0 && (
        <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No group expenses yet</h3>
          <p className="text-gray-500 mb-4">Start splitting bills with friends</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Group Expense
          </button>
        </div>
      )}

      {showAddModal && <AddGroupExpenseModal accounts={accounts} onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

const AddGroupExpenseModal: React.FC<{ accounts: any[]; onClose: () => void }> = ({ accounts, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: 0,
    paidBy: accounts[0]?.id || 0,
    date: new Date().toISOString().split('T')[0],
    splitType: 'equal' as 'equal' | 'custom',
  });
  const [members, setMembers] = useState([{ name: '', share: 0 }]);

  const handleAddMember = () => {
    setMembers([...members, { name: '', share: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const membersWithShares = formData.splitType === 'equal'
      ? members.map(m => ({ ...m, share: formData.totalAmount / members.length, paid: false }))
      : members.map(m => ({ ...m, paid: false }));

    await db.groupExpenses.add({
      ...formData,
      date: new Date(formData.date),
      members: membersWithShares,
      createdAt: new Date(),
    });

    const account = accounts.find(a => a.id === formData.paidBy);
    if (account) {
      await db.accounts.update(formData.paidBy, {
        balance: account.balance - formData.totalAmount,
      });
    }

    toast.success('Group expense added successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Add Group Expense</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Dinner, Trip, Movie"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.totalAmount || ''}
                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
              <select
                value={formData.paidBy}
                onChange={(e) => setFormData({ ...formData, paidBy: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Split Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitType: 'equal' })}
                className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                  formData.splitType === 'equal'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                Equal Split
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitType: 'custom' })}
                className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                  formData.splitType === 'custom'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                Custom Split
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Members</label>
              <button
                type="button"
                onClick={handleAddMember}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Member
              </button>
            </div>
            <div className="space-y-2">
              {members.map((member, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => {
                      const newMembers = [...members];
                      newMembers[idx].name = e.target.value;
                      setMembers(newMembers);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Member name"
                    required
                  />
                  {formData.splitType === 'custom' && (
                    <input
                      type="number"
                      step="0.01"
                      value={member.share || ''}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[idx].share = parseFloat(e.target.value) || 0;
                        setMembers(newMembers);
                      }}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Amount"
                      required
                    />
                  )}
                </div>
              ))}
            </div>
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
              Create Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
