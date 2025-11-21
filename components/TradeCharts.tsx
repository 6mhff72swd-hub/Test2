import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';
import { Trade } from '../types';

interface TradeChartsProps {
  trades: Trade[];
}

export const TradeCharts: React.FC<TradeChartsProps> = ({ trades }) => {
  // Prepare data for Charts
  const chartData = useMemo(() => {
    // 1. Aggregate Profit by Date
    const dailyProfits: Record<string, number> = {};

    trades.forEach(trade => {
        if (trade.sellPrice !== null) {
            const profit = (trade.sellPrice - trade.buyPrice) * trade.quantity;
            if (!dailyProfits[trade.date]) {
                dailyProfits[trade.date] = 0;
            }
            dailyProfits[trade.date] += profit;
        }
    });

    // 2. Sort Dates (ISO strings sort correctly chronologically)
    const sortedDates = Object.keys(dailyProfits).sort();

    // 3. Calculate Cumulative
    let runningTotal = 0;
    return sortedDates.map(date => {
        runningTotal += dailyProfits[date];
        return {
            date,
            dailyProfit: dailyProfits[date],
            cumulative: runningTotal
        };
    });
  }, [trades]);

  // Prepare data for Stock Performance (Average Return per Ticker)
  const tickerPerformance = useMemo(() => {
    const perf: Record<string, { totalProfit: number; count: number; avgProfit: number }> = {};
    
    trades.forEach(t => {
      if (t.sellPrice !== null) {
        const profit = (t.sellPrice - t.buyPrice) * t.quantity;
        if (!perf[t.symbol]) {
          perf[t.symbol] = { totalProfit: 0, count: 0, avgProfit: 0 };
        }
        perf[t.symbol].totalProfit += profit;
        perf[t.symbol].count += 1;
      }
    });

    return Object.keys(perf).map(symbol => ({
      symbol,
      avgProfit: perf[symbol].totalProfit / perf[symbol].count,
      totalProfit: perf[symbol].totalProfit
    })).sort((a, b) => b.totalProfit - a.totalProfit); // Best performers first
  }, [trades]);

  // Helper to format date safely (avoiding timezone shifts)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    // Construct date as local time to ensure day doesn't shift
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    }).format(date);
  };

  if (trades.filter(t => t.sellPrice !== null).length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400 mb-8">
        Record some completed trades to visualize your performance. <br/>
        <span className="text-sm opacity-70">(Open positions are not plotted)</span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-200 font-bold mb-1">{formatDate(label)}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }} className="text-sm">
              {p.name}: ${p.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Cumulative P&L Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Cumulative Performance</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                tick={{fontSize: 11}} 
                tickFormatter={formatDate}
                minTickGap={30}
              />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Total P&L"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Performance Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Daily Performance</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                tick={{fontSize: 11}} 
                tickFormatter={formatDate}
                minTickGap={30}
              />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="dailyProfit" name="Daily P&L" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.dailyProfit >= 0 ? '#34d399' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ticker Performance Bar Chart - Full Width */}
      <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Profit by Ticker</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tickerPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="symbol" stroke="#94a3b8" tick={{fontSize: 12}} />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#334155', opacity: 0.4}}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                                <p className="text-slate-200 font-bold mb-1">{payload[0].payload.symbol}</p>
                                <p className={`text-sm ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    Total Profit: ${val.toFixed(2)}
                                </p>
                            </div>
                        );
                    }
                    return null;
                }}
              />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="totalProfit" name="Total Profit" radius={[4, 4, 0, 0]}>
                {tickerPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.totalProfit >= 0 ? '#34d399' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};