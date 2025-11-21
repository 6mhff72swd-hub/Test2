export interface Trade {
  id: string;
  symbol: string;
  buyPrice: number;
  sellPrice: number | null;
  quantity: number;
  date: string; // ISO Date string
  timestamp: number; // For sorting
  remarks?: string;
}

export interface TradeStats {
  totalProfit: number;
  avgBuyPrice: number;
  avgSellPrice: number;
  avgProfitPerTrade: number;
  winRate: number;
  totalTrades: number;
  openPositions: number;
  bestTrade: number;
  worstTrade: number;
}

export enum TimeFrame {
  ALL = 'ALL',
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YTD = 'YTD',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM'
}