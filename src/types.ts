export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
  email?: string;
}

export interface Trade {
  id: string;
  ticket: string; // MT5 ticket number or manual ID
  userId: string;
  symbol: 'NASDAQ' | 'XAUUSD' | string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice?: number;
  openTime: string;
  closeTime?: string;
  profit: number; // positive for profit, negative for loss
  notes?: string;
  emotion?: 'neutral' | 'confident' | 'anxious' | 'greedy' | 'fearful' | 'disciplined';
  status: 'open' | 'closed';
  stopLoss?: number;
  takeProfit?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  originalTitle: string;
  source: 'Forex Factory' | 'Investing.com' | 'AI Generated';
  url: string;
  date: string;
  category: 'Nasdaq' | 'Gold' | 'Both' | 'General';
  translationMongolian: string;
  aiAnalysis: string; // Шинжилгээ, дүгнэлт
  aiPrediction: string; // Таамаг
  forecast?: string; // Таамаг утга
  actual?: string; // Бодит гарсан утга
  previous?: string; // Өмнөх утга
  impactLevel?: 'High' | 'Medium' | 'Low'; // Нөлөөллийн зэрэг
  marketOutcome?: string; // Мэдээний бодит үр дүн, зах зээлийн нөлөө
}

export interface TradingAccount {
  id: string;
  userId: string;
  accountNumber: string; // MT5/MT4 account ID
  broker: string; // Broker name
  accountType: 'Demo' | 'Real' | 'Prop';
  balance: number;
  leverage: string; // e.g., "1:100", "1:500"
  currency: string; // e.g., "USD", "MNT"
  createdAt: string;
  notes?: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientUsername: string;
  generatedPassword: string;
  sentAt: string;
  status: 'sent';
}
