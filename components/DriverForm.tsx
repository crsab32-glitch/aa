import React, { useState, useEffect } from 'react';
import { Upload, Plus, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Driver } from '../types';
import { saveDriver, getDrivers } from '../services/storageService';
import { extractDriversFromFiles } from '../services/geminiService';

export const DriverForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState<Partial<Driver>>({
    name: '', cpf: '', cnhNumber: '', validityDate: ''
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    setDrivers(getDrivers());
  }, []);

  const refreshList = () => {
    setDrivers(getDrivers());
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf) {
      setMsg({ type: 'error', text: 'Preencha os campos obrigatórios.' });
      return;
    }
    const success = saveDriver({
      ...formData as Driver,
      id: crypto.randomUUID()
    });
    if (success) {
      setMsg({ type: 'success', text: 'Motorista cadastrado com sucesso!' });
      setFormData({ name: '', cpf: '', cnhNumber: '', validityDate: '' });
      refreshList();
    } else {
      setMsg({ type: 'error', text: 'Erro: Motorista com este CPF já existe.' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    setMsg(null);
    try {
      const files = Array.from(e.target.files!) as File[];
      const extracted = await extractDriversFromFiles(files);
      let successCount = 0;
      let dupCount = 0;

      extracted.forEach(d => {
        if (d.name && d.cpf) {
          const saved = saveDriver({ ...d as Driver, id: crypto.randomUUID() });
          if (saved) successCount++; else dupCount++;
        }
      });

      refreshList();
      setMsg({ 
        type: successCount > 0 ? 'success' : 'error', 
        text: `Importação: ${successCount} salvos. ${dupCount} duplicados ignorados.` 
      });
    } catch (err) {
      setMsg({ type: 'error', text: 'Falha na importação via IA.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <Plus className="w-6 h-6 text-blue-600" /> Cadastro de Motorista
        </h2>

        {msg && (
          <div className={`p-4 mb-6 rounded-md flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome Motorista</label>
              <input name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">CPF</label>
              <input name="cpf" value={formData.cpf} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nº Registro CNH</label>
              <input name="cnhNumber" value={formData.cnhNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Data Validade</label>
              <input type="date" name="validityDate" value={formData.validityDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
              Salvar Motorista
            </button>
          </form>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50">
            <Upload className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Importação em Massa (CNH)</h3>
            <p className="text-sm text-slate-500 mb-4">Aceita PDF, Imagens e Excel (.xls, .xlsx).</p>
            <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-md shadow-sm">
              {loading ? 'Processando...' : 'Selecionar Arquivos'}
              <input type="file" multiple className="hidden" accept=".pdf,image/*,.xls,.xlsx" onChange={handleImport} disabled={loading} />
            </label>
            <p className="text-xs text-slate-400 mt-4">
              O sistema verifica duplicidade pelo CPF.
            </p>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Motoristas Cadastrados</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nome</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">CPF</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Registro CNH</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Validade</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {drivers.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhum motorista cadastrado.</td></tr>
                    ) : (
                        drivers.map(d => (
                            <tr key={d.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">{d.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{d.cpf}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{d.cnhNumber}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{formatDate(d.validityDate)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
