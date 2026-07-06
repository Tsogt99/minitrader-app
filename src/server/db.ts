import fs from 'fs';
import path from 'path';
import { User, Trade, NewsItem, EmailLog, TradingAccount } from '../types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // username -> password mapping
  trades: Trade[];
  news: NewsItem[];
  emails: EmailLog[];
  accounts: TradingAccount[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'admin_id',
    username: 'Minitrader777',
    role: 'admin',
    createdAt: new Date().toISOString(),
    email: 'admin@mini-trader.site'
  },
  {
    id: 'user_1',
    username: 'DemoTrader',
    role: 'user',
    createdAt: new Date().toISOString(),
    email: 'd.narantsogt8093@gmail.com'
  }
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  'Minitrader777': 'Tsogt200@',
  'DemoTrader': 'Demo123!'
};

// Generates simulated trades over the last several months to provide beautiful, rich analytics & seasonal/daily/hourly loss pattern analysis for AI
const generateMockTrades = (): Trade[] => {
  const trades: Trade[] = [];
  const symbols = ['XAUUSD', 'NASDAQ'];
  const emotions: ('neutral' | 'confident' | 'anxious' | 'greedy' | 'fearful' | 'disciplined')[] = [
    'confident', 'anxious', 'greedy', 'fearful', 'disciplined', 'neutral'
  ];

  // Let's create about 25 mock trades spanning the past year (seasons, different days, hours)
  const tradeDetails = [
    // 1. Gold Trade - Winter (January) - Early morning - Profit
    { ticket: '100010', symbol: 'XAUUSD', type: 'buy', volume: 0.5, openPrice: 2015.40, closePrice: 2032.10, profit: 835.0, hour: 8, day: 15, month: 0, emotion: 'confident', notes: 'Алтны дэмжлэг бүсийг харж худалдан авалт хийв. Төлөвлөгөөний дагуу TP авав.' },
    // 2. Nasdaq Trade - Winter (February) - US Session (Late evening in Mongolia) - Loss
    { ticket: '100020', symbol: 'NASDAQ', type: 'buy', volume: 1.0, openPrice: 17850.0, closePrice: 17750.0, profit: -1000.0, hour: 22, day: 3, month: 1, emotion: 'greedy', notes: 'Nasdaq хэт өндөр өсөлттэй байхад FOMO-дож авсан. Том алдагдал хүлээв.' },
    // 3. Gold Trade - Spring (March) - Midday - Loss
    { ticket: '100030', symbol: 'XAUUSD', type: 'sell', volume: 0.8, openPrice: 2160.0, closePrice: 2172.5, profit: -1000.0, hour: 13, day: 12, month: 2, emotion: 'fearful', notes: 'Эсрэг тренд рүү богино арилжаа ороод, сандарч SL хүрэхээс өмнө гараар хаасан.' },
    // 4. Nasdaq Trade - Spring (April) - Morning - Loss
    { ticket: '100040', symbol: 'NASDAQ', type: 'sell', volume: 0.5, openPrice: 18100.0, closePrice: 18180.0, profit: -400.0, hour: 9, day: 22, month: 3, emotion: 'anxious', notes: 'Азийн сессийн үеэр арилжаа нээсэн. Хөрвөх чадвар сул байснаас алдагдал хүлээв.' },
    // 5. Nasdaq Trade - Spring (May) - US Session - Profit
    { ticket: '100050', symbol: 'NASDAQ', type: 'buy', volume: 1.0, openPrice: 18350.0, closePrice: 18520.0, profit: 1700.0, hour: 21, day: 14, month: 4, emotion: 'disciplined', notes: 'АНУ-ын инфляцийн мэдээ гарсны дараа техникийн сувгийн дагуу арилжаанд оров.' },
    // 6. Gold Trade - Summer (June) - Late night - Loss
    { ticket: '100060', symbol: 'XAUUSD', type: 'buy', volume: 0.5, openPrice: 2320.0, closePrice: 2305.0, profit: -750.0, hour: 23, day: 18, month: 5, emotion: 'greedy', notes: 'Оройн цагаар арилжаа хийж эрсдэлийн удирдлага алдагдсан.' },
    // 7. Gold Trade - Summer (July) - US Session - Loss
    { ticket: '100070', symbol: 'XAUUSD', type: 'buy', volume: 1.2, openPrice: 2410.0, closePrice: 2385.0, profit: -3000.0, hour: 20, day: 5, month: 6, emotion: 'greedy', notes: 'Баасан гарагийн орой арилжаа хаагдах дөхөж байхад хэтэрхий том лотоор орсон. Сэтгэл хөдлөлөө хянаж чадсангүй.' },
    // 8. Nasdaq Trade - Summer (August) - US Session - Profit
    { ticket: '100080', symbol: 'NASDAQ', type: 'sell', volume: 0.8, openPrice: 19500.0, closePrice: 19280.0, profit: 1760.0, hour: 21, day: 24, month: 7, emotion: 'confident', notes: 'Техник шинжилгээгээр суваг задарч доошоо унах дохиог амжилттай ашиглав.' },
    // 9. Gold Trade - Autumn (September) - Morning - Loss
    { ticket: '100090', symbol: 'XAUUSD', type: 'sell', volume: 0.4, openPrice: 2510.0, closePrice: 2525.0, profit: -600.0, hour: 10, day: 9, month: 8, emotion: 'anxious', notes: 'Даваа гарагийн өглөө эрт зах зээлийн нээлтээр арилжаанд орж, хууртагдав.' },
    // 10. Nasdaq Trade - Autumn (October) - Late night - Loss
    { ticket: '100100', symbol: 'NASDAQ', type: 'buy', volume: 1.5, openPrice: 20200.0, closePrice: 20100.0, profit: -1500.0, hour: 23, day: 15, month: 9, emotion: 'fearful', notes: 'Орой унтахын өмнө арилжаа нээгээд SL тавиагүйгээс болж том алдсан.' },
    // 11. Gold Trade - Autumn (November) - US Session - Profit
    { ticket: '100110', symbol: 'XAUUSD', type: 'buy', volume: 0.6, openPrice: 2650.0, closePrice: 2682.0, profit: 1920.0, hour: 19, day: 20, month: 10, emotion: 'disciplined', notes: 'Дэмжлэгийн бүсийг амжилттай тестэлсэн дохиогоор худалдан авалт хийж TP авсан.' },
    // 12. Nasdaq Trade - Winter (December) - Afternoon - Loss
    { ticket: '100120', symbol: 'NASDAQ', type: 'sell', volume: 1.0, openPrice: 20900.0, closePrice: 20970.0, profit: -700.0, hour: 15, day: 5, month: 11, emotion: 'neutral', notes: 'Лондонгийн сессийн эхэнд оролт хийсэн ч зах зээлийн хүч хангалтгүй байлаа.' },
    // 13. Gold Trade - Winter (December) - Evening - Loss
    { ticket: '100130', symbol: 'XAUUSD', type: 'buy', volume: 0.8, openPrice: 2640.0, closePrice: 2620.0, profit: -1600.0, hour: 22, day: 25, month: 11, emotion: 'greedy', notes: 'Баярын үеэр хөрвөх чадвар багатай байхад арилжаа нээж алдагдал хүлээв.' },
    // More trades to create strong patterns
    { ticket: '100140', symbol: 'NASDAQ', type: 'buy', volume: 0.5, openPrice: 20000.0, closePrice: 20120.0, profit: 600.0, hour: 16, day: 10, month: 4, emotion: 'disciplined', notes: 'Төлөвлөгөөт арилжаа' },
    { ticket: '100150', symbol: 'XAUUSD', type: 'sell', volume: 0.5, openPrice: 2450.0, closePrice: 2465.0, profit: -750.0, hour: 21, day: 10, month: 6, emotion: 'anxious', notes: 'Буруу таамаглал' },
    { ticket: '100160', symbol: 'NASDAQ', type: 'sell', volume: 0.8, openPrice: 19800.0, closePrice: 19880.0, profit: -640.0, hour: 22, day: 17, month: 6, emotion: 'greedy', notes: 'Сэтгэл хөдлөлдөө хөтлөгдөв.' },
    { ticket: '100170', symbol: 'XAUUSD', type: 'buy', volume: 0.4, openPrice: 2350.0, closePrice: 2335.0, profit: -600.0, hour: 20, day: 24, month: 6, emotion: 'greedy', notes: 'Баасан гарагийн оройн алдагдал.' },
    { ticket: '100180', symbol: 'NASDAQ', type: 'buy', volume: 1.0, openPrice: 19200.0, closePrice: 19350.0, profit: 1500.0, hour: 20, day: 1, month: 8, emotion: 'confident', notes: 'Чиглэл зөв байлаа' },
    { ticket: '100190', symbol: 'XAUUSD', type: 'sell', volume: 0.6, openPrice: 2580.0, closePrice: 2595.0, profit: -900.0, hour: 23, day: 12, month: 9, emotion: 'anxious', notes: 'Оройн цагаар арилжаа нээж буруудав.' },
    { ticket: '100200', symbol: 'NASDAQ', type: 'sell', volume: 1.2, openPrice: 20500.0, closePrice: 20610.0, profit: -1320.0, hour: 22, day: 26, month: 9, emotion: 'greedy', notes: 'Баасан гарагийн оройн уналтаас зарах гээд алдав.' },
    { ticket: '100210', symbol: 'XAUUSD', type: 'buy', volume: 0.5, openPrice: 2620.0, closePrice: 2655.0, profit: 1750.0, hour: 14, day: 5, month: 10, emotion: 'disciplined', notes: 'Зөв дохио хүлээсэн' }
  ];

  const currentYear = 2026;

  tradeDetails.forEach((dt) => {
    // Construct open and close times
    const openDate = new Date(currentYear, dt.month, dt.day, dt.hour, 15, 0);
    const closeDate = new Date(currentYear, dt.month, dt.day, dt.hour + (dt.profit > 0 ? 3 : 1), 45, 0);

    trades.push({
      id: `trade_${dt.ticket}`,
      ticket: dt.ticket,
      userId: 'user_1',
      symbol: dt.symbol,
      type: dt.type as 'buy' | 'sell',
      volume: dt.volume,
      openPrice: dt.openPrice,
      closePrice: dt.closePrice,
      openTime: openDate.toISOString(),
      closeTime: closeDate.toISOString(),
      profit: dt.profit,
      notes: dt.notes,
      emotion: dt.emotion as any,
      status: 'closed'
    });
  });

  return trades;
};

