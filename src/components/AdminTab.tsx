import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, UserPlus, Mail, Key, Eye, EyeOff, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { EmailLog } from '../types.js';

export default function AdminTab() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<{ username: string; email: string; passwordGenerated: string } | null>(null);

  // Email Logs
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const fetchEmailLogs = async () => {
    setFetchingLogs(true);
    try {
      const response = await fetch('/api/admin/emails');
      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data.sort((a: EmailLog, b: EmailLog) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
      }
    } catch (err) {
      console.error('Fetch emails error:', err);
    } finally {
      setFetchingLogs(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessResult(null);

    if (!username || !email) {
      setError('Хэрэглэгчийн нэр болон и-мэйл хаягийг оруулна уу.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessResult({
          username: data.user.username,
          email: data.user.email,
          passwordGenerated: data.passwordGenerated
        });
        setUsername('');
        setEmail('');
        fetchEmailLogs(); // Refresh the email dispatch logs!
      } else {
        setError(data.error || 'Хэрэглэгч үүсгэхэд алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setError('Сервертэй холбогдож чадсангүй.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Intro header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          Админ Удирдлагын Хэсэг (Admin Panel)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Админ эрхээр нэвтэрсэн үед шинэ хэрэглэгч бүртгэх, AI-аар нууц үг үүсгүүлэх болон и-мэйл хүргэлтийг хянах боломжтой.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column: Create User Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-4">
              <UserPlus className="h-4.5 w-4.5 text-emerald-400" /> Шинэ хэрэглэгч нэмэх
            </h3>

            {error && (
              <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                  Хэрэглэгчийн Нэр
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none"
                  placeholder="Жишээ: BatTrader"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                  И-мэйл Хаяг (Email)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none"
                  placeholder="Жишээ: bat@gmail.com"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/60 text-[10px] text-slate-500 leading-relaxed">
                💡 Хэрэглэгч үүсгэх дарахад AI-аас тухайн хэрэглэгчид зориулсан <strong>аюулгүй, худалдаачинд тохиромжтой</strong> нууц үг зохиож, и-мэйл руу нь автоматаар илгээх процесс симуляци хийгдэнэ.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-xs uppercase"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Хэрэглэгч Үүсгэх
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Success Dialog Block if user just created */}
          {successResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" /> Хэрэглэгч амжилттай нэмэгдлээ!
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Нэвтрэх нэр:</span>
                  <span className="font-bold text-white">{successResult.username}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">И-мэйл:</span>
                  <span className="font-bold text-white">{successResult.email}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-850">
                  <span className="text-slate-400 font-semibold text-[10px]">AI-ГЕНЕРАТОР НУУЦ ҮГ:</span>
                  <span className="font-mono font-black text-emerald-400 text-xs tracking-wider">
                    {successResult.passwordGenerated}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed italic text-center">
                * Уг нууц үгийг ({successResult.email}) хаяг руу симуляци хийж илгээв. Баруун талын жагсаалтаас хянаж болно.
              </p>
            </motion.div>
          )}
        </div>

        {/* Right column: Email Log Viewer */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Илгээсэн и-мэйлүүд (Email Log)</span>
            </div>
            <button
              onClick={fetchEmailLogs}
              disabled={fetchingLogs}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fetchingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto">
            {fetchingLogs && emailLogs.length === 0 ? (
              <div className="py-20 text-center">
                <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Бүртгэлүүдийг татаж байна...</p>
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center">
                <Mail className="h-8 w-8 text-slate-700 mb-2" />
                <p className="text-xs font-medium">Одоогоор илгээсэн и-мэйл лог байхгүй байна.</p>
              </div>
            ) : (
              emailLogs.map((log) => {
                const showPass = showPasswords[log.id] || false;
                const sentDate = new Date(log.sentAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(log.sentAt).toLocaleDateString('mn-MN');

                return (
                  <div key={log.id} className="p-4 hover:bg-slate-950/20 space-y-3 transition text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-300">{log.recipientEmail}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{sentDate}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase font-semibold">Нэвтрэх нэр</div>
                        <div className="font-bold text-white text-[11px] font-mono mt-0.5">{log.username}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase font-semibold">Нууц үг</div>
                          <div className="font-black text-emerald-400 text-[11px] font-mono mt-0.5">
                            {showPass ? log.password : '••••••••'}
                          </div>
                        </div>
                        <button
                          onClick={() => togglePasswordVisibility(log.id)}
                          className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                        >
                          {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 italic">Сэдэв: {log.subject}</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">
                        Диспатч хийгдэв
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
