import React, { useState } from 'react';
import { ShieldCheck, User as UserIcon, Lock, UserPlus } from 'lucide-react';
import { login, saveUser } from '../services/storageService';
import { User } from '../types';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!username || !password || !name) {
        setError('Preencha todos os campos.');
        return;
      }
      const success = saveUser({ id: crypto.randomUUID(), username, password, name });
      if (success) {
        setIsRegistering(false);
        setError('Conta criada! Faça login.');
      } else {
        setError('Usuário já existe.');
      }
    } else {
      const user = login(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Usuário ou senha inválidos.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300">
        <div className="bg-blue-600 p-8 text-center">
          <ShieldCheck className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Controle e Gestão de Multas</h1>
          <p className="text-blue-100 text-sm mt-2">Gerenciamento Seguro de Frota</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-xl font-semibold text-slate-800 text-center">
            {isRegistering ? 'Crie sua conta' : 'Acesse o sistema'}
          </h2>

          {error && (
            <div className={`p-3 rounded-md text-sm text-center ${error.includes('sucesso') || error.includes('criada') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          {isRegistering && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Nome Completo" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>
          )}

          <div className="relative">
            <UserIcon className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Usuário" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition transform active:scale-95 shadow-lg shadow-blue-200"
          >
            {isRegistering ? 'Cadastrar' : 'Entrar'}
          </button>

          <div className="text-center">
            <button 
              type="button" 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1 mx-auto"
            >
              <UserPlus size={16} />
              {isRegistering ? 'Já tenho conta. Entrar' : 'Não tem conta? Registre-se'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};