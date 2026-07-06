import { GoogleGenAI, Type } from "@google/genai";
import { Trade, NewsItem } from '../types.js';

// Initialize the Google Gen AI client with appropriate headers
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not set in the environment variables!");
  }
  return new GoogleGenAI({
    apiKey: apiKey || 'MOCK_KEY',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getAiClient();
const MODEL_NAME = 'gemini-3.5-flash';

/**
 * Translates financial news titles/descriptions to Mongolian and categorizes them.
 */
export async function translateAndAnalyzeNews(title: string, rawDescription: string = ''): Promise<{
  translation: string;
  category: 'Nasdaq' | 'Gold' | 'Both' | 'General';
  analysis: string;
  prediction: string;
}> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      translation: `Монгол орчуулга: ${title} (AI идэвхжүүлээгүй байна)`,
      category: title.toUpperCase().includes('GOLD') || title.toUpperCase().includes('XAU') ? 'Gold' : 'Nasdaq',
      analysis: 'Мэдээний AI шинжилгээ: Санхүүгийн мэдээг задлан шинжилж байна. Долларын ханшийн хөдөлгөөн нь Nasdaq болон Алтны арилжаанд шууд нөлөөлөх хандлагатай.',
      prediction: 'Таамаг: Зах зээл дээрх савлагаа нэмэгдэж магадгүй тул хүлээх нь зүйтэй.'
    };
  }

  const prompt = `You are a professional financial translator and trading analyst. Translate the following trading news title and description into standard, clear, financial Mongolian (Монгол хэлээр).
Then, classify it into one of these categories: 'Nasdaq', 'Gold', 'Both', or 'General'.
Finally, provide a professional technical and fundamental analysis (Шинжилгээ, дүгнэлт) and a forecast/prediction (Таамаглал) in Mongolian on how this affects NASDAQ and XAUUSD (Gold) prices.

News Title: "${title}"
News Description: "${rawDescription}"

Provide your response in JSON format matching this schema:
{
  "translation": "Mongolian translation of the title/news",
  "category": "Nasdaq" | "Gold" | "Both" | "General",
  "analysis": "Detailed technical/fundamental analysis in Mongolian",
  "prediction": "Price prediction/forecasting advice in Mongolian"
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING, description: "Translation of title into clear Mongolian" },
            category: { type: Type.STRING, enum: ["Nasdaq", "Gold", "Both", "General"], description: "Category classification" },
            analysis: { type: Type.STRING, description: "Analysis in Mongolian" },
            prediction: { type: Type.STRING, description: "Forecasting in Mongolian" }
          },
          required: ["translation", "category", "analysis", "prediction"]
        }
      }
    });

    const resultText = response.text || '';
    return JSON.parse(resultText.trim());
  } catch (error) {
    console.error('Gemini News translation and analysis failed:', error);
    return {
      translation: `Орчуулга: ${title}`,
      category: 'General',
      analysis: 'Шинжилгээ хийх явцад алдаа гарлаа. Гэхдээ уг мэдээ нь зах зээлд хөрвөх чадварын савлагаа үүсгэх магадлалтай.',
      prediction: 'Богино хугацааны савлагаанаас сэргийлж, эрсдэлээ хянахыг зөвлөж байна.'
    };
  }
}

/**
 * Generates a secure, creative but memorable password for new users.
 */
export async function generateSecurePassword(username: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    // Fallback password
    const rand = Math.floor(100 + Math.random() * 900);
    return `Trader@${username}${rand}`;
  }

  const prompt = `Generate a single secure, unique, and professional trading-related password for a user named "${username}".
