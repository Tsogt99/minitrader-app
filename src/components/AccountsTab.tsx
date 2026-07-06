import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, 
  Wallet, TrendingUp, Info, Percent, RefreshCw, X, AlertCircle
} from 'lucide-react';
import { TradingAccount } from '../types.js';

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null); // holds account id if editing
  const [accountNumber, setAccountNumber] = useState('');
  const [broker, setBroker] = useState('');
  const [accountType, setAccountType] = useState<'Demo' | 'Real' | 'Prop'>('Demo');
  const [balance, setBalance] = useState('');
  const [leverage, setLeverage] = useState('1:100');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      } else {
        setError('Дансны мэдээллийг серверээс авахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Fetch accounts error:', err);
      setError('Сервертэй холбогдож чадсангүй.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const resetForm = () => {
    setAccountNumber('');
    setBroker('');
    setAccountType('Demo');
    setBalance('');
    setLeverage('1:100');
    setCurrency('USD');
    setNotes('');
    setIsEditing(null);
    setShowForm(false);
  };

  const handleOpenEdit = (acc: TradingAccount) => {
    setAccountNumber(acc.accountNumber);
    setBroker(acc.broker);
    setAccountType(acc.accountType);
    setBalance(acc.balance.toString());
    setLeverage(acc.leverage);
    setCurrency(acc.currency);
    setNotes(acc.notes || '');
    setIsEditing(acc.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!accountNumber || !broker || !accountType || !balance || !leverage || !currency) {
      setError('Зайлшгүй шаардлагатай бүх талбарыг бөглөнө үү.');
      return;
    }

    if (isNaN(Number(balance)) || Number(balance) < 0) {
      setError('Дансны үлдэгдэл зөв тоо байх ёстой.');
      return;
    }

    if (!isEditing && accounts.length >= 10) {
      setError('Уучлаарай, та дээд тал нь 10 хүртэлх арилжааны данс бүртгэх хязгаартай байна.');
      return;
    }

    const payload = {
      accountNumber,
      broker,
      accountType,
      balance: Number(balance),
      leverage,
      currency,
      notes
    };

    try {
      const url = isEditing ? `/api/accounts/${isEditing}` : '/api/accounts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(isEditing ? 'Дансны мэдээллийг амжилттай шинэчиллээ!' : 'Шинэ арилжааны дансыг амжилттай бүртгэлээ!');
        fetchAccounts();
        resetForm();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.error || 'Данс хадгалахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Submit account error:', err);
      setError('Хүсэлт илгээхэд алдаа гарлаа. Сервер ажиллаж байгаа эсэхийг шалгана уу.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Та энэ арилжааны дансыг бүртгэлээс устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Арилжааны дансыг амжилттай устгалаа.');
        fetchAccounts();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError('Дансыг устгахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Устгах хүсэлт илгээхэд алдаа гарлаа.');
    }
  };

  // Helper to format currency values
  const formatMoney = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Compute total balances across USD accounts
  const usdAccounts = accounts.filter(a => a.currency.toUpperCase() === 'USD');
  const mntAccounts = accounts.filter(a => a.currency.toUpperCase() === 'MNT');

  const totalUsdBalance = usdAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalMntBalance = mntAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            Арилжааны Дансны Удирдлага
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Та өөрийн ашигладаг 10 хүртэлх арилжааны дансуудаа бүртгэж, тэдгээрийн үлдэгдэл болон мэдээллийг нэг дороос хянах боломжтой.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={accounts.length >= 10}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <Plus className="h-4 w-4" /> Шинэ данс нэмэх
        </button>
      </div>

      {/* Account Limits Progress Tracker */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Metric 1: Registered count */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Бүртгэлтэй данс</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white">{accounts.length}</span>
              <span className="text-xs text-slate-500">/ 10 данс</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  accounts.length >= 9 ? 'bg-rose-500' : accounts.length >= 7 ? 'bg-amber-500' : 'bg-blue-400'
                }`}
                style={{ width: `${(accounts.length / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: USD Balance */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Нийт USD Үлдэгдэл</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {formatMoney(totalUsdBalance, 'USD')}
            </div>
            <div className="text-[10px] text-slate-500">
              {usdAccounts.length} данс ашиглаж байна
            </div>
          </div>
        </div>

        {/* Metric 3: MNT Balance */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Нийт MNT Үлдэгдэл</div>
            <div className="text-xl font-bold text-purple-400 font-mono">
              {totalMntBalance.toLocaleString()} ₮
            </div>
            <div className="text-[10px] text-slate-500">
              {mntAccounts.length} данс ашиглаж байна
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      {/* Registration/Edit Form Drawer modal */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-2xl relative"
        >
          <button 
            onClick={resetForm}
            className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-emerald-400" />
            {isEditing ? 'Арилжааны дансны мэдээлэл засварлах' : 'Шинэ арилжааны данс бүртгэх'}
          </h3>
          <p className="text-xs text-slate-400">
            Дансны мэдээллээ үнэн зөв бөглөснөөр арилжааны үр дүн, санхүүгийн анализыг данс тус бүрээр шүүж харах нөхцөл бүрдэнэ.
          </p>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">Дансны дугаар (MT4/MT5 ID) *</label>
              <input
                type="text"
                placeholder="жишээ нь: 50123456"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-emerald-500 text-slate-200 text-xs rounded-lg outline-none font-mono transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">Брокерын нэр (Broker) *</label>
              <input
                type="text"
                placeholder="жишээ нь: IC Markets, FTMO, Pepperstone"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-emerald-500 text-slate-200 text-xs rounded-lg outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">Дансны төрөл *</label>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['Demo', 'Real', 'Prop'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                      accountType === type ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type === 'Demo' ? 'Демо данс' : type === 'Real' ? 'Реал данс' : 'Проп данс'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">Баланс (Balance) *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="10000"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-emerald-500 text-slate-200 text-xs rounded-lg outline-none font-mono transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">Валют (Currency) *</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-emerald-500 text-slate-200 text-xs rounded-lg outline-none transition"
                >
                  <option value="USD">USD ($)</option>
                  <option value="MNT">MNT (₮)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">Хөшүүрэг (Leverage) *</label>
              <input
                type="text"
                placeholder="жишээ нь: 1:100, 1:500, 1:30"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-emerald-500 text-slate-200 text-xs rounded-lg outline-none font-mono transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">Тэмдэглэл (Notes)</label>
              <input
                type="text"
                placeholder="Дансны нэмэлт тайлбар, зорилго..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-emerald-500 text-slate-200 text-xs rounded-lg outline-none transition"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Цуцлах
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {isEditing ? 'Шинэчлэх' : 'Данс бүртгэх'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Account Cards Grid */}
      {loading && accounts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Дансны мэдээллийг ачаалж байна...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 p-8">
          <div className="h-14 w-14 rounded-full bg-slate-950 flex items-center justify-center mx-auto text-slate-500">
            <CreditCard className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="font-bold text-white text-sm">Одоогоор бүртгэлтэй арилжааны данс алга байна</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Та ашигладаг демо, бодит, болон проп дансаа нэмж оруулснаар арилжаа бүрийг тухайн данстай холбож удирдах боломжтой болно.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Анхны дансаа нэмэх
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const isDemo = acc.accountType === 'Demo';
            const isReal = acc.accountType === 'Real';
            const isProp = acc.accountType === 'Prop';

            return (
              <motion.div
                key={acc.id}
                layout
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:shadow-lg transition flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Account badge and number */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                      isReal ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      isProp ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {isReal ? 'REAL' : isProp ? 'PROP' : 'DEMO'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">#{acc.accountNumber}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 bg-slate-950 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white border border-slate-850 transition cursor-pointer"
                      title="Засварлах"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-rose-400 transition cursor-pointer"
                      title="Устгах"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Middle: Balance and Broker */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Дансны үлдэгдэл</div>
                  <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                    {formatMoney(acc.balance, acc.currency)}
                  </div>
                  <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <span>Брокер:</span>
                    <span className="text-slate-200 font-semibold">{acc.broker}</span>
                  </div>
                </div>

                {/* Card Bottom: Leverage and Notes */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Хөшүүрэг</div>
                    <div className="font-mono font-bold text-slate-300 mt-0.5">{acc.leverage}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Бүртгэсэн огноо</div>
                    <div className="text-slate-400 mt-0.5 font-mono text-[10px]">
                      {new Date(acc.createdAt).toLocaleDateString('mn-MN')}
                    </div>
                  </div>
                </div>

                {acc.notes && (
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 text-[11px] text-slate-400 leading-relaxed font-sans italic flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{acc.notes}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick tips */}
      <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex gap-3.5">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="h-4.5 w-4.5 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Чухал зөвлөгөө</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Та арилжаа бүртгэхдээ (Journal) тухайн арилжааг аль дансаар хийсэн болохыг зааж өгснөөр брокер тус бүрийн арилжааны үр дүн, амжилтын хувь, сэтгэл хөдлөлийн нөлөөллийг илүү бодитоор харах боломжтой болно. Мөн 10 дансны дээд хязгаарыг ухаалгаар ашиглаарай.
          </p>
        </div>
      </div>
    </div>
  );
}
