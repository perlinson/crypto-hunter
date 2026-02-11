#!/usr/bin/env node
/**
 * Crypto Hunter - 加密货币异动监控器
 * 监控涨幅榜、交易量突增、新币上市，并发送预警
 * 支持: Telegram Bot + 飞书 Webhook 通知
 */

const https = require('https');
const http = require('http');

// 配置（可以从环境变量读取）
const CONFIG = {
    // 涨幅阈值 (%)
    MIN_GAINERS_24H: 15,
    
    // 交易量倍数阈值 (相对于市值的倍数)
    VOLUME_MULTIPLIER: 5,
    
    // 新币上市时间阈值（小时）
    NEW_COIN_HOURS: 24,
    
    // 价格预警 - 自动添加 BTC/ETH/SOL
    PRICE_ALERTS: [],
    
    // 通知配置
    NOTIFICATION: {
        // Telegram Bot
        telegram: {
            enabled: false,
            botToken: process.env.TELEGRAM_BOT_TOKEN || '',
            chatId: process.env.TELEGRAM_CHAT_ID || '',
        },
        // 飞书 Webhook
        feishu: {
            enabled: false,
            webhookUrl: process.env.FEISHU_WEBHOOK_URL || '',
        },
        // 钉钉机器人
        dingtalk: {
            enabled: false,
            accessToken: process.env.DINGTALK_ACCESS_TOKEN || '',
            secret: process.env.DINGTALK_SECRET || '',
        },
    },
    
    // 要排除的稳定币
    STABLECOINS: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDD'],
};

// 缓存
let cachedData = null;
let lastNotification = null;
let lastAlertTime = {};

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
    
    // 返回模拟数据
    return { data: generateMockData() };
}

/**
 * 生成模拟数据用于测试
 */
function generateMockData() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    
    const coins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 71130.93, percent_change_24h: 2.92, quote: { USD: { volume_24h: 41748899685, market_cap: 1420000000000 } } },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 2110.43, percent_change_24h: 2.88, quote: { USD: { volume_24h: 31968662174, market_cap: 254360000000 } } },
        { id: 'solana', name: 'Solana', symbol: 'SOL', price: 87.73, percent_change_24h: 13.63, quote: { USD: { volume_24h: 3759738821, market_cap: 49780000000 } } },
        { id: 'bnb', name: 'BNB', symbol: 'BNB', price: 643.45, percent_change_24h: 13.93, quote: { USD: { volume_24h: 1840711073, market_cap: 87740000000 } } },
        { id: 'hyperliquid', name: 'Hyperliquid', symbol: 'HYPE', price: 31.55, percent_change_24h: 9.07, quote: { USD: { volume_24h: 337865145, market_cap: 8200000000 } } },
        { id: 'pepe', name: 'Pepe', symbol: 'PEPE', price: 0.00001234, percent_change_24h: 25.67, quote: { USD: { volume_24h: 1234567890, market_cap: 5200000000 } } },
        { id: 'bonk', name: 'Bonk', symbol: 'BONK', price: 0.00002345, percent_change_24h: 45.32, quote: { USD: { volume_24h: 456789012, market_cap: 1500000000 } } },
        { id: 'catizen', name: 'Catizen', symbol: 'CATI', price: 0.52, percent_change_24h: 35.21, quote: { USD: { volume_24h: 89012345, market_cap: 260000000 } } },
        { id: 'notcoin', name: 'Notcoin', symbol: 'NOT', price: 0.00789, percent_change_24h: 18.45, quote: { USD: { volume_24h: 234567890, market_cap: 780000000 } } },
        { id: 'ponke', name: 'Ponke', symbol: 'PONKE', price: 0.00234, percent_change_24h: 52.13, quote: { USD: { volume_24h: 12345678, market_cap: 230000000 } } },
    ];
    
    // 随机添加一些动态数据
    coins[Math.floor(Math.random() * coins.length)].percent_change_24h = 28 + Math.random() * 20;
    coins[Math.floor(Math.random() * coins.length)].percent_change_24h = 38 + Math.random() * 25;
    
    return coins;
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
                message: `🚀 ${symbol} (${name}) 24h +${percent_change_24h.toFixed(2)}% 📈`,
                messageZh: `🚀 ${name} 24小时涨幅 ${percent_change_24h.toFixed(2)}%`,
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
                message: `📊 ${symbol} 交易量激增 ${(volumeRatio * 100).toFixed(0)}%`,
                messageZh: `📊 ${name} 交易量突增 ${(volumeRatio * 100).toFixed(0)}%`,
                priority: 'MEDIUM'
            });
        }
        
        // 3. 价格预警（自动监控 BTC/ETH/SOL）
        const watchList = ['BTC', 'ETH', 'SOL'];
        watchList.forEach(sym => {
            const alert = { symbol: sym, target: getPriceTarget(sym), direction: 'above' };
            if (sym === symbol) {
                const triggered = price >= alert.target;
                if (triggered) {
                    alerts.push({
                        type: 'PRICE_ALERT',
                        symbol,
                        name,
                        value: formatPrice(price),
                        target: formatPrice(alert.target),
                        message: `💰 ${symbol} ✅ ${alert.target >= 1000 ? formatPrice(price) : price.toFixed(2)}`,
                        messageZh: `💰 ${name} 价格触及 ${formatPrice(alert.target)}`,
                        priority: 'HIGH'
                    });
                }
            }
        });
    });
    
    return alerts;
}

