import React, { useState, useEffect } from 'react';
import { FileWarning, Upload, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Fine, Vehicle } from '../types';
import { saveFine, findDetranCode, getDrivers, getVehicles } from '../services/storageService';
import { extractFinesFromFiles } from '../services/geminiService';

export const FineForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [drivers, setDrivers] = useState(getDrivers());
  const [vehicles, setVehicles] = useState<Vehicle[]>(getVehicles());
  
  const [formData, setFormData] = useState<Partial<Fine>>({
    autoInfraction: '', date: '', code: '', description: '', value: 0, organ: '', 
    indicatesDriver: false, location: '', points: 0, payDouble: false, 
    observations: '', paymentStatus: 'PENDING', plate: '', driverName: ''
  });

  // Auto-import or clear description when Code changes
  useEffect(() => {
    if (!formData.code || formData.code.trim() === '') {
      setFormData(prev => ({
        ...prev,
        description: '',
        value: 0,
        points: 0
      }));
      return;
    }

    if (formData.code.length >= 3) {
        const detranData = findDetranCode(formData.code);
        if (detranData) {
            const baseValue = detranData.defaultValue || 0;
            const basePoints = detranData.defaultPoints || 0;
            
            setFormData(prev => ({
                ...prev,
                description: detranData.description,
                value: prev.payDouble ? baseValue * 2 : baseValue,
                points: prev.payDouble ? 0 : basePoints
            }));
        }
    }
  }, [formData.code]);

  // Handle Double Fine logic separately for toggle
  const handleToggleDouble = (checked: boolean) => {
    setFormData(prev => {
      if (!prev.code) return { ...prev, payDouble: checked };
      const detranData = findDetranCode(prev.code);
      if (!detranData) return { ...prev, payDouble: checked };

      return {
        ...prev,
        payDouble: checked,
        value: checked ? detranData.defaultValue * 2 : detranData.defaultValue,
        points: checked ? 0 : detranData.defaultPoints
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'payDouble') {
        handleToggleDouble(checked);
      } else {
        setFormData({ ...formData, [name]: checked });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.autoInfraction || !formData.plate || !formData.code) {
      setMsg({ type: 'error', text: 'Preencha os campos obrigatórios (Auto, Placa, Código).' });
      return;
    }

    const success = saveFine({ ...formData as Fine, id: crypto.randomUUID() });
    if (success) {
      setMsg({ type: 'success', text: 'Multa cadastrada com sucesso!' });
      setFormData({
        autoInfraction: '', date: '', code: '', description: '', value: 0, organ: '', 
        indicatesDriver: false, location: '', points: 0, payDouble: false, 
        observations: '', paymentStatus: 'PENDING', plate: '', driverName: ''
      });
    } else {
      setMsg({ type: 'error', text: 'Erro: Auto de Infração já existe.' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    setMsg(null);
    try {
      const files = Array.from(e.target.files!) as File[];
      const extracted = await extractFinesFromFiles(files);
      let successCount = 0;
      let dupCount = 0;

      extracted.forEach(f => {
        if (f.autoInfraction) {
          if (f.code) {
             const dData = findDetranCode(f.code);
             if (dData) {
                 if (!f.description) f.description = dData.description;
                 if (!f.value) f.value = dData.defaultValue;
                 if (!f.points) f.points = dData.defaultPoints;
             }
          }
          const saved = saveFine({ ...f as Fine, id: crypto.randomUUID(), paymentStatus: 'PENDING', payDouble: false });
          if (saved) successCount++; else dupCount++;
        }
      });
      setMsg({ type: 'success', text: `Importação: ${successCount} salvos. ${dupCount} duplicados.` });
    } catch (err) {
      setMsg({ type: 'error', text: 'Falha na importação via IA.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-6xl mx-auto">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileWarning className="w-6 h-6 text-red-600" /> Cadastro de Multas
        </h2>
        
        <label className="cursor-pointer bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition flex items-center gap-2 shadow-sm">
            {loading ? 'Lendo PDF...' : <><Upload size={16} /> Importar Multa (PDF/Img)</>}
            <input type="file" multiple className="hidden" accept=".pdf,image/*" onChange={handleImport} disabled={loading} />
        </label>
      </div>

      {msg && (
        <div className={`p-4 mb-6 rounded-md flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      <form onSubmit={handleManualSubmit} className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Dados Motorista / Veículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Motorista</label>
                    <select name="driverName" value={formData.driverName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2">
                        <option value="">Selecione...</option>
                        {drivers.map(d => <option key={d.id} value={d.name}>{d.name} ({d.cpf})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Placa (Veículos Cadastrados)</label>
                    <select 
                      name="plate" 
                      value={formData.plate} 
                      onChange={handleChange} 
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 uppercase"
                      required
                    >
                      <option value="">Selecione a Placa...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.plate}>{v.plate} - {v.brand} {v.model}</option>
                      ))}
                    </select>
                </div>
                <div className="flex items-center pt-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="indicatesDriver" checked={formData.indicatesDriver} onChange={handleChange} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" />
                        <span className="text-sm font-medium text-slate-700">Indica Condutor?</span>
                    </label>
                </div>
            </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
             <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Dados da Infração</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Auto Infração (ID)</label>
                    <input name="autoInfraction" value={formData.autoInfraction} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Data</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-1">
                        Código <Search size={12} className="text-slate-400" />
                    </label>
                    <input name="code" value={formData.code} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" placeholder="Código Detran" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Órgão Autuador</label>
                    <input name="organ" value={formData.organ} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
                </div>
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Descrição (Automática)</label>
                    <input name="description" value={formData.description} readOnly className="mt-1 block w-full rounded-md border-slate-200 shadow-sm border p-2 bg-slate-100 italic" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700">Valor (R$)</label>
                    <input type="number" name="value" value={formData.value} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" step="0.01" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Pontos</label>
                    <input type="number" name="points" value={formData.points} readOnly className="mt-1 block w-full rounded-md border-slate-200 shadow-sm border p-2 bg-slate-100" />
                </div>
             </div>
             
             <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Local</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Situação Pgto</label>
                    <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2">
                        <option value="PENDING">Pendente</option>
                        <option value="PAID">Pago</option>
                        <option value="CANCELED">Cancelado</option>
                    </select>
                </div>
                 <div className="flex items-center pt-6">
                    <label className={`flex items-center space-x-2 cursor-pointer p-2 border rounded-lg transition w-full ${formData.payDouble ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-red-200 text-red-700'}`}>
                        <input 
                          type="checkbox" 
                          name="payDouble" 
                          checked={formData.payDouble} 
                          onChange={handleChange} 
                          className="rounded text-red-600 focus:ring-red-500 w-5 h-5" 
                        />
                        <div>
                            <span className="text-sm font-bold block uppercase">Pagar Dobrado (x2)</span>
                            <span className={`text-[10px] block ${formData.payDouble ? 'text-red-100' : 'text-red-500'}`}>Sem pontos na CNH</span>
                        </div>
                    </label>
                </div>
             </div>
        </div>

        <button type="submit" className="w-full bg-slate-900 text-white py-3 px-4 rounded-md hover:bg-slate-800 transition font-medium text-lg shadow-xl">
            Salvar Infração
        </button>
      </form>
    </div>
  );
};
