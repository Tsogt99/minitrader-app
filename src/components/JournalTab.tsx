import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, Save, Trash2, Edit2, X, Sparkles, AlertCircle, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';
import { Trade, User } from '../types.js';

interface JournalTabProps {
  currentUser: User;
  onTradesUpdated?: () => void;
}

export default function JournalTab({ currentUser, onTradesUpdated }: JournalTabProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Manual Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [symbol, setSymbol] = useState('XAUUSD');
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [volume, setVolume] = useState('0.1');
  const [openPrice, setOpenPrice] = useState('');
  const [closePrice, setClosePrice] = useState('');
  const [profit, setProfit] = useState('');
  const [emotion, setEmotion] = useState<'neutral' | 'confident' | 'anxious' | 'greedy' | 'fearful' | 'disciplined'>('neutral');
  const [notes, setNotes] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  // Editing States
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editEmotion, setEditEmotion] = useState<'neutral' | 'confident' | 'anxious' | 'greedy' | 'fearful' | 'disciplined'>('neutral');

  const fetchTrades = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/journal?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setTrades(data.sort((a: Trade, b: Trade) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime()));
      } else {
        setError('Журнал мэдээллийг татахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Fetch trades error:', err);
      setError('Сервертэй холбогдож чадсангүй.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!symbol || !openPrice || !profit) {
      setError('Шаардлагатай талбаруудыг бөглөнө үү.');
      return;
    }

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          symbol,
          type,
          volume: Number(volume || 0.1),
          openPrice: Number(openPrice),
          closePrice: closePrice ? Number(closePrice) : undefined,
          profit: Number(profit),
          emotion,
          notes,
          stopLoss: stopLoss ? Number(stopLoss) : undefined,
          takeProfit: takeProfit ? Number(takeProfit) : undefined,
          status: 'closed' // default added manual is completed
        }),
      });

      if (response.ok) {
        setSuccess('Арилжаа журналд амжилттай бүртгэгдлээ!');
        setShowAddForm(false);
        // Reset states
        setSymbol('XAUUSD');
        setType('buy');
        setVolume('0.1');
        setOpenPrice('');
        setClosePrice('');
        setProfit('');
        setEmotion('neutral');
        setNotes('');
        setStopLoss('');
        setTakeProfit('');
        
        fetchTrades();
        if (onTradesUpdated) onTradesUpdated();
      } else {
        const data = await response.json();
        setError(data.error || 'Арилжаа бүртгэхэд алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Add trade error:', err);
      setError('Сервертэй холбогдож чадсангүй.');
    }
  };

  const handleUpdateNotes = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: editNotes,
          emotion: editEmotion
        }),
      });

      if (response.ok) {
        setSuccess('Арилжааны тэмдэглэл шинэчлэгдлээ!');
        setEditingTradeId(null);
        fetchTrades();
        if (onTradesUpdated) onTradesUpdated();
      } else {
        setError('Тэмдэглэл шинэчлэхэд алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Update notes error:', err);
      setError('Сервертэй холбогдож чадсангүй.');
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (!window.confirm('Энэ арилжааг устгахдаа итгэлтэй байна уу?')) return;
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Арилжаа амжилттай устгагдлаа.');
        fetchTrades();
        if (onTradesUpdated) onTradesUpdated();
      } else {
        setError('Устгахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Delete trade error:', err);
      setError('Сервертэй холбогдож чадсангүй.');
    }
  };

  const getEmotionLabelAndEmoji = (emo: Trade['emotion']) => {
    switch (emo) {
      case 'confident': return { label: 'Итгэлтэй', emoji: '💪', color: 'text-emerald-400 bg-emerald-500/10' };
      case 'anxious': return { label: 'Сандарсан', emoji: '😰', color: 'text-amber-400 bg-amber-500/10' };
      case 'greedy': return { label: 'Шунасан', emoji: '🤑', color: 'text-purple-400 bg-purple-500/10' };
      case 'fearful': return { label: 'Айсан', emoji: '😨', color: 'text-rose-400 bg-rose-500/10' };
      case 'disciplined': return { label: 'Сахилга баттай', emoji: '🧘', color: 'text-blue-400 bg-blue-500/10' };
      default: return { label: 'Төвийг сахисан', emoji: '😐', color: 'text-slate-400 bg-slate-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Journal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            Арилжааны Журнал Хөтлөлт
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Арилжаа бүрийн сэтгэл хөдлөл, техникийн тэмдэглэлээ хөтөлж, дүн шинжилгээндээ ашиглаарай.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? 'Хаах' : 'Арилжаа Тэмдэглэх'}
          </button>
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

      {/* Manual Add Form (Dropdown-style) */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <form onSubmit={handleAddTrade} className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 mb-2 flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-emerald-400" /> Шинэ арилжааны тэмдэглэл оруулах
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Asset choice */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Хос / Сонголт</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="XAUUSD">XAUUSD (Gold Spot)</option>
                  <option value="NASDAQ">NASDAQ Index (IXIC)</option>
                  <option value="EURUSD">EURUSD</option>
                  <option value="GBPUSD">GBPUSD</option>
                </select>
              </div>

              {/* Type Choice */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Захиалгын Төрөл</label>
                <div className="grid grid-cols-2 bg-slate-950 rounded-xl p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setType('buy')}
                    className={`py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      type === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('sell')}
                    className={`py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      type === 'sell' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-400'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              {/* Volume (Lot) */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Лот хэмжээ (Volume)</label>
                <input
                  type="number"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  placeholder="0.1"
                />
              </div>

              {/* Profit / Loss */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Ашиг / Алдагдал ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={profit}
                  onChange={(e) => setProfit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  placeholder="Алдагдал бол хасах (-50)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Open Price */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Нээсэн үнэ (Open Price)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={openPrice}
                  onChange={(e) => setOpenPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  placeholder="2450.50"
                />
              </div>

              {/* Close Price */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Хаасан үнэ (Close Price)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={closePrice}
                  onChange={(e) => setClosePrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  placeholder="2462.10"
                />
              </div>

              {/* Stop Loss */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Stop Loss (SL)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  placeholder="Заавал биш"
                />
              </div>

              {/* Take Profit */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Take Profit (TP)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  placeholder="Заавал биш"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Emotion Selector */}
              <div className="md:col-span-1">
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Таны Сэтгэл Хөдлөл</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['confident', 'disciplined', 'neutral', 'anxious', 'greedy', 'fearful'] as const).map((emo) => {
                    const info = getEmotionLabelAndEmoji(emo);
                    return (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setEmotion(emo)}
                        className={`p-2.5 rounded-xl border text-[11px] font-medium text-left flex items-center gap-1.5 cursor-pointer transition ${
                          emotion === emo
                            ? 'bg-slate-950 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <span>{info.emoji}</span>
                        <span>{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Арилжааны Тэмдэглэл / Дүгнэлт</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-white text-xs focus:outline-none font-sans"
                  placeholder="Яагаад энэ оролтыг хийсэн, ямар загвар харсан эсвэл алдаа гаргаснаа дэлгэрэнгүй бичнэ үү..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase rounded-xl transition cursor-pointer flex items-center gap-1 shadow-lg shadow-emerald-500/10"
              >
                <Save className="h-4 w-4" /> Бүртгэлийг Хадгалах
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Trades Table Listings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-emerald-400" /> Арилжааны Логууд
          </h3>
          <button
            onClick={fetchTrades}
            disabled={loading}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && trades.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Арилжааны түүхийг ачаалж байна...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Арилжааны бичлэг одоогоор байхгүй байна.</p>
            <p className="text-xs text-slate-500 mt-1">
              Дээд хэсгээс гараар оруулах эсвэл MT5-тайгаа холбож автоматаар бүртгүүлээрэй.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-[10px] text-slate-400 uppercase tracking-widest font-bold border-b border-slate-800">
                  <th className="py-4 px-5">Ticket / Хугацаа</th>
                  <th className="py-4 px-5">Хос</th>
                  <th className="py-4 px-5">Захиалга</th>
                  <th className="py-4 px-5">Лот</th>
                  <th className="py-4 px-5">Нээсэн үнэ</th>
                  <th className="py-4 px-5">Хаасан үнэ</th>
                  <th className="py-4 px-5 text-right">Ашиг / Алдагдал</th>
                  <th className="py-4 px-5">Сэтгэл хөдлөл</th>
                  <th className="py-4 px-5 text-center">Удирдах</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trades.map((trade) => {
                  const isEditing = editingTradeId === trade.id;
                  const isProfit = trade.profit > 0;
                  const isLoss = trade.profit < 0;
                  const emotionInfo = getEmotionLabelAndEmoji(trade.emotion);

                  const openDate = new Date(trade.openTime);
                  const displayDate = openDate.toLocaleDateString('mn-MN') + ' ' + openDate.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <React.Fragment key={trade.id}>
                      <tr className="hover:bg-slate-950/40 text-xs transition">
                        {/* Ticket & Time */}
                        <td className="py-4 px-5">
                          <div className="font-mono text-slate-400 font-bold">{trade.ticket}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {displayDate}
                          </div>
                        </td>

                        {/* Symbol */}
                        <td className="py-4 px-5 font-bold text-white font-sans">
                          {trade.symbol}
                        </td>

                        {/* Order Type */}
                        <td className="py-4 px-5">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                              trade.type === 'buy'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {trade.type}
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="py-4 px-5 font-mono text-slate-300 font-medium">
                          {trade.volume.toFixed(2)}
                        </td>

                        {/* Open Price */}
                        <td className="py-4 px-5 font-mono text-slate-400">
                          {trade.openPrice.toLocaleString()}
                        </td>

                        {/* Close Price */}
                        <td className="py-4 px-5 font-mono text-slate-400">
                          {trade.closePrice ? trade.closePrice.toLocaleString() : 'Нээлттэй'}
                        </td>

                        {/* Profit or Loss */}
                        <td className={`py-4 px-5 text-right font-mono font-bold text-sm ${
                          isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {isProfit ? '+' : ''}{trade.profit.toLocaleString()}$
                        </td>

                        {/* Emotion tag */}
                        <td className="py-4 px-5">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-medium inline-flex items-center gap-1 border border-slate-800 ${emotionInfo.color}`}>
                            <span>{emotionInfo.emoji}</span>
                            <span>{emotionInfo.label}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  setEditingTradeId(null);
                                } else {
                                  setEditingTradeId(trade.id);
                                  setEditNotes(trade.notes || '');
                                  setEditEmotion(trade.emotion || 'neutral');
                                }
                              }}
                              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-emerald-400 rounded-lg transition cursor-pointer"
                            >
                              {isEditing ? <X className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Notes row / Edit Row */}
                      {(trade.notes || isEditing) && (
                        <tr className="bg-slate-950/20">
                          <td colSpan={9} className="py-3 px-6 border-b border-slate-800/40">
                            {isEditing ? (
                              <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 uppercase font-semibold">Сэтгэл хөдлөл:</span>
                                    <select
                                      value={editEmotion}
                                      onChange={(e) => setEditEmotion(e.target.value as any)}
                                      className="bg-slate-900 border border-slate-800 rounded-lg text-xs py-1 px-2.5 text-white focus:outline-none"
                                    >
                                      <option value="neutral">Neutral (Төвийг сахисан) 😐</option>
                                      <option value="confident">Confident (Итгэлтэй) 💪</option>
                                      <option value="disciplined">Disciplined (Сахилга баттай) 🧘</option>
                                      <option value="anxious">Anxious (Сандарсан) 😰</option>
                                      <option value="greedy">Greedy (Шунасан) 🤑</option>
                                      <option value="fearful">Fearful (Айсан) 😨</option>
                                    </select>
                                  </div>

                                  <button
                                    onClick={() => handleUpdateNotes(trade.id)}
                                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 self-end"
                                  >
                                    <Save className="h-3.5 w-3.5" /> Хадгалах
                                  </button>
                                </div>

                                <textarea
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  rows={2}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                                  placeholder="Энэ арилжаанаас сурсан зүйл эсвэл оролтын дэлгэрэнгүй тэмдэглэл..."
                                />
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 font-sans flex items-start gap-1.5">
                                <span className="text-emerald-400 font-semibold shrink-0">Тэмдэглэл:</span>
                                <span className="leading-relaxed whitespace-pre-line">{trade.notes}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
