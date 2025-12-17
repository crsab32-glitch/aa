import React, { useState } from 'react';
import { Database, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { DetranCode } from '../types';
import { saveDetranCode, getDetranCodes } from '../services/storageService';
import { extractDetranCodesFromExcel } from '../services/geminiService';

export const DetranBase: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [codes, setCodes] = useState<DetranCode[]>(getDetranCodes());

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    setMsg(null);
    try {
      const files = Array.from(e.target.files!) as File[];
      const extracted = await extractDetranCodesFromExcel(files);
      let successCount = 0;
      
      extracted.forEach(c => {
        if (c.code) {
          const saved = saveDetranCode({ ...c as DetranCode, id: crypto.randomUUID() });
          if (saved) successCount++;
        }
      });
      
      setCodes(getDetranCodes()); // Refresh list
      setMsg({ type: 'success', text: `${successCount} novos códigos importados.` });
    } catch (err) {
      setMsg({ type: 'error', text: 'Falha na importação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" /> Base de Dados Detran
        </h2>
        <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm">
                {loading ? 'Importando...' : <><Upload size={16} /> Importar Excel (.xls/img)</>}
                <input type="file" multiple className="hidden" accept=".xls,.xlsx,image/*,.pdf" onChange={handleImport} disabled={loading} />
            </label>
        </div>
      </div>

      {msg && (
        <div className={`p-4 mb-6 rounded-md flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Valor Padrão</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pontos</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {codes.length === 0 ? (
               <tr>
                 <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Nenhum código cadastrado. Importe uma planilha.</td>
               </tr>
            ) : (
                codes.map(c => (
                    <tr key={c.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{c.code}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{c.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">R$ {c.defaultValue?.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{c.defaultPoints}</td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};