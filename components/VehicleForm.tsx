import React, { useState, useEffect } from 'react';
import { Upload, Car, AlertCircle, CheckCircle } from 'lucide-react';
import { Vehicle } from '../types';
import { saveVehicle, getVehicles } from '../services/storageService';
import { extractVehiclesFromFiles } from '../services/geminiService';

export const VehicleForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '', renavam: '', chassis: '', brand: '', model: '', year: new Date().getFullYear()
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    setVehicles(getVehicles());
  }, []);

  const refreshList = () => {
    setVehicles(getVehicles());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.renavam) {
      setMsg({ type: 'error', text: 'Placa e Renavam são obrigatórios.' });
      return;
    }
    const success = saveVehicle({
      ...formData as Vehicle,
      id: crypto.randomUUID()
    });
    if (success) {
      setMsg({ type: 'success', text: 'Veículo cadastrado com sucesso!' });
      setFormData({ plate: '', renavam: '', chassis: '', brand: '', model: '', year: new Date().getFullYear() });
      refreshList();
    } else {
      setMsg({ type: 'error', text: 'Erro: Veículo com esta Placa já existe.' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    setMsg(null);
    try {
      const files = Array.from(e.target.files!) as File[];
      const extracted = await extractVehiclesFromFiles(files);
      let successCount = 0;
      let dupCount = 0;

      extracted.forEach(v => {
        if (v.plate && v.renavam) {
          const saved = saveVehicle({ ...v as Vehicle, id: crypto.randomUUID() });
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
          <Car className="w-6 h-6 text-indigo-600" /> Cadastro de Veículo
        </h2>

        {msg && (
          <div className={`p-4 mb-6 rounded-md flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700">Placa</label>
                  <input name="plate" value={formData.plate} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 uppercase" placeholder="ABC-1234" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Renavam</label>
                  <input name="renavam" value={formData.renavam} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Chassis</label>
              <input name="chassis" value={formData.chassis} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700">Marca</label>
                  <input name="brand" value={formData.brand} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Modelo</label>
                  <input name="model" value={formData.model} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ano</label>
              <input type="number" name="year" value={formData.year} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition">
              Salvar Veículo
            </button>
          </form>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50">
            <Upload className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Importação CRLV</h3>
            <p className="text-sm text-slate-500 mb-4">Aceita PDF, Imagens e Excel (.xls, .xlsx).</p>
            <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-md shadow-sm">
              {loading ? 'Processando...' : 'Selecionar Arquivos'}
              <input type="file" multiple className="hidden" accept=".pdf,image/*,.xls,.xlsx" onChange={handleImport} disabled={loading} />
            </label>
            <p className="text-xs text-slate-400 mt-4">
              Evita duplicatas baseado na Placa.
            </p>
          </div>
        </div>
      </div>

       {/* List Section */}
       <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Veículos Cadastrados</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Placa</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Renavam</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Modelo/Marca</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ano</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {vehicles.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhum veículo cadastrado.</td></tr>
                    ) : (
                        vehicles.map(v => (
                            <tr key={v.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900 uppercase">{v.plate}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{v.renavam}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{v.brand} {v.model}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{v.year}</td>
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