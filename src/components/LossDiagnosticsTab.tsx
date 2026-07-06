import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity, AlertTriangle, Play, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Trade } from '../types.js';

export default function LossDiagnosticsTab() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [report, setReport] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [error, setError] = useState('');

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/journal');
      if (response.ok) {
        const data = await response.json();
        setTrades(data);
      }
    } catch (err) {
      console.error('Fetch trades error in diagnostics:', err);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const runLossDiagnostics = async () => {
    setAnalyzing(true);
    setError('');
    setReport('');

    // Simulated scanning process for cool UI feedback
    const statuses = [
      'Алдагдалтай арилжааны түүхийг нэгтгэж байна...',
      'Улирлын болон улирал хоорондын хамаарлыг бодож байна...',
      'Алдагдал хамгийн их гарсан гараг, өдрүүдийг тодорхойлж байна...',
      'Арилжаа нээсэн цаг болон хөрвөх чадварын савлагааг холбож байна...',
      'Сэтгэл хөдлөл (greedy, fearful) болон алдагдлын хамаарлыг дүгнэж байна...',
      'AI Шинжээч дүгнэлт болон зөвлөмжийг нэгтгэн бэлтгэж байна...'
    ];

    for (let i = 0; i < statuses.length; i++) {
      setAnalysisStatus(statuses[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const response = await fetch('/api/analytics/ai-report', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else {
        setError('AI шинжилгээ хийхэд алдаа гарлаа. Дахин оролдоно уу.');
      }
    } catch (err) {
      console.error('AI diagnostics API error:', err);
      setError('AI сервертэй холбогдож чадсангүй.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to format/parse Markdown to simple structured HTML
  const renderMarkdown = (mdText: string) => {
    if (!mdText) return null;
    
    const lines = mdText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-emerald-400 uppercase tracking-wider mt-5 mb-2 font-sans border-l-2 border-emerald-500 pl-2">
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h3 key={idx} className="text-base font-extrabold text-white tracking-tight mt-6 mb-3 border-b border-slate-800 pb-1 flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
            {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('#')) {
        return (
          <h2 key={idx} className="text-lg font-black text-white tracking-tight mt-7 mb-4 border-b-2 border-emerald-500/20 pb-2">
            {trimmed.replace(/^#\s*/, '')}
          </h2>
        );
      }
      
      // Unordered list
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        // Parse bold elements in bullet points
        const text = trimmed.replace(/^[-*]\s*/, '');
        return (
          <li key={idx} className="text-xs text-slate-300 leading-relaxed list-none pl-4 relative mb-2 font-sans">
            <span className="absolute left-0 text-emerald-400">•</span>
            {parseBoldText(text)}
          </li>
        );
      }

      // Normal lines / Paragraphs
      if (trimmed.length > 0) {
        return (
          <p key={idx} className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
            {parseBoldText(trimmed)}
          </p>
        );
      }

      return <div key={idx} className="h-2" />;
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-bold">{part}</strong>;
      }
      return part;
    });
  };

  // Pre-calculate basic stats to show immediately
  const lossTrades = trades.filter(t => t.profit < 0);
  const totalLossAmount = lossTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0);
  const biggestLoss = lossTrades.length > 0 ? Math.max(...lossTrades.map(t => Math.abs(t.profit))) : 0;

  // Find most dangerous day of week
  const getMostDangerousDay = () => {
    const days = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
    const counts: Record<string, number> = {};
    lossTrades.forEach(t => {
      const d = new Date(t.openTime).getDay();
      counts[days[d]] = (counts[days[d]] || 0) + Math.abs(t.profit);
    });
    
    let maxDay = 'Байхгүй';
    let maxVal = 0;
    Object.keys(counts).forEach(day => {
      if (counts[day] > maxVal) {
        maxVal = counts[day];
        maxDay = day;
      }
    });
    return maxDay;
  };

  // Find most dangerous hour of day
  const getMostDangerousHour = () => {
    const counts: Record<string, number> = {};
    lossTrades.forEach(t => {
      const hr = new Date(t.openTime).getHours();
      const interval = `${hr}:00 - ${hr + 1}:00`;
      counts[interval] = (counts[interval] || 0) + Math.abs(t.profit);
    });

    let maxHr = 'Байхгүй';
    let maxVal = 0;
    Object.keys(counts).forEach(hr => {
      if (counts[hr] > maxVal) {
        maxVal = counts[hr];
        maxHr = hr;
      }
    });
    return maxHr;
  };

  return (
    <div className="space-y-6">
      {/* Intro header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            AI Алдагдлын Шинжилгээ & Диагностик
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Таны алдагдалтай арилжааны түүхэнд дүн шинжилгээ хийж, алдаж буй улирал, гараг, цаг, сэтгэл зүйн хэв маягийг оношлон засч залруулах зөвлөмж өгнө.
          </p>
        </div>

        <button
          onClick={runLossDiagnostics}
          disabled={analyzing || trades.length === 0}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/15 disabled:opacity-50 self-start md:self-auto"
        >
          <Play className="h-3.5 w-3.5 fill-slate-950 text-slate-950" /> Шинжилгээ эхлүүлэх
        </button>
      </div>

      {/* Basic Metrics Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Нийт алдагдлын тоо</div>
          <div className="text-xl font-black text-rose-400 mt-2 font-mono">{lossTrades.length} удаа</div>
          <div className="text-[10px] text-slate-500 mt-1">Улаанаар хаагдсан захиалгууд</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Нийт алдагдлын дүн</div>
          <div className="text-xl font-black text-rose-400 mt-2 font-mono">-${totalLossAmount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-1">Нийт алдсан хөрөнгө</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Алдагдалтай гол гараг</div>
          <div className="text-xl font-black text-amber-400 mt-2">{getMostDangerousDay()}</div>
          <div className="text-[10px] text-slate-500 mt-1">Хамгийн өндөр алдагдалтай өдөр</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Алдагдалтай гол цаг</div>
          <div className="text-xl font-black text-amber-400 mt-2 font-mono">{getMostDangerousHour()}</div>
          <div className="text-[10px] text-slate-500 mt-1">Хамгийн өндөр алдагдалтай цаг</div>
        </div>
      </div>

      {/* Loader Diagnostics */}
      {analyzing && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            {/* Pulsating radar circles */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="h-16 w-16 bg-slate-950 border-2 border-emerald-500 rounded-full flex items-center justify-center z-10 relative">
              <Activity className="h-8 w-8 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-emerald-400 font-bold text-sm tracking-wide animate-pulse">
              AI ДИАГНОСТИК ИДЭВХТЭЙ АЖИЛЛАЖ БАЙНА
            </p>
            <p className="text-slate-300 text-xs font-mono">
              {analysisStatus}
            </p>
          </div>
          <div className="w-full max-w-xs bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full animate-[progress_5s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Generated Report Output */}
      {report && !analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Арилжааны Эрсдлийн AI Дүгнэлт Тайлан
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Мотто: "Арилжаачин таны үнэнч туслах"</p>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-full font-bold uppercase tracking-widest">
              Оношлогдсон
            </span>
          </div>

          {/* Formatted Markdown Content Container */}
          <div className="prose prose-invert max-w-none pt-2">
            {renderMarkdown(report)}
          </div>
        </motion.div>
      )}

      {/* Default placeholder state when no report has been run */}
      {!report && !analyzing && (
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-slate-600 mb-2" />
          <p className="text-slate-300 text-sm font-semibold">Одоогоор AI Алдагдлын шинжилгээ хийгдээгүй байна.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Баруун дээд буланд байрлах <strong>"Шинжилгээ эхлүүлэх"</strong> товчийг дарснаар AI таны бүх алдагдалтай арилжааны өгөгдлийг нэгтгэн, улирал, гараг, цаг болон сэтгэл зүйн хэв маягийг нарийн тодорхойлж зөвлөгөө тайлан боловсруулна.
          </p>
        </div>
      )}
    </div>
  );
}
