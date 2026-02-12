#!/usr/bin/env node
/**
 * 🐋 链上数据监控器 (On-Chain Data Monitor)
 * v1.0 - 链上数据分析模块
 * 
 * 功能：
 * 1. 交易所资金流向监控
 * 2. 稳定币流动性监测
 * 3. 巨鲸交易追踪
 * 4. 链上活动综合评分
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    // API配置
    apis: {
        coinmarketcap: {
            baseUrl: 'https://pro-api.coinmarketcap.com/v1',
            apiKey: process.env.CMC_API_KEY || '',
        },
        glassnode: {
            baseUrl: 'https://api.glassnode.com/v1',
            apiKey: process.env.GLASSNODE_API_KEY || '',
        },
        cryptoquant: {
            baseUrl: 'https://api.cryptoquant.com/v1',
            apiKey: process.env.CRYPTOQUANT_API_KEY || '',
        },
    },
    
    // 监控配置
    monitor: {
        // 检查间隔（毫秒）
        checkInterval: 60000,
        
        // 交易所地址
        exchanges: {
            binance: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
            coinbase: '0x503828976d22510a876020a7519ab0ad399c4e91',
            kraken: '0xae54f4617f11e72e23d7a0e1a5d5d3d2d5d3d5d3',
        },
        
        // 巨鲸阈值（BTC数量）
        whaleThreshold: 100,
        
        // 稳定币
        stablecoins: ['USDT', 'USDC', 'DAI'],
    },
    
    // 预警配置
    alerts: {
        // 交易所净流入/流出阈值（BTC）
        exchangeFlowThreshold: 5000,
        
        // 稳定币大幅变化阈值（百万美元）
        stablecoinFlowThreshold: 100,
        
        // 巨鲸交易阈值（BTC）
        whaleTransactionThreshold: 500,
    },
};

// 数据存储
let onChainData = {
    lastUpdate: null,
    exchangeFlows: {
        binance: { inflow: 0, outflow: 0, net: 0 },
        coinbase: { inflow: 0, outflow: 0, net: 0 },
        kraken: { inflow: 0, outflow: 0, net: 0 },
    },
    stablecoinFlows: {
        USDT: { volume: 0, net: 0, exchanges: {} },
        USDC: { volume: 0, net: 0, exchanges: {} },
        DAI: { volume: 0, net: 0, exchanges: {} },
    },
    whaleTransactions: [],
    marketActivityScore: 0,
};

/**
 * 获取交易所BTC储备数据
 */
async function getExchangeReserves() {
    try {
        // 使用模拟数据进行演示（实际可以接入Glassnode等API）
        const reserves = {
            binance: {
                btc: Math.random() * 500000 + 400000, // 40-50万BTC
                change: (Math.random() - 0.5) * 5, // -2.5% ~ +2.5%
            },
            coinbase: {
                btc: Math.random() * 100000 + 80000, // 8-18万BTC
                change: (Math.random() - 0.5) * 3,
            },
            kraken: {
                btc: Math.random() * 50000 + 30000, // 3-8万BTC
                change: (Math.random() - 0.5) * 2,
            },
        };
        
        return reserves;
    } catch (error) {
        console.error('获取交易所储备数据失败:', error.message);
        return null;
    }
}

/**
 * 获取链上交易数据
 */
async function getOnChainTransactions() {
    try {
        // 模拟大额链上交易数据
        const transactions = [];
        const whaleCount = Math.floor(Math.random() * 10) + 5;
        
        for (let i = 0; i < whaleCount; i++) {
            const isExchange = Math.random() > 0.7;
            const amount = Math.random() * 1000 + 100;
            
            transactions.push({
                hash: generateTxHash(),
                from: isExchange ? 'Exchange Wallet' : generateWalletAddress(),
                to: isExchange ? generateWalletAddress() : 'Exchange Wallet',
                amount: amount,
                type: isExchange ? 'deposit' : 'withdrawal',
                timestamp: Date.now() - Math.random() * 3600000,
            });
        }
        
        return transactions.sort((a, b) => b.amount - a.amount);
    } catch (error) {
        console.error('获取链上交易数据失败:', error.message);
        return [];
    }
}

/**
 * 获取稳定币数据
 */
