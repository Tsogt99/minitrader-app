import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { Trade, User } from '../types.js';

interface CalendarTabProps {
  currentUser: User;
  key?: any;
}

export default function CalendarTab({ currentUser }: CalendarTabProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const fetchTrades = async () => {
    try {
      const response = await fetch(`/api/journal?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setTrades(data);
      }
    } catch (err) {
      console.error('Fetch trades error in calendar:', err);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Handle Sunday-indexed or Monday-indexed grid. Let's make it Monday-indexed for standard Eurasian calendar!
  // Monday is 1, Sunday is 0.
  // Shift firstDayOfMonth: if 0 (Sunday) -> 6, else firstDayOfMonth - 1
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    'Нэгдүгээр сар (January)', 'Хоёрдугаар сар (February)', 'Гуравдугаар сар (March)',
    'Дөрөвдүгээр сар (April)', 'Тавдугаар сар (May)', 'Зургаадугаар сар (June)',
    'Долоодугаар сар (July)', 'Наймдугаар сар (August)', 'Есдүгээр сар (September)',
    'Аравдугаар сар (October)', 'Арван нэгдүгээр сар (November)', 'Арван хоёрдугаар сар (December)'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayTrades(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayTrades(null);
  };

  // Group trades by date
  const getDayTrades = (dayNum: number): Trade[] => {
    return trades.filter(t => {
      if (!t.openTime) return false;
      const tDate = new Date(t.openTime);
      return tDate.getFullYear() === year && tDate.getMonth() === month && tDate.getDate() === dayNum;
    });
  };

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    daysGrid.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push(i);
  }

  const handleDayClick = (dayNum: number) => {
    const dayTrades = getDayTrades(dayNum);
    if (dayTrades.length > 0) {
      setSelectedDayTrades(dayTrades);
      setSelectedDateStr(`${year} оны ${month + 1}-р сарын ${dayNum}`);
    } else {
      setSelectedDayTrades(null);
      setSelectedDateStr(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Tab Intro */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-emerald-400" />
          Арилжааны Календарь
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Өдөр бүрийн арилжааны нийлбэр дүнг календарь дээр харуулна. Аль өдрүүдэд ашигтай, аль өдрүүдэд алдагдалтай байснаа тод хараарай.
        </p>
      </div>

      {/* Month Switcher and Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {/* Header Month Control */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-white text-base">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-300 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2.5">
            {/* Week Days Headers */}
            {['Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бям', 'Ням'].map((day) => (
              <div key={day} className="text-center text-xs font-bold text-slate-500 py-1.5 uppercase tracking-wider">
                {day}
              </div>
            ))}

            {/* Grid Items */}
            {daysGrid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-slate-950/20 aspect-video rounded-xl" />;
              }

              const dayTrades = getDayTrades(day);
              const totalProfit = dayTrades.reduce((sum, t) => sum + t.profit, 0);
              const hasTrades = dayTrades.length > 0;
              const isProfit = totalProfit > 0;
              const isLoss = totalProfit < 0;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-video p-2 rounded-xl flex flex-col justify-between border cursor-pointer select-none transition duration-200 ${
                    hasTrades
                      ? isProfit
                        ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <span className={`text-xs font-bold ${hasTrades ? 'text-white' : 'text-slate-500'}`}>
                    {day}
                  </span>

                  {hasTrades && (
                    <span className={`text-[9px] sm:text-[10px] font-mono font-black text-center tracking-tight truncate ${
                      isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {isProfit ? '+' : ''}{Math.round(totalProfit)}$
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-3 mb-4 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-400" /> Өдрийн арилжааны дэлгэрэнгүй
            </h4>

            {selectedDayTrades ? (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                <p className="text-xs text-emerald-400 font-bold tracking-wide">
                  📅 {selectedDateStr}
                </p>

                {selectedDayTrades.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">#{t.ticket}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        t.type === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {t.type} {t.volume} Lot
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-bold">
                      <span className="text-xs text-slate-300">{t.symbol}</span>
                      <span className={`text-xs ${t.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.profit >= 0 ? '+' : ''}{t.profit.toLocaleString()}$
                      </span>
                    </div>

                    {t.notes && (
                      <p className="text-[10px] text-slate-400 border-t border-slate-850 pt-1.5 line-clamp-2">
                        {t.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center text-slate-500">
                <CalendarIcon className="h-8 w-8 text-slate-700 mb-3" />
                <p className="text-xs font-medium">Арилжаатай өдөр сонгоно уу.</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Арилжааны дүн бүртгэгдсэн өдрүүдийн нүдэн дээр дарахад дэлгэрэнгүй лог энд харагдана.
                </p>
              </div>
            )}
          </div>

          {selectedDayTrades && (
            <div className="pt-4 border-t border-slate-800 mt-4">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Нийт арилжаа:</span>
                <span className="font-bold text-white">{selectedDayTrades.length} оролт</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mt-1">
                <span>Нийт ашиг:</span>
                <span className={`font-bold ${
                  selectedDayTrades.reduce((sum, t) => sum + t.profit, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {selectedDayTrades.reduce((sum, t) => sum + t.profit, 0) >= 0 ? '+' : ''}
                  {selectedDayTrades.reduce((sum, t) => sum + t.profit, 0).toLocaleString()}$
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

