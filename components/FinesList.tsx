import React, { useState, useEffect } from 'react';
import { Fine, Driver, Vehicle } from '../types';
import { getFines, getDrivers, getVehicles } from '../services/storageService';
import { FileText, FileCheck, Eye, AlertCircle } from 'lucide-react';
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

  const loadData = () => {
    try {
      const data = getFines();
      setFines(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar lista de multas:", err);
      setError("Falha ao carregar dados do banco local.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
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
        <div className="p-12 text-center bg-white rounded-lg shadow">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Erro no Sistema</h2>
            <p className="text-slate-500 mt-2">{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Recarregar Página
            </button>
        </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-7xl mx-auto min-h-[500px]">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        <FileText className="w-6 h-6 text-slate-600" /> Gestão de Multas
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        <strong>Duplo clique</strong> em uma linha para editar | <strong>Recibo</strong> para ciência | <strong>Visualizar</strong> documento.
      </p>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Ações</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Auto</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Placa</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Data</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Pts</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Motorista</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
             {fines.length === 0 ? (
                 <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic">Nenhuma multa registrada.</td></tr>
             ) : (
                fines.map(f => (
                    <tr 
                        key={f.id} 
                        onDoubleClick={() => onEditFine(f)}
                        className="hover:bg-blue-50 cursor-pointer transition"
                    >
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReceiptFine(f); }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-600 transition"
                            title="Gerar Recibo"
                          >
                            <FileCheck size={18} />
                          </button>
                          {f.fileData && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewingFileFine(f); }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition"
                              title="Visualizar Original"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{f.autoInfraction}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 uppercase">{f.plate}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(f.date)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">R$ {f.value?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {f.payDouble ? <span className="text-red-500 font-bold">0</span> : f.points}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                            {f.driverName || <span className="text-red-400 italic text-xs">Não atribuído</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                            <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase
                                ${f.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 
                                  f.paymentStatus === 'CANCELED' ? 'bg-gray-100 text-gray-800' : 
                                  'bg-yellow-100 text-yellow-800'}`}>
                                {f.paymentStatus === 'PAID' ? 'Pago' : f.paymentStatus === 'CANCELED' ? 'Cancelado' : 'Pendente'}
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