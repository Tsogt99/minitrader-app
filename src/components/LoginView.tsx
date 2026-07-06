import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, TrendingUp, Key, User, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { User as UserType } from '../types.js';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot password states
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleView = () => {
    setError('');
    setSuccessMessage('');
    if (view === 'login') {
      setView('forgot');
    } else {
      setView('login');
    }
  };

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername || !forgotEmail || !newPassword || !confirmPassword) {
      setError('Бүх талбарыг бөглөнө үү.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Шинэ нууц үгнүүд хоорондоо тохирохгүй байна.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          email: forgotEmail,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Таны нууц үг амжилттай солигдлоо! Та шинэ нууц үгээрээ нэвтэрнэ үү.');
        // Clear forgot password fields
        setForgotUsername('');
        setForgotEmail('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Алдаа гарлаа. Та мэдээллээ дахин шалгана уу.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
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

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-xl flex items-start gap-2.5"
          >
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {view === 'login' ? (
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
                  placeholder="Хэрэглэгчийн нэр"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Нууц үг
                </label>
                <button
                  type="button"
                  onClick={handleToggleView}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition hover:underline"
                >
                  Нууц үг мартсан?
                </button>
              </div>
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
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-white">
              <h2 className="text-lg font-bold">Нууц үг шинэчлэх</h2>
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Та хэрэглэгчийн нэр болон бүртгэлтэй и-мэйл хаягаа оруулан шинээр ашиглах нууц үгээ шууд тохируулна уу.
            </p>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Хэрэглэгчийн нэр
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition text-xs"
                  placeholder="Жишээ: BatTrader"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                И-мэйл хаяг (Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition text-xs"
                  placeholder="Жишээ: bat@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Шинэ нууц үг
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition text-xs"
                  placeholder="Хамгийн багадаа 6 тэмдэгт"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Шинэ нууц үг давтах
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition text-xs"
                  placeholder="Дахин оруулна уу"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center text-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Нууц үг шинэчлэх'
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleView}
                className="w-full bg-transparent hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Буцах
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
