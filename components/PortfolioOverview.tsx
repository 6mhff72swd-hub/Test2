import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trade } from '../types';

interface PortfolioOverviewProps {
  trades: Trade[];
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ trades }) => {
  // Calculate Portfolio Aggregates based on ALL trades passed (which are already filtered by date/symbol in App)
  const portfolioData = useMemo(() => {
    const summary: Record<string, { totalShares: number; investedAmount: number; avgBuyPrice: number }> = {};

    trades.forEach(trade => {
      // We include all trades in the filter to show volume/allocation stats for the selected period
      if (!summary[trade.symbol]) {
        summary[trade.symbol] = { totalShares: 0, investedAmount: 0, avgBuyPrice: 0 };
      }
      summary[trade.symbol].totalShares += trade.quantity;
      summary[trade.symbol].investedAmount += trade.buyPrice * trade.quantity;
    });

    const totalInvested = Object.values(summary).reduce((acc, curr) => acc + curr.investedAmount, 0);

    return Object.keys(summary).map(symbol => {
      const data = summary[symbol];
      return {
        symbol,
        shares: data.totalShares,
        amount: data.investedAmount,
        avgBuy: data.investedAmount / data.totalShares,
        percentage: totalInvested > 0 ? (data.investedAmount / totalInvested) * 100 : 0
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [trades]);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  // Custom Label Renderer for Pie Chart
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';
    
    // Only show label if slice is big enough to matter (e.g., > 3%) to reduce clutter
    if (percent < 0.03) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="#cbd5e1" 
        textAnchor={textAnchor} 
        dominantBaseline="central" 
        fontSize={11}
        fontWeight={500}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (portfolioData.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-400">
        No data available for the selected filters to generate portfolio analytics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      
      {/* Allocation Pie Chart */}
      <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col items-center">
        <h3 className="text-lg font-bold text-white mb-2 w-full text-left">Capital Allocation</h3>
        <p className="text-xs text-slate-400 w-full text-left mb-4">Based on Total Invested Amount</p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={portfolioData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="amount"
                nameKey="symbol"
                label={renderCustomizedLabel}
                labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
              >
                {portfolioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                formatter={(value: number) => `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center" 
                wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                formatter={(value) => <span className="text-slate-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center">
          <span className="text-slate-400 text-sm">Total Volume Invested</span>
          <div className="text-2xl font-bold text-white">
            ${portfolioData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Portfolio Details</h3>
          <p className="text-xs text-slate-400 mt-1">Breakdown of volume and average costs per symbol</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Color</th>
                <th className="p-4 font-semibold">Symbol</th>
                <th className="p-4 font-semibold text-right">Total Shares</th>
                <th className="p-4 font-semibold text-right">Avg. Buy Price</th>
                <th className="p-4 font-semibold text-right">Total Amount</th>
                <th className="p-4 font-semibold text-right">Portfolio %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {portfolioData.map((item, index) => (
                <tr key={item.symbol} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  </td>
                  <td className="p-4 font-bold text-white">{item.symbol}</td>
                  <td className="p-4 text-right text-slate-300">{item.shares}</td>
                  <td className="p-4 text-right text-slate-300 font-mono">${item.avgBuy.toFixed(2)}</td>
                  <td className="p-4 text-right text-emerald-400 font-mono font-medium">
                    ${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="p-4 text-right text-slate-300">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs">{item.percentage.toFixed(1)}%</span>
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${item.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};