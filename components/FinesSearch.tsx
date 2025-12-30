import React, { useState, useEffect } from 'react';
import { Search, User, FileText, Printer, FileCheck, Eye } from 'lucide-react';
import { Fine, Driver } from '../types';
import { getFines, getDrivers } from '../services/storageService';
import { ReceiptModal } from './ReceiptModal';
import { FileViewerModal } from './FileViewerModal';

export const FinesSearch: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [allFines, setAllFines] = useState<Fine[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [filteredFines, setFilteredFines] = useState<Fine[]>([]);
  const [receiptFine, setReceiptFine] = useState<Fine | null>(null);
  const [viewingFileFine, setViewingFileFine] = useState<Fine | null>(null);

  useEffect(() => {
    setDrivers(getDrivers());
    setAllFines(getFines());
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      setFilteredFines(allFines.filter(f => f.driverName === selectedDriver));
    } else {
      setFilteredFines([]);
    }
  }, [selectedDriver, allFines]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-6xl mx-auto min-h-[500px]">
      <div className="mb-8 border-b pb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Search className="w-6 h-6 text-blue-600" /> Pesquisa de Infrações
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Motorista</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <select 
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="pl-10 block w-full rounded-md border-slate-300 border p-2.5 shadow-sm outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">Selecione um motorista para ver as multas...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.name}>{d.name} ({d.cpf})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedDriver ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-700">
              Infrações de: <span className="text-blue-600">{selectedDriver}</span>
            </h3>
            <span className="text-sm text-slate-500">{filteredFines.length} registros encontrados</span>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Documentos</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Auto</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Placa</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Infração</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredFines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      Nenhuma infração encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredFines.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setReceiptFine(f)}
                          className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition border border-blue-200 text-[10px] font-bold"
                          title="Gerar Recibo"
                        >
                          <FileCheck size={14} /> RECIBO
                        </button>
                        {f.fileData && (
                           <button 
                           onClick={() => setViewingFileFine(f)}
                           className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition border border-slate-200 text-[10px] font-bold"
                           title="Ver Arquivo Original"
                         >
                           <Eye size={14} /> VER
                         </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{f.autoInfraction}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 uppercase">{f.plate}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(f.date)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">R$ {f.value?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-xs" title={f.description}>
                        {f.description}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 inline-flex text-[10px] leading-5 font-semibold rounded-full uppercase
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
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Search size={48} className="mb-4 opacity-20" />
          <p>Selecione um motorista acima para consultar as infrações vinculadas.</p>
        </div>
      )}

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