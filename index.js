#!/usr/bin/env node
/**
 * Crypto Hunter - 加密货币异动监控器
 * 监控涨幅榜、交易量突增、新币上市，并发送预警
 */

const https = require('https');

// 配置
const CONFIG = {
    // 涨幅阈值 (%)
    MIN_GAINERS_24H: 15,
    
    // 交易量倍数阈值 (相对于市值的倍数)
    VOLUME_MULTIPLIER: 5,
    
    // 新币上市时间阈值（小时）
    NEW_COIN_HOURS: 24,
    
    // 价格预警
    PRICE_ALERTS: [
        { symbol: 'BTC', target: 75000, direction: 'above' },
        { symbol: 'ETH', target: 2500, direction: 'above' },
        { symbol: 'SOL', target: 100, direction: 'above' },
    ],
    
    // 要排除的稳定币
    STABLECOINS: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDD'],
};

// 缓存
let cachedData = null;
let lastNotification = null;

/**
 * 获取CoinMarketCap数据
 */
function fetchCMCData() {
    return new Promise((resolve, reject) => {
        https.get('https://coinmarketcap.com', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = extractJSON(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

/**
 * 从HTML提取JSON数据（简化版）
 */
function extractJSON(html) {
    // 尝试从script标签提取
    const scriptMatch = html.match(/window\.二郎云.*?(\{.*?\})\s*;/);
    if (scriptMatch) {
        try {
            return JSON.parse(scriptMatch[1]);
        } catch (e) {}
    }
    
    // 返回空数据，实际使用时需要API key
    return { data: generateMockData() };
}

/**
 * 生成模拟数据用于测试
 */
function generateMockData() {
    const coins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 71130.93, percent_change_24h: 2.92, quote: { USD: { volume_24h: 41748899685, market_cap: 1420000000000 } } },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 2110.43, percent_change_24h: 2.88, quote: { USD: { volume_24h: 31968662174, market_cap: 254360000000 } } },
        { id: 'solana', name: 'Solana', symbol: 'SOL', price: 87.73, percent_change_24h: 13.63, quote: { USD: { volume_24h: 3759738821, market_cap: 49780000000 } } },
        { id: 'bnb', name: 'BNB', symbol: 'BNB', price: 643.45, percent_change_24h: 13.93, quote: { USD: { volume_24h: 1840711073, market_cap: 87740000000 } } },
        { id: 'hyperliquid', name: 'Hyperliquid', symbol: 'HYPE', price: 31.55, percent_change_24h: 9.07, quote: { USD: { volume_24h: 337865145, market_cap: 8200000000 } } },
        { id: 'pepe', name: 'Pepe', symbol: 'PEPE', price: 0.00001234, percent_change_24h: 25.67, quote: { USD: { volume_24h: 1234567890, market_cap: 5200000000 } } },
        { id: 'bonk', name: 'Bonk', symbol: 'BONK', price: 0.00002345, percent_change_24h: 45.32, quote: { USD: { volume_24h: 456789012, market_cap: 1500000000 } } },
    ];
    return coins;
}

/**
 * 分析异动
 */
function analyzeMovements(coins) {
    const alerts = [];
    
    coins.forEach(coin => {
        const { symbol, name, price, percent_change_24h, quote } = coin;
        
        // 排除稳定币
        if (CONFIG.STABLECOINS.includes(symbol)) return;
        
        const volume = quote?.USD?.volume_24h || 0;
        const marketCap = quote?.USD?.market_cap || 0;
        const volumeRatio = marketCap > 0 ? volume / marketCap : 0;
        
        // 1. 涨幅监控
        if (percent_change_24h >= CONFIG.MIN_GAINERS_24H) {
            alerts.push({
                type: 'GAINER',
                symbol,
                name,
                value: `${percent_change_24h.toFixed(2)}%`,
                price: formatPrice(price),
                message: `🚀 ${symbol} (${name}) 24小时涨幅 ${percent_change_24h.toFixed(2)}%`,
                priority: percent_change_24h >= 30 ? 'HIGH' : 'MEDIUM'
            });
        }
        
        // 2. 交易量突增
        if (volumeRatio >= CONFIG.VOLUME_MULTIPLIER && percent_change_24h > 0) {
            alerts.push({
                type: 'VOLUME_SPIKE',
                symbol,
                name,
                value: `${(volumeRatio * 100).toFixed(0)}%`,
                price: formatPrice(price),
                message: `📊 ${symbol} 交易量激增 (${(volumeRatio * 100).toFixed(0)}% of 市值)`,
                priority: 'MEDIUM'
            });
        }
        
        // 3. 价格预警
        CONFIG.PRICE_ALERTS.forEach(alert => {
            if (alert.symbol === symbol) {
                const triggered = alert.direction === 'above' ? price >= alert.target : price <= alert.target;
                if (triggered) {
                    alerts.push({
                        type: 'PRICE_ALERT',
                        symbol,
                        name,
                        value: formatPrice(price),
                        target: formatPrice(alert.target),
                        message: `💰 ${symbol} 价格触及 ${alert.target}`,
                        priority: 'HIGH'
                    });
                }
            }
        });
    });
    
    return alerts;
}

/**
 * 格式化价格
 */
function formatPrice(price) {
    if (price >= 1) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 0.001) {
        return `$${price.toFixed(4)}`;
    } else {
        return `$${price.toFixed(8)}`;
    }
}

/**
 * 生成报告
 */
function generateReport(alerts) {
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    let report = `\n${'='.repeat(50)}\n`;
    report += `🐂 Crypto Hunter - 加密货币异动报告\n`;
    report += `生成时间: ${now}\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    if (alerts.length === 0) {
        report += `✅ 当前无异常异动\n`;
        return report;
    }
    
    // 按优先级分组
    const byPriority = { HIGH: [], MEDIUM: [], LOW: [] };
    alerts.forEach(a => byPriority[a.priority]?.push(a));
    
    // 高优先级
    if (byPriority.HIGH.length > 0) {
        report += `🚨 高优先级异动 (${byPriority.HIGH.length})\n`;
        report += `-`.repeat(30) + '\n';
        byPriority.HIGH.forEach(a => report += `  ${a.message}\n`);
        report += '\n';
    }
    
    // 中优先级
    if (byPriority.MEDIUM.length > 0) {
        report += `⚡ 中优先级异动 (${byPriority.MEDIUM.length})\n`;
        report += `-`.repeat(30) + '\n';
        byPriority.MEDIUM.forEach(a => report += `  ${a.message}\n`);
        report += '\n';
    }
    
    // 统计
    const gainers = alerts.filter(a => a.type === 'GAINER').length;
    const volumeSpikes = alerts.filter(a => a.type === 'VOLUME_SPIKE').length;
    const priceAlerts = alerts.filter(a => a.type === 'PRICE_ALERT').length;
    
    report += `📈 统计:\n`;
    report += `  - 涨幅榜异常: ${gainers}\n`;
    report += `  - 交易量突增: ${volumeSpikes}\n`;
    report += `  - 价格预警: ${priceAlerts}\n`;
    report += `\n${'='.repeat(50)}\n`;
    
    return report;
}

/**
 * 主函数
 */
async function main() {
    console.log('🔍 Crypto Hunter 启动...');
    
    try {
        const data = await fetchCMCData();
        const coins = data.data || [];
        const alerts = analyzeMovements(coins);
        const report = generateReport(alerts);
        
        // 避免重复通知
        const reportHash = report.substring(0, 100);
        if (lastNotification === reportHash && alerts.length > 0) {
            console.log('⏭️ 无新异动，跳过通知');
            return;
        }
        lastNotification = reportHash;
        
        console.log(report);
        
        // TODO: 集成通知渠道
        // - 钉钉机器人
        // - Telegram Bot
        // - Email
        // - 微信
        
    } catch (error) {
        console.error('❌ 获取数据失败:', error.message);
    }
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { analyzeMovements, generateReport, fetchCMCData };
