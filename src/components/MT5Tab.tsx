import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Copy, Check, ShieldAlert, Cpu, Network, CheckCircle2, ListOrdered } from 'lucide-react';

export default function MT5Tab() {
  const [copied, setCopied] = useState(false);

  const mql5Code = `//+------------------------------------------------------------------+
//|                                              MinitraderLogger.mq5 |
//|                                  Copyright 2026, Minitrader Corp  |
//|                                  "Арилжаачин таны үнэнч туслах"   |
//+------------------------------------------------------------------+
#property copyright "Minitrader"
#property link      "https://mini-trader.site"
#property version   "1.00"
#property description "Auto-logs MT5 trades to Minitrader web journal"

//--- Inputs
input string   InpWebUrl = "http://localhost:3000/api/mt5/trade"; // Web API Endpoint
input string   InpApiKey = "MINITRADER_MT5_SECRET_CONNECT_KEY";   // Auth Token

//--- Global variables
int last_history_deals = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Minitrader Logger initialized!");
   // Request history deal count
   HistorySelect(0, TimeCurrent());
   last_history_deals = HistoryDealsTotal();
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Minitrader Logger stopped.");
}

//+------------------------------------------------------------------+
//| Expert tick function / Trade event                               |
//+------------------------------------------------------------------+
void OnTrade()
{
   HistorySelect(0, TimeCurrent());
   int current_deals = HistoryDealsTotal();
   
   // Check if a new deal has been added to history
   if(current_deals > last_history_deals)
   {
      ulong ticket = HistoryDealGetTicket(current_deals - 1);
      if(ticket > 0)
      {
         SendTradeToServer(ticket);
      }
      last_history_deals = current_deals;
   }
}

//+------------------------------------------------------------------+
//| Send trade deal payload to Express Web API                       |
//+------------------------------------------------------------------+
void SendTradeToServer(ulong ticket)
{
   string symbol       = HistoryDealGetString(ticket, DEAL_SYMBOL);
   long type           = HistoryDealGetInteger(ticket, DEAL_TYPE);
   double volume       = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double price        = HistoryDealGetDouble(ticket, DEAL_PRICE);
   double profit       = HistoryDealGetDouble(ticket, DEAL_PROFIT);
   long entry          = HistoryDealGetInteger(ticket, DEAL_ENTRY); // Entry In/Out
   
   // Only log Out deals (Trade completions) or entry-in trade logs
   string tradeType = (type == DEAL_TYPE_BUY) ? "buy" : "sell";
   
   // Construct JSON Payload
   string json = "{\\"ticket\\":\\"" + IntegerToString(ticket) + "\\",";
   json += "\\"symbol\\":\\"" + symbol + "\\",";
   json += "\\"type\\":\\"" + tradeType + "\\",";
   json += "\\"volume\\":" + DoubleToString(volume, 2) + ",";
   json += "\\"openPrice\\":" + DoubleToString(price, 5) + ",";
   json += "\\"profit\\":" + DoubleToString(profit, 2) + ",";
   json += "\\"status\\":\\"closed\\",";
   json += "\\"notes\\":\\"MT5 Terminal-оос автоматаар бүртгэв.\\"}";
   
   char postData[];
   StringToCharArray(json, postData, 0, WHOLE_ARRAY, CP_UTF8);
   
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\\r\\nAuthorization: Bearer " + InpApiKey + "\\r\\n";
   
   int res = WebRequest("POST", InpWebUrl, headers, 10000, postData, result, resultHeaders);
   
   if(res == 200 || res == 201)
   {
      Print("Minitrader: Trade #" + IntegerToString(ticket) + " successfully logged!");
   }
   else
   {
      Print("Minitrader: Failed to send. Code: " + IntegerToString(res));
   }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mql5Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Intro */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-emerald-400" />
          MT5 (MetaTrader 5) Автомат Холболт
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          МТ5 терминал дээрээ арилжаа нээх болон хаах үед гараар журнал хөтлөх шаардлагагүйгээр автоматаар веб сайт руу бүртгэдэг Expert Advisor бот суулгах заавар.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column: Setup steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <ListOrdered className="h-4.5 w-4.5 text-emerald-400" /> Суулгах заавар
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="h-6 w-6 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-xs font-black text-emerald-400 font-mono">1</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">WebURL зөвшөөрөх</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    MT5-ийн <strong>Tools &gt; Options &gt; Expert Advisors</strong> цэс рүү ороод <strong>"Allow WebRequest for listed URL"</strong> хэсгийг чагталж, доорх хаягийг нэмнэ үү:
                  </p>
                  <div className="mt-2 p-2 bg-slate-950 border border-slate-850 rounded-lg font-mono text-[10px] text-emerald-400 select-all">
                    http://localhost:3000
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="h-6 w-6 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-xs font-black text-emerald-400 font-mono">2</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">MetaEditor нээх</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    MT5 дээрээ <strong>F4</strong> товч даран MetaEditor нээж, <strong>Experts</strong> хавтас дотор <strong>"MinitraderLogger.mq5"</strong> нэртэй шинэ файл үүсгэнэ.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="h-6 w-6 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-xs font-black text-emerald-400 font-mono">3</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Код хуулж, Compile хийх</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Баруун талын бэлэн MQL5 кодыг хуулж MetaEditor руу бүхлээр нь оруулан <strong>Compile (F7)</strong> товч дарна. Алдаагүй хөрвөж дуусна.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="h-6 w-6 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-xs font-black text-emerald-400 font-mono">4</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Чарт руу чирэх</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Бэлэн болсон EA роботыг Navigator цонхноос аль нэг идэвхтэй чарт руу чирж оруулж, <strong>"Algo Trading"</strong> товчийг идэвхжүүлснээр таны арилжаанууд автоматаар бүртгэгдэж эхэлнэ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Аюулгүй байдал</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                MT5-аас ирж буй хүсэлтүүд нь манай Express серверийн хамгаалалтын тусгай Token-оор баталгааждаг тул бусад этгээд таны журнал руу хуурамч арилжаа илгээх эрсдэлгүй.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Copiable MQL5 Editor */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 font-mono">MinitraderLogger.mq5</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white rounded-lg border border-slate-800 transition cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Хуулагдлаа!' : 'Код Хуулах'}
            </button>
          </div>

          <div className="p-5 bg-slate-950/80 font-mono text-[10px] leading-relaxed overflow-y-auto max-h-[480px] text-slate-400 select-all">
            <pre className="whitespace-pre">{mql5Code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
