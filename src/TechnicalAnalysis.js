/**
 * TechnicalAnalysis.js - 技术分析模块
 * 
 * 提供 RSI、MACD、布林带等技术指标计算
 * 以及支撑/阻力位分析功能
 * 
 * @version 2.1.0
 * @author Crypto Hunter Team
 */

class TechnicalAnalysis {
    constructor(config = {}) {
        // 默认配置
        this.config = {
            // RSI 周期
            rsiPeriod: config.rsiPeriod || 14,
            // RSI 超买阈值
            rsiOverbought: config.rsiOverbought || 70,
            // RSI 超卖阈值
            rsiOversold: config.rsiOversold || 30,
            // MACD 快速 EMA 周期
            macdFastPeriod: config.macdFastPeriod || 12,
            // MACD 慢速 EMA 周期
            macdSlowPeriod: config.macdSlowPeriod || 26,
            // MACD 信号线周期
            macdSignalPeriod: config.macdSignalPeriod || 9,
            // 布林带周期
            bollingerPeriod: config.bollingerPeriod || 20,
            // 布林带标准差倍数
            bollingerStdDev: config.bollingerStdDev || 2,
            // 是否启用
            enabled: config.enabled !== false
        };
    }

    /**
     * 计算 RSI (Relative Strength Index)
     * RSI = 100 - (100 / (1 + RS))
     * RS = 平均涨幅 / 平均跌幅
     * 
     * @param {Array} prices - 价格数组
     * @returns {Object} RSI 计算结果
     */
    calculateRSI(prices) {
        if (!prices || prices.length < this.config.rsiPeriod + 1) {
            return { value: null, signal: 'INSUFFICIENT_DATA' };
        }

        const period = this.config.rsiPeriod;
        const changes = [];
        
        // 计算价格变化
        for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
        }

        // 计算平均涨幅和平均跌幅
        let gains = 0;
        let losses = 0;

        for (let i = 0; i < period; i++) {
            if (changes[changes.length - period + i] > 0) {
                gains += changes[changes.length - period + i];
            } else {
                losses += Math.abs(changes[changes.length - period + i]);
            }
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;

        if (avgLoss === 0) {
            return { value: 100, signal: 'OVERBOUGHT' };
        }

        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        // 生成信号
        let signal = 'NEUTRAL';
        if (rsi >= this.config.rsiOverbought) {
            signal = 'OVERBOUGHT'; // 可能超买，考虑卖出
        } else if (rsi <= this.config.rsiOversold) {
            signal = 'OVERSOLD'; // 可能超卖，考虑买入
        }

        return {
            value: parseFloat(rsi.toFixed(2)),
            signal,
            overbought: this.config.rsiOverbought,
            oversold: this.config.rsiOversold
        };
    }

    /**
     * 计算 MACD (Moving Average Convergence Divergence)
     * MACD = Fast EMA - Slow EMA
     * Signal Line = MACD 的 EMA
     * Histogram = MACD - Signal Line
     * 
     * @param {Array} prices - 价格数组
     * @returns {Object} MACD 计算结果
     */
    calculateMACD(prices) {
        if (!prices || prices.length < this.config.macdSlowPeriod + this.config.macdSignalPeriod) {
            return { value: null, signal: 'INSUFFICIENT_DATA' };
        }

        const fastPeriod = this.config.macdFastPeriod;
        const slowPeriod = this.config.macdSlowPeriod;
        const signalPeriod = this.config.macdSignalPeriod;

        // 计算 EMA
        const fastEMA = this.calculateEMA(prices, fastPeriod);
        const slowEMA = this.calculateEMA(prices, slowPeriod);

        // MACD 线
        const macdLine = fastEMA - slowEMA;

        // 计算 MACD 的 EMA 作为信号线
        const macdValues = [];
        for (let i = slowPeriod; i < prices.length; i++) {
            const startIdx = i - slowPeriod;
            const slice = prices.slice(0, i + 1).slice(-slowPeriod);
            const ema = this.calculateEMA(slice, slowPeriod);
            macdValues.push(this.calculateEMA(prices.slice(0, i + 1), slowPeriod) - 
                          this.calculateEMA(prices.slice(0, i + 1), fastPeriod));
        }

        // 计算信号线
        const signalLine = this.calculateEMA(macdValues.slice(-signalPeriod), signalPeriod);

        // 直方图
        const histogram = macdLine - signalLine;

        // 生成信号
        let signal = 'NEUTRAL';
        if (macdLine > signalLine && histogram > 0) {
            signal = 'BULLISH'; // 上升趋势
        } else if (macdLine < signalLine && histogram < 0) {
            signal = 'BEARISH'; // 下降趋势
        }

        return {
            macd: parseFloat(macdLine.toFixed(4)),
            signal: parseFloat(signalLine.toFixed(4)),
            histogram: parseFloat(histogram.toFixed(4)),
            signal,
            trend: histogram > 0 ? 'UP' : (histogram < 0 ? 'DOWN' : 'FLAT')
        };
    }