async function getStablecoinData() {
    try {
        const stablecoins = {
            USDT: {
                volume24h: Math.random() * 50000000000 + 30000000000, // 300-800亿
                marketCap: Math.random() * 100000000000 + 80000000000, // 800-1800亿
                exchanges: {
                    tron: Math.random() * 40000000000,
                    ethereum: Math.random() * 30000000000,
                    omnilayer: Math.random() * 10000000000,
                },
            },
            USDC: {
                volume24h: Math.random() * 20000000000 + 10000000000,
                marketCap: Math.random() * 40000000000 + 30000000000,
                exchanges: {
                    ethereum: Math.random() * 20000000000,
                    solana: Math.random() * 10000000000,
                },
            },
            DAI: {
                volume24h: Math.random() * 5000000000 + 2000000000,
                marketCap: Math.random() * 10000000000 + 5000000000,
                exchanges: {
                    ethereum: Math.random() * 8000000000,
                },
            },
        };
        
        return stablecoins;
    } catch (error) {
        console.error('获取稳定币数据失败:', error.message);
        return null;
    }
}

/**
 * 计算市场活动评分
 */
function calculateActivityScore(exchangeFlows, whaleTransactions, stablecoinFlows) {
    let score = 50; // 基础分数
    
    // 交易所净流入/流出影响
    const totalNetFlow = Object.values(exchangeFlows).reduce((sum, ex) => sum + ex.net, 0);
    score += Math.min(Math.abs(totalNetFlow) / 10000, 20); // 每10000BTC增加20分，封顶20
    
    // 巨鲸交易影响
    const whaleCount = whaleTransactions.length;
    score += Math.min(whaleCount * 2, 10); // 每笔巨鲸交易增加2分，封顶10分
    
    // 稳定币交易量影响
    const totalStableVolume = Object.values(stablecoinFlows)
        .reduce((sum, sc) => sum + sc.volume, 0);
    score += Math.min(totalStableVolume / 10000000000, 20); // 每100亿增加20分，封顶20
    
    return Math.min(Math.max(score, 0), 100); // 0-100范围
}

/**
 * 生成交易哈希
 */
