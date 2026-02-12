/**
 * PriceAlertSystem.js - 增强版价格预警系统
 * 
 * 功能:
 * - 自定义价格阈值设置
 * - 价格波动百分比监控
 * - 多级别预警（正常/警告/紧急）
 * - 支持多个加密货币
 * 
 * @version 2.0.0
 */

class PriceAlertSystem {
    constructor(config = {}) {
        this.config = {
            // 波动百分比阈值
            volatilityThresholds: {
                normal: config.normalThreshold || 2,    // 正常波动 < 2%
                warning: config.warningThreshold || 5,    // 警告波动 2-5%
                critical: config.criticalThreshold || 10 // 紧急波动 > 10%
            },
            // 默认价格阈值（可被用户配置覆盖）
            defaultThresholds: {
                'BTC': { target: 75000, direction: 'above' },
                'ETH': { target: 2500, direction: 'above' },
                'SOL': { target: 100, direction: 'above' },
                'BNB': { target: 700, direction: 'above' },
                'HYPE': { target: 35, direction: 'above' }
            },
            // 通知设置
            notifications: {
                sound: config.sound !== false,
                desktop: config.desktop !== false,
                cooldown: config.cooldown || 300000 // 5分钟冷却
            },
            // 是否启用
            enabled: config.enabled !== false
        };
        
        // 用户自定义阈值（从localStorage加载）
        this.customThresholds = this.loadCustomThresholds();
        
        // 预警历史
        this.alertHistory = [];
        
        // 预警触发时间记录（用于冷却）
        this.triggeredAlerts = {};
    }
    
    /**
     * 加载用户自定义阈值
     */
    loadCustomThresholds() {
        try {
            const saved = localStorage.getItem('priceAlert_thresholds');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('加载自定义阈值失败:', e);
            return {};
        }
    }
    
    /**
     * 保存用户自定义阈值
     */
    saveCustomThresholds() {
        try {
            localStorage.setItem('priceAlert_thresholds', JSON.stringify(this.customThresholds));
            return true;
        } catch (e) {
            console.error('保存自定义阈值失败:', e);
            return false;
        }
    }
    
    /**
     * 添加/更新自定义价格阈值
     * @param {string} symbol - 币种符号
     * @param {number} targetPrice - 目标价格
     * @param {string} direction - 方向 ('above' 或 'below')
     */
    setThreshold(symbol, targetPrice, direction = 'above') {
        const upperSymbol = symbol.toUpperCase();
        this.customThresholds[upperSymbol] = {
            target: parseFloat(targetPrice),
            direction: direction,
            enabled: true,
            updatedAt: new Date().toISOString()
        };
        this.saveCustomThresholds();
        return this.customThresholds[upperSymbol];
    }
    
    /**
     * 删除自定义阈值
     * @param {string} symbol - 币种符号
     */
    deleteThreshold(symbol) {
        const upperSymbol = symbol.toUpperCase();
        delete this.customThresholds[upperSymbol];
        this.saveCustomThresholds();
    }
    
    /**
     * 获取阈值配置
     * @param {string} symbol - 币种符号
     */
    getThreshold(symbol) {
        const upperSymbol = symbol.toUpperCase();
        // 优先使用自定义阈值
        if (this.customThresholds[upperSymbol]?.enabled) {
            return this.customThresholds[upperSymbol];
        }
        // 否则使用默认阈值
        return this.defaultThresholds[upperSymbol] || null;
    }
    
    /**
     * 检查价格是否触及阈值
     * @param {string} symbol - 币种符号
     * @param {number} currentPrice - 当前价格
     * @param {number} previousPrice - 之前价格
     */
    checkThreshold(symbol, currentPrice, previousPrice) {
        const threshold = this.getThreshold(symbol);
        if (!threshold) return null;
        
        const triggered = threshold.direction === 'above' 
            ? currentPrice >= threshold.target
            : currentPrice <= threshold.target;
        
        if (!triggered) return null;
        
        // 检查冷却时间
        const now = Date.now();
        const key = `${symbol}_${threshold.direction}`;
        if (this.triggeredAlerts[key] && (now - this.triggeredAlerts[key]) < this.config.notifications.cooldown) {
            return { ...threshold, skipped: true, reason: 'cooldown' };
        }
        
        this.triggeredAlerts[key] = now;
        
        return {
            symbol,
            target: threshold.target,
            current: currentPrice,
            direction: threshold.direction,
            triggered: true,
            timestamp: now
        };
    }
    
