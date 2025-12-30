import React, { useState, useEffect } from 'react';
import { Fine, Driver, Vehicle } from '../types';
import { getFines, getDrivers, getVehicles, updateFine, findDetranCode } from '../services/storageService';
import { FileText, User, X, FileCheck, Save, Eye, FileSearch } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { FileViewerModal } from './FileViewerModal';

export const FinesList: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [editingFine, setEditingFine] = useState<Fine | null>(null);
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

  const handleDoubleClick = (fine: Fine) => {
    setEditingFine({ ...fine });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editingFine) return;
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'payDouble') {
        const detranData = findDetranCode(editingFine.code);
        const baseValue = detranData?.defaultValue || editingFine.value / (editingFine.payDouble ? 2 : 1);
        const basePoints = detranData?.defaultPoints || 0;

        setEditingFine({
          ...editingFine,
          payDouble: checked,
          value: checked ? baseValue * 2 : baseValue,
          points: checked ? 0 : basePoints
        });
      } else {
        setEditingFine({ ...editingFine, [name]: checked });
      }
    } else if (name === 'driverId') {
      const driver = drivers.find(d => d.id === value);
      setEditingFine({ 
        ...editingFine, 
        driverId: value, 
        driverName: driver ? driver.name : '' 
      });
    } else {
      setEditingFine({ ...editingFine, [name]: value });
    }
  };

  const saveChanges = () => {
    if (editingFine) {
      updateFine(editingFine);
      setEditingFine(null);
      loadData();
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-7xl mx-auto min-h-[500px]">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        <FileText className="w-6 h-6 text-slate-600" /> Gestão de Multas
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        <strong>Duplo clique</strong> em uma linha para editar | <strong>Recibo</strong> para ciência | <strong>Visualizar</strong> documento original.
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
                        onDoubleClick={() => handleDoubleClick(f)}
                        className="hover:bg-blue-50 cursor-pointer transition"
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

      {editingFine && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <FileText size={20} className="text-blue-400" /> Editar Infração: {editingFine.autoInfraction}
                    </h3>
                    <button onClick={() => setEditingFine(null)} className="p-1 hover:bg-slate-800 rounded transition">
                      <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motorista</label>
                          <select 
                              name="driverId"
                              value={editingFine.driverId || ''} 
                              onChange={handleEditChange}
                              className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                          >
                              <option value="">Não atribuído</option>
                              {drivers.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Veículo (Placa)</label>
                          <select 
                              name="plate"
                              value={editingFine.plate} 
                              onChange={handleEditChange}
                              className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none uppercase"
                          >
                              {vehicles.map(v => (
                                  <option key={v.id} value={v.plate}>{v.plate}</option>
                              ))}
                          </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Situação de Pagamento</label>
                          <select 
                              name="paymentStatus"
                              value={editingFine.paymentStatus} 
                              onChange={handleEditChange}
                              className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                          >
                              <option value="PENDING">Pendente</option>
                              <option value="PAID">Pago</option>
                              <option value="CANCELED">Cancelado</option>
                          </select>
                      </div>
                      <div className="flex items-end">
                        <label className={`flex items-center gap-2 cursor-pointer p-2 border rounded-md transition w-full h-[38px] ${editingFine.payDouble ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-white text-slate-600'}`}>
                            <input 
                              type="checkbox" 
                              name="payDouble" 
                              checked={editingFine.payDouble} 
                              onChange={handleEditChange} 
                              className="w-4 h-4 text-red-600"
                            />
                            <span className="text-xs uppercase">Pagar Dobrado</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Valor Atual:</span>
                          <span className="font-bold text-slate-900">R$ {editingFine.value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Pontuação na CNH:</span>
                          <span className={`font-bold ${editingFine.payDouble ? 'text-red-500' : 'text-slate-900'}`}>
                            {editingFine.payDouble ? 'ISENTO (PAGTO DOBRADO)' : `${editingFine.points} pts`}
                          </span>
                        </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                      <textarea 
                        name="observations"
                        value={editingFine.observations || ''}
                        onChange={handleEditChange}
                        rows={2}
                        className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                        placeholder="Notas internas..."
                      />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={() => setEditingFine(null)} className="px-4 py-2 border rounded text-slate-600 text-sm">Cancelar</button>
                    <button onClick={saveChanges} className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-sm">Salvar</button>
                </div>
            </div>
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