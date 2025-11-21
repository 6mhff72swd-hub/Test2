import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Filter, Plus, List, Search, PieChart } from 'lucide-react';
import { Trade, TradeStats, TimeFrame } from './types';
import { TradeForm } from './components/TradeForm';
import { StatsOverview } from './components/StatsOverview';
import { TradeCharts } from './components/TradeCharts';
import { TradeHistory } from './components/TradeHistory';
import { AIInsights } from './components/AIInsights';
import { PortfolioOverview } from './components/PortfolioOverview';
import { LiveTicker } from './components/LiveTicker';

// Helper to generate IDs without external lib
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Helper to generate massive test dataset
const generateLargeDataset = (): Trade[] => {
  const symbols = ['TSLA', 'AAPL', 'NVDA', 'MSFT', 'AMZN'];
  const trades: Trade[] = [];
  const now = new Date();
  const tenYearsInMillis = 10 * 365 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < 1000; i++) {
      // Random date within last 10 years
      const timeOffset = Math.random() * tenYearsInMillis;
      const tradeDate = new Date(now.getTime() - timeOffset);
      
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Random realistic prices based on symbol (rough approx for realism)
      let basePrice = 100;
      if (symbol === 'TSLA') basePrice = 200;
      if (symbol === 'AAPL') basePrice = 150;
      if (symbol === 'NVDA') basePrice = 400;
      if (symbol === 'MSFT') basePrice = 300;
      if (symbol === 'AMZN') basePrice = 130;
      
      // Add variance to price
      const buyPrice = basePrice * (0.5 + Math.random()); // 50% to 150% of base
      
      const quantity = Math.floor(Math.random() * 50) + 1;
      
      // 80% Closed, 20% Held
      const isSold = Math.random() > 0.2;
      let sellPrice: number | null = null;
      
      if (isSold) {
          // Profit/Loss variance (+/- 25%)
          const variance = (Math.random() * 0.5) - 0.2; 
          sellPrice = buyPrice * (1 + variance);
      }

      trades.push({
          id: `test-${i}-${Math.random().toString(36).substring(2, 9)}`,
          symbol,
          buyPrice: parseFloat(buyPrice.toFixed(2)),
          sellPrice: sellPrice ? parseFloat(sellPrice.toFixed(2)) : null,
          quantity,
          date: tradeDate.toISOString().split('T')[0],
          timestamp: tradeDate.getTime(),
          remarks: 'Automated 10-Year Test Data'
      });
  }
  
  return trades.sort((a, b) => b.timestamp - a.timestamp);
};

