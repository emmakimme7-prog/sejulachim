import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Bell, Plus, Trash2, Search,
  BarChart3, Activity, Briefcase, Star, ArrowUpRight,
  ArrowDownRight, Clock, RefreshCw, Settings, X,
  AlertTriangle, CheckCircle, Eye, ChevronRight, Edit3, Save
} from "lucide-react";

// ============================================================
// STATE & HELPERS
// ============================================================

const generatePriceHistory = (base, days = 30) => {
  const data = [];
  let price = base;
  for (let i = days; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    price = price * (1 + (Math.random() - 0.48) * 0.03);
    data.push({ date: `${d.getMonth()+1}/${d.getDate()}`, price: Math.round(price * 100) / 100, volume: Math.floor(Math.random() * 5000000) + 500000, ma5: 0, ma20: 0 });
  }
  for (let i = 0; i < data.length; i++) {
    if (i >= 4) data[i].ma5 = Math.round(data.slice(i-4,i+1).reduce((s,d) => s+d.price, 0) / 5 * 100) / 100;
    if (i >= 19) data[i].ma20 = Math.round(data.slice(i-19,i+1).reduce((s,d) => s+d.price, 0) / 20 * 100) / 100;
  }
  return data;
};

const MARKET_INDICES = [
  { name: "코스피", value: 2687.45, change: 1.23, pct: 0.05 },
  { name: "코스닥", value: 892.31, change: -5.67, pct: -0.63 },
  { name: "S&P 500", value: 5892.12, change: 23.45, pct: 0.40 },
  { name: "나스닥", value: 19234.56, change: 112.34, pct: 0.59 },
];

const STOCK_DB = [
  { symbol: "삼성전자", code: "005930", market: "KRX" },
  { symbol: "SK하이닉스", code: "000660", market: "KRX" },
  { symbol: "카카오", code: "035720", market: "KRX" },
  { symbol: "네이버", code: "035420", market: "KRX" },
  { symbol: "LG에너지솔루션", code: "373220", market: "KRX" },
  { symbol: "현대차", code: "005380", market: "KRX" },
  { symbol: "셀트리온", code: "068270", market: "KRX" },
  { symbol: "NVDA", code: "NVDA", market: "NASDAQ" },
  { symbol: "AAPL", code: "AAPL", market: "NASDAQ" },
  { symbol: "TSLA", code: "TSLA", market: "NASDAQ" },
  { symbol: "MSFT", code: "MSFT", market: "NASDAQ" },
  { symbol: "AMZN", code: "AMZN", market: "NASDAQ" },
  { symbol: "GOOG", code: "GOOG", market: "NASDAQ" },
  { symbol: "META", code: "META", market: "NASDAQ" },
  { symbol: "AMD", code: "AMD", market: "NASDAQ" },
];

const formatPrice = (p, m) => m === "KRX" ? `₩${p.toLocaleString()}` : `$${p.toFixed(2)}`;
const formatVol = (v) => v >= 100000000 ? `${(v/100000000).toFixed(1)}억` : v >= 10000 ? `${(v/10000).toFixed(0)}만` : v.toLocaleString();

// ============================================================
// SMALL COMPONENTS
// ============================================================

const RsiBadge = ({ value }) => {
  const color = value <= 30 ? "bg-green-900/60 text-green-400" : value >= 70 ? "bg-red-900/60 text-red-400" : "bg-gray-700 text-gray-300";
  const label = value <= 30 ? "과매도" : value >= 70 ? "과매수" : "중립";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>RSI {value} ({label})</span>;
};

const MacdBadge = ({ value }) => {
  const c = { "매수": "bg-green-900/60 text-green-400", "매도": "bg-red-900/60 text-red-400", "중립": "bg-gray-700 text-gray-300" };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c[value]}`}>MACD {value}</span>;
};

const SignalBadge = ({ type }) => {
  const c = { buy: "bg-green-500/20 text-green-400 border-green-500/30", sell: "bg-red-500/20 text-red-400 border-red-500/30", hold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  const icons = { buy: <ArrowUpRight size={14}/>, sell: <ArrowDownRight size={14}/>, hold: <Clock size={14}/> };
  const labels = { buy: "매수", sell: "매도", hold: "관망" };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${c[type]}`}>{icons[type]} {labels[type]}</span>;
};

