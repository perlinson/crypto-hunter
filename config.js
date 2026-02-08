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
};
