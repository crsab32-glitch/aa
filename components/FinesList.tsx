import React, { useState, useEffect } from 'react';
import { Fine, Driver, Vehicle } from '../types';
import { getFines, getDrivers, getVehicles } from '../services/storageService';
import { FileText, FileCheck, Eye, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { FileViewerModal } from './FileViewerModal';

interface FinesListProps {
  onEditFine: (fine: Fine) => void;
}

export const FinesList: React.FC<FinesListProps> = ({ onEditFine }) => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [receiptFine, setReceiptFine] = useState<Fine | null>(null);
  const [viewingFileFine, setViewingFileFine] = useState<Fine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    setIsRefreshing(true);
    try {
      const data = getFines();
      // Filtragem defensiva para garantir que apenas objetos válidos sejam processados
      const sanitized = Array.isArray(data) 
        ? data.filter(f => f && typeof f === 'object' && f.id) 
        : [];
      setFines(sanitized);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar lista de multas:", err);
      setError("Houve um problema ao carregar os dados armazenados localmente.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateStr;
    }
  };

  if (error) {
    return (
        <div className="p-12 text-center bg-white rounded-xl shadow-lg border border-red-100 max-w-xl mx-auto mt-10">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-800 uppercase">Falha na Listagem</h2>
            <p className="text-slate-500 mt-2 mb-6">{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
            >
                Recarregar Sistema
            </button>
        </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-7xl mx-auto min-h-[500px]">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-slate-600" /> Gestão de Multas
        </h2>
        <button 
            onClick={loadData} 
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-blue-600 transition disabled:opacity-50"
            title="Atualizar Lista"
        >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <p className="text-sm text-slate-500 mb-6 bg-slate-50 p-3 rounded border-l-4 border-blue-500">
        <strong>Atenção:</strong> Duplo clique em uma linha para editar no formulário de cadastro.
      </p>

      <div className="overflow-x-auto border rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto</th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Placa</th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pts</th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorista</th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
             {fines.length === 0 ? (
                 <tr><td colSpan={8} className="px-4 py-20 text-center text-slate-400 italic">Nenhum registro encontrado.</td></tr>
             ) : (
                fines.map(f => (
                    <tr 
                        key={f?.id} 
                        onDoubleClick={() => onEditFine(f)}
                        className="hover:bg-blue-50/50 cursor-pointer transition group"
                    >
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-1.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReceiptFine(f); }}
                            className="p-1.5 bg-white border border-slate-200 rounded text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-sm"
                            title="Gerar Recibo"
                          >
                            <FileCheck size={16} />
                          </button>
                          {f?.fileData && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewingFileFine(f); }}
                              className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-800 hover:text-white transition shadow-sm"
                              title="Visualizar Documento"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-slate-900">{f?.autoInfraction || '---'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 uppercase font-bold">{f?.plate || '---'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-medium">{formatDate(f?.date)}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-bold">R$ {f?.value?.toFixed(2) || '0,00'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {f?.payDouble ? <span className="text-red-500 font-black">NIC</span> : <span className="font-bold">{f?.points || 0}</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                            {f?.driverName || <span className="text-red-300 italic text-[10px] uppercase font-bold">Pendente</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 inline-flex text-[9px] leading-5 font-black rounded-md uppercase border
                                ${f?.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 
                                  f?.paymentStatus === 'CANCELED' ? 'bg-slate-50 text-slate-500 border-slate-200' : 
                                  'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {f?.paymentStatus === 'PAID' ? 'Pago' : f?.paymentStatus === 'CANCELED' ? 'Cancelado' : 'Pendente'}
                            </span>
                        </td>
                    </tr>
                ))
             )}
          </tbody>
        </table>
      </div>

      {receiptFine && (
        <ReceiptModal fine={receiptFine} onClose={() => setReceiptFine(null)} />
      )}

      {viewingFileFine && viewingFileFine.fileData && viewingFileFine.fileMimeType && (
        <FileViewerModal 
            fileData={viewingFileFine.fileData} 
            mimeType={viewingFileFine.fileMimeType} 
            title={viewingFileFine.autoInfraction}
            onClose={() => setViewingFileFine(null)} 
        />
      )}
    </div>
  );
};