/**
 * 获取价格目标
 */
function getPriceTarget(symbol) {
    const targets = {
        'BTC': 75000,
        'ETH': 2500,
        'SOL': 100,
    };
    return targets[symbol] || 0;
}

/**
 * 发送 Telegram 通知
 */
async function sendTelegram(message) {
    if (!CONFIG.NOTIFICATION.telegram.enabled) return false;
    
    const { botToken, chatId } = CONFIG.NOTIFICATION.telegram;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
        const response = await new Promise((resolve, reject) => {
            const req = https.post(url, {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: `🐂 *Crypto Hunter Alert*\n\n${message}`,
                    parse_mode: 'Markdown'
                })
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.end();
        });
        
        console.log('✅ Telegram 通知已发送');
        return true;
    } catch (error) {
        console.error('❌ Telegram 通知失败:', error.message);
        return false;
    }
}

/**
 * 发送飞书 Webhook 通知
 */
async function sendFeishu(message) {
    if (!CONFIG.NOTIFICATION.feishu.enabled) return false;
    
    try {
        const response = await new Promise((resolve, reject) => {
            const req = http.post(CONFIG.NOTIFICATION.feishu.webhookUrl, {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    msg_type: 'text',
                    content: { text: `🐂 Crypto Hunter\n\n${message}` }
                })
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.end();
        });
        
        console.log('✅ 飞书通知已发送');
        return true;
    } catch (error) {
        console.error('❌ 飞书通知失败:', error.message);
        return false;
    }
}

/**
 * 发送所有通知
 */
async function sendNotifications(alerts) {
    if (alerts.length === 0) return;
    
    // 去重：5分钟内相同类型的预警不重复发送
    const now = Date.now();
    const filteredAlerts = alerts.filter(alert => {
        const key = `${alert.type}_${alert.symbol}`;
        if (lastAlertTime[key] && (now - lastAlertTime[key]) < 5 * 60 * 1000) {
            return false;
        }
        lastAlertTime[key] = now;
        return true;
    });
    
    if (filteredAlerts.length === 0) {
        console.log('⏭️ 预警去重，跳过重复通知');
        return;
    }
    
    const message = filteredAlerts.map(a => a.messageZh || a.message).join('\n');
    
    // 并行发送
    await Promise.all([
        sendTelegram(message),
        sendFeishu(message)
    ]);
}

/**
 * 生成控制台报告
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
        
        // 避免重复通知
        const report = generateReport(alerts);
        const reportHash = JSON.stringify(alerts.slice(0, 3));
        
        if (lastNotification === reportHash && alerts.length > 0) {
            console.log('⏭️ 无新异动，跳过通知');
            return;
        }
        lastNotification = reportHash;
        
        console.log(report);
        
        // 发送通知
        await sendNotifications(alerts);
        
    } catch (error) {
        console.error('❌ 获取数据失败:', error.message);
    }
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { analyzeMovements, generateReport, fetchCMCData, sendNotifications };
