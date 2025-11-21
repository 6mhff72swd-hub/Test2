import React, { useEffect, useState } from 'react';
import { Trade } from '../types';
import { getStockPrice } from '../services/geminiService';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';

interface LiveTickerProps {
  openTrades: Trade[];
}

interface PriceData {
  price: number;
  change?: number; // Not always available from simple prompt, but good for future
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ openTrades }) => {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Identify unique symbols held in open positions
  const heldSymbols: string[] = Array.from(new Set(openTrades.map(t => t.symbol)));

  const fetchPrices = async () => {
    if (heldSymbols.length === 0) return;
    
    setLoading(true);
    const newPrices: Record<string, number> = {};

    // In a production app, we would batch this or use a real WebSocket API.
    // Here we loop, which might be slow, but works for the demo constraints.
    await Promise.all(heldSymbols.map(async (symbol) => {
      const result = await getStockPrice(symbol);
      if (result) {
        newPrices[symbol] = result.price;
      }
    }));

    setPrices(prev => ({ ...prev, ...newPrices }));
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchPrices();
    // Refresh every 5 minutes automatically
    const interval = setInterval(fetchPrices, 300000); 
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldSymbols.join(',')]); // Re-run if held symbols change

  if (heldSymbols.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} className="text-indigo-400" />
          Live Holdings Watch
        </h3>
        <button 
          onClick={fetchPrices} 
          disabled={loading}
          className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? 'Updating...' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {heldSymbols.map(symbol => {
          // Calculate average buy price for this symbol in open trades
          const symbolTrades = openTrades.filter(t => t.symbol === symbol);
          const totalCost = symbolTrades.reduce((sum, t) => sum + (t.buyPrice * t.quantity), 0);
          const totalQty = symbolTrades.reduce((sum, t) => sum + t.quantity, 0);
          const avgBuy = totalQty > 0 ? totalCost / totalQty : 0;

          const currentPrice = prices[symbol];
          const diff = currentPrice ? currentPrice - avgBuy : 0;
          const percentDiff = currentPrice ? (diff / avgBuy) * 100 : 0;
          const isProfit = diff >= 0;

          return (
            <div key={symbol} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 flex flex-col shadow-sm hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-white text-sm">{symbol}</span>
                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                  {totalQty} sh
                </span>
              </div>
              
              <div className="flex items-end justify-between mt-1">
                <div>
                  <div className="text-xs text-slate-500">Avg: {avgBuy.toFixed(2)}</div>
                  <div className="text-lg font-mono font-semibold text-slate-200">
                    {currentPrice ? `$${currentPrice.toFixed(2)}` : <span className="text-xs text-slate-600">Loading...</span>}
                  </div>
                </div>
                
                {currentPrice && (
                  <div className={`flex items-center text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isProfit ? <TrendingUp size={14} className="mr-0.5" /> : <TrendingDown size={14} className="mr-0.5" />}
                    {Math.abs(percentDiff).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};