import React, { useState } from 'react';
import { db } from '@/lib/database';
import { Download, Upload, Trash2, Database, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

export const Settings: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExportData = async () => {
    try {
      const data = {
        accounts: await db.accounts.toArray(),
        transactions: await db.transactions.toArray(),
        loans: await db.loans.toArray(),
        goals: await db.goals.toArray(),
        investments: await db.investments.toArray(),
        groupExpenses: await db.groupExpenses.toArray(),
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financelife-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (confirm('This will replace all existing data. Are you sure?')) {
        await db.accounts.clear();
        await db.transactions.clear();
        await db.loans.clear();
        await db.goals.clear();
        await db.investments.clear();
        await db.groupExpenses.clear();

        if (data.accounts) await db.accounts.bulkAdd(data.accounts);
        if (data.transactions) await db.transactions.bulkAdd(data.transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date),
        })));
        if (data.loans) await db.loans.bulkAdd(data.loans.map((l: any) => ({
          ...l,
          dueDate: l.dueDate ? new Date(l.dueDate) : undefined,
          createdAt: new Date(l.createdAt),
        })));
        if (data.goals) await db.goals.bulkAdd(data.goals);
        if (data.investments) await db.investments.bulkAdd(data.investments);
        if (data.groupExpenses) await db.groupExpenses.bulkAdd(data.groupExpenses);

        toast.success('Data imported successfully');
        window.location.reload();
      }
    } catch (error) {
      toast.error('Import failed. Please check the file format.');
    }
  };

  const handleClearAllData = async () => {
    if (confirm('This will delete ALL your data. This action cannot be undone. Are you sure?')) {
      if (confirm('Are you ABSOLUTELY sure? This is your last warning!')) {
        await db.accounts.clear();
        await db.transactions.clear();
        await db.loans.clear();
        await db.goals.clear();
        await db.investments.clear();
        await db.groupExpenses.clear();
        await db.notifications.clear();
        
        toast.success('All data cleared');
        window.location.reload();
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">Manage your data and preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
          <p className="text-sm text-gray-500 mt-1">Import, export, and manage your financial data</p>
        </div>

        <div className="divide-y divide-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="text-blue-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Export Data</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Download all your data as a JSON file for backup
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Upload className="text-green-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Import JSON Data</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Restore your data from a previously exported JSON file
                  </p>
                </div>
              </div>
              <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="text-purple-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Import from Excel/CSV</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Import transactions from Excel or CSV files
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Import Excel/CSV
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="text-red-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Clear All Data</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Permanently delete all your data from this device
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About FinanceLife</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Storage:</strong> All data is stored locally on your device using IndexedDB</p>
          <p><strong>Privacy:</strong> Your financial data never leaves your device</p>
          <p><strong>Offline:</strong> Works completely offline, no internet required</p>
        </div>
      </div>

      {showImportModal && (
        <ImportExcelModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
};

const ImportExcelModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState({
    date: '',
    description: '',
    amount: '',
    category: '',
    type: 'expense',
  });
  const [accountId, setAccountId] = useState<number>(0);
  const [accounts, setAccounts] = useState<any[]>([]);

  React.useEffect(() => {
    db.accounts.toArray().then(setAccounts);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCsvData(results.data);
        toast.success(`Loaded ${results.data.length} rows`);
      },
      error: () => {
        toast.error('Failed to parse file');
      },
    });
  };

  const handleImport = async () => {
    if (!accountId) {
      toast.error('Please select an account');
      return;
    }

    try {
      const transactions = csvData
        .filter(row => row[mapping.amount] && row[mapping.description])
        .map(row => ({
          type: mapping.type,
          amount: Math.abs(parseFloat(row[mapping.amount])),
          accountId: accountId,
          category: row[mapping.category] || 'Other',
          description: row[mapping.description] || 'Imported transaction',
          date: row[mapping.date] ? new Date(row[mapping.date]) : new Date(),
          tags: ['imported'],
        }));

      await db.transactions.bulkAdd(transactions);

      const account = accounts.find(a => a.id === accountId);
      if (account) {
        const totalAmount = transactions.reduce((sum, t) => 
          sum + (t.type === 'expense' ? -t.amount : t.amount), 0
        );
        await db.accounts.update(accountId, {
          balance: account.balance + totalAmount,
        });
      }

      toast.success(`Imported ${transactions.length} transactions`);
      onClose();
    } catch (error) {
      toast.error('Import failed');
    }
  };

  const columns = csvData.length > 0 ? Object.keys(csvData[0]) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Import from Excel/CSV</h3>

        {csvData.length === 0 ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-4">Upload your Excel or CSV file</p>
              <label className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors">
                Choose File
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">Expected CSV Format:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Date column (any date format)</p>
                <p>• Description/Memo column</p>
                <p>• Amount column (numeric)</p>
                <p>• Category column (optional)</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 font-medium">✓ File loaded: {csvData.length} rows</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Import to Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMapping({ ...mapping, type: 'expense' })}
                  className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                    mapping.type === 'expense'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Expenses
                </button>
                <button
                  type="button"
                  onClick={() => setMapping({ ...mapping, type: 'income' })}
                  className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                    mapping.type === 'income'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Column</label>
                <select
                  value={mapping.date}
                  onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select column</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description Column</label>
                <select
                  value={mapping.description}
                  onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select column</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Column</label>
                <select
                  value={mapping.amount}
                  onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select column</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Column (Optional)</label>
                <select
                  value={mapping.category}
                  onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select column</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 3 rows):</p>
              <div className="space-y-1 text-xs">
                {csvData.slice(0, 3).map((row, idx) => (
                  <div key={idx} className="flex gap-2 text-gray-600">
                    <span>{row[mapping.date] || '-'}</span>
                    <span>|</span>
                    <span>{row[mapping.description] || '-'}</span>
                    <span>|</span>
                    <span>{row[mapping.amount] || '-'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setCsvData([]);
                  setMapping({ date: '', description: '', amount: '', category: '', type: 'expense' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleImport}
                disabled={!mapping.date || !mapping.description || !mapping.amount || !accountId}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Transactions
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
