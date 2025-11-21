import { GoogleGenAI } from "@google/genai";
import { Trade, TradeStats } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

export const analyzeTrades = async (trades: Trade[], stats: TradeStats): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "API Key not configured. Please check your environment settings.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare data summary to avoid token limits with huge datasets
    const tradeSummary = trades.slice(0, 50).map(t => {
      if (t.sellPrice === null) {
        return {
          symbol: t.symbol,
          status: 'HELD (OPEN)',
          buyPrice: t.buyPrice,
          date: t.date
        };
      }
      return {
        symbol: t.symbol,
        profit: (t.sellPrice - t.buyPrice) * t.quantity,
        percentGain: ((t.sellPrice - t.buyPrice) / t.buyPrice) * 100,
        date: t.date
      };
    });

    const prompt = `
      Act as a professional senior financial analyst. Analyze the following trading performance data.
      
      Global Stats:
      - Total Realized Profit: $${stats.totalProfit.toFixed(2)}
      - Win Rate (Closed Trades): ${stats.winRate.toFixed(1)}%
      - Total Trades (Including Held): ${stats.totalTrades}
      - Open Positions: ${stats.openPositions}
      - Avg Profit/Trade (Closed): $${stats.avgProfitPerTrade.toFixed(2)}

      Recent Trade History (Partial):
      ${JSON.stringify(tradeSummary)}

      Please provide a concise, bulleted analysis:
      1. Performance Summary: Are they profitable on closed trades?
      2. Open Position Analysis: Comment on the volume of held positions if any.
      3. Pattern Recognition: Any specific stocks or behaviors leading to wins or losses?
      4. Strategic Advice: One or two actionable tips to improve based on this data.

      Keep the tone professional, encouraging, but realistic. Format with Markdown.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert stock market trading coach.",
      }
    });

    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Error analyzing trades:", error);
    return "An error occurred while analyzing your trades. Please try again later.";
  }
};

export const getStockPrice = async (symbol: string): Promise<{ price: number, text: string } | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `What is the current live stock price of ${symbol}? Return the price clearly.`,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const text = response.text || "";
    // Simple regex to find a price pattern like $123.45 or 123.45
    const priceMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(\.\d{2})?)/);
    
    if (priceMatch) {
        const priceStr = priceMatch[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        return { price, text };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching stock price:", error);
    return null;
  }
};