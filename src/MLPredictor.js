/**
 * MLPredictor.js - 机器学习预测模块
 * 
 * 基于线性回归的价格预测和趋势分析
 * 
 * @version 2.1.0
 * @author Crypto Hunter Team
 */

class MLPredictor {
    constructor(config = {}) {
        // 默认配置
        this.config = {
            // 预测时间范围（小时）
            predictionHorizon: config.predictionHorizon || 24,
            // 是否启用预测
            enabled: config.enabled !== false,
            // 用于训练的最小数据点
            minDataPoints: config.minDataPoints || 24,
            // 置信区间百分比
            confidenceInterval: config.confidenceInterval || 0.95,
            // 趋势阈值（百分比）
            trendThreshold: config.trendThreshold || 2.0
        };

        // 存储训练数据
        this.trainingData = [];
    }

    /**
     * 线性回归拟合
     * 使用最小二乘法 (Least Squares)
     * 
     * @param {Array} x - 自变量数组 (时间戳/索引)
     * @param {Array} y - 因变量数组 (价格)
     * @returns {Object} 斜率和截距
     */
    linearRegression(x, y) {
        const n = x.length;
        if (n === 0) return { slope: 0, intercept: 0 };

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }

        // 斜率 (m) = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
        const denominator = n * sumX2 - sumX * sumX;
        if (denominator === 0) {
            return { slope: 0, intercept: sumY / n };
        }

        const slope = (n * sumXY - sumX * sumY) / denominator;
        // 截距 (b) = (Σy - m*Σx) / n
        const intercept = (sumY - slope * sumX) / n;