const App: React.FC = () => {
  // Initial State with Auto-Generated Data if empty
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('tradePulse_trades');
    const parsed = saved ? JSON.parse(saved) : [];

    // If storage is empty or has just the small default set (< 50), inject the massive test set
    // This ensures the user sees the 1000 entries immediately for testing.
    if (parsed.length < 50) {
       console.log("Injecting 1000 test entries...");
       return generateLargeDataset();
    }
    
    return parsed;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'log'>('dashboard');
  
  // Filter State
  const [stockFilter, setStockFilter] = useState('');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(TimeFrame.ALL);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Auto-sanitize and save
  useEffect(() => {
    const sanitizedTrades = trades.map(t => ({
        ...t,
        sellPrice: (t.sellPrice === '' as any) ? null : t.sellPrice
    }));
    localStorage.setItem('tradePulse_trades', JSON.stringify(sanitizedTrades));
  }, [trades]);

  // Get Unique Symbols for Dropdown
  const uniqueSymbols = useMemo(() => {
    return Array.from(new Set(trades.map(t => t.symbol))).sort();
  }, [trades]);

  const handleSaveTrade = (tradeData: Omit<Trade, 'id' | 'timestamp'>) => {
    if (editingTrade) {
      // Update existing trade
      setTrades(prev => prev.map(t => 
        t.id === editingTrade.id 
          ? { ...t, ...tradeData, timestamp: new Date(tradeData.date).getTime() } 
          : t
      ));
    } else {
      // Create new trade
      const newTrade: Trade = {
        ...tradeData,
        id: generateId(),
        timestamp: new Date(tradeData.date).getTime()
      };
      setTrades(prev => [...prev, newTrade]);
    }
    
    // Close modal and reset
    setIsModalOpen(false);
    setEditingTrade(null);
  };

  const handleDeleteTrade = (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade record?')) {
      setTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEditClick = (trade: Trade) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  const handleNewTradeClick = () => {
    setEditingTrade(null);
    setIsModalOpen(true);
  };

  // Filtering Logic
  const filteredTrades = useMemo(() => {
    let result = trades;

    if (stockFilter) {
      result = result.filter(t => t.symbol.includes(stockFilter.toUpperCase()));
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeFrame !== TimeFrame.ALL) {
      let start = new Date(0); // Epoch
      let end = new Date(8640000000000000); // Max date

      switch (timeFrame) {
        case TimeFrame.TODAY:
          start = today;
          break;
        case TimeFrame.WEEK:
          start = new Date(today);
          start.setDate(today.getDate() - 7);
          break;
        case TimeFrame.MONTH:
          start = new Date(today);
          start.setDate(today.getDate() - 30);
          break;
        case TimeFrame.YTD:
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case TimeFrame.YEAR:
          start = new Date(today);
          start.setFullYear(today.getFullYear() - 1);
          break;
        case TimeFrame.CUSTOM:
          if (customStartDate) start = new Date(customStartDate);
          if (customEndDate) {
             end = new Date(customEndDate);
             end.setHours(23, 59, 59, 999); // End of that day
          }
          break;
      }
      
      result = result.filter(t => t.timestamp >= start.getTime() && t.timestamp <= end.getTime());
    }

    return result;
  }, [trades, stockFilter, timeFrame, customStartDate, customEndDate]);

  // Statistics Calculation
  const stats: TradeStats = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        totalProfit: 0,
        avgBuyPrice: 0,
        avgSellPrice: 0,
        avgProfitPerTrade: 0,
        winRate: 0,
        totalTrades: 0,
        openPositions: 0,
        bestTrade: 0,
        worstTrade: 0
      };
    }

    const totalTrades = filteredTrades.length;
    const closedTrades = filteredTrades.filter(t => t.sellPrice !== null);
    const openPositions = totalTrades - closedTrades.length;
    const totalBuyPrice = filteredTrades.reduce((sum, t) => sum + t.buyPrice, 0);
    
    let totalProfit = 0;
    let totalSellPrice = 0;
    let wins = 0;
    let best = -Infinity;
    let worst = Infinity;

    closedTrades.forEach(t => {
      const sellPrice = t.sellPrice as number;
      const profit = (sellPrice - t.buyPrice) * t.quantity;
      totalProfit += profit;
      totalSellPrice += sellPrice;
      if (profit > 0) wins++;
      if (profit > best) best = profit;
      if (profit < worst) worst = profit;
    });

    return {
      totalProfit,
      avgBuyPrice: totalTrades > 0 ? totalBuyPrice / totalTrades : 0,
      avgSellPrice: closedTrades.length > 0 ? totalSellPrice / closedTrades.length : 0,
      avgProfitPerTrade: closedTrades.length > 0 ? totalProfit / closedTrades.length : 0,
      winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
      totalTrades,
      openPositions,
      bestTrade: best === -Infinity ? 0 : best,
      worstTrade: worst === Infinity ? 0 : worst
    };
  }, [filteredTrades]);

  // Open Positions for Live Ticker - USES ALL TRADES, NOT FILTERED
  const openPositionsTrades = useMemo(() => {
      return trades.filter(t => t.sellPrice === null);
  }, [trades]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-24">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-4 shadow-lg shadow-slate-900/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <LayoutDashboard className="text-white" size={22} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              TradePulse
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <AIInsights trades={filteredTrades} stats={stats} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        {/* Tabs & Filters Container */}
        <div className="mb-8 space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700/50 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'portfolio' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <PieChart size={16} />
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'log' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <List size={16} />
              Trade Log
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
                    <Filter size={18} />
                  </div>
                  <span className="font-semibold text-slate-300">Filters</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
                  {/* Symbol Dropdown */}
                  <div className="relative w-full sm:w-48">
                    <input
                      list="stock-symbols"
                      placeholder="Filter Symbol"
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none uppercase text-sm transition-all placeholder:text-slate-600"
                    />
                    <Search size={16} className="absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                    <datalist id="stock-symbols">
                      <option value="">All Symbols</option>
                      {uniqueSymbols.map(sym => (
                        <option key={sym} value={sym} />
                      ))}
                    </datalist>
                  </div>

                  {/* Time Frame */}
                  <select
                      value={timeFrame}
                      onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
                      className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none text-sm w-full sm:w-48 transition-all text-slate-300"
                  >
                      <option value={TimeFrame.ALL}>All Time</option>
                      <option value={TimeFrame.TODAY}>Today</option>
                      <option value={TimeFrame.WEEK}>Last 7 Days</option>
                      <option value={TimeFrame.MONTH}>Last 30 Days</option>
                      <option value={TimeFrame.YTD}>Year to Date</option>
                      <option value={TimeFrame.YEAR}>Last Year</option>
                      <option value={TimeFrame.CUSTOM}>Custom Range</option>
                  </select>

                  {/* Custom Date Inputs */}
                  {timeFrame === TimeFrame.CUSTOM && (
                    <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-left-4 duration-300">
                      <div className="relative">
                        <input 
                          type="date" 
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none w-full sm:w-32"
                        />
                      </div>
                      <span className="text-slate-500">-</span>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none w-full sm:w-32"
                        />
                      </div>
                    </div>
                  )}
              </div>
          </div>
        </div>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <LiveTicker openTrades={openPositionsTrades} />
             <StatsOverview stats={stats} />
             <TradeCharts trades={filteredTrades} />
             <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Recent Activity
                  </h2>
                  <button 
                    onClick={() => setActiveTab('log')}
                    className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    View All &rarr;
                  </button>
                </div>
                <TradeHistory 
                  trades={filteredTrades.slice(0, 5)} 
                  onDelete={handleDeleteTrade} 
                  onEdit={handleEditClick}
                />
             </div>
          </div>
        )}

        {/* Portfolio View */}
        {activeTab === 'portfolio' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Portfolio Analysis
                  <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                    Filtered View
                  </span>
                </h2>
            </div>
            <PortfolioOverview trades={filteredTrades} />
          </div>
        )}

        {/* Trade Log View */}
        {activeTab === 'log' && (
          <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Trade Log
                  <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                    {filteredTrades.length} Records
                  </span>
                </h2>
              </div>
              <TradeHistory 
                trades={filteredTrades} 
                onDelete={handleDeleteTrade} 
                onEdit={handleEditClick}
              />
          </div>
        )}

      </main>

      {/* Floating Add Button */}
      <button
        onClick={handleNewTradeClick}
        className="fixed bottom-8 right-8 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 z-40 flex items-center gap-3 group border border-emerald-400/20"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" /> 
        <span className="font-bold pr-2">Record Trade</span>
      </button>

      {/* Modal */}
      <TradeForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTrade} 
        initialData={editingTrade} 
      />
    </div>
  );
};

export default App;