const DEFAULT_NEWS: NewsItem[] = [
  {
    id: 'news_1',
    title: 'ISM Services PMI Sparks Volatility as Fed Decision Looms',
    originalTitle: 'ISM Services PMI Sparks Volatility as Fed Decision Looms',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/forex-news',
    date: '2026-07-06T15:30:00.000Z',
    category: 'Both',
    translationMongolian: 'Холбооны Нөөцийн Сангийн шийдвэр ойртож буй энэ үед ISM Үйлчилгээний салбарын PMI өндөр савлагаа үүсгэв',
    aiAnalysis: 'Үйлчилгээний салбарын идэвхжилийг илтгэх ISM Services PMI индекс хүлээлтээс өндөр (52.4) гарсан нь АНУ-ын эдийн засаг хүчтэй хэвээр байгаа бөгөөд инфляци эргэн өсөх дарамт байсаар байгааг харууллаа. Энэ нь ФРС хүүг ойрын хугацаанд хурдан бууруулахгүй байх шалтгаан болно.',
    aiPrediction: 'Ам.долларын индекс богино хугацаанд чангарч, Алтны ханш (XAUUSD) унах эрсдэлтэй. Арилжаачид хүүгийн шийдвэрт бэлтгэж, лот хэмжээгээ багасгахыг зөвлөж байна.',
    forecast: '51.8',
    actual: '52.4',
    previous: '51.2',
    impactLevel: 'High',
    marketOutcome: 'Үйлчилгээний салбарын идэвхжилт хүлээлтээс өндөр гарсан тул ам.доллар чангарч, Алтны ханш 12$-оор буурав. NASDAQ индекс тогтвортой хэвээр үлдэв.'
  },
  {
    id: 'news_2',
    title: 'Geopolitical Uncertainties Support Gold Above Key Pivot Levels',
    originalTitle: 'Geopolitical Uncertainties Support Gold Above Key Pivot Levels',
    source: 'Forex Factory',
    url: 'https://www.forexfactory.com/',
    date: '2026-07-05T09:15:00.000Z',
    category: 'Gold',
    translationMongolian: 'Геополитикийн тодорхойгүй байдлууд Алтны ханшийг гол тулгуур түвшнээс дээш барьж байна',
    aiAnalysis: 'Ойрх Дорнодын бүс нутаг дахь геополитикийн хурцадмал байдал дахин идэвхжсэн нь хөрөнгө оруулагчдыг эрсдэл багатай аюулгүй хөрөнгө рүү (Safe-haven assets) хөрөнгөө чиглүүлэхэд хүргэж байна. Алт нь энэ урсгалын гол хүлээн авагч болж байна.',
    aiPrediction: 'Хэрэв мөргөлдөөн намжихгүй бол Алтны ханш (XAUUSD) 2350$ бүсийг хамгаалж, цаашлаад 2380$ хүртэл өсөх магадлалтай. Харин хэлэлцээр амжилттай болбол огцом залруулга хийгдэж унана.',
    forecast: '-',
    actual: '-',
    previous: '-',
    impactLevel: 'Medium',
    marketOutcome: 'Аюулгүй хөрөнгийн урсгал нэмэгдэж, Алтны ханш 2330$-оос 2355$ хүртэл 25$-оор хүчтэй өсөв. NASDAQ индексийн арилжаа сул байлаа.'
  },
  {
    id: 'news_3',
    title: 'US Independence Day: Low Market Liquidity Warnings Issued',
    originalTitle: 'US Independence Day: Low Market Liquidity Warnings Issued',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/forex-news',
    date: '2026-07-04T13:00:00.000Z',
    category: 'General',
    translationMongolian: 'АНУ-ын Тусгаар Тогтнолын Баяр: Зах зээлийн хөрвөх чадвар бага байхыг анхааруулав',
    aiAnalysis: 'АНУ-ын баярын өдөр тохиож байгаа тул Нью-Йоркийн хөрөнгийн бирж болон түүхий эдийн фьючерсийн арилжаа эрт хаагдана. Энэ өдөр томоохон банкууд болон сангууд арилжаанд оролцохгүй тул хөрвөх чадвар маш сул байна.',
    aiPrediction: 'Хөрвөх чадвар сул үед бага зэрэг хэмжээний арилжааны захиалга ч ханшийг огцом савлуулах эсвэл бүрэн хөдөлгөөнгүй болгох аюултай. Өнөөдөр шинээр арилжаа нээхгүй байх нь хамгийн зөв сонголт.',
    forecast: '-',
    actual: '-',
    previous: '-',
    impactLevel: 'Low',
    marketOutcome: 'АНУ-ын Тусгаар тогтнолын баярын өдөр тохиосон тул биржүүд эрт хаагдаж, савлагаа бага, ханш хажуугийн хөдөлгөөнд орсон.'
  },
  {
    id: 'news_4',
    title: 'US Non-Farm Payrolls (NFP) Unexpectedly Falls to 135K',
    originalTitle: 'US Non-Farm Payrolls (NFP) Unexpectedly Falls to 135K',
    source: 'Forex Factory',
    url: 'https://www.forexfactory.com/',
    date: '2026-07-03T12:30:00.000Z',
    category: 'Both',
    translationMongolian: 'АНУ-ын Хөдөө аж ахуйн бус салбарын шинэ ажлын байр (NFP) хүлээлтээс унаж 135К болов',
    aiAnalysis: 'NFP үзүүлэлт хүлээгдэж байсан 175K-аас хамаагүй сул буюу 135K гарлаа. Энэ нь АНУ-ын хөдөлмөрийн зах зээл хөрж байгааг, улмаар эдийн засгийн идэвхжил удааширч байгааг харуулсан маш чухал дохио бөгөөд ФРС хүүг бууруулах хүлээлтийг огцом нэмэгдүүлэв.',
    aiPrediction: 'Ам.долларын индекс унаж, Алтны ханш (XAUUSD) болон NASDAQ технологийн индекс маш хүчтэй өсөлт үзүүлэх боломжтой. Сул гарсан мэдээ нь бодлогын хүүг хурдан бууруулах таатай нөхцөл болно.',
    forecast: '175K',
    actual: '135K',
    previous: '210K',
    impactLevel: 'High',
    marketOutcome: 'Ажлын байрны тоо таамагаас хамаагүй сул гарсан нь ам.долларыг огцом унагав. Үүний нөлөөгөөр Алтны ханш 38$-оор өсөж, NASDAQ индекс хүү буурах таамаглалаар 1.2%-иар өсөж хаагдсан.'
  },
  {
    id: 'news_5',
    title: 'US Unemployment Claims Rise to 238K, Adding Pressure on Fed',
    originalTitle: 'US Unemployment Claims Rise to 238K, Adding Pressure on Fed',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/forex-news',
    date: '2026-07-02T12:30:00.000Z',
    category: 'Nasdaq',
    translationMongolian: 'АНУ-ын Ажилгүйдлийн тэтгэмж хүсэгчдийн тоо 238К болж өссөн нь Холбооны Нөөцийн Санд дарамт нэмэв',
    aiAnalysis: 'Долоо хоног бүр гардаг ажилгүйдлийн тэтгэмжийн өргөдөл хүлээгдэж байснаас давж гарлаа. Энэ нь хөдөлмөрийн зах зээлд яваандаа асуудал үүсэж эхэлж байгааг илтгэж байгаа бөгөөд ФРС-ийн зөөлөн бодлого баримтлах сэдэл болно.',
    aiPrediction: 'Доллар бага зэрэг суларч, Nasdaq индекс дэх хувьцааны үнүүд өсөлт үзүүлэх хандлагатай байна. Богино хугацааны хувьд худалдан авагчид давамгайлна.',
    forecast: '220K',
    actual: '238K',
    previous: '233K',
    impactLevel: 'Medium',
    marketOutcome: 'Ажилгүйдлийн өргөдөл өссөн нь хөдөлмөрийн зах зээл суларч байгааг баталж, ам.долларыг бага зэрэг сулруулан, NASDAQ индексийн өсөлтийг дэмжив.'
  },
  {
    id: 'news_6',
    title: 'US ISM Manufacturing PMI Remains in Contraction at 48.2',
    originalTitle: 'US ISM Manufacturing PMI Remains in Contraction at 48.2',
    source: 'Forex Factory',
    url: 'https://www.forexfactory.com/',
    date: '2026-07-01T14:00:00.000Z',
    category: 'Both',
    translationMongolian: 'АНУ-ын ISM Үйлдвэрлэлийн PMI 48.2 болж буурснаар үйлдвэрлэлийн уналт үргэлжилж байна',
    aiAnalysis: 'Үйлдвэрлэлийн идэвхжлийн индекс 50-иас доош буюу 48.2 гарсан нь үйлдвэрлэлийн салбарт уналт үргэлжилсээр байгааг нотлов. Хүлээлт болох 49.0-д хүрч чадсангүй. Энэ нь эдийн засгийн өсөлтийг сааруулж буй дүр зургийг үзүүлж байна.',
    aiPrediction: 'Эдийн засгийн сул үзүүлэлт нь Алтны ханшийг хамгаалалтын зорилгоор дэмжих бол хөрөнгийн зах зээл богино хугацаанд унах эрсдэлтэй.',
    forecast: '49.0',
    actual: '48.2',
    previous: '48.7',
    impactLevel: 'High',
    marketOutcome: 'Үйлдвэрлэлийн идэвхжил сул хэвээр байсан тул эдийн засгийн удаашралын айдас нэмэгдэж, Алтны ханш хамгаалалтын урсгалаар 15$ өсөж, NASDAQ индекс бага зэрэг буурав.'
  },
  {
    id: 'news_7',
    title: 'CB Consumer Confidence Surpasses Estimates, Elevating Tech Stocks',
    originalTitle: 'CB Consumer Confidence Surpasses Estimates, Elevating Tech Stocks',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/forex-news',
    date: '2026-06-30T14:00:00.000Z',
    category: 'Nasdaq',
    translationMongolian: 'Хэрэглэгчдийн итгэлийн индекс (CB) таамаглалаас давж, технологийн хувьцаануудыг өсгөв',
    aiAnalysis: 'АНУ-ын хэрэглэгчдийн эдийн засагт итгэх итгэл маш сайн гарлаа (103.1). Хэрэглэгчид ирээдүйдээ итгэлтэй байх тусам жижиглэнгийн худалдан авалт болон технологийн бүтээгдэхүүний эрэлт өсдөг тул технологийн компаниудын хувьцаанд маш сайн нөлөөтэй.',
    aiPrediction: 'Nasdaq индекс дээр хүчтэй өсөлт ажиглагдана. Техникийн чухал эсэргүүцлийн шугамыг эвдэн дээшлэх боломжтой.',
    forecast: '100.4',
    actual: '103.1',
    previous: '101.3',
    impactLevel: 'Medium',
    marketOutcome: 'Хэрэглэгчдийн итгэл өндөр гарсан нь технологийн хувьцаануудыг дэмжив. NASDAQ индекс 0.8%-иар өсөж шинэ дээд түвшинд дөхөв.'
  },
  {
    id: 'news_8',
    title: 'Pending Home Sales q/q Declines by -1.2% Amid High Mortgage Rates',
    originalTitle: 'Pending Home Sales q/q Declines by -1.2% Amid High Mortgage Rates',
    source: 'Forex Factory',
    url: 'https://www.forexfactory.com/',
    date: '2026-06-29T14:00:00.000Z',
    category: 'General',
    translationMongolian: 'Орон сууцны борлуулалтын гэрээ өндөр хүүний нөлөөгөөр -1.2 хувиар буурав',
    aiAnalysis: 'АНУ-д ипотекийн зээлийн хүү (Mortgage rates) түүхэн өндөр хэмжээнд хадгалагдсаар байгаа нь үл хөдлөх хөрөнгө худалдан авагчдыг хойш суулгаж байна. Энэ нь үл хөдлөх хөрөнгийн салбарыг зогсонги байдалд оруулж эхэллээ.',
    aiPrediction: 'Арилжааны хувьд нөлөөлөл бага боловч урт хугацаандаа эдийн засагт сөрөг нөлөө үзүүлэх үзүүлэлт тул долларын эрчийг сааруулна.',
    forecast: '-0.5%',
    actual: '-1.2%',
    previous: '0.2%',
    impactLevel: 'Low',
    marketOutcome: 'Орон сууцны борлуулалтын гэрээ буурсан нь ипотекийн зээлийн өндөр хүүний нөлөөг харуулж, ам.долларын эрчийг саарууллаа.'
  },
  {
    id: 'news_9',
    title: 'US Core PCE Inflation Matches Forecast at 0.1% Month-over-Month',
    originalTitle: 'US Core PCE Inflation Matches Forecast at 0.1% Month-over-Month',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/forex-news',
    date: '2026-06-26T12:30:00.000Z',
    category: 'Both',
    translationMongolian: 'АНУ-ын Хэрэглээний хувийн зардлын суурь индекс (Core PCE) таамагт нийцэж 0.1 хувиар өсөв',
    aiAnalysis: 'ФРС-ийн инфляцийг хэмждэг хамгийн гол үзүүлэлт болох Суурь PCE индекс хүлээлтэд нийцсэн нь инфляци хяналтад байгаа бөгөөд ФРС бодлогын хүүг зөөлрүүлэх боломжтойг харуулж, хөрөнгө оруулагчдын айдсыг бүрэн арилгалаа.',
    aiPrediction: 'Хөрөнгийн зах зээл (NASDAQ) маш том өсөлт үзүүлэх боломжтой бол ам.долларын ханш тогтворжиж, Алтны ханш хэвийн хүрээнд арилжаалагдах төлөвтэй.',
    forecast: '0.1%',
    actual: '0.1%',
    previous: '0.2%',
    impactLevel: 'High',
    marketOutcome: 'ФРС-ийн хамгийн чухал инфляцийн хэмжүүр хүлээлтэд яв цав нийцсэн нь зах зээлийг тайвшруулж, NASDAQ 180 пунктээр өсөж, Алтны ханш 2340$ орчимд тогтворжсон.'
  },
  {
    id: 'news_10',
    title: 'US Final GDP q/q Comes in Solid at 1.8%',
    originalTitle: 'US Final GDP q/q Comes in Solid at 1.8%',
    source: 'Forex Factory',
    url: 'https://www.forexfactory.com/',
    date: '2026-06-25T12:30:00.000Z',
    category: 'Nasdaq',
    translationMongolian: 'АНУ-ын ДНБ-ий эцсийн үзүүлэлт 1.8 хувь гарч, эдийн засаг бат бөх байгааг харуулав',
    aiAnalysis: 'ДНБ-ий гуравдугаар улирлын эцсийн тооцоо 1.8% гарч хүлээлт (1.7%)-ээс бага зэрэг сайн гарлаа. Энэ нь өндөр хүүтэй орчинд ч АНУ-ын эдийн засаг уналтад (recession) өртөхөөргүй хүчтэй байгааг нотолж байна.',
    aiPrediction: 'Эдийн засгийн хүчтэй өсөлт нь хувьцааны зах зээлийг (Nasdaq) дэмжих бөгөөд ам.долларын ханшийг унахаас сэргийлж хамгаална.',
    forecast: '1.7%',
    actual: '1.8%',
    previous: '1.7%',
    impactLevel: 'Medium',
    marketOutcome: 'ДНБ-ий үзүүлэлт сайжирсан нь АНУ-ын эдийн засаг хүчтэй хэвээр байгааг илтгэж, NASDAQ болон S&P 500 индекст эерэг нөлөө үзүүллээ.'
  },
  {
    id: 'news_11',
    title: 'Crude Oil Inventories Build Pressure on Overall Commodity Basket',
    originalTitle: 'Crude Oil Inventories Build Pressure on Overall Commodity Basket',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/forex-news',
    date: '2026-06-24T14:30:00.000Z',
    category: 'Gold',
    translationMongolian: 'Түүхий тосны нөөцийн өсөлт түүхий эдийн сагсанд дарамт учруулав',
    aiAnalysis: 'АНУ-ын Энергийн Мэдээллийн Албанаас (EIA) гаргасан түүхий тосны нөөц таамаглаж байснаас давж өссөн нь шатахууны эрэлт сул байгааг илтгэв. Түүхий эдийн ерөнхий салбарт уналтын нөлөө үзүүлж байна.',
    aiPrediction: 'Алтны ханшид шууд нөлөө бага боловч түүхий эдийн үнийн уналт Алтны ханшийг бага зэрэг доош дарах нөлөө үзүүлж болно.',
    forecast: '-1.2M',
    actual: '1.5M',
    previous: '-2.1M',
    impactLevel: 'Low',
    marketOutcome: 'Түүхий тосны нөөц нэмэгдсэн нь түүхий эдийн салбарт бага зэргийн уналт үүсгэсэн ч Алтны ханшид үзүүлэх нөлөө маш сул байлаа.'
  },
  {
    id: 'news_12',
    title: 'Flash Manufacturing and Services PMI Highlight Strong US Growth',
    originalTitle: 'Flash Manufacturing and Services PMI Highlight Strong US Growth',
    source: 'Forex Factory',
    url: 'https://www.forexfactory.com/',
    date: '2026-06-23T13:45:00.000Z',
    category: 'Both',
    translationMongolian: 'Үйлдвэрлэл болон Үйлчилгээний урьдчилсан PMI АНУ-ын хүчтэй өсөлтийг онцлов',
    aiAnalysis: 'АНУ-ын эдийн засгийн идэвхжлийн PMI урьдчилсан гүйцэтгэл хүлээлтээс маш өндөр (53.5) гарсан нь эдийн засаг хэт халж байгааг харууллаа. Энэ нь Холбооны Нөөцийн Сан хүүгээ өндөр түвшинд урт хугацаанд хадгалах магадлалыг улам нэмэгдүүлэв.',
    aiPrediction: 'Ам.доллар чангарч, Алтны ханш (XAUUSD) болон Nasdaq индекс дээр ашиг орлогоо бэхжүүлэх уналт (profit-taking sell-off) явагдах магадлал маш өндөр байна.',
    forecast: '52.1',
    actual: '53.5',
    previous: '52.4',
    impactLevel: 'High',
    marketOutcome: 'АНУ-ын PMI урьдчилсан гүйцэтгэл маш хүчтэй гарсан нь хүү бууруулах хугацааг хойшлуулж, Алтны ханш 30$-оор унаж, NASDAQ индекс ашиг ололтын борлуулалтаар 1%-иар буурав.'
  },
  {
    id: 'news_13',
    title: 'US Existing Home Sales Decline as Supply Pressures Mount',
    originalTitle: 'US Existing Home Sales Decline as Supply Pressures Mount',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/forex-news',
    date: '2026-06-22T14:00:00.000Z',
    category: 'General',
    translationMongolian: 'Нийлүүлэлтийн дарамтаас шалтгаалан АНУ-ын Хуучин орон сууцны борлуулалт буурав',
    aiAnalysis: 'Хуучин орон сууцны борлуулалтын хэмжээ 3.95M болж буурлаа. Орон сууцны зах зээлд үнэ өндөр, нийлүүлэлт хомс байгаа нь борлуулалтыг боомилж байгаа бөгөөд энэ нь эдийн засгийн нэг хэсэгт удаашрал үүссэнийг харуулж байна.',
    aiPrediction: 'Энэ нь урт хугацааны үл хөдлөх хөрөнгийн уналтын үзүүлэлт тул богино хугацааны арилжаачдад онцгой хүчтэй нөлөө үзүүлэхгүй.',
    forecast: '4.10M',
    actual: '3.95M',
    previous: '4.11M',
    impactLevel: 'Low',
    marketOutcome: 'Хуучин орон сууцны борлуулалт таамагаас сул гарсан нь үл хөдлөх хөрөнгийн салбарын удаашралыг харуулсан ч арилжааны ерөнхий хөдөлгөөнд бага нөлөөллөө.'
  }
];