        // 计算 R² (决定系数)
        const yMean = sumY / n;
        let ssTotal = 0, ssResidual = 0;
        for (let i = 0; i < n; i++) {
            const yPred = slope * x[i] + intercept;
            ssTotal += Math.pow(y[i] - yMean, 2);
            ssResidual += Math.pow(y[i] - yPred, 2);
        }
        const r2 = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);

        return {
            slope,
            intercept,
            r2: parseFloat(r2.toFixed(4))
        };
    }

    /**
     * 训练模型
     * 
     * @param {Array} priceHistory - 价格历史数组 [{timestamp, price}]
     */
    train(priceHistory) {
        if (!priceHistory || priceHistory.length < this.config.minDataPoints) {
            console.warn(`⚠️ 数据点不足，需要至少 ${this.config.minDataPoints} 个数据点`);
            return false;
        }

        // 准备训练数据
        const x = [];
        const y = [];

        // 使用归一化的时间戳（小时）
        const startTime = priceHistory[0].timestamp;
        
        for (let i = 0; i < priceHistory.length; i++) {
            x.push((priceHistory[i].timestamp - startTime) / 3600000); // 转换为小时
            y.push(priceHistory[i].price);
        }

        // 执行线性回归
        this.model = this.linearRegression(x, y);
        this.trainingData = priceHistory;

        console.log(`✅ 模型训练完成: slope=${this.model.slope.toFixed(6)}, R²=${this.model.r2}`);
        return true;
    }

    /**
     * 预测未来价格
     * 
     * @param {Number} hoursAhead - 预测多少小时后的价格
     * @returns {Object} 预测结果
     */
    predict(hoursAhead = null) {
        if (!this.model) {
            return { error: 'Model not trained. Call train() first.' };
        }

        const horizon = hoursAhead || this.config.predictionHorizon;
        const lastDataPoint = this.trainingData[this.trainingData.length - 1];
        const startTime = this.trainingData[0].timestamp;

        // 计算预测时间点
        const predictTime = (lastDataPoint.timestamp - startTime) / 3600000 + horizon;

        // 预测价格
        const predictedPrice = this.model.slope * predictTime + this.model.intercept;

        // 计算预测区间
        const confidence = this.calculateConfidenceInterval(predictedPrice);

        // 趋势分析
        const trend = this.analyzeTrend();

        return {
            predictedPrice: parseFloat(predictedPrice.toFixed(4)),
            timestamp: lastDataPoint.timestamp + horizon * 3600000,
            horizon,
            confidence: {
                lower: parseFloat(confidence.lower.toFixed(4)),
                upper: parseFloat(confidence.upper.toFixed(4)),
                interval: this.config.confidenceInterval * 100
            },
            trend
        };
    }

    /**
     * 计算置信区间
     * 
     * @param {Number} predictedPrice - 预测价格
     * @returns {Object} 置信区间
     */
    calculateConfidenceInterval(predictedPrice) {
        // 计算残差标准误差
        let sumSquaredResiduals = 0;
        const startTime = this.trainingData[0].timestamp;

        for (let i = 0; i < this.trainingData.length; i++) {
            const x = (this.trainingData[i].timestamp - startTime) / 3600000;
            const predicted = this.model.slope * x + this.model.intercept;
            sumSquaredResiduals += Math.pow(this.trainingData[i].price - predicted, 2);
        }

        const n = this.trainingData.length;
        const residualsStdError = Math.sqrt(sumSquaredResiduals / (n - 2));

        // 使用 t 分布的近似值（简化处理）
        const tValue = 1.96; // 95% 置信水平的近似值
        const margin = tValue * residualsStdError * Math.sqrt(1 + 1/n);

        return {
            lower: predictedPrice - margin,
            upper: predictedPrice + margin
        };
    }

    /**
     * 分析趋势
     * 
     * @returns {Object} 趋势分析结果
     */
    analyzeTrend() {
        if (!this.model || this.trainingData.length < 2) {
            return { direction: 'UNKNOWN', strength: 0, changePercent: 0 };
        }

        // 斜率表示每小时的变化量
        const hourlyChange = this.model.slope;
        const currentPrice = this.trainingData[this.trainingData.length - 1].price;

        // 计算变化百分比（基于预测范围）
        const changePercent = (hourlyChange * this.config.predictionHorizon / currentPrice) * 100;

        // 趋势方向
        let direction = 'FLAT';
        if (hourlyChange > 0.0001 * currentPrice) {
            direction = 'UP';
        } else if (hourlyChange < -0.0001 * currentPrice) {
            direction = 'DOWN';
        }

        // 趋势强度 (基于 R² 和斜率)
        const slopeMagnitude = Math.abs(changePercent);
        let strength = 0;

        if (this.model.r2 >= 0.7) {
            // 高相关性
            if (slopeMagnitude >= 5) strength = 3;
            else if (slopeMagnitude >= 2) strength = 2;
            else strength = 1;
        } else if (this.model.r2 >= 0.4) {
            // 中等相关性
            strength = Math.max(1, Math.floor(slopeMagnitude / 3));
        } else {
            // 低相关性 - 趋势不稳定
            strength = 0;
            direction = 'UNCERTAIN';
        }

        return {
            direction,
            strength, // 0-3: 0=不确定, 1=弱, 2=中等, 3=强
            changePercent: parseFloat(changePercent.toFixed(2)),
            hourlySlope: parseFloat(hourlyChange.toFixed(6)),
            r2: this.model.r2
        };
    }

    /**
     * 生成交易信号
     * 
     * @returns {Object} 交易信号
     */
    generateSignal() {
        const prediction = this.predict();
        const trend = prediction.trend || this.analyzeTrend();

        if (prediction.error) {
            return { signal: 'HOLD', reason: 'INSUFFICIENT_DATA' };
        }

        // 综合评分
        let score = 50; // 基准分

        // 基于趋势方向评分
        if (trend.direction === 'UP') {
            score += trend.strength * 15;
        } else if (trend.direction === 'DOWN') {
            score -= trend.strength * 15;
        }

        // 基于预测变化评分
        if (trend.changePercent > this.config.trendThreshold) {
            score += 20;
        } else if (trend.changePercent < -this.config.trendThreshold) {
            score -= 20;
        }

        // 基于 R² 评分 (模型可靠性)
        score += (trend.r2 - 0.5) * 30;

        // 限制分数范围
        score = Math.max(0, Math.min(100, score));

        // 生成信号
        let signal = 'HOLD';
        let reason = [];

        if (score >= 70) {
            signal = 'BUY';
            reason.push('预测趋势看涨');
        } else if (score <= 30) {
            signal = 'SELL';
            reason.push('预测趋势看跌');
        } else {
            signal = 'HOLD';
            reason.push('趋势不明确');
        }

        if (trend.r2 < 0.4) {
            reason.push('模型置信度较低');
        }

        if (prediction.confidence.interval > 10) {
            reason.push('预测波动较大');
        }

        return {
            signal,
            score: Math.round(score),
            reason: reason.join('; '),
            predictedPrice: prediction.predictedPrice,
            confidence: prediction.confidence,
            trend,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 获取预测摘要
     * 
     * @param {Array} priceHistory - 价格历史
     * @returns {Object} 预测摘要
     */
    getPredictionSummary(priceHistory) {
        // 训练模型
        this.train(priceHistory);

        // 生成多个时间点的预测
        const horizons = [1, 6, 12, 24, 48, 72];
        const predictions = {};

        for (const h of horizons) {
            const pred = this.predict(h);
            if (!pred.error) {
                predictions[`${h}h`] = pred;
            }
        }

        return {
            currentPrice: this.trainingData[this.trainingData.length - 1]?.price,
            predictions,
            signal: this.generateSignal(),
            modelQuality: {
                r2: this.model?.r2 || 0,
                dataPoints: this.trainingData.length,
                trend: this.analyzeTrend()
            }
        };
    }
}

// 导出
module.exports = MLPredictor;
