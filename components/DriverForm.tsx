import React, { useState, useEffect } from 'react';
import { Upload, Plus, AlertCircle, CheckCircle, Search, Calendar, AlertTriangle, X, Save, UserCheck } from 'lucide-react';
import { Driver } from '../types';
import { saveDriver, getDrivers, updateDriver } from '../services/storageService';
import { extractDriversFromFiles } from '../services/geminiService';

export const DriverForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const getCNHStatus = (dateStr: string) => {
    if (!dateStr) return { label: 'Não Informada', color: 'bg-slate-100 text-slate-600', icon: AlertCircle };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(23, 59, 59, 999);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Vencida', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
    } else if (diffDays <= 30) {
      return { label: `Vence em ${diffDays} dias`, color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle };
    } else {
      return { label: 'Regular', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearForm = () => {
    setFormData({ name: '', cpf: '', cnhNumber: '', validityDate: '' });
    setEditingId(null);
    setMsg(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf) {
      setMsg({ type: 'error', text: 'Preencha os campos obrigatórios.' });
      return;
    }

    if (editingId) {
      updateDriver({
        ...formData as Driver,
        id: editingId
      });
      setMsg({ type: 'success', text: 'Dados do motorista atualizados com sucesso!' });
      clearForm();
      refreshList();
    } else {
      const success = saveDriver({
        ...formData as Driver,
        id: crypto.randomUUID()
      });
      if (success) {
        setMsg({ type: 'success', text: 'Motorista cadastrado com sucesso!' });
        clearForm();
        refreshList();
      } else {
        setMsg({ type: 'error', text: 'Erro: Motorista com este CPF já existe.' });
      }
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

  const handleDoubleClick = (d: Driver) => {
    setFormData({ ...d });
    setEditingId(d.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className={`p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto border-t-4 transition-colors ${editingId ? 'border-amber-500' : 'border-blue-600'}`}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <UserCheck className="w-6 h-6 text-amber-500" /> : <Plus className="w-6 h-6 text-blue-600" />} 
                {editingId ? 'Editar Motorista' : 'Cadastro de Motorista'}
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
            <button 
              type="submit" 
              className={`w-full flex items-center justify-center gap-2 text-white py-2.5 px-4 rounded-md transition font-bold shadow-lg ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
            >
              {editingId ? <><Save size={18}/> Atualizar Motorista</> : 'Salvar Motorista'}
            </button>
          </form>

          {!editingId ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 transition hover:bg-slate-100">
                <Upload className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Importação em Massa (CNH)</h3>
                <p className="text-sm text-slate-500 mb-4">Aceita PDF, Imagens e Excel (.xls, .xlsx).</p>
                <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-md shadow-sm font-semibold">
                {loading ? 'Processando...' : 'Selecionar Arquivos'}
                <input type="file" multiple className="hidden" accept=".pdf,image/*,.xls,.xlsx" onChange={handleImport} disabled={loading} />
                </label>
                <p className="text-xs text-slate-400 mt-4 italic">
                O sistema verifica duplicidade pelo CPF e extrai datas automaticamente.
                </p>
            </div>
          ) : (
            <div className="h-full bg-amber-50/50 rounded-xl p-8 border border-amber-200 border-dashed flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <UserCheck className="w-12 h-12 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-amber-800 uppercase tracking-tight">Modo de Edição</h3>
                <p className="text-sm text-amber-600 mt-2">
                    Alterando dados de:<br/>
                    <span className="text-lg font-black text-amber-700">{formData.name}</span>
                </p>
            </div>
          )}
        </div>
      </div>

      {/* List Section */}
      <div className="p-0 bg-white rounded-lg shadow-md max-w-5xl mx-auto overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Motoristas Cadastrados</h3>
            <span className="text-xs text-slate-400 italic">Dê um duplo clique para editar</span>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Nome</th>
                        <th className="px-6 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">CPF</th>
                        <th className="px-6 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Registro CNH</th>
                        <th className="px-6 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Validade</th>
                        <th className="px-6 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Status CNH</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {drivers.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum motorista cadastrado no sistema.</td></tr>
                    ) : (
                        drivers.map(d => {
                            const status = getCNHStatus(d.validityDate);
                            const StatusIcon = status.icon;
                            return (
                                <tr 
                                  key={d.id} 
                                  onDoubleClick={() => handleDoubleClick(d)}
                                  className="hover:bg-blue-50 cursor-pointer transition group"
                                  title="Duplo clique para editar"
                                >
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{d.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{d.cpf}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">{d.cnhNumber}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(d.validityDate)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color}`}>
                                            <StatusIcon size={12} />
                                            {status.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider italic">
                * Motoristas vencidos ou vencendo em breve também aparecem no ícone de sino do topo.
            </p>
        </div>
      </div>
    </div>
  );
};