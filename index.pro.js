#!/usr/bin/env node
/**
 * Crypto Hunter Pro - 增强版后端服务
 * 支持：投资组合追踪、多交易所数据聚合、模拟交易
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ============== 配置文件 ==============
const CONFIG = {
    port: 3000,
    dataCacheTime: 60000, // 缓存1分钟
    
    // 交易所API配置
    exchanges: {
        binance: {
            name: 'Binance',
            baseUrl: 'https://api.binance.com/api/v3',
            enabled: true
        },
        coingecko: {
            name: 'CoinGecko',
            baseUrl: 'https://api.coingecko.com/api/v3',
            enabled: true
        }
    },
    
    // 支撑/阻力位提醒配置
    supportResistanceLevels: {
        checkInterval: 300000, // 5分钟检查一次
        tolerance: 0.02 // 2%容差
    }
};

// ============== 投资组合管理 ==============
class PortfolioManager {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'portfolio.json');
        this.ensureDataDir();
        this.portfolio = this.loadPortfolio();
    }
    
    ensureDataDir() {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    
    loadPortfolio() {
        try {
            if (fs.existsSync(this.dataFile)) {
                return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
            }
        } catch (e) {
            console.error('加载投资组合失败:', e.message);
        }
        return { holdings: [], transactions: [] };
    }
    
    savePortfolio() {
        fs.writeFileSync(this.dataFile, JSON.stringify(this.portfolio, null, 2));
    }
    
    // 添加持仓
    addHolding(symbol, amount, avgPrice, exchange = 'Binance') {
        const existing = this.portfolio.holdings.find(h => h.symbol.toUpperCase() === symbol.toUpperCase());
        if (existing) {
            // 计算新的平均成本
            const totalCost = (existing.amount * existing.avgPrice) + (amount * avgPrice);
            const totalAmount = existing.amount + amount;
            existing.avgPrice = totalCost / totalAmount;
            existing.amount = totalAmount;
            existing.exchange = exchange;
        } else {
            this.portfolio.holdings.push({
                symbol: symbol.toUpperCase(),
                amount,
                avgPrice,
                exchange,
                addedAt: new Date().toISOString()
            });
        }
        
        // 记录交易
        this.portfolio.transactions.push({
            type: 'BUY',
            symbol: symbol.toUpperCase(),
            amount,
            price: avgPrice,
            total: amount * avgPrice,
            exchange,
            timestamp: new Date().toISOString()
        });
        
        this.savePortfolio();
        return this.portfolio;
    }
    
    // 出售持仓
    sellHolding(symbol, amount, price, exchange = 'Binance') {
        const holding = this.portfolio.holdings.find(h => h.symbol.toUpperCase() === symbol.toUpperCase());
        if (!holding || holding.amount < amount) {
            throw new Error('持仓不足');
        }
        
        holding.amount -= amount;
        if (holding.amount <= 0) {
            this.portfolio.holdings = this.portfolio.holdings.filter(h => h.symbol !== symbol.toUpperCase());
        }
        
        this.portfolio.transactions.push({
            type: 'SELL',
            symbol: symbol.toUpperCase(),
            amount,
            price,
            total: amount * price,
            exchange,
            timestamp: new Date().toISOString()
        });
        
        this.savePortfolio();
        return this.portfolio;
    }
    
    // 获取投资组合价值（带当前价格）
    getPortfolioValue(currentPrices) {
        let totalValue = 0;
        let totalCost = 0;
        
        const holdings = this.portfolio.holdings.map(holding => {
            const currentPrice = currentPrices[holding.symbol.toUpperCase()] || holding.avgPrice;
            const value = holding.amount * currentPrice;
            const cost = holding.amount * holding.avgPrice;
            const profit = value - cost;
            const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
            
            totalValue += value;
            totalCost += cost;
            
            return {
                ...holding,
                currentPrice,
                value,
                profit,
                profitPercent
            };
        });
        
        const totalProfit = totalValue - totalCost;
        const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
        
        return {
            holdings,
            totalValue,
            totalCost,
            totalProfit,
            totalProfitPercent
        };
    }
    
    // 获取交易历史
    getTransactionHistory(limit = 50) {
        return this.portfolio.transactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
}

// ============== 模拟交易系统 ==============
class PaperTradingSystem {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'paper_trading.json');
        this.ensureDataDir();
        this.state = this.loadState();
    }
    
    ensureDataDir() {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    
    loadState() {
        try {
            if (fs.existsSync(this.dataFile)) {
                return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
            }
        } catch (e) {
            console.error('加载模拟交易状态失败:', e.message);
        }
        return {
            balance: 10000, // 初始资金
            positions: [],
            orders: [],
            trades: [],
            stats: {
                totalTrades: 0,
                winningTrades: 0,
                totalProfit: 0,
                winRate: 0
            },
            startTime: new Date().toISOString()
        };
    }
    
    saveState() {
        fs.writeFileSync(this.dataFile, JSON.stringify(this.state, null, 2));
    }
    
    // 市价买入
    marketBuy(symbol, amount, price) {
        const totalCost = amount * price;
        if (totalCost > this.state.balance) {
            throw new Error('余额不足');
        }
        
        this.state.balance -= totalCost;
        
        const existingPosition = this.state.positions.find(p => p.symbol === symbol.toUpperCase());
        if (existingPosition) {
            const totalAmount = existingPosition.amount + amount;
            const totalCost2 = (existingPosition.amount * existingPosition.avgPrice) + totalCost;
            existingPosition.amount = totalAmount;
            existingPosition.avgPrice = totalCost2 / totalAmount;
        } else {
            this.state.positions.push({
                symbol: symbol.toUpperCase(),
                amount,
                avgPrice: price,
                side: 'LONG'
            });
        }
        
        // 记录交易
        this.state.trades.push({
            type: 'BUY',
            symbol: symbol.toUpperCase(),
            amount,
            price,
            total: totalCost,
            timestamp: new Date().toISOString()
        });
        
        this.updateStats();
        this.saveState();
        return this.state;
    }
    
    // 市价卖出
    marketSell(symbol, amount, price) {
        const position = this.state.positions.find(p => p.symbol === symbol.toUpperCase());
        if (!position || position.amount < amount) {
            throw new Error('持仓不足');
        }
        
        const totalRevenue = amount * price;
        this.state.balance += totalRevenue;
        
        position.amount -= amount;
        if (position.amount <= 0) {
            this.state.positions = this.state.positions.filter(p => p.symbol !== symbol.toUpperCase());
        }
        
        // 记录交易
        this.state.trades.push({
            type: 'SELL',
            symbol: symbol.toUpperCase(),
            amount,
            price,
            total: totalRevenue,
            timestamp: new Date().toISOString()
        });
        
        this.updateStats();
        this.saveState();
        return this.state;
    }
    
    // 更新统计
    updateStats() {
        this.state.stats.totalTrades = this.state.trades.length;
        this.state.stats.winningTrades = this.state.trades.filter(t => {
            if (t.type !== 'BUY') {
                // 查找对应的买入订单
                const buyTrade = [...this.state.trades].reverse().find(trade => 
                    trade.symbol === t.symbol && trade.type === 'BUY' && 
                    new Date(trade.timestamp) < new Date(t.timestamp)
                );
                if (buyTrade) {
                    return t.price > buyTrade.price;
                }
            }
            return false;
        }).length;
        
        // 计算总收益
        this.state.stats.totalProfit = this.state.balance - 10000;
        this.state.stats.winRate = this.state.stats.totalTrades > 0 
            ? (this.state.stats.winningTrades / (this.state.stats.totalTrades / 2)) * 100 
            : 0;
    }
    
    // 获取交易统计
    getStats() {
        return {
            ...this.state.stats,
            balance: this.state.balance,
            positionsCount: this.state.positions.length,
            startTime: this.state.startTime
        };
    }
    
    // 重置模拟交易
    reset() {
        this.state = {
            balance: 10000,
            positions: [],
            orders: [],
            trades: [],
            stats: {
                totalTrades: 0,
                winningTrades: 0,
                totalProfit: 0,
                winRate: 0
            },
            startTime: new Date().toISOString()
        };
        this.saveState();
        return this.state;
    }
}

// ============== 多交易所数据聚合 ==============
class ExchangeAggregator {
    constructor() {
        this.cache = {};
        this.cacheTime = {};
    }
    
    isCacheValid(symbol) {
        return this.cache[symbol] && (Date.now() - this.cacheTime[symbol]) < CONFIG.dataCacheTime;
    }
    
    // 获取Binance价格
    async fetchBinancePrice(symbol) {
        return new Promise((resolve, reject) => {
            const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`;
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.price) {
                            resolve({ price: parseFloat(json.price), source: 'Binance' });
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        resolve(null);
                    }
                });
            }).on('error', reject);
        });
    }
    
    // 获取CoinGecko价格
    async fetchCoinGeckoPrice(symbol) {
        const symbolMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana',
            'BNB': 'binancecoin',
            'XRP': 'ripple',
            'ADA': 'cardano',
            'DOGE': 'dogecoin',
            'DOT': 'polkadot',
            'MATIC': 'matic-network',
            'LINK': 'chainlink'
        };
        
        const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
        
        return new Promise((resolve, reject) => {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const coinData = json[coinId];
                        if (coinData && coinData.usd) {
                            resolve({
                                price: coinData.usd,
                                change24h: coinData.usd_24h_change || 0,
                                source: 'CoinGecko'
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        resolve(null);
                    }
                });
            }).on('error', reject);
        });
    }
    
    // 聚合多交易所价格
    async aggregatePrices(symbols) {
        const results = {};
        
        for (const symbol of symbols) {
            if (this.isCacheValid(symbol)) {
                results[symbol] = this.cache[symbol];
                continue;
            }
            
            const [binanceData, coingeckoData] = await Promise.allSettled([
                this.fetchBinancePrice(symbol),
                this.fetchCoinGeckoPrice(symbol)
            ]);
            
            const prices = [];
            if (binanceData.status === 'fulfilled' && binanceData.value) {
                prices.push(binanceData.value);
            }
            if (coingeckoData.status === 'fulfilled' && coingeckoData.value) {
                prices.push(coingeckoData.value);
            }
            
            if (prices.length > 0) {
                const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
                const data = {
                    symbol,
                    price: avgPrice,
                    change24h: prices.find(p => p.change24h !== undefined)?.change24h || 0,
                    sources: prices.map(p => p.source),
                    updatedAt: new Date().toISOString()
                };
                this.cache[symbol] = data;
                this.cacheTime[symbol] = Date.now();
                results[symbol] = data;
            }
        }
        
        return results;
    }
    
    // 获取所有主流币价格
    async getTopCoins() {
        const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'LINK'];
        return await this.aggregatePrices(symbols);
    }
}

// ============== 自动化提醒系统 ==============
class AlertSystem {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'alerts.json');
        this.ensureDataDir();
        this.alerts = this.loadAlerts();
        this.priceHistory = {};
    }
    
    ensureDataDir() {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    
    loadAlerts() {
        try {
            if (fs.existsSync(this.dataFile)) {
                return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
            }
        } catch (e) {
            console.error('加载提醒配置失败:', e.message);
        }
        return {
            priceAlerts: [],
            supportResistance: [],
            trendAlerts: []
        };
    }
    
    saveAlerts() {
        fs.writeFileSync(this.dataFile, JSON.stringify(this.alerts, null, 2));
    }
    
    // 添加价格提醒
    addPriceAlert(symbol, targetPrice, direction, condition = 'cross') {
        this.alerts.priceAlerts.push({
            id: Date.now().toString(),
            symbol: symbol.toUpperCase(),
            targetPrice,
            direction, // 'above' or 'below'
            condition, // 'cross' or 'touch'
            enabled: true,
            triggered: false,
            triggeredAt: null,
            createdAt: new Date().toISOString()
        });
        this.saveAlerts();
        return this.alerts;
    }
    
    // 添加支撑/阻力位提醒
    addSupportResistance(symbol, levels, type = 'both') {
        this.alerts.supportResistance.push({
            id: Date.now().toString(),
            symbol: symbol.toUpperCase(),
            levels, // Array of price levels
            type, // 'support', 'resistance', or 'both'
            enabled: true,
            createdAt: new Date().toISOString()
        });
        this.saveAlerts();
        return this.alerts;
    }
    
    // 检查提醒
    checkAlerts(currentPrices) {
        const triggered = [];
        
        // 价格提醒
        this.alerts.priceAlerts.forEach(alert => {
            if (!alert.enabled || alert.triggered) return;
            
            const currentPrice = currentPrices[alert.symbol];
            if (!currentPrice) return;
            
            let triggeredNow = false;
            if (alert.condition === 'cross') {
                if (alert.direction === 'above' && currentPrice >= alert.targetPrice) {
                    triggeredNow = true;
                } else if (alert.direction === 'below' && currentPrice <= alert.targetPrice) {
                    triggeredNow = true;
                }
            } else if (alert.condition === 'touch') {
                const tolerance = currentPrice * 0.001;
                if (Math.abs(currentPrice - alert.targetPrice) <= tolerance) {
                    triggeredNow = true;
                }
            }
            
            if (triggeredNow) {
                alert.triggered = true;
                alert.triggeredAt = new Date().toISOString();
                triggered.push({
                    type: 'PRICE',
                    ...alert,
                    currentPrice
                });
            }
        });
        
        // 支撑/阻力位提醒
        this.alerts.supportResistance.forEach(sr => {
            if (!sr.enabled) return;
            
            const currentPrice = currentPrices[sr.symbol];
            if (!currentPrice) return;
            
            sr.levels.forEach(level => {
                const tolerance = level * CONFIG.supportResistanceLevels.tolerance;
                if (Math.abs(currentPrice - level) <= tolerance) {
                    const isAbove = currentPrice > level;
                    const type = sr.type === 'both' 
                        ? (isAbove ? 'resistance' : 'support')
                        : sr.type;
                    
                    triggered.push({
                        type: 'SUPPORT_RESISTANCE',
                        symbol: sr.symbol,
                        level,
                        srType: type,
                        currentPrice
                    });
                }
            });
        });
        
        if (triggered.length > 0) {
            this.saveAlerts();
        }
        
        return triggered;
    }
    
    // 获取所有提醒
    getAlerts() {
        return this.alerts;
    }
    
    // 重置提醒触发状态
    resetTriggered() {
        this.alerts.priceAlerts.forEach(a => a.triggered = false);
        this.saveAlerts();
    }
}

// ============== HTTP服务器 ==============
const portfolioManager = new PortfolioManager();
const paperTrading = new PaperTradingSystem();
const exchangeAggregator = new ExchangeAggregator();
const alertSystem = new AlertSystem();

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Content-Type', 'application/json');
    
    const url = new URL(req.url, `http://localhost:${CONFIG.port}`);
    const pathname = url.pathname;
    
    try {
        // API路由
        if (pathname === '/api/portfolio' && req.method === 'GET') {
            const prices = await exchangeAggregator.getTopCoins();
            const portfolio = portfolioManager.getPortfolioValue(prices);
            res.end(JSON.stringify(portfolio));
            return;
        }
        
        if (pathname === '/api/portfolio' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                const { action, symbol, amount, price, exchange } = JSON.parse(body);
                if (action === 'buy') {
                    portfolioManager.addHolding(symbol, amount, price, exchange);
                } else if (action === 'sell') {
                    portfolioManager.sellHolding(symbol, amount, price, exchange);
                }
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }
        
        if (pathname === '/api/portfolio/history' && req.method === 'GET') {
            const history = portfolioManager.getTransactionHistory();
            res.end(JSON.stringify(history));
            return;
        }
        
        // 模拟交易API
        if (pathname === '/api/paper-trading' && req.method === 'GET') {
            res.end(JSON.stringify(paperTrading.getStats()));
            return;
        }
        
        if (pathname === '/api/paper-trading/trade' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                const { action, symbol, amount, price } = JSON.parse(body);
                try {
                    if (action === 'buy') {
                        paperTrading.marketBuy(symbol, amount, price);
                    } else if (action === 'sell') {
                        paperTrading.marketSell(symbol, amount, price);
                    }
                    res.end(JSON.stringify({ success: true, state: paperTrading.getStats() }));
                } catch (e) {
                    res.status(400).end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }
        
        if (pathname === '/api/paper-trading/reset' && req.method === 'POST') {
            paperTrading.reset();
            res.end(JSON.stringify({ success: true }));
            return;
        }
        
        if (pathname === '/api/paper-trading/history' && req.method === 'GET') {
            res.end(JSON.stringify(paperTrading.state.trades));
            return;
        }
        
        // 价格API
        if (pathname === '/api/prices' && req.method === 'GET') {
            const symbols = url.searchParams.get('symbols')?.split(',') || [];
            const prices = await exchangeAggregator.aggregatePrices(symbols.length > 0 ? symbols : ['BTC', 'ETH', 'SOL']);
            res.end(JSON.stringify(prices));
            return;
        }
        
        if (pathname === '/api/prices/top' && req.method === 'GET') {
            const prices = await exchangeAggregator.getTopCoins();
            res.end(JSON.stringify(Object.values(prices)));
            return;
        }
        
        // 提醒API
        if (pathname === '/api/alerts' && req.method === 'GET') {
            res.end(JSON.stringify(alertSystem.getAlerts()));
            return;
        }
        
        if (pathname === '/api/alerts' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                const { type, symbol, targetPrice, direction, levels } = JSON.parse(body);
                if (type === 'price') {
                    alertSystem.addPriceAlert(symbol, targetPrice, direction);
                } else if (type === 'sr') {
                    alertSystem.addSupportResistance(symbol, levels);
                }
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }
        
        if (pathname === '/api/alerts/check' && req.method === 'GET') {
            const prices = await exchangeAggregator.getTopCoins();
            const triggered = alertSystem.checkAlerts(prices);
            res.end(JSON.stringify({ triggered, alerts: alertSystem.getAlerts() }));
            return;
        }
        
        if (pathname === '/api/alerts/reset' && req.method === 'POST') {
            alertSystem.resetTriggered();
            res.end(JSON.stringify({ success: true }));
            return;
        }
        
        // 健康检查
        if (pathname === '/health') {
            res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
            return;
        }
        
        // 404
        res.status(404).end(JSON.stringify({ error: 'Not Found' }));
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).end(JSON.stringify({ error: error.message }));
    }
});

// 启动服务器
server.listen(CONFIG.port, () => {
    console.log(`🚀 Crypto Hunter Pro Server running on http://localhost:${CONFIG.port}`);
    console.log(`\n📊 Available API Endpoints:`);
    console.log(`   GET  /api/portfolio          - Get portfolio`);
    console.log(`   POST /api/portfolio         - Add/Sell holdings`);
    console.log(`   GET  /api/portfolio/history  - Transaction history`);
    console.log(`   GET  /api/paper-trading      - Get trading stats`);
    console.log(`   POST /api/paper-trading/trade - Execute trade`);
    console.log(`   POST /api/paper-trading/reset - Reset simulation`);
    console.log(`   GET  /api/prices            - Get aggregated prices`);
    console.log(`   GET  /api/prices/top        - Get top coins prices`);
    console.log(`   GET  /api/alerts            - Get alerts`);
    console.log(`   POST /api/alerts            - Add alert`);
    console.log(`   GET  /api/alerts/check       - Check triggered alerts`);
});

module.exports = {
    PortfolioManager,
    PaperTradingSystem,
    ExchangeAggregator,
    AlertSystem,
    server
};
