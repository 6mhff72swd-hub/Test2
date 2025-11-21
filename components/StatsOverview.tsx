import React from 'react';
import { TradeStats } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, Layers } from 'lucide-react';

interface StatsOverviewProps {
  stats: TradeStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const isProfitable = stats.totalProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Profit Card */}
      <div className={`bg-slate-800 border ${isProfitable ? 'border-emerald-500/30' : 'border-red-500/30'} rounded-xl p-4 shadow-lg relative overflow-hidden group`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${isProfitable ? 'bg-emerald-500/10' : 'bg-red-500/10'} transition-transform group-hover:scale-150`}></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Realized P/L</p>
            <h3 className={`text-2xl font-bold mt-1 ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalProfit < 0 ? '-' : ''}${Math.abs(stats.totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">From closed trades</p>
          </div>
          <div className={`p-2 rounded-lg ${isProfitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {isProfitable ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        </div>
      </div>

      {/* Win Rate Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Win Rate</p>
            <h3 className="text-2xl font-bold mt-1 text-blue-400">
              {stats.winRate.toFixed(1)}%
            </h3>
             <p className="text-xs text-slate-500 mt-1">Of closed trades</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <Percent size={20} />
          </div>
        </div>
        <div className="w-full bg-slate-700 h-1 mt-4 rounded-full">
            <div className="bg-blue-500 h-1 rounded-full transition-all duration-500" style={{ width: `${stats.winRate}%` }}></div>
        </div>
      </div>

      {/* Avg Prices Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Average Price</p>
            <div className="mt-1 space-y-1">
                <div className="flex items-center text-xs text-slate-300">
                    <span className="w-8 text-emerald-400 font-bold">Buy:</span> 
                    ${stats.avgBuyPrice.toFixed(2)}
                </div>
                <div className="flex items-center text-xs text-slate-300">
                    <span className="w-8 text-red-400 font-bold">Sell:</span> 
                    ${stats.avgSellPrice.toFixed(2)}
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Avg Buy includes holds</p>
          </div>
          <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

       {/* Trades Overview Card */}
       <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Activity</p>
             <div className="mt-1 space-y-1">
                <div className="flex items-center text-xs text-slate-300">
                    <span className="w-12 text-slate-400">Total:</span> 
                    <span className="font-bold text-white">{stats.totalTrades}</span>
                </div>
                <div className="flex items-center text-xs text-slate-300">
                    <span className="w-12 text-blue-400">Open:</span> 
                    <span className="font-bold text-blue-300">{stats.openPositions}</span>
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-1">Avg Profit: ${stats.avgProfitPerTrade.toFixed(2)}</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
            <Layers size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};