    /**
     * 计算价格波动百分比
     * @param {number} currentPrice - 当前价格
     * @param {number} previousPrice - 之前价格
     * @returns {number} 波动百分比
     */
    calculateVolatility(currentPrice, previousPrice) {
        if (!previousPrice || previousPrice === 0) return 0;
        return Math.abs((currentPrice - previousPrice) / previousPrice * 100);
    }
    
    /**
     * 获取波动级别
     * @param {number} volatility - 波动百分比
     * @returns {string} 级别 ('normal' | 'warning' | 'critical')
     */
    getVolatilityLevel(volatility) {
        const { normal, warning, critical } = this.config.volatilityThresholds;
        if (volatility >= critical) return 'critical';
        if (volatility >= warning) return 'warning';
        return 'normal';
    }
    
    /**
     * 分析价格变化并生成预警
     * @param {Array} coins - 币种数据数组
     * @returns {Array} 预警列表
     */
    analyzePriceChanges(coins) {
        const alerts = [];
        const now = Date.now();
        
        coins.forEach(coin => {
            const { symbol, price, percent_change_24h: change24h } = coin;
            
            // 1. 检查自定义阈值预警
            const thresholdAlert = this.checkThreshold(symbol, price, price * 0.99);
            if (thresholdAlert && thresholdAlert.triggered) {
                alerts.push({
                    type: 'PRICE_THRESHOLD',
                    level: 'warning',
                    symbol,
                    name: coin.name,
                    current: this.formatPrice(price),
                    target: this.formatPrice(thresholdAlert.target),
                    direction: thresholdAlert.direction,
                    message: `💰 ${symbol} 价格${thresholdAlert.direction === 'above' ? '突破' : '跌破'} ${this.formatPrice(thresholdAlert.target)}`,
                    timestamp: now
                });
            }
            
            // 2. 计算24小时波动并生成预警
            const volatility = Math.abs(change24h);
            const volatilityLevel = this.getVolatilityLevel(volatility);
            
            if (volatilityLevel !== 'normal') {
                const levelConfig = {
                    warning: { emoji: '⚠️', label: '警告', priority: 'MEDIUM' },
                    critical: { emoji: '🚨', label: '紧急', priority: 'HIGH' }
                };
                const config = levelConfig[volatilityLevel];
                
                alerts.push({
                    type: 'VOLATILITY',
                    level: volatilityLevel,
                    priority: config.priority,
                    symbol,
                    name: coin.name,
                    current: this.formatPrice(price),
                    change: `24h ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
                    volatility: volatility.toFixed(2),
                    message: `${config.emoji} ${symbol} 波动${config.label}: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
                    timestamp: now
                });
            }
        });
        
        // 记录预警历史
        this.alertHistory = [...alerts, ...this.alertHistory].slice(0, 100);
        
        return alerts;
    }
    
    /**
     * 格式化价格
     */
    formatPrice(price) {
        if (price >= 1) {
            return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 0.001) {
            return '$' + price.toFixed(4);
        } else {
            return '$' + price.toFixed(8);
        }
    }
    
    /**
     * 获取所有配置的币种列表
     */
    getWatchedSymbols() {
        const custom = Object.keys(this.customThresholds).filter(s => this.customThresholds[s].enabled);
        const defaults = Object.keys(this.config.defaultThresholds);
        
        return [...new Set([...custom, ...defaults])];
    }
    
    /**
     * 获取预警统计
     */
    getAlertStats() {
        const now = Date.now();
        const last24h = this.alertHistory.filter(a => now - a.timestamp < 86400000);
        
        return {
            total: this.alertHistory.length,
            last24h: last24h.length,
            byLevel: {
                warning: last24h.filter(a => a.level === 'warning').length,
                critical: last24h.filter(a => a.level === 'critical').length
            },
            byType: {
                threshold: last24h.filter(a => a.type === 'PRICE_THRESHOLD').length,
                volatility: last24h.filter(a => a.type === 'VOLATILITY').length
            }
        };
    }
    
    /**
     * 导出配置
     */
    exportConfig() {
        return {
            customThresholds: this.customThresholds,
            volatilityThresholds: this.config.volatilityThresholds,
            watchedSymbols: this.getWatchedSymbols()
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PriceAlertSystem;
}