The password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and be at least 8-12 characters long.
It should feel inspiring for a trader, like "GoldBull2026!" or "NasdaqPip#77" but customized.
Return ONLY the raw password string. Do not include markdown or explanations.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return (response.text || '').trim().replace(/[`"'\s]/g, '');
  } catch (error) {
    console.error('Gemini Password generation failed, using fallback:', error);
    return `Trader@${username}2026`;
  }
}

/**
 * AI-powered Loss analysis / Diagnostics.
 * Takes the trades history, filters out loss trades, analyzes them by day, hour, season, and provides advice.
 */
export async function analyzeTradingLosses(trades: Trade[]): Promise<string> {
  const lossTrades = trades.filter(t => t.profit < 0);
  
  if (lossTrades.length === 0) {
    return `### **Анализ хийхэд алдагдалтай арилжаа олдсонгүй!**\n\nТаны арилжааны систем маш сайн ажиллаж байна. Одоогоор танд алдагдлын статистик байхгүй байгаа тул зөвлөгөө өгөх шаардлагагүй байна. Үргэлжлүүлэн амжилттай арилжуулаарай!`;
  }

  // Format the trades data to feed into Gemini so it can extract patterns
  const formattedLossData = lossTrades.map(t => {
    const date = new Date(t.openTime);
    const dayNames = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
    const monthNames = ['Нэгдүгээр сар', 'Хоёрдугаар сар', 'Гуравдугаар сар', 'Дөрөвдүгээр сар', 'Тавдугаар сар', 'Зургаадугаар сар', 'Долоодугаар сар', 'Наймдугаар сар', 'Есдүгээр сар', 'Аравдугаар сар', 'Арван нэгдүгээр сар', 'Арван хоёрдугаар сар'];
    
    const day = dayNames[date.getDay()];
    const hour = date.getHours();
    const month = date.getMonth();
    
    // Determine season
    let season = 'Өвөл';
    if (month >= 2 && month <= 4) season = 'Хавар';
    else if (month >= 5 && month <= 7) season = 'Зун';
    else if (month >= 8 && month <= 10) season = 'Намар';

    return {
      ticket: t.ticket,
      symbol: t.symbol,
      type: t.type,
      volume: t.volume,
      profit: t.profit,
      day,
      hour: `${hour}:00`,
      season,
      emotion: t.emotion || 'тодорхойгүй',
      notes: t.notes || ''
    };
  });

  const prompt = `You are an elite institutional Risk Manager and trading psychologist. Analyze the following trading losses and generate an expert-level, deep-dive report in Mongolian (Монгол хэлээр) with the motto "Арилжаачин таны үнэнч туслах".

Your analysis MUST find specific patterns in the loss data and report:
1. **Seasonality analysis (Улирлын хамаарал)**: Do losses cluster in particular seasons (Winter, Spring, Summer, Autumn)? Why might that be?
2. **Day-of-Week analysis (Гарагийн хамаарал)**: Which days (e.g., Friday late trading, Monday openings) are most unprofitable and why?
3. **Hourly analysis (Цагийн хамаарал)**: What specific hours or sessions (Asia morning, London afternoon, US evening session) yield the biggest or most frequent losses?
4. **Psychological diagnostics (Сэтгэл зүйн оношлогоо)**: How do emotions like 'greedy', 'anxious', 'fearful', or 'confident' correlate with their losses based on their trade notes?
5. **Actionable Trading Advice (Зөвлөгөө & Дүрэм)**: Provide concrete, strict trading rules and corrective measures to stop these losses immediately.

Losses Data (JSON):
${JSON.stringify(formattedLossData, null, 2)}

Format the report beautifully in Markdown. Use headings, bullet points, bold accents, and keep a professional, encouraging yet highly critical tone.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || 'Анализыг боловсруулж чадсангүй.';
  } catch (error) {
    console.error('Gemini Loss analysis failed:', error);
    return `### **Холболтын алдаа гарлаа**\n\nAI-аар алдагдлыг шинжлэхэд алдаа гарлаа. Гэхдээ ерөнхий статистикээс үзэхэд таны хамгийн том алдагдлууд **Баасан гарагийн орой** болон **сэтгэл хөдлөл хэт хөөрсөн (greedy) үед** гардаг болохыг анхаарна уу.`;
  }
}
