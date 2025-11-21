import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Briefcase, StickyNote, RefreshCw, Search } from 'lucide-react';
import { Trade } from '../types';
import { getStockPrice } from '../services/geminiService';

interface TradeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'timestamp'>) => void;
  initialData?: Trade | null;
}

export const TradeForm: React.FC<TradeFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [symbol, setSymbol] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  
  // Live Price State
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSymbol(initialData.symbol);
        setBuyPrice(initialData.buyPrice.toString());
        setSellPrice(initialData.sellPrice !== null ? initialData.sellPrice.toString() : '');
        setQuantity(initialData.quantity.toString());
        setDate(initialData.date);
        setRemarks(initialData.remarks || '');
      } else {
        // Reset for new entry
        setSymbol('');
        setBuyPrice('');
        setSellPrice('');
        setQuantity('');
        setDate(new Date().toISOString().split('T')[0]);
        setRemarks('');
      }
      setFetchedPrice(null);
    }
  }, [isOpen, initialData]);

  const handleFetchPrice = async () => {
    if (!symbol) return;
    setIsFetchingPrice(true);
    const result = await getStockPrice(symbol);
    if (result) {
        setFetchedPrice(result.price);
    }
    setIsFetchingPrice(false);
  };

  const applyPriceToBuy = () => {
    if (fetchedPrice) setBuyPrice(fetchedPrice.toString());
  };

  const applyPriceToSell = () => {
    if (fetchedPrice) setSellPrice(fetchedPrice.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !buyPrice || !quantity || !date) return;

    // If sellPrice is empty string, it treats as null (Held/Not Sold)
    const parsedSellPrice = sellPrice.trim() === '' ? null : parseFloat(sellPrice);

    onSave({
      symbol: symbol.toUpperCase(),
      buyPrice: parseFloat(buyPrice),
      sellPrice: parsedSellPrice,
      quantity: parseInt(quantity),
      date: date,
      remarks: remarks
    });
  };

  if (!isOpen) return null;

  // Determine status based on sell price input
  const isHolding = sellPrice.trim() === '';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-0 w-full max-w-lg shadow-2xl relative flex flex-col overflow-hidden ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              {initialData ? <Briefcase size={20} /> : <Plus size={20} />}
            </div>
            {initialData ? 'Edit Trade Details' : 'New Trade Entry'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            {/* Symbol & Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Stock Symbol</label>
                <div className="relative">
                    <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. AAPL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pr-10 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none uppercase transition-all font-semibold tracking-wide"
                    required
                    autoFocus={!initialData}
                    onBlur={() => symbol && !fetchedPrice && handleFetchPrice()}
                    />
                     <button 
                        type="button"
                        onClick={handleFetchPrice}
                        disabled={!symbol || isFetchingPrice}
                        className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors disabled:opacity-50"
                        title="Get Current Price"
                    >
                        {isFetchingPrice ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                </div>
                {fetchedPrice && (
                    <div className="absolute mt-1 text-xs font-mono text-emerald-400 flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 z-10">
                        <span>Live: ${fetchedPrice.toFixed(2)}</span>
                        <span className="w-px h-3 bg-emerald-500/30 mx-1"></span>
                        <button type="button" onClick={applyPriceToBuy} className="hover:underline hover:text-white">Use Buy</button>
                        <span className="text-slate-600">|</span>
                        <button type="button" onClick={applyPriceToSell} className="hover:underline hover:text-white">Use Sell</button>
                    </div>
                )}
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Trade Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="group">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of shares"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all"
                required
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Buy Price ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-7 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-1.5">
                    <label className={`block text-xs font-medium transition-colors ${isHolding ? 'text-slate-500' : 'text-slate-400 group-focus-within:text-emerald-400'}`}>Sell Price ($)</label>
                    {isHolding && <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 rounded border border-indigo-500/20 uppercase font-semibold tracking-wider">On Hold</span>}
                </div>
                <div className="relative">
                  <span className={`absolute left-3 top-3 ${isHolding ? 'text-slate-600' : 'text-slate-500'}`}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="Empty = Held"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-7 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Info Box for Status */}
             <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 transition-all duration-300 ${isHolding ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                 {isHolding ? (
                     <>
                        <Briefcase size={14} />
                        <span>This position is currently <strong>OPEN (HELD)</strong>.</span>
                     </>
                 ) : (
                     <>
                        <Save size={14} />
                        <span>This position is <strong>CLOSED (SOLD)</strong>.</span>
                     </>
                 )}
             </div>

            {/* Remarks */}
            <div className="group">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">
                    <div className="flex items-center gap-1.5">
                        <StickyNote size={12} />
                        Remarks / Strategy
                    </div>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter trade notes, strategy used, or lessons learned..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all min-h-[80px] text-sm resize-none"
                />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
            >
              <Save size={18} />
              {initialData ? 'Update Trade' : 'Save Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};