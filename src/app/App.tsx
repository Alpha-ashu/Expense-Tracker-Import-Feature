import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { SecurityProvider, useSecurity } from '@/contexts/SecurityContext';
import { PINAuth } from '@/app/components/PINAuth';
import { Sidebar } from '@/app/components/Sidebar';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { QuickActionModal } from '@/app/components/QuickActionModal';
import { PWAInstallPrompt } from '@/app/components/PWAInstallPrompt';
import { Dashboard } from '@/app/components/Dashboard';
import { Accounts } from '@/app/components/Accounts';
import { Transactions } from '@/app/components/Transactions';
import { Loans } from '@/app/components/Loans';
import { Goals } from '@/app/components/Goals';
import { Groups } from '@/app/components/Groups';
import { Investments } from '@/app/components/Investments';
import { Reports } from '@/app/components/Reports';
import { Settings } from '@/app/components/Settings';
import { Toaster } from 'sonner';
import { initializeDemoData } from '@/lib/demoData';
import { initializeNotifications } from '@/lib/notifications';
import { registerServiceWorker, setupPWAInstallPrompt, setupNetworkListener } from '@/lib/pwa';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const AppContent: React.FC = () => {
  const { currentPage, setCurrentPage } = useApp();
  const { isAuthenticated, setAuthenticated } = useSecurity();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showQuickAction, setShowQuickAction] = useState(false);

  useEffect(() => {
    // Initialize app data
    Promise.all([
      initializeDemoData(),
      initializeNotifications(),
    ]).then(() => setIsInitialized(true));

    // Setup Capacitor plugins for native platforms
    if (Capacitor.isNativePlatform()) {
      setupNativeFeatures();
    }

    // Handle URL parameters for quick actions
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'add-expense') {
      setShowQuickAction(true);
    }

    // Register service worker and setup PWA features
    registerServiceWorker();
    setupPWAInstallPrompt();
    
    // Setup network listener
    const cleanupNetwork = setupNetworkListener(
      () => toast.success('Back online!'),
      () => toast.warning('You are offline. Data will sync when reconnected.')
    );

    return () => {
      cleanupNetwork();
    };
  }, []);

  const setupNativeFeatures = async () => {
    try {
      // Set status bar style
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#2563eb' });

      // Handle back button on Android
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });

      // Handle app state changes
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('App is active');
        }
      });
    } catch (error) {
      console.error('Error setting up native features:', error);
    }
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    // Handle different quick actions
    switch (action) {
      case 'add-expense':
      case 'add-income':
        setCurrentPage('transactions');
        break;
      case 'pay-emi':
        setCurrentPage('loans');
        break;
      case 'split-bill':
        setCurrentPage('groups');
        break;
      case 'add-goal':
        setCurrentPage('goals');
        break;
      case 'voice-entry':
        // TODO: Show voice input modal
        break;
      case 'scan-bill':
        setCurrentPage('transactions');
        break;
      default:
        break;
    }
  };

  // Show PIN authentication if not authenticated
  if (!isAuthenticated) {
    return <PINAuth onAuthenticated={setAuthenticated} />;
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading FinanceLife...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return <Transactions />;
      case 'loans':
        return <Loans />;
      case 'goals':
        return <Goals />;
      case 'groups':
        return <Groups />;
      case 'investments':
        return <Investments />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden mobile-container">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-0">
          {renderPage()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onQuickAdd={() => setShowQuickAction(true)} />

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={showQuickAction}
        onClose={() => setShowQuickAction(false)}
        onAction={handleQuickAction}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SecurityProvider>
      <AppProvider>
        <AppContent />
        <Toaster position="top-center" richColors closeButton />
      </AppProvider>
    </SecurityProvider>
  );
};

export default App;