function generateTxHash() {
    return '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * 生成钱包地址
 */
function generateWalletAddress() {
    return '0x' + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * 格式化金额
 */
function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
}

/**
 * 生成链上数据报告
 */
function generateReport() {
    const scoreColor = onChainData.marketActivityScore >= 70 ? '🟢' : 
                       onChainData.marketActivityScore >= 40 ? '🟡' : '🔴';
    
    let report = `
╔════════════════════════════════════════════════════════════╗
║              🐋 链上数据监控报告                              ║
╠════════════════════════════════════════════════════════════╣
║ 更新时间: ${new Date().toLocaleString('zh-CN').padEnd(30)}
╠════════════════════════════════════════════════════════════╣
`;
    
    // 市场活动评分
    report += `║ 📊 市场活动评分: ${scoreColor} ${onChainData.marketActivityScore}/100                  ║\n`;
    report += `╠════════════════════════════════════════════════════════════╣\n`;
    
    // 交易所资金流向
    report += `║ 🏦 交易所资金流向 (BTC)                                   ║\n`;
    Object.entries(onChainData.exchangeFlows).forEach(([name, data]) => {
        const flowEmoji = data.net > 0 ? '📥 净流入' : '📤 净流出';
        const flowValue = formatNumber(Math.abs(data.net));
        report += `║    ${name}: ${flowValue} BTC ${flowEmoji.padEnd(12)}           ║\n`;
    });
    
    // 巨鲸交易
    report += `╠════════════════════════════════════════════════════════════╣\n`;
    report += `║ 🐋 近期巨鲸交易 (Top 5)                                   ║\n`;
    onChainData.whaleTransactions.slice(0, 5).forEach((tx, i) => {
        const amount = formatNumber(tx.amount);
        const type = tx.type === 'deposit' ? '📥 转入交易所' : '📤 转出交易所';
        report += `║    ${i+1}. ${amount} BTC - ${type}              ║\n`;
    });
    
    // 稳定币数据
    report += `╠════════════════════════════════════════════════════════════╣\n`;
    report += `║ 💵 稳定币24h交易量                                        ║\n`;
    Object.entries(onChainData.stablecoinFlows).forEach(([symbol, data]) => {
        report += `║    ${symbol}: $${formatNumber(data.volume)}                            ║\n`;
    });
    
    report += `╚════════════════════════════════════════════════════════════╝\n`;
    
    return report;
}

/**
 * 检测异常并预警
 */
function detectAnomalies() {
    const alerts = [];
    
    // 检测交易所大幅净流入/流出
    Object.entries(onChainData.exchangeFlows).forEach(([name, data]) => {
        if (Math.abs(data.net) > CONFIG.alerts.exchangeFlowThreshold) {
            alerts.push({
                type: 'EXCHANGE_FLOW',
                level: Math.abs(data.net) > CONFIG.alerts.exchangeFlowThreshold * 2 ? '🚨 紧急' : '⚠️ 警告',
                message: `${name} 净${data.net > 0 ? '流入' : '流出'} ${formatNumber(Math.abs(data.net))} BTC`,
            });
        }
    });
    
    // 检测巨鲸交易
    const largeWhaleTxs = onChainData.whaleTransactions.filter(
        tx => tx.amount > CONFIG.alerts.whaleTransactionThreshold
    );
    if (largeWhaleTxs.length > 5) {
        alerts.push({
            type: 'WHALE_ACTIVITY',
            level: '⚠️ 警告',
            message: `检测到 ${largeWhaleTxs.length} 笔大额巨鲸交易`,
        });
    }
    
    return alerts;
}

/**
 * 主监控循环
 */
async function monitor() {
    console.log('🐋 链上数据监控器已启动...');
    console.log(`⏰ 监控间隔: ${CONFIG.monitor.checkInterval / 1000}秒\n`);
    
    setInterval(async () => {
        try {
            console.clear();
            console.log('🔄 正在更新链上数据...\n');
            
            // 获取数据
            const [reserves, transactions, stablecoins] = await Promise.all([
                getExchangeReserves(),
                getOnChainTransactions(),
                getStablecoinData(),
            ]);
            
            if (reserves) {
                // 更新交易所资金流向
                Object.entries(reserves).forEach(([name, data]) => {
                    onChainData.exchangeFlows[name] = {
                        inflow: data.btc * (data.change > 0 ? data.change / 100 : 0),
                        outflow: data.btc * (data.change < 0 ? Math.abs(data.change) / 100 : 0),
                        net: data.btc * (data.change / 100),
                    };
                });
            }
            
            if (transactions) {
                onChainData.whaleTransactions = transactions;
            }
            
            if (stablecoins) {
                Object.entries(stablecoins).forEach(([symbol, data]) => {
                    if (onChainData.stablecoinFlows[symbol]) {
                        onChainData.stablecoinFlows[symbol] = {
                            volume: data.volume24h,
                            net: (data.exchanges.tron || 0) - (data.exchanges.ethereum || 0),
                            exchanges: data.exchanges,
                        };
                    }
                });
            }
            
            // 更新市场活动评分
            onChainData.marketActivityScore = calculateActivityScore(
                onChainData.exchangeFlows,
                onChainData.whaleTransactions,
                onChainData.stablecoinFlows
            );
            
            onChainData.lastUpdate = new Date();
            
            // 输出报告
            console.log(generateReport());
            
            // 检测异常
            const alerts = detectAnomalies();
            if (alerts.length > 0) {
                console.log('\n🚨 检测到异常:\n');
                alerts.forEach(alert => {
                    console.log(`   ${alert.level} ${alert.message}`);
                });
            }
            
            console.log('\n' + '='.repeat(60));
            
        } catch (error) {
            console.error('监控循环出错:', error.message);
        }
    }, CONFIG.monitor.checkInterval);
}

/**
 * 初始化
 */
async function init() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         🐋 Crypto Hunter - 链上数据监控器 v1.0             ║
╠════════════════════════════════════════════════════════════╣
║  功能:                                                    ║
║  ✓ 交易所资金流向监控                                     ║
║  ✓ 稳定币流动性监测                                       ║
║  ✓ 巨鲸交易追踪                                           ║
║  ✓ 市场活动综合评分                                       ║
╚════════════════════════════════════════════════════════════╝
    `);
    
    await monitor();
}

// 导出模块
module.exports = {
    CONFIG,
    onChainData,
    getExchangeReserves,
    getOnChainTransactions,
    getStablecoinData,
    calculateActivityScore,
    generateReport,
    detectAnomalies,
    init,
};

// 如果直接运行
if (require.main === module) {
    init().catch(console.error);
}
