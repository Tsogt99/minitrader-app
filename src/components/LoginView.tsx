import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, TrendingUp, Key, User } from 'lucide-react';
import { User as UserType } from '../types.js';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Хэрэглэгчийн нэр болон нууц үгээ оруулна уу.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Нэвтрэхэд алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Сервертэй холбогдоход алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Abstract Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans">
            MINI TRADER
          </h1>
          <p className="text-emerald-400 font-medium text-sm tracking-wide">
            "Арилжаачин таны үнэнч туслах"
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Хэрэглэгчийн нэр
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition text-sm"
                placeholder="Minitrader777 эсвэл DemoTrader"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Нууц үг
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center text-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Системд нэвтрэх'
            )}
          </button>
        </form>

        {/* Credentials hints for quick review and testing */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
            Туршилтын нэвтрэх эрхүүд
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div
              onClick={() => {
                setUsername('Minitrader777');
                setPassword('Tsogt200@');
              }}
              className="p-2.5 bg-slate-950/50 border border-slate-800/40 rounded-xl cursor-pointer hover:border-emerald-500/40 transition text-center"
            >
              <div className="text-[10px] text-emerald-400 font-bold uppercase">Админ</div>
              <div className="text-[11px] text-slate-300 font-mono">Minitrader777</div>
              <div className="text-[10px] text-slate-500 font-mono">Tsogt200@</div>
            </div>
            <div
              onClick={() => {
                setUsername('DemoTrader');
                setPassword('Demo123!');
              }}
              className="p-2.5 bg-slate-950/50 border border-slate-800/40 rounded-xl cursor-pointer hover:border-emerald-500/40 transition text-center"
            >
              <div className="text-[10px] text-blue-400 font-bold uppercase">Хэрэглэгч</div>
              <div className="text-[11px] text-slate-300 font-mono">DemoTrader</div>
              <div className="text-[10px] text-slate-500 font-mono">Demo123!</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-600">
            Дээрх картууд дээр дарж нэвтрэх талбарыг автоматаар бөглөнө үү.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
