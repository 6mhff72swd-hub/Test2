import React from 'react';
import { Trade } from '../types';
import { Trash2, Clock, Pencil, ArrowUpRight, ArrowDownRight, MessageSquareText } from 'lucide-react';

interface TradeHistoryProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades, onDelete, onEdit }) => {
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed">
        <div className="p-4 bg-slate-800 rounded-full mb-4">
          <Clock size={32} className="opacity-50" />
        </div>
        <p className="text-lg font-medium">No trades recorded yet</p>
        <p className="text-sm opacity-70">Start building your portfolio by adding a trade.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl ring-1 ring-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Symbol</th>
              <th className="p-4 font-semibold text-right">Buy Price</th>
              <th className="p-4 font-semibold text-right">Sell Price</th>
              <th className="p-4 font-semibold text-right">Qty</th>
              <th className="p-4 font-semibold text-right">P/L</th>
              <th className="p-4 font-semibold">Remarks</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {trades.sort((a,b) => b.timestamp - a.timestamp).map((trade) => {
              const isHeld = trade.sellPrice === null;
              let profit = 0;
              let profitPercent = 0;
              let isProfitable = false;

              if (!isHeld) {
                profit = ((trade.sellPrice as number) - trade.buyPrice) * trade.quantity;
                profitPercent = (((trade.sellPrice as number) - trade.buyPrice) / trade.buyPrice) * 100;
                isProfitable = profit >= 0;
              }

              return (
                <tr key={trade.id} className="group hover:bg-slate-700/20 transition-colors text-sm">
                  <td className="p-4 text-slate-300 font-mono text-xs whitespace-nowrap">{trade.date}</td>
                  <td className="p-4">
                    <span className="font-bold text-white bg-slate-700/50 px-2 py-1 rounded border border-slate-600 text-xs tracking-wide">
                      {trade.symbol}
                    </span>
                  </td>
                  <td className="p-4 text-right text-slate-300 font-mono">${trade.buyPrice.toFixed(2)}</td>
                  <td className="p-4 text-right text-slate-300 font-mono">
                    {isHeld ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                        <Clock size={10} /> HELD
                      </span>
                    ) : (
                      `$${(trade.sellPrice as number).toFixed(2)}`
                    )}
                  </td>
                  <td className="p-4 text-right text-slate-300">{trade.quantity}</td>
                  <td className="p-4 text-right">
                    {isHeld ? (
                      <span className="text-slate-600">-</span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className={`font-bold flex items-center gap-1 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {isProfitable ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                           {profit < 0 ? '-' : '+'}${Math.abs(profit).toFixed(2)}
                        </div>
                        <div className={`text-xs font-medium ${isProfitable ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                          {profitPercent > 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-4 max-w-xs">
                    {trade.remarks ? (
                      <div className="text-xs text-slate-400 truncate" title={trade.remarks}>
                         {trade.remarks}
                      </div>
                    ) : (
                      <span className="text-slate-700 text-xs italic">No remarks</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(trade)}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                        title="Edit Trade"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(trade.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Trade"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};