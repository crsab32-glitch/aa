import React, { useState, useEffect } from 'react';
import { Fine, Driver, Vehicle } from '../types';
import { getFines, getDrivers, getVehicles } from '../services/storageService';
import { FileText, FileCheck, Eye } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { FileViewerModal } from './FileViewerModal';

interface FinesListProps {
  onEditFine: (fine: Fine) => void;
}

export const FinesList: React.FC<FinesListProps> = ({ onEditFine }) => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [receiptFine, setReceiptFine] = useState<Fine | null>(null);
  const [viewingFileFine, setViewingFileFine] = useState<Fine | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const loadData = () => {
    setFines(getFines());
    setDrivers(getDrivers());
    setVehicles(getVehicles());
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-7xl mx-auto min-h-[500px]">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        <FileText className="w-6 h-6 text-slate-600" /> Gestão de Multas
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        <strong>Duplo clique</strong> em uma linha para abrir o cadastro e editar | <strong>Recibo</strong> para ciência | <strong>Visualizar</strong> documento original.
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
                 <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Nenhuma multa registrada.</td></tr>
             ) : (
                fines.map(f => (
                    <tr 
                        key={f.id} 
                        onDoubleClick={() => onEditFine(f)}
                        className="hover:bg-blue-50 cursor-pointer transition"
                        title="Duplo clique para editar no formulário"
                    >
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReceiptFine(f); }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-600 transition"
                            title="Gerar Recibo de Ciência"
                          >
                            <FileCheck size={18} />
                          </button>
                          {f.fileData && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewingFileFine(f); }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition"
                              title="Visualizar Documento Original"
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