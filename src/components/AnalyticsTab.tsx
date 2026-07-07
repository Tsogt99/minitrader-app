import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Award, BarChart3, PieChart, Activity, DollarSign, Calendar } from 'lucide-react';
import { Trade, User } from '../types.js';

type PeriodType = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';

interface AnalyticsTabProps {
  currentUser: User;
  key?: any;
}

export default function AnalyticsTab({ currentUser }: AnalyticsTabProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [period, setPeriod] = useState<PeriodType>('Month');
  const [loading, setLoading] = useState(false);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/journal?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setTrades(data);
      }
    } catch (err) {
      console.error('Fetch trades error in analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  // Filter & calculate based on trades
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalTradesCount = closedTrades.length;
  const profitableTrades = closedTrades.filter(t => t.profit > 0);
  const unprofitableTrades = closedTrades.filter(t => t.profit < 0);
  const winRate = totalTradesCount > 0 ? (profitableTrades.length / totalTradesCount) * 100 : 0;
  const netProfit = closedTrades.reduce((sum, t) => sum + t.profit, 0);
  const totalGrossProfit = profitableTrades.reduce((sum, t) => sum + t.profit, 0);
  const totalGrossLoss = unprofitableTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0);
  const averageProfit = totalTradesCount > 0 ? netProfit / totalTradesCount : 0;

  // Group trades by period
  const getGroupedData = () => {
    const groups: Record<string, number> = {};

    closedTrades.forEach(trade => {
      const date = new Date(trade.openTime);
      let key = '';

      if (period === 'Day') {
        // Group by Date string mn-MN e.g., "05/12"
        key = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'Week') {
        // Group by ISO week (approximate)
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 3600 * 1000));
        const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        key = `W-${weekNumber}`;
      } else if (period === 'Month') {
        // Group by Month e.g., "7-р сар"
        key = `${date.getMonth() + 1}-р сар`;
      } else if (period === 'Quarter') {
        // Group by Quarter
        const q = Math.ceil((date.getMonth() + 1) / 3);
        key = `Q-${q}`;
      } else if (period === 'Year') {
        // Group by Year e.g., "2026"
        key = `${date.getFullYear()}`;
      }

      groups[key] = (groups[key] || 0) + trade.profit;
    });

    // Convert to ordered array
    let sortedKeys = Object.keys(groups);
    if (period === 'Month') {
      sortedKeys.sort((a, b) => parseInt(a) - parseInt(b));
    } else if (period === 'Day') {
      // Sort day strings mm/dd chronologically (approximate since they are formatted)
      sortedKeys.sort((a, b) => {
        const [da, ma] = a.split('/').map(Number);
        const [db, mb] = b.split('/').map(Number);
        return ma === mb ? da - db : ma - mb;
      });
    } else {
      sortedKeys.sort();
    }

    return sortedKeys.map(key => ({
      label: key,
      value: groups[key]
    }));
  };

  const chartData = getGroupedData();

  // Custom SVG Bar Chart Constants
  const chartHeight = 220;
  const padding = 30;
  const values = chartData.map(d => d.value);
  const maxVal = values.length > 0 ? Math.max(...values.map(Math.abs), 100) : 100;

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            График, Шинжилгээ & Үзүүлэлт
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Өдөр, 7 хоног, Сар, Улирал, Жилээр арилжааны ашиг, алдагдлын үзүүлэлт болон статистик гүйцэтгэлээ хянаарай.
          </p>
        </div>

        {/* Period selection */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          {(['Day', 'Week', 'Month', 'Quarter', 'Year'] as const).map((p) => {
            const labels = { Day: 'Өдөр', Week: '7 хоног', Month: 'Сар', Quarter: 'Улирал', Year: 'Жил' };
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  period === p ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total profit card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10">
            <TrendingUp className="h-12 w-12 text-emerald-400" />
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Цэвэр Ашиг</div>
          <div className={`text-2xl font-black font-sans mt-2 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}$
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">Нийт арилжааны дүн</div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10">
            <Award className="h-12 w-12 text-blue-500" />
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Амжилтын хувь (Win Rate)</div>
          <div className="text-2xl font-black text-white font-sans mt-2">
            {winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">{profitableTrades.length} ашигтай / {totalTradesCount} арилжаа</div>
        </div>

        {/* Total Gross Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10">
            <DollarSign className="h-12 w-12 text-emerald-400" />
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Нийт олсон ашиг</div>
          <div className="text-2xl font-black text-emerald-400 font-sans mt-2">
            +{totalGrossProfit.toLocaleString()}$
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">Ашигтай орсон арилжаанууд</div>
        </div>

        {/* Total Gross Loss */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10">
            <Activity className="h-12 w-12 text-rose-500" />
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Нийт алдсан дүн</div>
          <div className="text-2xl font-black text-rose-400 font-sans mt-2">
            -{totalGrossLoss.toLocaleString()}$
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">Алдагдалтай арилжаанууд</div>
        </div>
      </div>

      {/* Charts Block */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Curve Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-emerald-400" /> {period === 'Day' ? 'Өдөр өдрийн' : period === 'Week' ? '7 хоногийн' : period === 'Month' ? 'Сар сарын' : period === 'Quarter' ? 'Улирлын' : 'Жилийн'} Ашиг, Алдагдал
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Үзүүлэлт: USD</span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-xs">
              График зурахад хангалттай өгөгдөл байхгүй байна.
            </div>
          ) : (
            /* Responsive SVG Custom Bar Chart */
            <div className="w-full relative">
              <svg viewBox={`0 0 500 ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                {/* Midline (zero line) */}
                <line
                  x1="30"
                  y1={chartHeight / 2}
                  x2="480"
                  y2={chartHeight / 2}
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4"
                />

                {/* Bars */}
                {chartData.map((d, i) => {
                  const barWidth = 320 / Math.max(chartData.length, 6);
                  const xPos = 40 + i * ((420) / chartData.length);
                  
                  // Calculate height proportionally to maxVal
                  const ratio = Math.abs(d.value) / maxVal;
                  const barHeight = ratio * ((chartHeight / 2) - padding);
                  
                  // Determine yPos: if positive, starts above midline, if negative starts below midline
                  const isPos = d.value >= 0;
                  const yPos = isPos ? (chartHeight / 2) - barHeight : (chartHeight / 2);

                  return (
                    <g key={d.label}>
                      {/* Interactive hover container */}
                      <rect
                        x={xPos - 5}
                        y={padding}
                        width={barWidth + 10}
                        height={chartHeight - padding * 2}
                        fill="transparent"
                        className="group cursor-pointer"
                      />
                      {/* The actual colored bar */}
                      <rect
                        x={xPos}
                        y={yPos}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        rx="3"
                        fill={isPos ? '#10b981' : '#f43f5e'}
                        opacity="0.85"
                        className="transition-all duration-300 hover:opacity-100"
                      />
                      {/* Label on X Axis */}
                      <text
                        x={xPos + barWidth / 2}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                        className="font-mono font-bold"
                      >
                        {d.label}
                      </text>
                      {/* Profit value above/below bar */}
                      <text
                        x={xPos + barWidth / 2}
                        y={isPos ? yPos - 6 : yPos + barHeight + 11}
                        textAnchor="middle"
                        fill={isPos ? '#34d399' : '#f87171'}
                        fontSize="7"
                        className="font-mono font-bold opacity-0 hover:opacity-100 transition-opacity duration-200"
                      >
                        {isPos ? '+' : ''}{Math.round(d.value)}$
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="text-[10px] text-slate-500 text-center mt-2 italic">
                * Баганууд дээгүүр хулганаа чирэхэд тухайн өдрийн ашгийн хэмжээ тод харагдана.
              </div>
            </div>
          )}
        </div>

        {/* Win Rate circular gauge & Extra metrics column */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-emerald-400" /> Арилжааны Гүйцэтгэл
            </h3>

            {/* Circular Win Rate Gauge */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative h-32 w-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="10"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - winRate / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white font-sans">{winRate.toFixed(1)}%</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Win Rate</span>
                </div>
              </div>
            </div>

            {/* Minor KPI lists */}
            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Нийт хаасан арилжаа:</span>
                <span className="font-bold text-white font-mono">{totalTradesCount}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Ашигтай хаасан:</span>
                <span className="font-bold text-emerald-400 font-mono">{profitableTrades.length}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Алдагдалтай хаасан:</span>
                <span className="font-bold text-rose-400 font-mono">{unprofitableTrades.length}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Арилжаа бүрийн дундаж дүн:</span>
                <span className={`font-bold font-mono ${averageProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {averageProfit >= 0 ? '+' : ''}{averageProfit.toFixed(1)}$
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center text-[10px] text-slate-500 mt-4 leading-relaxed">
            💡 <strong>Амжилтын хувь</strong> (Win Rate) 50%-иас дээш бөгөөд арилжааны дундаж ашиг эерэг байх нь урт хугацааны тогтвортой өсөлтийн үндэс юм.
          </div>
        </div>
      </div>
    </div>
  );
}
