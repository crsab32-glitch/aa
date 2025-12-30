
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DriverForm } from './components/DriverForm';
import { VehicleForm } from './components/VehicleForm';
import { DetranBase } from './components/DetranBase';
import { FineForm } from './components/FineForm';
import { FinesList } from './components/FinesList';
import { FinesSearch } from './components/FinesSearch';
import { LoginForm } from './components/LoginForm';
import { AppView, User, Driver } from './types';
import { getCurrentUser, logout, getDrivers } from './services/storageService';
// Added CheckCircle to imports to fix "Cannot find name 'CheckCircle'" error
import { LogOut, User as UserIcon, Bell, AlertCircle, AlertTriangle, X, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('drivers');
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<Driver[]>([]);

  const checkAlerts = () => {
    const drivers = getDrivers();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueOrNear = drivers.filter(d => {
      if (!d.validityDate) return false;
      const expiry = new Date(d.validityDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30; // Vencidos ou vencendo em 30 dias
    });
    setAlerts(overdueOrNear);
  };

  useEffect(() => {
    const activeUser = getCurrentUser();
    setUser(activeUser);
    setIsReady(true);
    if (activeUser) checkAlerts();
  }, []);

  // Recalcular alertas quando a view mudar (pode ter havido novos cadastros)
  useEffect(() => {
    if (user) checkAlerts();
  }, [currentView]);

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
      
      <main className="flex-1 ml-64 flex flex-col h-screen relative">
        {/* Top Header */}
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center no-print z-50">
          <h2 className="text-slate-500 font-medium">Bem-vindo, <span className="text-slate-900 font-bold">{user.name}</span></h2>
          
          <div className="flex items-center gap-6">
            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-all relative ${alerts.length > 0 ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <Bell size={22} />
                {alerts.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {alerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="bg-slate-900 p-3 text-white flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider">Alertas de CNH</span>
                    <button onClick={() => setShowNotifications(false)} className="hover:text-red-400"><X size={16}/></button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        <CheckCircle size={32} className="mx-auto mb-2 text-green-500 opacity-20" />
                        Tudo em dia! Nenhuma CNH vencida.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {alerts.map(d => {
                           const expiry = new Date(d.validityDate);
                           const isExpired = expiry < new Date();
                           return (
                             <div key={d.id} className="p-3 hover:bg-slate-50 flex gap-3 items-start">
                                {isExpired ? <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />}
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{d.name}</p>
                                  <p className="text-[11px] text-slate-500 uppercase">
                                    {isExpired ? 'Vencida desde: ' : 'Vence em: '}
                                    <span className={isExpired ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
                                      {new Date(d.validityDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  </p>
                                </div>
                             </div>
                           )
                        })}
                      </div>
                    )}
                  </div>
                  {alerts.length > 0 && (
                    <button 
                      onClick={() => { setCurrentView('drivers'); setShowNotifications(false); }}
                      className="w-full p-2 bg-slate-50 text-blue-600 text-[10px] font-bold uppercase hover:bg-slate-100 transition border-t"
                    >
                      Ver todos os motoristas
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium">
              <UserIcon size={16} />
              <span>Admin</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition flex items-center gap-2"
              title="Sair do Sistema"
            >
              <LogOut size={20} />
              <span className="text-xs font-bold uppercase">Sair</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50" onClick={() => setShowNotifications(false)}>
          <div className="max-w-7xl mx-auto pb-12">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
