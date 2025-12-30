import React, { useState, useEffect } from 'react';
import { Upload, Car, AlertCircle, CheckCircle, X, Save } from 'lucide-react';
import { Vehicle } from '../types';
import { saveVehicle, getVehicles, updateVehicle } from '../services/storageService';
import { extractVehiclesFromFiles } from '../services/geminiService';

export const VehicleForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const clearForm = () => {
    setFormData({ plate: '', renavam: '', chassis: '', brand: '', model: '', year: new Date().getFullYear() });
    setEditingId(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.renavam) {
      setMsg({ type: 'error', text: 'Placa e Renavam são obrigatórios.' });
      return;
    }

    const normalizedVehicle = {
        ...formData,
        plate: formData.plate.toUpperCase().trim(),
        renavam: formData.renavam.trim(),
        chassis: formData.chassis?.toUpperCase().trim() || ''
    } as Vehicle;

    if (editingId) {
      updateVehicle({
        ...normalizedVehicle,
        id: editingId
      });
      setMsg({ type: 'success', text: 'Veículo atualizado com sucesso!' });
      clearForm();
      refreshList();
    } else {
      const success = saveVehicle({
        ...normalizedVehicle,
        id: crypto.randomUUID()
      });
      if (success) {
        setMsg({ type: 'success', text: 'Veículo cadastrado com sucesso!' });
        clearForm();
        refreshList();
      } else {
        setMsg({ type: 'error', text: 'Erro: Veículo com esta Placa já existe.' });
      }
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
        // Limpeza básica dos dados vindos da IA
        const plate = v.plate?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const renavam = v.renavam?.replace(/[^0-9]/g, '');

        if (plate && renavam) {
          const saved = saveVehicle({ 
            ...v, 
            plate,
            renavam,
            id: crypto.randomUUID(),
            year: Number(v.year) || new Date().getFullYear()
          } as Vehicle);
          if (saved) successCount++; else dupCount++;
        }
      });

      refreshList();
      if (successCount === 0 && extracted.length > 0) {
          setMsg({ type: 'error', text: 'Os dados foram extraídos mas são duplicados ou incompletos.' });
      } else {
          setMsg({ 
            type: successCount > 0 ? 'success' : 'error', 
            text: `Importação: ${successCount} salvos. ${dupCount} duplicados ignorados.` 
          });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Falha na importação via IA.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleClick = (v: Vehicle) => {
    setFormData({ ...v });
    setEditingId(v.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className={`p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto border-t-4 ${editingId ? 'border-orange-500' : 'border-indigo-600'}`}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Car className={`w-6 h-6 ${editingId ? 'text-orange-500' : 'text-indigo-600'}`} /> 
                {editingId ? 'Editar Veículo' : 'Cadastro de Veículo'}
            </h2>
            {editingId && (
                <button 
                    onClick={clearForm}
                    className="text-slate-500 hover:text-red-500 flex items-center gap-1 text-sm font-medium transition"
                >
                    <X size={16} /> Cancelar Edição
                </button>
            )}
        </div>

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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                  <input name="plate" value={formData.plate} onChange={handleChange} className="w-full rounded-md border-slate-300 shadow-sm border p-2.5 uppercase focus:ring-2 focus:ring-blue-100 outline-none" placeholder="ABC1D23" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Renavam</label>
                  <input name="renavam" value={formData.renavam} onChange={handleChange} className="w-full rounded-md border-slate-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="00000000000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chassis</label>
              <input name="chassis" value={formData.chassis} onChange={handleChange} className="w-full rounded-md border-slate-300 shadow-sm border p-2.5 uppercase focus:ring-2 focus:ring-blue-100 outline-none" placeholder="NÚMERO DO CHASSIS" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input name="brand" value={formData.brand} onChange={handleChange} className="w-full rounded-md border-slate-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ex: FIAT" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input name="model" value={formData.model} onChange={handleChange} className="w-full rounded-md border-slate-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ex: UNO" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
              <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full rounded-md border-slate-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
            <button 
              type="submit" 
              className={`w-full flex items-center justify-center gap-2 text-white py-3 px-4 rounded-lg transition font-bold shadow-lg ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
            >
              {editingId ? <><Save size={20}/> Atualizar Veículo</> : 'Salvar Veículo'}
            </button>
          </form>

          <div className="relative">
            {!editingId ? (
                <div className="h-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 transition hover:bg-slate-100/50">
                    <Upload className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">Importação CRLV</h3>
                    <p className="text-sm text-slate-500 mt-2 mb-6">Arraste arquivos ou clique no botão para extrair dados via IA de PDFs ou Fotos.</p>
                    <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-3 px-6 rounded-lg shadow-sm font-semibold transition flex items-center gap-2">
                        {loading ? 'Processando...' : 'Selecionar Arquivos'}
                        <input type="file" multiple className="hidden" accept=".pdf,image/*,.xls,.xlsx" onChange={handleImport} disabled={loading} />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-6 uppercase tracking-wider">Formatos: PDF, JPG, PNG, XLS</p>
                </div>
            ) : (
                <div className="h-full bg-orange-50/50 rounded-xl p-8 border border-orange-200 border-dashed flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                        <Car className="w-12 h-12 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-black text-orange-800 uppercase tracking-tight">Modo de Edição</h3>
                    <p className="text-sm text-orange-600 mt-2">
                        Você está alterando os dados do veículo placa<br/>
                        <span className="text-lg font-black text-orange-700">{formData.plate}</span>.
                    </p>
                </div>
            )}
          </div>
        </div>
      </div>

       {/* List Section */}
       <div className="p-0 bg-white rounded-lg shadow-md max-w-5xl mx-auto overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Veículos Cadastrados</h3>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold uppercase">Total: {vehicles.length}</span>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Placa</th>
                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Renavam</th>
                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Chassis</th>
                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Modelo/Marca</th>
                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Ano</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {vehicles.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum veículo cadastrado no sistema.</td></tr>
                    ) : (
                        vehicles.map(v => (
                            <tr 
                                key={v.id} 
                                onDoubleClick={() => handleDoubleClick(v)}
                                className="hover:bg-blue-50/50 cursor-pointer transition group"
                                title="Dê um duplo clique para editar"
                            >
                                <td className="px-6 py-4 text-sm font-black text-slate-800 uppercase tracking-tighter">{v.plate}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{v.renavam}</td>
                                <td className="px-6 py-4 text-sm text-slate-400 uppercase font-mono tracking-tighter text-xs">
                                    {v.chassis ? v.chassis : '---'}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                    {v.brand} {v.model}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-md border border-slate-200">
                                        {v.year}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                * Dê um duplo clique em qualquer linha para abrir o modo de edição.
            </p>
        </div>
      </div>
    </div>
  );
};