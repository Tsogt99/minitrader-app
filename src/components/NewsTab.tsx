import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Newspaper, Sparkles, TrendingUp, SlidersHorizontal, RefreshCw, PlusCircle, AlertCircle } from 'lucide-react';
import { NewsItem } from '../types.js';

export default function NewsTab() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<'All' | 'Nasdaq' | 'Gold'>('All');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      } else {
        setError('Мэдээллийг татахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Fetch news error:', err);
      setError('Сервертэй холбогдож чадсангүй.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleGenerateAINews = async (topic: string) => {
    setGenerating(true);
    setError('');
    try {
      const response = await fetch('/api/news/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      if (response.ok) {
        const newItem = await response.json();
        setNews(prev => [newItem, ...prev]);
        setExpandedId(newItem.id); // Auto-expand the newly generated AI news!
      } else {
        setError('AI мэдээ үүсгэхэд алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Generate AI news error:', err);
      setError('AI сервертэй холбогдож чадсангүй.');
    } finally {
      setGenerating(false);
    }
  };

  const filteredNews = news.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Nasdaq') return item.category === 'Nasdaq' || item.category === 'Both';
    if (filter === 'Gold') return item.category === 'Gold' || item.category === 'Both';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-emerald-400" />
            Арилжааны Мэдээ & AI Шинжилгээ
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Nasdaq болон XAUUSD (Алт)-тай холбоотой шинэ мэдээнүүдийг монгол хэлээр орчуулж, AI дүгнэлт, таамаглалтай харуулна.
          </p>
        </div>

        {/* AI Generator Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Мэдээ үүсгэгч:
          </span>
          <button
            onClick={() => handleGenerateAINews('Nasdaq FOMC Interest Rate')}
            disabled={generating}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            <PlusCircle className="h-3.5 w-3.5 text-blue-400" /> NASDAQ & FOMC
          </button>
          <button
            onClick={() => handleGenerateAINews('Gold Spot breakout above 2700')}
            disabled={generating}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            <PlusCircle className="h-3.5 w-3.5 text-amber-400" /> XAUUSD Breakout
          </button>
          <button
            onClick={() => handleGenerateAINews('US Non-Farm Payrolls Volatility')}
            disabled={generating}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" /> NFP Мэдээ
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Filter and Refresh Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setFilter('All')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filter === 'All' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Бүх мэдээ
          </button>
          <button
            onClick={() => setFilter('Nasdaq')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filter === 'Nasdaq' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            NASDAQ
          </button>
          <button
            onClick={() => setFilter('Gold')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filter === 'Gold' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            XAUUSD (Алт)
          </button>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* News Listings */}
      <div className="space-y-4">
        {loading && news.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Мэдээлэл ачаалж байна...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Newspaper className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Одоогоор энэ ангилалд мэдээ байхгүй байна.</p>
          </div>
        ) : (
          filteredNews.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const itemDate = new Date(item.date).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) + ' | ' + new Date(item.date).toLocaleDateString('mn-MN');

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* News Card Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-6 cursor-pointer select-none space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          item.category === 'Gold'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : item.category === 'Nasdaq'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : item.category === 'Both'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.category === 'Gold' ? 'XAUUSD (Алт)' : item.category === 'Nasdaq' ? 'NASDAQ' : item.category === 'Both' ? 'NASDAQ & GOLD' : 'GENERAL'}
                      </span>
                      {item.impactLevel && (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                          item.impactLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          item.impactLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {item.impactLevel === 'High' ? 'Өндөр нөлөө' : item.impactLevel === 'Medium' ? 'Дунд нөлөө' : 'Бага нөлөө'}
                        </span>
                      )}
                      {item.actual && item.actual !== '-' && (
                        <span className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-full text-slate-300 border border-slate-800">
                          Бодит: {item.actual} / Таамаг: {item.forecast}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-semibold">{item.source}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{itemDate}</span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight leading-snug hover:text-emerald-400 transition">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1 italic font-mono">
                    Оригинал: "{item.originalTitle}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md text-[10px] tracking-wider uppercase">
                      <Sparkles className="h-3 w-3" /> AI шинжилгээ унших
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {isExpanded ? 'Хураах ▲' : 'Дэлгэрэнгүй үзэх ▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded AI Analysis Segment */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-slate-800/80 bg-slate-950/60 p-6 space-y-5"
                  >
                    {/* Translation Segment */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Монгол Орчуулга</div>
                      <p className="text-slate-200 text-sm leading-relaxed font-sans">{item.translationMongolian}</p>
                    </div>

                    {/* Economic Indicators & Market Outcomes Segment */}
                    {(item.forecast || item.actual || item.previous || item.marketOutcome) && (
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4" /> Мэдээний бодит үр дүн & Эдийн засгийн үзүүлэлтүүд
                          </div>
                          {item.impactLevel && (
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${
                              item.impactLevel === 'High' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                              item.impactLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              Нөлөөллийн зэрэг: {item.impactLevel === 'High' ? 'Өндөр' : item.impactLevel === 'Medium' ? 'Дунд' : 'Бага'}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-center bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                          <div className="space-y-0.5">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Бодит (Actual)</div>
                            <div className="text-sm font-bold text-white font-mono">{item.actual || '-'}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Таамаг (Forecast)</div>
                            <div className="text-sm font-bold text-slate-400 font-mono">{item.forecast || '-'}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Өмнөх (Previous)</div>
                            <div className="text-sm font-bold text-slate-400 font-mono">{item.previous || '-'}</div>
                          </div>
                        </div>

                        {item.marketOutcome && (
                          <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
                              Мэдээний бодит үр дүн & Зах зээлийн нөлөөлөл:
                            </div>
                            <p className="text-slate-200 text-xs leading-relaxed font-sans font-medium">
                              {item.marketOutcome}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Analysis and Predictions Block */}
                    <div className="grid md:grid-cols-2 gap-5">
                      {/* Analysis Block */}
                      <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                          <TrendingUp className="h-4 w-4" /> AI Шинжилгээ & Дүгнэлт
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed font-sans whitespace-pre-line">
                          {item.aiAnalysis}
                        </p>
                      </div>

                      {/* Predictions Block */}
                      <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold uppercase tracking-wide">
                          <Sparkles className="h-4 w-4 text-purple-400" /> AI Үнийн Таамаглал
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed font-sans whitespace-pre-line">
                          {item.aiPrediction}
                        </p>
                      </div>
                    </div>

                    {/* External Link */}
                    {item.url && (
                      <div className="pt-2 text-right">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-500 hover:text-emerald-400 transition underline"
                        >
                          Мэдээний эх сурвалж руу очих →
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