export const initDb = () => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const data: DatabaseSchema = {
      users: DEFAULT_USERS,
      passwords: DEFAULT_PASSWORDS,
      trades: generateMockTrades(),
      news: DEFAULT_NEWS,
      emails: [],
      accounts: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Database initialized successfully at:', DB_FILE);
  } else {
    // If database already exists but misses new fields, let's migrate it
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      let changed = false;
      if (!data.accounts) {
        data.accounts = [];
        changed = true;
      }
      // Re-seed updated news with outcome details and 14 days history
      if (!data.news || data.news.length <= 4 || !data.news.some(n => n.marketOutcome)) {
        data.news = DEFAULT_NEWS;
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Database migrated and seeded successfully with 14 days news and accounts.');
      }
    } catch (e) {
      console.error('Error migrating database:', e);
    }
  }
};

export const getDb = (): DatabaseSchema => {
  try {
    initDb();
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    // Guarantee accounts is always present
    if (!parsed.accounts) {
      parsed.accounts = [];
    }
    if (!parsed.news || parsed.news.length === 0) {
      parsed.news = DEFAULT_NEWS;
    }
    return parsed;
  } catch (error) {
    console.error('Error reading database file:', error);
    return {
      users: DEFAULT_USERS,
      passwords: DEFAULT_PASSWORDS,
      trades: [],
      news: DEFAULT_NEWS,
      emails: [],
      accounts: []
    };
  }
};

export const saveDb = (data: DatabaseSchema) => {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    // Ensure accounts array exists before saving
    if (!data.accounts) {
      data.accounts = [];
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
};
