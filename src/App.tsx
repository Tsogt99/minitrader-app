import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Newspaper,
  BookOpen,
  Calendar,
  BarChart3,
  Sparkles,
  Cpu,
  Shield,
  LogOut,
  User as UserIcon,
  CircleDot,
  CreditCard,
  Sun,
  Moon
} from 'lucide-react';

import { User, Trade } from './types.js';
import LoginView from './components/LoginView.js';
import NewsTab from './components/NewsTab.js';
import JournalTab from './components/JournalTab.js';
import CalendarTab from './components/CalendarTab.js';
import AnalyticsTab from './components/AnalyticsTab.js';
import LossDiagnosticsTab from './components/LossDiagnosticsTab.js';
import MT5Tab from './components/MT5Tab.js';
import AdminTab from './components/AdminTab.js';
import AccountsTab from './components/AccountsTab.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('news');
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Day/Night theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('minitrader-theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.add('light-theme');
      body.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
      body.classList.remove('light-theme');
    }
    localStorage.setItem('minitrader-theme', theme);
  }, [theme]);

  // Dynamic statistics bar state
  const [statTrades, setStatTrades] = useState<Trade[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStatsData = async () => {
    try {
      const response = await fetch('/api/journal');
      if (response.ok) {
        const data = await response.json();
        setStatTrades(data);
      }
    } catch (err) {
      console.error('Error fetching global stats:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStatsData();
    }
  }, [currentUser, refreshCounter]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Set default tab based on role
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('news');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleTradesUpdated = () => {
    // Increment refresh counter to trigger state reload in all child modules
    setRefreshCounter(prev => prev + 1);
  };

  // Calculation for live header summary bar
  const totalTrades = statTrades.length;
  const netProfit = statTrades.reduce((sum, t) => sum + t.profit, 0);
  const winCount = statTrades.filter(t => t.profit > 0).length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Define side tabs
  const tabs = [
    { id: 'news', label: 'Арилжааны Мэдээ', icon: Newspaper, role: 'both' },
    { id: 'journal', label: 'Арилжааны Журнал', icon: BookOpen, role: 'both' },
    { id: 'accounts', label: 'Данс мэдээлэл', icon: CreditCard, role: 'both' },
    { id: 'calendar', label: 'Календарь', icon: Calendar, role: 'both' },
    { id: 'analytics', label: 'Гүйцэтгэлийн График', icon: BarChart3, role: 'both' },
    { id: 'loss', label: 'AI Диагностик', icon: Sparkles, role: 'both' },
    { id: 'mt5', label: 'MT5 Холболт', icon: Cpu, role: 'both' },
    { id: 'admin', label: 'Админ Удирдлага', icon: Shield, role: 'admin' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Upper Navigation and Header bar */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo and Brand slogan */}
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden h-16 w-16 flex items-center justify-center shrink-0">
              <img 
                src="/src/assets/images/minitrader_logo_1783322096320.jpg" 
                alt="MINITRADER Logo" 
                className={`h-full w-full object-contain transition-all duration-300 ${
                  theme === 'dark' ? 'invert mix-blend-screen' : 'mix-blend-multiply'
                }`}
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-wider text-white">MINITRADER</h1>
                <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">PRO</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-bold tracking-wide mt-0.5">
                "Арилжаачин таны үнэнч туслах"
              </p>
            </div>
          </div>

          {/* User profile with logout link */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                <UserIcon className="h-3 w-3 text-emerald-400" /> {currentUser.username}
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                {currentUser.role === 'admin' ? 'Администратор' : 'Худалдаачин'}
              </span>
            </div>

            {/* Theme toggle button */}
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-emerald-400 rounded-xl transition cursor-pointer flex items-center justify-center"
              title={theme === 'light' ? 'Шөнийн горим' : 'Өдрийн горим'}
            >
              {theme === 'light' ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Гарах</span>
            </button>
          </div>

        </div>
      </header>

      {/* Real-time stats ticker bar */}
      <div className="bg-slate-950 border-b border-slate-900/60 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase font-bold">Нийт захиалга:</span>
              <span className="font-bold text-white">{totalTrades}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase font-bold">Цэвэр ашиг:</span>
              <span className={`font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}$
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase font-bold">Win Rate:</span>
              <span className="font-bold text-white">{winRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Connected MT5 status line */}
          <div className="flex items-center gap-2 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
            <CircleDot className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              MT5 Terminal холболт бэлэн
            </span>
          </div>
        </div>
      </div>

      {/* Main Sidebar & Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="md:w-64 shrink-0 space-y-2">
          <div className="bg-slate-900 border border-slate-850/80 rounded-2xl p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2.5 pb-2 border-b border-slate-850/60 mb-2">
              Цэсний сонголт
            </div>
            {tabs
              .filter(tab => tab.role === 'both' || tab.role === currentUser.role)
              .map(tab => {
                const isSelected = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </div>

          <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-[10px] text-slate-500 font-sans leading-relaxed">
            💡 Мэдээ болон арилжаа бүрийг шинжлэхдээ манай AI шинжээчийг ашиглан арилжааны эрсдэлээ удирдаарай.
          </div>
        </aside>

        {/* Content Section Container */}
        <section className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'news' && <NewsTab />}
            {activeTab === 'journal' && <JournalTab onTradesUpdated={handleTradesUpdated} />}
            {activeTab === 'accounts' && <AccountsTab />}
            {activeTab === 'calendar' && <CalendarTab key={refreshCounter} />}
            {activeTab === 'analytics' && <AnalyticsTab key={refreshCounter} />}
            {activeTab === 'loss' && <LossDiagnosticsTab key={refreshCounter} />}
            {activeTab === 'mt5' && <MT5Tab />}
            {activeTab === 'admin' && currentUser.role === 'admin' && <AdminTab />}
          </motion.div>
        </section>

      </main>

      {/* Brand Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold tracking-wide">MINI TRADER - Арилжаачин таны үнэнч туслах</p>
          <p className="text-[10px] text-slate-700 mt-1">
            © 2026 Minitrader арилжааны платформ. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </footer>
    </div>
  );
}