    /**
     * 计算 EMA (Exponential Moving Average)
     * EMA = Price(t) * k + EMA(y) * (1 - k)
     * k = 2 / (N + 1)
     * 
     * @param {Array} prices - 价格数组
     * @param {Number} period - 周期
     * @returns {Number} EMA 值
     */
    calculateEMA(prices, period) {
        if (!prices || prices.length === 0) return 0;
        if (prices.length === 1) return prices[0];

        const k = 2 / (period + 1);
        let ema = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema = prices[i] * k + ema * (1 - k);
        }

        return ema;
    }

    /**
     * 计算布林带 (Bollinger Bands)
     * 中轨 = N日简单移动平均线
     * 上轨 = 中轨 + 2 * 标准差
     * 下轨 = 中轨 - 2 * 标准差
     * 
     * @param {Array} prices - 价格数组
     * @returns {Object} 布林带计算结果
     */
    calculateBollingerBands(prices) {
        if (!prices || prices.length < this.config.bollingerPeriod) {
            return { value: null, signal: 'INSUFFICIENT_DATA' };
        }

        const period = this.config.bollingerPeriod;
        const stdDev = this.config.bollingerStdDev;

        // 取最近 period 个价格
        const recentPrices = prices.slice(-period);

        // 计算中轨 (SMA)
        const middle = recentPrices.reduce((a, b) => a + b, 0) / period;

        // 计算标准差
        const variance = recentPrices.reduce((sum, price) => {
            return sum + Math.pow(price - middle, 2);
        }, 0) / period;
        const standardDeviation = Math.sqrt(variance);

        // 上轨和下轨
        const upper = middle + (stdDev * standardDeviation);
        const lower = middle - (stdDev * standardDeviation);

        // 当前位置 (百分比)
        const latestPrice = prices[prices.length - 1];
        const position = ((latestPrice - lower) / (upper - lower)) * 100;

        // 生成信号
        let signal = 'NEUTRAL';
        if (latestPrice >= upper) {
            signal = 'OVERBOUGHT'; // 价格触及上轨，可能超买
        } else if (latestPrice <= lower) {
            signal = 'OVERSOLD'; // 价格触及下轨，可能超卖
        }

        return {
            upper: parseFloat(upper.toFixed(4)),
            middle: parseFloat(middle.toFixed(4)),
            lower: parseFloat(lower.toFixed(4)),
            position: parseFloat(position.toFixed(2)),
            signal,
            volatility: parseFloat((standardDeviation / middle * 100).toFixed(2))
        };
    }

    /**
     * 计算支撑/阻力位
     * 使用 Pivot Points 方法
     * 
     * @param {Object} priceData - 价格数据 { high, low, close, open }
     * @returns {Object} 支撑/阻力位
     */
    calculateSupportResistance(priceData) {
        const { high, low, close } = priceData;

        // Pivot Point (枢轴点)
        const pivot = (high + low + close) / 3;

        // 阻力位
        const r1 = 2 * pivot - low;
        const r2 = pivot + (high - low);
        const r3 = high + 2 * (pivot - low);

        // 支撑位
        const s1 = 2 * pivot - high;
        const s2 = pivot - (high - low);
        const s3 = low - 2 * (high - pivot);

        return {
            pivot: parseFloat(pivot.toFixed(4)),
            resistance: {
                r1: parseFloat(r1.toFixed(4)),
                r2: parseFloat(r2.toFixed(4)),
                r3: parseFloat(r3.toFixed(4))
            },
            support: {
                s1: parseFloat(s1.toFixed(4)),
                s2: parseFloat(s2.toFixed(4)),
                s3: parseFloat(s3.toFixed(4))
            }
        };
    }

    /**
     * 分析多个时间框架
     * 
     * @param {Object} data - 多时间框架数据
     * @returns {Object} 综合分析结果
     */
    analyzeMultipleTimeframes(data) {
        const results = {};

        for (const [timeframe, prices] of Object.entries(data)) {
            if (!prices || prices.length < 20) {
                results[timeframe] = { error: 'INSUFFICIENT_DATA' };
                continue;
            }

            results[timeframe] = {
                rsi: this.calculateRSI(prices),
                macd: this.calculateMACD(prices),
                bollinger: this.calculateBollingerBands(prices)
            };
        }

        // 综合信号
        const signals = [];
        
        for (const tf of Object.keys(results)) {
            const tfData = results[tf];
            if (tfData.error) continue;

            if (tfData.rsi.signal === 'OVERSOLD') {
                signals.push({ timeframe: tf, indicator: 'RSI', signal: 'BUY' });
            } else if (tfData.rsi.signal === 'OVERBOUGHT') {
                signals.push({ timeframe: tf, indicator: 'RSI', signal: 'SELL' });
            }

            if (tfData.macd.signal === 'BULLISH') {
                signals.push({ timeframe: tf, indicator: 'MACD', signal: 'BUY' });
            } else if (tfData.macd.signal === 'BEARISH') {
                signals.push({ timeframe: tf, indicator: 'MACD', signal: 'SELL' });
            }
        }

        // 统计买卖信号
        const buySignals = signals.filter(s => s.signal === 'BUY').length;
        const sellSignals = signals.filter(s => s.signal === 'SELL').length;

        let overallSignal = 'NEUTRAL';
        if (buySignals > sellSignals && buySignals >= 2) {
            overallSignal = 'BUY';
        } else if (sellSignals > buySignals && sellSignals >= 2) {
            overallSignal = 'SELL';
        }

        return {
            timeframes: results,
            signals,
            summary: {
                overallSignal,
                buySignals,
                sellSignals,
                neutralSignals: signals.length - buySignals - sellSignals
            }
        };
    }

    /**
     * 获取完整的分析报告
     * 
     * @param {Array} prices - 价格历史数组
     * @param {Object} latestPriceData - 最新价格数据 { high, low, close, open }
     * @returns {Object} 完整分析报告
     */
    getAnalysisReport(prices, latestPriceData = null) {
        if (!this.config.enabled) {
            return { enabled: false, message: 'Technical Analysis is disabled' };
        }

        const report = {
            timestamp: new Date().toISOString(),
            rsi: this.calculateRSI(prices),
            macd: this.calculateMACD(prices),
            bollinger: this.calculateBollingerBands(prices)
        };

        // 如果提供了最新价格数据，计算支撑/阻力位
        if (latestPriceData) {
            report.supportResistance = this.calculateSupportResistance(latestPriceData);
        }

        // 综合评分 (0-100)
        let score = 50; // 基准分

        // RSI 评分
        if (report.rsi.value !== null) {
            if (report.rsi.signal === 'OVERSOLD') score += 15;
            else if (report.rsi.signal === 'OVERBOUGHT') score -= 15;
        }

        // MACD 评分
        if (report.macd.signal === 'BULLISH') score += 15;
        else if (report.macd.signal === 'BEARISH') score -= 15;

        // 布林带评分
        if (report.bollinger.signal === 'OVERSOLD') score += 10;
        else if (report.bollinger.signal === 'OVERBOUGHT') score -= 10;

        // 限制分数范围
        score = Math.max(0, Math.min(100, score));

        report.score = score;
        report.recommendation = score >= 60 ? 'BUY' : (score <= 40 ? 'SELL' : 'HOLD');

        return report;
    }
}

// 导出
module.exports = TechnicalAnalysis;
