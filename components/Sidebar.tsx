import React from 'react';
import { UserPlus, Car, Database, FileWarning, List, Search } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const menu = [
    { id: 'drivers', label: 'Cadastro Motorista', icon: UserPlus },
    { id: 'vehicles', label: 'Cadastro Veículo', icon: Car },
    { id: 'detran', label: 'Base Detran', icon: Database },
    { id: 'fines_entry', label: 'Cadastro Multas', icon: FileWarning },
    { id: 'fines_list', label: 'Gestão de Multas', icon: List },
    { id: 'fines_search', label: 'Pesquisa por Motorista', icon: Search },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col fixed left-0 top-0 no-print">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
          Controle e Gestão <span className="text-blue-400">de Multas</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Gerenciamento Inteligente</p>
      </div>
      
      <nav className="space-y-2 flex-1">
        {menu.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as AppView)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 
                    ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <Icon size={20} />
                    <span className="font-medium text-sm">{item.label}</span>
                </button>
            )
        })}
      </nav>

      <div className="mt-auto px-4 py-4 text-xs text-slate-600 border-t border-slate-800">
        <p>© 2024 Controle e Gestão de Multas</p>
        <p>Versão 1.0.0</p>
      </div>
    </div>
  );
};