const MiniChart = ({ data, positive }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data.slice(-14)}>
      <defs>
        <linearGradient id={positive ? "gU" : "gD"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
          <stop offset="100%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="price" stroke={positive ? "#22c55e" : "#ef4444"} fill={`url(#${positive ? "gU" : "gD"})`} strokeWidth={1.5} dot={false}/>
    </AreaChart>
  </ResponsiveContainer>
);

// ============================================================
// MODAL: 종목 검색 & 추가
// ============================================================

const AddStockModal = ({ onClose, onAdd, type = "watchlist" }) => {
  const [query, setQuery] = useState("");
  const [step, setStep] = useState("search"); // search | form
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ qty: "", avgPrice: "", targetPrice: "", stopLoss: "" });

  const results = query.length > 0
    ? STOCK_DB.filter(s => s.symbol.toLowerCase().includes(query.toLowerCase()) || s.code.includes(query))
    : [];

  const handleSelect = (stock) => {
    setSelected(stock);
    if (type === "portfolio") setStep("form");
    else {
      onAdd({ ...stock, price: stock.market === "KRX" ? Math.floor(Math.random() * 100000) + 10000 : Math.floor(Math.random() * 300) + 50, change: (Math.random() - 0.4) * 10, rsi: Math.floor(Math.random() * 60) + 20, macd: ["매수","중립","매도"][Math.floor(Math.random()*3)], volume: Math.floor(Math.random()*10000000)+500000, history: generatePriceHistory(stock.market === "KRX" ? 50000 : 150) });
      onClose();
    }
  };

  const handleSubmitPortfolio = () => {
    if (!form.qty || !form.avgPrice) return;
    onAdd({
      ...selected,
      qty: Number(form.qty),
      avgPrice: Number(form.avgPrice),
      currentPrice: Number(form.avgPrice) * (1 + (Math.random() - 0.3) * 0.1),
      targetPrice: form.targetPrice ? Number(form.targetPrice) : Number(form.avgPrice) * 1.15,
      stopLoss: form.stopLoss ? Number(form.stopLoss) : Number(form.avgPrice) * 0.9,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            {type === "portfolio" ? "포트폴리오에 종목 추가" : "관심종목 추가"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} className="text-gray-400"/>
          </button>
        </div>

        {step === "search" && (
          <div className="p-4">
            {/* 검색 입력 */}
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input
                type="text" autoFocus placeholder="종목명 또는 코드 입력 (예: 삼성전자, NVDA)"
                value={query} onChange={e => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* 검색 결과 */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {query.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">종목명이나 코드를 입력하세요</p>
              )}
              {results.length === 0 && query.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">검색 결과가 없습니다</p>
                  <button className="mt-2 text-blue-400 text-sm hover:underline">직접 입력하기</button>
                </div>
              )}
              {results.map(stock => (
                <button
                  key={stock.code}
                  onClick={() => handleSelect(stock)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                >
                  <div>
                    <span className="text-white font-medium">{stock.symbol}</span>
                    <span className="text-gray-500 text-sm ml-2">{stock.code}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded">{stock.market}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "form" && selected && (
          <div className="p-4 space-y-4">
            {/* 선택된 종목 */}
            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Activity size={20} className="text-blue-400"/>
              </div>
              <div>
                <p className="text-white font-semibold">{selected.symbol}</p>
                <p className="text-gray-500 text-xs">{selected.code} · {selected.market}</p>
              </div>
              <button onClick={() => { setStep("search"); setSelected(null); }} className="ml-auto text-gray-400 hover:text-white text-sm">변경</button>
            </div>

            {/* 입력 폼 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">보유 수량 *</label>
                <input type="number" placeholder="예: 50" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">평균 매입가 *</label>
                <input type="number" placeholder={selected.market === "KRX" ? "예: 72000" : "예: 142.50"} value={form.avgPrice} onChange={e => setForm({...form, avgPrice: e.target.value})}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">목표가 <span className="text-gray-600">(선택)</span></label>
                <input type="number" placeholder="자동: +15%" value={form.targetPrice} onChange={e => setForm({...form, targetPrice: e.target.value})}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">손절가 <span className="text-gray-600">(선택)</span></label>
                <input type="number" placeholder="자동: -10%" value={form.stopLoss} onChange={e => setForm({...form, stopLoss: e.target.value})}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
            </div>

            <button
              onClick={handleSubmitPortfolio}
              disabled={!form.qty || !form.avgPrice}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18}/> 포트폴리오에 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 알림 규칙 설정 모달
// ============================================================

const AlertRulesModal = ({ rules, onUpdate, onClose }) => {
  const [local, setLocal] = useState(rules);
  const toggle = (idx) => { const n = [...local]; n[idx] = { ...n[idx], enabled: !n[idx].enabled }; setLocal(n); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={18} className="text-gray-400"/> 알림 규칙 설정
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-400"/></button>
        </div>
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {local.map((rule, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-gray-200 text-sm">{rule.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{rule.desc}</p>
              </div>
              <button onClick={() => toggle(i)} className={`w-11 h-6 rounded-full relative transition-colors ${local[i].enabled ? "bg-blue-600" : "bg-gray-600"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${local[i].enabled ? "left-6" : "left-1"}`}/>
              </button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700">
          <button onClick={() => { onUpdate(local); onClose(); }} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <Save size={16}/> 저장
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TAB VIEWS
// ============================================================

const DashboardView = ({ portfolio, signals, onNav }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const totalInvested = portfolio.reduce((s, p) => s + p.avgPrice * p.qty, 0);
  const totalCurrent = portfolio.reduce((s, p) => s + p.currentPrice * p.qty, 0);
  const totalPnl = totalCurrent - totalInvested;
  const pnlPct = totalInvested > 0 ? (totalPnl / totalInvested * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">시장 현황</h2>
          <p className="text-gray-400 text-sm mt-1">{now.toLocaleDateString("ko-KR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · {now.toLocaleTimeString("ko-KR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> KRX 장중
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MARKET_INDICES.map(idx => (
          <div key={idx.name} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <p className="text-gray-400 text-sm">{idx.name}</p>
            <p className="text-xl font-bold text-white mt-1">{idx.value.toLocaleString()}</p>
            <div className={`flex items-center gap-1 mt-1 text-sm ${idx.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {idx.change >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
              <span>{idx.change >= 0 ? "+" : ""}{idx.pct.toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* 시그널 요약 */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Bell size={18} className="text-yellow-400"/> 오늘의 매매 시그널</h3>
          <button onClick={() => onNav("signals")} className="text-blue-400 text-xs hover:underline">전체보기 →</button>
        </div>
        {signals.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">관심종목을 등록하면 시그널이 생성됩니다</p>
        ) : (
          <div className="space-y-2">
            {signals.slice(0, 5).map((sig, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs font-mono w-12">{sig.time}</span>
                  <SignalBadge type={sig.type}/>
                  <span className="text-white font-medium">{sig.symbol}</span>
                </div>
                <p className="text-gray-400 text-sm hidden md:block max-w-xs truncate">{sig.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 포트폴리오 요약 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30 rounded-xl p-5">
          <p className="text-blue-300 text-sm">총 투자금</p>
          <p className="text-2xl font-bold text-white mt-1">{portfolio.length > 0 ? `₩${Math.round(totalInvested).toLocaleString()}` : "—"}</p>
          <p className="text-blue-400 text-xs mt-1">{portfolio.length}종목 보유중</p>
        </div>
        <div className={`bg-gradient-to-br ${totalPnl >= 0 ? "from-green-900/40 to-green-800/20 border-green-700/30" : "from-red-900/40 to-red-800/20 border-red-700/30"} border rounded-xl p-5`}>
          <p className={`${totalPnl >= 0 ? "text-green-300" : "text-red-300"} text-sm`}>총 평가금</p>
          <p className="text-2xl font-bold text-white mt-1">{portfolio.length > 0 ? `₩${Math.round(totalCurrent).toLocaleString()}` : "—"}</p>
          <p className={`${totalPnl >= 0 ? "text-green-400" : "text-red-400"} text-xs mt-1`}>{totalPnl >= 0 ? "+" : ""}{Math.round(totalPnl).toLocaleString()} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30 rounded-xl p-5 flex flex-col justify-center items-center cursor-pointer hover:border-purple-600/50 transition-colors" onClick={() => onNav("portfolio")}>
          <Plus size={24} className="text-purple-400 mb-1"/>
          <p className="text-purple-300 text-sm">종목 관리하기</p>
        </div>
      </div>
    </div>
  );
};

const WatchlistView = ({ watchlist, setWatchlist, onSelect }) => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = watchlist.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.code.includes(search));
  const handleAdd = (stock) => setWatchlist(prev => [...prev, stock]);
  const handleRemove = (code) => setWatchlist(prev => prev.filter(s => s.code !== code));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">관심종목 <span className="text-gray-500 text-lg font-normal">({watchlist.length})</span></h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16}/> 종목 추가
        </button>
      </div>

      {watchlist.length > 0 && (
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input type="text" placeholder="종목명 또는 코드 검색..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"/>
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
          <Star size={40} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400 text-lg font-medium">관심종목이 없습니다</p>
          <p className="text-gray-500 text-sm mt-1">상단의 '종목 추가' 버튼으로 모니터링할 종목을 등록하세요</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} className="inline mr-1"/> 첫 종목 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(stock => (
            <div key={stock.code} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-all group">
              <div className="flex justify-between items-start">
                <div className="cursor-pointer flex-1" onClick={() => onSelect(stock.symbol)}>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{stock.symbol}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">{stock.market}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{stock.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-white font-bold">{formatPrice(stock.price, stock.market)}</p>
                    <p className={`text-sm ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>{stock.change >= 0 ? "+" : ""}{stock.change.toFixed(1)}%</p>
                  </div>
                  <button onClick={() => handleRemove(stock.code)} className="p-1.5 hover:bg-red-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} className="text-red-400"/>
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <MiniChart data={stock.history} positive={stock.change >= 0}/>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2"><RsiBadge value={stock.rsi}/><MacdBadge value={stock.macd}/></div>
                <span className="text-xs text-gray-500">Vol {formatVol(stock.volume)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddStockModal type="watchlist" onClose={() => setShowAdd(false)} onAdd={handleAdd}/>}
    </div>
  );
};

const PortfolioView = ({ portfolio, setPortfolio }) => {
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = (stock) => setPortfolio(prev => [...prev, stock]);
  const handleRemove = (code) => setPortfolio(prev => prev.filter(p => p.code !== code));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">포트폴리오 <span className="text-gray-500 text-lg font-normal">({portfolio.length})</span></h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16}/> 보유종목 추가
        </button>
      </div>

      {portfolio.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
          <Briefcase size={40} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400 text-lg font-medium">보유종목이 없습니다</p>
          <p className="text-gray-500 text-sm mt-1">보유중인 종목, 수량, 평균매입가를 등록하세요</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} className="inline mr-1"/> 첫 보유종목 등록
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-700/50">
                  <th className="pb-3 font-medium">종목</th>
                  <th className="pb-3 font-medium">수량</th>
                  <th className="pb-3 font-medium">평균단가</th>
                  <th className="pb-3 font-medium">현재가</th>
                  <th className="pb-3 font-medium">수익률</th>
                  <th className="pb-3 font-medium">평가손익</th>
                  <th className="pb-3 font-medium">목표가</th>
                  <th className="pb-3 font-medium">손절가</th>
                  <th className="pb-3 font-medium">상태</th>
                  <th className="pb-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map(p => {
                  const pnl = (p.currentPrice - p.avgPrice) * p.qty;
                  const pnlPct = ((p.currentPrice - p.avgPrice) / p.avgPrice) * 100;
                  const near = p.currentPrice >= p.targetPrice * 0.95 ? "target" : p.currentPrice <= p.stopLoss * 1.05 ? "stop" : "normal";
                  return (
                    <tr key={p.code} className="border-b border-gray-800/50 hover:bg-gray-800/30 group">
                      <td className="py-3"><span className="text-white font-medium">{p.symbol}</span> <span className="text-xs text-gray-500">{p.market}</span></td>
                      <td className="py-3 text-gray-300">{p.qty}</td>
                      <td className="py-3 text-gray-300">{formatPrice(p.avgPrice, p.market)}</td>
                      <td className="py-3 text-white font-medium">{formatPrice(p.currentPrice, p.market)}</td>
                      <td className={`py-3 font-medium ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%</td>
                      <td className={`py-3 font-medium ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{pnl >= 0 ? "+" : ""}{formatPrice(Math.abs(pnl), p.market)}</td>
                      <td className="py-3 text-gray-300">{formatPrice(p.targetPrice, p.market)}</td>
                      <td className="py-3 text-gray-300">{formatPrice(p.stopLoss, p.market)}</td>
                      <td className="py-3">
                        {near === "target" && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12}/> 목표근접</span>}
                        {near === "stop" && <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={12}/> 손절주의</span>}
                        {near === "normal" && <span className="text-xs text-gray-500 flex items-center gap-1"><Eye size={12}/> 보유중</span>}
                      </td>
                      <td className="py-3">
                        <button onClick={() => handleRemove(p.code)} className="p-1.5 hover:bg-red-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={14} className="text-red-400"/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 비중 바 */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">포트폴리오 비중</h3>
            {(() => {
              const total = portfolio.reduce((s, p) => s + p.currentPrice * p.qty, 0);
              const colors = ["bg-blue-500","bg-green-500","bg-purple-500","bg-yellow-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
              return (
                <>
                  <div className="flex rounded-full overflow-hidden h-4">
                    {portfolio.map((p, i) => {
                      const w = total > 0 ? (p.currentPrice * p.qty / total * 100) : 0;
                      return <div key={p.code} className={colors[i % colors.length]} style={{ width: `${w}%` }}/>;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-300">
                    {portfolio.map((p, i) => {
                      const w = total > 0 ? (p.currentPrice * p.qty / total * 100) : 0;
                      return <span key={p.code} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${colors[i % colors.length]}`}/>{p.symbol} {w.toFixed(0)}%</span>;
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}

      {showAdd && <AddStockModal type="portfolio" onClose={() => setShowAdd(false)} onAdd={handleAdd}/>}
    </div>
  );
};

const SignalView = ({ signals, onOpenRules }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-white">매매 시그널</h2>
      <button onClick={onOpenRules} className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors">
        <Settings size={16}/> 규칙 설정
      </button>
    </div>

    {signals.length === 0 ? (
      <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
        <Activity size={40} className="text-gray-600 mx-auto mb-3"/>
        <p className="text-gray-400 text-lg font-medium">시그널이 없습니다</p>
        <p className="text-gray-500 text-sm mt-1">관심종목을 등록하면 기술적 분석 기반 시그널이 자동 생성됩니다</p>
      </div>
    ) : (
      <div className="space-y-3">
        {signals.map((sig, i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <SignalBadge type={sig.type}/>
                <span className="text-white font-semibold text-lg">{sig.symbol}</span>
                <span className="text-gray-400">{formatPrice(sig.price, sig.symbol.match(/^[A-Z]+$/) ? "NASDAQ" : "KRX")}</span>
              </div>
              <span className="text-gray-500 text-xs">{sig.time}</span>
            </div>
            <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
              <p className="text-gray-300 text-sm">{sig.reason}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const StockDetailView = ({ symbol, watchlist, onBack }) => {
  const stock = watchlist.find(s => s.symbol === symbol);
  if (!stock) return <div className="text-center py-16"><p className="text-gray-400">종목을 찾을 수 없습니다</p><button onClick={onBack} className="mt-2 text-blue-400 hover:underline text-sm">돌아가기</button></div>;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">← 뒤로가기</button>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{stock.symbol}</h2>
          <p className="text-gray-400 text-sm">{stock.code} · {stock.market}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{formatPrice(stock.price, stock.market)}</p>
          <p className={`text-lg ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>{stock.change >= 0 ? "+" : ""}{stock.change.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3">가격 차트 (30일)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={stock.history}>
            <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
            <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }}/>
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} domain={["auto","auto"]}/>
            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#fff" }}/>
            <Area type="monotone" dataKey="price" stroke="#3b82f6" fill="url(#pg)" strokeWidth={2} name="가격"/>
            <Line type="monotone" dataKey="ma5" stroke="#f59e0b" strokeWidth={1} dot={false} name="MA5"/>
            <Line type="monotone" dataKey="ma20" stroke="#ef4444" strokeWidth={1} dot={false} name="MA20"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3">거래량</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={stock.history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
            <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }}/>
            <Bar dataKey="volume" fill="#6366f1" radius={[2,2,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "RSI (14)", val: stock.rsi, badge: <RsiBadge value={stock.rsi}/> },
          { label: "MACD", val: stock.macd === "매수" ? "↑" : stock.macd === "매도" ? "↓" : "→", badge: <MacdBadge value={stock.macd}/> },
          { label: "거래량", val: formatVol(stock.volume), sub: "일 거래량" },
          { label: "시장", val: stock.market, sub: stock.code },
        ].map((item, i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">{item.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{item.val}</p>
            {item.badge || <span className="text-xs text-gray-500">{item.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================

const DEFAULT_RULES = [
  { label: "RSI 과매도 (30 이하) 매수 신호", desc: "RSI가 30 밑으로 떨어지면 매수 알림", enabled: true },
  { label: "RSI 과매수 (70 이상) 매도 신호", desc: "RSI가 70 위로 올라가면 매도 알림", enabled: true },
  { label: "골든크로스 (5일/20일)", desc: "5일 이동평균이 20일선을 상향 돌파", enabled: true },
  { label: "데드크로스 (5일/20일)", desc: "5일 이동평균이 20일선을 하향 돌파", enabled: true },
  { label: "거래량 300% 급증", desc: "평균 거래량 대비 3배 이상 거래량 발생", enabled: false },
  { label: "목표가 95% 도달", desc: "설정한 목표가의 95%에 도달 시 알림", enabled: true },
  { label: "손절가 105% 근접", desc: "손절가에 5% 이내로 접근 시 알림", enabled: true },
];

export default function StockDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [selectedStock, setSelectedStock] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [showRules, setShowRules] = useState(false);

  // 시그널은 관심종목 기반으로 자동 생성 (데모)
  const signals = useMemo(() => {
    return watchlist.map(s => {
      const types = ["buy", "sell", "hold"];
      const reasons = {
        buy: [`RSI ${s.rsi} 과매도 반등`, `5일선 20일선 골든크로스 임박`, `지지선 반등 + 거래량 증가`],
        sell: [`RSI ${s.rsi} 과매수 진입`, `데드크로스 접근 중`, `거래량 급감 + 하락 추세`],
        hold: [`박스권 횡보 중, 관망 추천`, `추세 불명확, 대기`, `이동평균선 수렴 중`],
      };
      const type = s.rsi <= 30 ? "buy" : s.rsi >= 70 ? "sell" : types[Math.floor(Math.random() * 3)];
      const h = Math.floor(Math.random() * 8) + 9;
      const m = Math.floor(Math.random() * 60);
      return {
        time: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`,
        symbol: s.symbol, type, price: s.price,
        reason: reasons[type][Math.floor(Math.random() * reasons[type].length)],
      };
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [watchlist]);

  const handleSelectStock = (symbol) => { setSelectedStock(symbol); setTab("detail"); };
  const handleNav = (t) => { setTab(t); setSelectedStock(null); };

  const tabs = [
    { id: "dashboard", label: "대시보드", icon: <BarChart3 size={18}/> },
    { id: "watchlist", label: "관심종목", icon: <Star size={18}/> },
    { id: "portfolio", label: "포트폴리오", icon: <Briefcase size={18}/> },
    { id: "signals", label: "시그널", icon: <Activity size={18}/> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-white"/>
            </div>
            <h1 className="text-lg font-bold text-white">StockPulse</h1>
            <span className="text-xs px-2 py-0.5 bg-blue-600/30 text-blue-400 rounded-full font-medium">Personal</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-800 rounded-lg"><RefreshCw size={18} className="text-gray-400"/></button>
            <button className="p-2 hover:bg-gray-800 rounded-lg relative"><Bell size={18} className="text-gray-400"/>{signals.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>}</button>
            <button onClick={() => setShowRules(true)} className="p-2 hover:bg-gray-800 rounded-lg"><Settings size={18} className="text-gray-400"/></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex gap-1 mb-6 bg-gray-800/50 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => handleNav(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id || (tab === "detail" && t.id === "watchlist") ? "bg-gray-700 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
              }`}>
              {t.icon} {t.label}
              {t.id === "signals" && signals.length > 0 && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{signals.length}</span>}
            </button>
          ))}
        </nav>

        {tab === "dashboard" && <DashboardView portfolio={portfolio} signals={signals} onNav={handleNav}/>}
        {tab === "watchlist" && <WatchlistView watchlist={watchlist} setWatchlist={setWatchlist} onSelect={handleSelectStock}/>}
        {tab === "portfolio" && <PortfolioView portfolio={portfolio} setPortfolio={setPortfolio}/>}
        {tab === "signals" && <SignalView signals={signals} onOpenRules={() => setShowRules(true)}/>}
        {tab === "detail" && selectedStock && <StockDetailView symbol={selectedStock} watchlist={watchlist} onBack={() => setTab("watchlist")}/>}
      </div>

      <footer className="border-t border-gray-800 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-gray-600">
          <span>StockPulse v0.1 · 개인용</span>
          <span>데이터: 네이버증권 · Yahoo Finance · Alpha Vantage · Finnhub</span>
        </div>
      </footer>

      {showRules && <AlertRulesModal rules={rules} onUpdate={setRules} onClose={() => setShowRules(false)}/>}
    </div>
  );
}