#!/usr/bin/env node
/**
 * Crypto Hunter - 配置文件
 */

module.exports = {
    // 监控配置
    monitor: {
        // 轮询间隔（秒）
        interval: 3600,
        
        // 是否启用控制台输出
        consoleOutput: true,
        
        // 是否启用详细日志
        verbose: false,
    },
    
    // 异动阈值
    thresholds: {
        // 最小涨幅（%）
        minGain24h: 10,
        
        // 最小交易量/市值比
        minVolumeRatio: 3,
        
        // 新币上市阈值（小时）
        newCoinHours: 24,
        
        // 市值下限（美元）
        minMarketCap: 1000000,
    },
    
    // 通知配置
    notifications: {
        // 启用钉钉通知
        dingtalk: {
            enabled: false,
            webhook: '',
            access_token: '',
        },
        
        // 启用Telegram通知
        telegram: {
            enabled: false,
            bot_token: '',
            chat_id: '',
        },
        
        // 启用邮件通知
        email: {
            enabled: false,
            smtp: {},
            to: '',
        },
    },
    
    // 价格预警
    priceAlerts: [
        { symbol: 'BTC', target: 75000, direction: 'above', triggered: false },
        { symbol: 'BTC', target: 60000, direction: 'below', triggered: false },
        { symbol: 'ETH', target: 2500, direction: 'above', triggered: false },
        { symbol: 'SOL', target: 100, direction: 'above', triggered: false },
    ],
    
    // 排除列表
    exclude: {
        // 排除的代币符号
        symbols: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDD', 'USDP'],
        
        // 排除的类别
        categories: ['stablecoin'],
    },
    
    // 数据源
    dataSources: [
        {
            name: 'CoinMarketCap',
            url: 'https://coinmarketcap.com',
            enabled: true,
            priority: 1,
        },
        {
            name: 'CoinGecko',
            url: 'https://www.coingecko.com',
            enabled: false,
            priority: 2,
        },
    ],
    
    // 高级功能
    features: {
        // 是否追踪持仓
        trackPortfolio: false,
        portfolio: [],
        
        // 是否发送每日报告
        dailyReport: true,
        reportTime: '09:00',
        
        // 是否启用AI分析
        aiAnalysis: false,
        openaiKey: '',
    },
    
    // ========================================
    // v2.1 技术分析配置
    // ========================================
    technicalAnalysis: {
        // 是否启用技术分析
        enabled: process.env.TECHNICAL_ANALYSIS !== 'false',
        
        // RSI 配置
        rsi: {
            period: parseInt(process.env.RSI_PERIOD) || 14,
            overbought: parseInt(process.env.RSI_OVERBROUGHT) || 70,
            oversold: parseInt(process.env.RSI_OVERSOLD) || 30,
        },
        
        // MACD 配置
        macd: {
            fastPeriod: parseInt(process.env.MACD_FAST_PERIOD) || 12,
            slowPeriod: parseInt(process.env.MACD_SLOW_PERIOD) || 26,
            signalPeriod: parseInt(process.env.MACD_SIGNAL_PERIOD) || 9,
        },
        
        // 布林带配置
        bollinger: {
            period: parseInt(process.env.BOLLINGER_PERIOD) || 20,
            stdDev: parseFloat(process.env.BOLLINGER_STDDEV) || 2,
        },
    },
    
    // ========================================
    // v2.1 机器学习预测配置
    // ========================================
    mlPrediction: {
        // 是否启用机器学习预测
        enabled: process.env.ML_PREDICTION !== 'false',
        
        // 预测时间范围（小时）
        predictionHorizon: parseInt(process.env.PREDICTION_HORIZON) || 24,
        
        // 最小训练数据点
        minDataPoints: parseInt(process.env.MIN_DATA_POINTS) || 24,
        
        // 趋势阈值（百分比）
        trendThreshold: parseFloat(process.env.TREND_THRESHOLD) || 2.0,
        
        // 置信区间百分比
        confidenceInterval: 0.95,
        
        // 预测结果缓存时间（秒）
        cacheTime: 300,
    },

    // ========================================
    // v2.2 DeFi协议监控配置
    // ========================================
    defiMonitor: {
        // 是否启用DeFi监控
        enabled: process.env.DEFI_MONITOR !== 'false',

        // 检查间隔（毫秒）
        checkInterval: parseInt(process.env.DEFI_CHECK_INTERVAL) || 300000,

        // TVL变化阈值（%）
        tvlThreshold: parseFloat(process.env.DEFI_TVL_THRESHOLD) || 5,

        // APY异常阈值（%）
        apyThreshold: parseFloat(process.env.DEFI_APY_THRESHOLD) || 20,

        // 启用的协议
        protocols: ['aave', 'compound', 'uniswap', 'curve'],

        // 通知配置
        notifications: {
            telegram: true,
            feishu: true,
            dingtalk: true,
        },
    },
};
