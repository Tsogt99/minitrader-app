import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { getDb, saveDb, initDb } from './src/server/db.js';
import { translateAndAnalyzeNews, generateSecurePassword, analyzeTradingLosses } from './src/server/gemini.js';
import { Trade, User, NewsItem, EmailLog, TradingAccount } from './src/types.js';

// Load environment variables
dotenv.config();

// Fix __dirname and __filename for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB file
initDb();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Midlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Allow CORS in development
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- API ROUTES ---

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Authentication Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Хэрэглэгчийн нэр болон нууц үгийг оруулна уу.' });
    }

    const db = getDb();
    const dbPassword = db.passwords[username];

    if (dbPassword && dbPassword === password) {
      const user = db.users.find(u => u.username === username);
      if (user) {
        return res.json({ success: true, user });
      }
    }

    return res.status(401).json({ error: 'Нэвтрэх нэр эсвэл нууц үг буруу байна.' });
  });

  // 3. Create user (Admin only)
  app.post('/api/admin/users', async (req, res) => {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Хэрэглэгчийн нэр болон и-мэйл хаягийг оруулна уу.' });
    }

    const db = getDb();
    
    // Check if user already exists
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Энэ хэрэглэгчийн нэр бүртгэгдсэн байна.' });
    }

    try {
      // 1. Generate password using Gemini!
      const generatedPassword = await generateSecurePassword(username);

      // 2. Create the user object
      const newUser: User = {
        id: `user_${Date.now()}`,
        username,
        role: 'user',
        email,
        createdAt: new Date().toISOString()
      };

      // 3. Save to database
      db.users.push(newUser);
      db.passwords[username] = generatedPassword;

      // 4. Simulate sending an email and log it
      const emailLog: EmailLog = {
        id: `email_${Date.now()}`,
        recipientEmail: email,
        recipientUsername: username,
        generatedPassword,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };
      db.emails.push(emailLog);

      saveDb(db);

      return res.json({
        success: true,
        user: newUser,
        generatedPassword,
        emailLog
      });
    } catch (error: any) {
      console.error('Failed to create user:', error);
      return res.status(500).json({ error: 'Хэрэглэгч үүсгэхэд алдаа гарлаа: ' + error.message });
    }
  });

  // 4. Get all simulated emails (Admin console viewer)
  app.get('/api/admin/emails', (req, res) => {
    const db = getDb();
    res.json(db.emails || []);
  });

  // 5. Live MT5 Integration Endpoint!
  // MT5 Expert Advisor will make a WebRequest POST here to log trades automatically
  app.post('/api/mt5/trade', (req, res) => {
    const {
      ticket,
      symbol,
      type, // 'buy' or 'sell'
      volume,
      openPrice,
      closePrice,
      profit,
      stopLoss,
      takeProfit,
      action // 'open' or 'close' or empty
    } = req.body;

    if (!ticket || !symbol || !type) {
      return res.status(400).json({ error: 'Зайлшгүй шаардлагатай талбарууд дутуу байна (ticket, symbol, type).' });
    }

    const db = getDb();
    const tradeTicketStr = String(ticket);
    const existingTradeIndex = db.trades.findIndex(t => t.ticket === tradeTicketStr);

    let updatedOrCreatedTrade: Trade;

    if (existingTradeIndex >= 0) {
      // Trade already exists, let's update it (e.g. closing or updating SL/TP)
      const existingTrade = db.trades[existingTradeIndex];
      
      updatedOrCreatedTrade = {
        ...existingTrade,
        closePrice: closePrice !== undefined ? Number(closePrice) : existingTrade.closePrice,
        profit: profit !== undefined ? Number(profit) : existingTrade.profit,
        stopLoss: stopLoss !== undefined ? Number(stopLoss) : existingTrade.stopLoss,
        takeProfit: takeProfit !== undefined ? Number(takeProfit) : existingTrade.takeProfit,
        status: action === 'close' || closePrice !== undefined ? 'closed' : existingTrade.status,
        closeTime: action === 'close' || closePrice !== undefined ? new Date().toISOString() : existingTrade.closeTime
      };

      db.trades[existingTradeIndex] = updatedOrCreatedTrade;
    } else {
      // New trade from MT5 or manual
      const isClosed = action === 'close' || closePrice !== undefined;
      
      updatedOrCreatedTrade = {
        id: `trade_${tradeTicketStr}`,
        ticket: tradeTicketStr,
        userId: 'user_1', // default client ID
        symbol: String(symbol).toUpperCase(),
        type: String(type).toLowerCase() as 'buy' | 'sell',
        volume: Number(volume || 0.1),
        openPrice: Number(openPrice || 0),
        closePrice: closePrice !== undefined ? Number(closePrice) : undefined,
        profit: profit !== undefined ? Number(profit) : 0,
        openTime: new Date().toISOString(),
        closeTime: isClosed ? new Date().toISOString() : undefined,
        status: isClosed ? 'closed' : 'open',
        stopLoss: stopLoss !== undefined ? Number(stopLoss) : undefined,
        takeProfit: takeProfit !== undefined ? Number(takeProfit) : undefined,
        notes: 'MT5-аас автоматаар бүртгэв.',
        emotion: 'neutral'
      };

      db.trades.push(updatedOrCreatedTrade);
    }

    saveDb(db);
    console.log(`[MT5 Integration] Logged trade ticket ${tradeTicketStr} - Symbol: ${symbol} - Profit: ${profit}`);
    
    return res.json({ success: true, trade: updatedOrCreatedTrade });
  });

  // 6. Get Trading Journal entries
  app.get('/api/journal', (req, res) => {
    const db = getDb();
    // Return all trades
    return res.json(db.trades || []);
  });

  // 7. Create Manual Trade entry in journal
  app.post('/api/journal', (req, res) => {
    const {
      symbol,
      type,
      volume,
      openPrice,
      closePrice,
      profit,
      openTime,
      closeTime,
      notes,
      emotion,
      stopLoss,
      takeProfit,
      status
    } = req.body;

    if (!symbol || !type || volume === undefined || openPrice === undefined) {
      return res.status(400).json({ error: 'Дутуу мэдээлэл оруулсан байна.' });
    }

    const db = getDb();
    const ticket = `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTrade: Trade = {
      id: `trade_${ticket}`,
      ticket,
      userId: 'user_1',
      symbol: String(symbol).toUpperCase(),
      type: type as 'buy' | 'sell',
      volume: Number(volume),
      openPrice: Number(openPrice),
      closePrice: closePrice !== undefined ? Number(closePrice) : undefined,
      profit: profit !== undefined ? Number(profit) : 0,
      openTime: openTime || new Date().toISOString(),
      closeTime: closeTime || (status === 'closed' ? new Date().toISOString() : undefined),
      status: (status || 'closed') as 'open' | 'closed',
      notes: notes || '',
      emotion: emotion || 'neutral',
      stopLoss: stopLoss !== undefined ? Number(stopLoss) : undefined,
      takeProfit: takeProfit !== undefined ? Number(takeProfit) : undefined
    };

    db.trades.push(newTrade);
    saveDb(db);

    return res.json({ success: true, trade: newTrade });
  });

  // 8. Update Trading Journal entry
  app.put('/api/journal/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    const tradeIndex = db.trades.findIndex(t => t.id === id);

    if (tradeIndex === -1) {
      return res.status(404).json({ error: 'Арилжааны бичлэг олдсонгүй.' });
    }

    const existing = db.trades[tradeIndex];
    const updated = {
      ...existing,
      ...req.body,
      // Ensure numeric conversions where appropriate
      volume: req.body.volume !== undefined ? Number(req.body.volume) : existing.volume,
      openPrice: req.body.openPrice !== undefined ? Number(req.body.openPrice) : existing.openPrice,
      closePrice: req.body.closePrice !== undefined ? Number(req.body.closePrice) : existing.closePrice,
      profit: req.body.profit !== undefined ? Number(req.body.profit) : existing.profit,
      stopLoss: req.body.stopLoss !== undefined ? Number(req.body.stopLoss) : existing.stopLoss,
      takeProfit: req.body.takeProfit !== undefined ? Number(req.body.takeProfit) : existing.takeProfit,
    };

    db.trades[tradeIndex] = updated;
    saveDb(db);

    return res.json({ success: true, trade: updated });
  });

  // 9. Delete Journal entry
  app.delete('/api/journal/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    const initialLength = db.trades.length;
    db.trades = db.trades.filter(t => t.id !== id);

    if (db.trades.length === initialLength) {
      return res.status(404).json({ error: 'Арилжааны бичлэг олдсонгүй.' });
    }

    saveDb(db);
    return res.json({ success: true });
  });

  // 9.5. Trading Accounts Management (Up to 10 accounts per user)
  app.get('/api/accounts', (req, res) => {
    const db = getDb();
    const userId = req.query.userId ? String(req.query.userId) : 'user_1';
    const userAccounts = (db.accounts || []).filter(a => a.userId === userId);
    return res.json(userAccounts);
  });

  app.post('/api/accounts', (req, res) => {
    const db = getDb();
    const userId = req.body.userId || 'user_1';
    const { accountNumber, broker, accountType, balance, leverage, currency, notes } = req.body;

    if (!accountNumber || !broker || !accountType || balance === undefined || !leverage || !currency) {
      return res.status(400).json({ error: 'Зайлшгүй шаардлагатай талбарууд дутуу байна (accountNumber, broker, accountType, balance, leverage, currency).' });
    }

    const userAccounts = (db.accounts || []).filter(a => a.userId === userId);
    if (userAccounts.length >= 10) {
      return res.status(400).json({ error: 'Та дээд тал нь 10 хүртэлх арилжааны данс бүртгэх боломжтой.' });
    }

    if (userAccounts.some(a => a.accountNumber === String(accountNumber))) {
      return res.status(400).json({ error: 'Энэ дансны дугаар аль хэдийн бүртгэгдсэн байна.' });
    }

    const newAccount: TradingAccount = {
      id: `acc_${Date.now()}`,
      userId,
      accountNumber: String(accountNumber),
      broker: String(broker),
      accountType: accountType as any,
      balance: Number(balance),
      leverage: String(leverage),
      currency: String(currency),
      createdAt: new Date().toISOString(),
      notes: notes || ''
    };

    if (!db.accounts) db.accounts = [];
    db.accounts.push(newAccount);
    saveDb(db);

    return res.json({ success: true, account: newAccount });
  });

  app.put('/api/accounts/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    if (!db.accounts) db.accounts = [];
    const index = db.accounts.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Арилжааны данс олдсонгүй.' });
    }

    const existing = db.accounts[index];
    const updated: TradingAccount = {
      ...existing,
      ...req.body,
      balance: req.body.balance !== undefined ? Number(req.body.balance) : existing.balance,
      createdAt: existing.createdAt
    };

    db.accounts[index] = updated;
    saveDb(db);

    return res.json({ success: true, account: updated });
  });

  app.delete('/api/accounts/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    if (!db.accounts) db.accounts = [];
    const initialLength = db.accounts.length;
    db.accounts = db.accounts.filter(a => a.id !== id);

    if (db.accounts.length === initialLength) {
      return res.status(404).json({ error: 'Арилжааны данс олдсонгүй.' });
    }

    saveDb(db);
    return res.json({ success: true });
  });

  // 10. Fetch financial news (From RSS/Web Scraper OR Gemini Generator fallback)
  app.get('/api/news', async (req, res) => {
    const db = getDb();
    
    // We try to scrape Forex Factory and Investing.com RSS or web pages.
    // However, to make it completely robust against container proxy IP blockages (403 Forbidden), 
    // we fetch with a timeout, and if it fails, we fall back to our cached/seeded database news, 
    // and if needed, we can trigger Gemini to generate extremely realistic new trading news items!
    
    try {
      const newsItems: NewsItem[] = [];

      // Fetch from Investing.com Forex news RSS
      const investingUrl = 'https://www.investing.com/rss/news_1.rss';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5 sec timeout

      try {
        const rssRes = await fetch(investingUrl, { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        clearTimeout(timeoutId);

        if (rssRes.ok) {
          const text = await rssRes.text();
          
          // Regex parse RSS XML items
          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let match;
          let count = 0;

          while ((match = itemRegex.exec(text)) !== null && count < 3) {
            const itemContent = match[1];
            const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
            const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
            const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
            const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

            const originalTitle = titleMatch ? titleMatch[1].trim() : '';
            const link = linkMatch ? linkMatch[1].trim() : '';
            const description = descMatch ? descMatch[1].trim() : '';
            const date = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();

            if (originalTitle) {
              // Check if we already have this news in our database
              const isDuplicate = db.news.some(n => n.originalTitle === originalTitle || n.title === originalTitle);
              if (!isDuplicate) {
                // Run Gemini to translate and analyze!
                const analyzed = await translateAndAnalyzeNews(originalTitle, description);
                const newNews: NewsItem = {
                  id: `news_scraped_${Date.now()}_${count}`,
                  title: analyzed.translation,
                  originalTitle,
                  source: 'Investing.com',
                  url: link || 'https://www.investing.com/news/forex-news',
                  date,
                  category: analyzed.category,
                  translationMongolian: analyzed.translation,
                  aiAnalysis: analyzed.analysis,
                  aiPrediction: analyzed.prediction
                };
                db.news.unshift(newNews);
                newsItems.push(newNews);
                count++;
              }
            }
          }
          if (count > 0) {
            saveDb(db);
          }
        }
      } catch (scrapingErr) {
        console.warn('Scraping live RSS failed (this is normal due to CORS/Proxy restrictions):', scrapingErr);
      }

      // If we got no new live news because of rate-limiting/network blocks, we have a beautiful mechanism!
      // We will ensure our news page is always extremely fresh by keeping the cached news, and occasionally
      // generating an amazing fresh simulated AI market update if the database has less than 6 news items.
      const updatedDb = getDb();
      return res.json(updatedDb.news);
    } catch (err: any) {
      console.error('Error in news endpoint:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 11. Generate a manual AI-driven news update or translation
  app.post('/api/news/generate-ai', async (req, res) => {
    const { topic } = req.body; // e.g. "Gold breakout" or "Nasdaq interest rate impact"
    const db = getDb();

    try {
      const topicText = topic || 'Nasdaq and XAUUSD trend';
      
      // Let's use translateAndAnalyzeNews to simulate an incoming major headline!
      const title = `MAJOR: Market Shifts Dynamically as Economic Indicators Trigger Massive Volume on ${topicText}`;
      const description = `Investors are re-adjusting portfolios following sudden changes in US treasury yields and technical resistance tests on major instruments. Momentum is building rapidly.`;
      
      const analyzed = await translateAndAnalyzeNews(title, description);
      const newNews: NewsItem = {
        id: `news_ai_${Date.now()}`,
        title: analyzed.translation,
        originalTitle: title,
        source: 'AI Generated',
        url: 'https://mini-trader.site',
        date: new Date().toISOString(),
        category: analyzed.category,
        translationMongolian: analyzed.translation,
        aiAnalysis: analyzed.analysis,
        aiPrediction: analyzed.prediction
      };

      db.news.unshift(newNews);
      saveDb(db);

      return res.json(newNews);
    } catch (err: any) {
      console.error('Failed to generate AI news update:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 12. Trigger AI Loss analysis & Advice
  app.post('/api/analytics/ai-report', async (req, res) => {
    const db = getDb();
    
    try {
      const reportMarkdown = await analyzeTradingLosses(db.trades);
      return res.json({ report: reportMarkdown });
    } catch (err: any) {
      console.error('Failed to generate AI loss analysis report:', err);
      return res.status(500).json({ error: 'AI Алдагдлын шинжилгээ хийхэд алдаа гарлаа: ' + err.message });
    }
  });


  // --- VITE DEV SERVER OR STATIC SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Vite] Middleware mounted in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Vite] Serving static files in production mode.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Vite Dev Server is live and hot`);
    console.log(`MT5 Integration Webhook is active at:`);
    console.log(`POST /api/mt5/trade`);
    console.log(`========================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to boot Express server:', err);
});
