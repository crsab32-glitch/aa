import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DriverForm } from './components/DriverForm';
import { VehicleForm } from './components/VehicleForm';
import { DetranBase } from './components/DetranBase';
import { FineForm } from './components/FineForm';
import { FinesList } from './components/FinesList';
import { FinesSearch } from './components/FinesSearch';
import { LoginForm } from './components/LoginForm';
import { AppView, User } from './types';
import { getCurrentUser, logout } from './services/storageService';
import { LogOut, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('drivers');
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const activeUser = getCurrentUser();
    setUser(activeUser);
    setIsReady(true);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'drivers': return <DriverForm />;
      case 'vehicles': return <VehicleForm />;
      case 'detran': return <DetranBase />;
      case 'fines_entry': return <FineForm />;
      case 'fines_list': return <FinesList />;
      case 'fines_search': return <FinesSearch />;
      default: return <DriverForm />;
    }
  };

  if (!isReady) return null;

  if (!user) {
    return <LoginForm onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 ml-64 flex flex-col h-screen">
        {/* Top Header */}
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center no-print">
          <h2 className="text-slate-500 font-medium">Bem-vindo, <span className="text-slate-900 font-bold">{user.name}</span></h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-sm">
              <UserIcon size={16} />
              <span>Admin</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition flex items-center gap-2"
              title="Sair do Sistema"
            >
              <LogOut size={20} />
              <span className="text-sm font-bold uppercase">Sair</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto pb-12">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
