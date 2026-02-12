/**
 * DeFi Protocol Monitor - DeFi协议监控器
 * 
 * 监控功能：
 * 1. TVL（总锁仓量）变化监测
 * 2. APY（收益率）异常预警
 * 3. 流动性池状态监控
 * 4. 清算风险预警
 * 
 * 支持的协议：Aave, Compound, Uniswap, Curve, MakerDAO, Synthetix
 */

const axios = require('axios');

// DeFi协议API端点
const DEFI_PROTOCOLS = {
  aave: {
    name: 'Aave',
    tvlApi: 'https://api.aave.com/data/tvl',
    apyApi: 'https://api.aave.com/reserve-aps',
    eventsApi: 'https://api.aave.com/events',
    tvlChangeThreshold: 5, // TVL变化5%以上预警
  },
  compound: {
    name: 'Compound',
    tvlApi: 'https://api.compound.finance/api/v2/market',
    apyApi: 'https://api.compound.finance/api/v2/governance/comp-rates',
    tvlChangeThreshold: 5,
  },
  uniswap: {
    name: 'Uniswap V3',
    tvlApi: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    tvlChangeThreshold: 8,
  },
  curve: {
    name: 'Curve Finance',
    tvlApi: 'https://api.curve.fi/api/getTVL',
    apyApi: 'https://api.curve.fi/api/getApys',
    tvlChangeThreshold: 5,
  },
  makerdao: {
    name: 'MakerDAO',
    tvlApi: 'https://api.makerdao.com/v1/vaults?what=summary',
    tvlChangeThreshold: 10,
  },
};

class DeFiProtocolMonitor {
  constructor(config = {}) {
    this.config = {
      checkInterval: config.checkInterval || 300000, // 默认5分钟
      tvlChangeThreshold: config.tvlChangeThreshold || 5,
      apyThreshold: config.apyThreshold || 2, // APY变化2%以上预警
      enableTvlAlerts: config.enableTvlAlerts !== false,
      enableApyAlerts: config.enableApyAlerts !== false,
      enableLiquidationAlerts: config.enableLiquidationAlerts !== false,
      ...config,
    };

    this.previousData = new Map();
    this.alertCallbacks = [];
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * 注册预警回调函数
   */
  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  /**
   * 发送预警通知
   */
  async sendAlert(alert) {
    for (const callback of this.alertCallbacks) {
      try {
        await callback(alert);
      } catch (error) {
        console.error(`[DeFi Monitor] 预警回调失败: ${error.message}`);
      }
    }
  }

  /**
   * 获取协议TVL数据
   */
  async getProtocolTVL(protocol) {
    try {
      const config = DEFI_PROTOCOLS[protocol];
      if (!config) throw new Error(`未知协议: ${protocol}`);

      // 这里使用模拟数据（实际项目中替换为真实API调用）
      const tvlData = await this.fetchMockTVL(protocol);
      return tvlData;
    } catch (error) {
      console.error(`[DeFi Monitor] 获取${protocol} TVL失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取协议APY数据
   */
  async getProtocolAPY(protocol) {
    try {
      const config = DEFI_PROTOCOLS[protocol];
      if (!config) throw new Error(`未知协议: ${protocol}`);

      const apyData = await this.fetchMockAPY(protocol);
      return apyData;
    } catch (error) {
      console.error(`[DeFi Monitor] 获取${protocol} APY失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 模拟TVL数据（实际项目中替换为真实API）
   */
  async fetchMockTVL(protocol) {
    const baseTVL = {
      aave: 15000000000, // 150亿美元
      compound: 8000000000, // 80亿美元
      uniswap: 5000000000, // 50亿美元
      curve: 20000000000, // 200亿美元
      makerdao: 12000000000, // 120亿美元
    };

    const currentTVL = baseTVL[protocol] || 1000000000;
    const randomChange = (Math.random() - 0.5) * 0.1; // ±5%波动
    const tvl = currentTVL * (1 + randomChange);

    return {
      protocol,
      tvl: tvl,
      tvlFormatted: this.formatTVL(tvl),
      currency: 'USD',
      timestamp: Date.now(),
      change24h: (Math.random() - 0.5) * 10, // ±5%
    };
  }

  /**
   * 模拟APY数据
   */
  async fetchMockAPY(protocol) {
    const apyData = {
      aave: [
        { asset: 'USDC', borrowAPY: 3.5, supplyAPY: 2.8 },
        { asset: 'USDT', borrowAPY: 3.2, supplyAPY: 2.5 },
        { asset: 'DAI', borrowAPY: 3.8, supplyAPY: 3.0 },
        { asset: 'ETH', borrowAPY: 1.5, supplyAPY: 0.8 },
        { asset: 'WBTC', borrowAPY: 2.0, supplyAPY: 1.2 },
      ],
      compound: [
        { asset: 'USDC', borrowAPY: 4.0, supplyAPY: 3.2 },
        { asset: 'USDT', borrowAPY: 3.8, supplyAPY: 3.0 },
        { asset: 'DAI', borrowAPY: 4.2, supplyAPY: 3.5 },
      ],
      uniswap: [
        { pool: 'ETH/USDC', apy: 15.5, tvl: 500000000 },
        { pool: 'ETH/USDT', apy: 12.3, tvl: 300000000 },
        { pool: 'ETH/DAI', apy: 18.7, tvl: 200000000 },
      ],
      curve: [
        { pool: '3CRV', apy: 5.5, tvl: 5000000000 },
        { pool: 'CRV/ETH', apy: 8.2, tvl: 2000000000 },
        { pool: 'STETH', apy: 4.8, tvl: 3000000000 },
      ],
      makerdao: [
        { collateral: 'ETH', stabilityFee: 2.5, liquidationRatio: 1.5 },
        { collateral: 'WBTC', stabilityFee: 4.0, liquidationRatio: 1.75 },
        { collateral: 'USDC', stabilityFee: 4.0, liquidationRatio: 1.2 },
      ],
    };

    const data = apyData[protocol] || [];
    return {
      protocol,
      assets: data,
      timestamp: Date.now(),
    };
  }

  /**
   * 格式化TVL显示
   */
  formatTVL(tvl) {
    if (tvl >= 1e12) return `$${(tvl / 1e12).toFixed(2)}T`;
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
    return `$${tvl.toFixed(2)}`;
  }

  /**
   * 检测TVL变化
   */
  async checkTVLChanges() {
    if (!this.config.enableTvlAlerts) return;

    const alerts = [];

    for (const protocol of Object.keys(DEFI_PROTOCOLS)) {
      const currentData = await this.getProtocolTVL(protocol);
      const previousData = this.previousData.get(protocol);

      if (currentData && previousData) {
        const change = ((currentData.tvl - previousData.tvl) / previousData.tvl) * 100;
        const threshold = DEFI_PROTOCOLS[protocol].tvlChangeThreshold;

        if (Math.abs(change) >= threshold) {
          const alert = {
            type: 'TVL_CHANGE',
            protocol: DEFI_PROTOCOLS[protocol].name,
            currentTVL: currentData.tvlFormatted,
            previousTVL: this.formatTVL(previousData.tvl),
            change: change.toFixed(2),
            direction: change > 0 ? '📈 UP' : '📉 DOWN',
            severity: Math.abs(change) >= threshold * 2 ? 'HIGH' : 'MEDIUM',
            timestamp: Date.now(),
          };
          alerts.push(alert);
        }
      }

      // 保存当前数据用于下次比较
      this.previousData.set(protocol, currentData);
    }

    // 发送TVL变化预警
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  /**
   * 检测APY异常
   */
  async checkAPYAnomalies() {
    if (!this.config.enableApyAlerts) return [];

    const alerts = [];

    for (const protocol of ['aave', 'compound', 'uniswap', 'curve']) {
      const apyData = await this.getProtocolAPY(protocol);

      if (apyData && apyData.assets) {
        for (const asset of apyData.assets) {
          // 检测异常高APY
          let apy = 0;
          if (asset.supplyAPY) apy = asset.supplyAPY;
          else if (asset.apy) apy = asset.apy;

          if (apy > 20) { // APY超过20%视为异常
            const alert = {
              type: 'HIGH_APY',
              protocol: DEFI_PROTOCOLS[protocol].name,
              asset: asset.asset || asset.pool || asset.collateral,
              apy: `${apy.toFixed(2)}%`,
              severity: apy > 50 ? 'HIGH' : 'MEDIUM',
              timestamp: Date.now(),
            };
            alerts.push(alert);
          }

          // 检测APY剧烈变化（需要历史数据比较，这里简化处理）
          if (apy > 15 && apy < 30) {
            // 中等APY可能是套利机会
            const alert = {
              type: 'OPPORTUNITY',
              protocol: DEFI_PROTOCOLS[protocol].name,
              asset: asset.asset || asset.pool || asset.collateral,
              apy: `${apy.toFixed(2)}%`,
              message: '中等收益率，可能存在套利机会',
              severity: 'INFO',
              timestamp: Date.now(),
            };
            alerts.push(alert);
          }
        }
      }
    }

    // 发送APY预警
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  /**
   * 获取所有协议状态概览
   */
  async getAllProtocolsStatus() {
    const status = {
      protocols: [],
      totalTVL: 0,
      lastUpdate: Date.now(),
    };

    for (const [key, config] of Object.entries(DEFI_PROTOCOLS)) {
      const tvl = await this.getProtocolTVL(key);
      const apy = await this.getProtocolAPY(key);

      if (tvl) {
        status.totalTVL += tvl.tvl;
      }

      status.protocols.push({
        id: key,
        name: config.name,
        tvl: tvl,
        apy: apy,
      });
    }

    status.totalTVLFormatted = this.formatTVL(status.totalTVL);
    return status;
  }

  /**
   * 开始监控
   */
  async start() {
    if (this.isRunning) {
      console.log('[DeFi Monitor] 监控已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('[DeFi Monitor] 启动DeFi协议监控...');

    // 初始化数据
    for (const protocol of Object.keys(DEFI_PROTOCOLS)) {
      const data = await this.getProtocolTVL(protocol);
      this.previousData.set(protocol, data);
    }

    // 首次检查
    await this.checkTVLChanges();
    await this.checkAPYAnomalies();

    // 定期检查
    this.intervalId = setInterval(async () => {
      try {
        await this.checkTVLChanges();
        await this.checkAPYAnomalies();
      } catch (error) {
        console.error('[DeFi Monitor] 定期检查失败:', error.message);
      }
    }, this.config.checkInterval);

    console.log(`[DeFi Monitor] 监控已启动，间隔: ${this.config.checkInterval / 1000}秒`);
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[DeFi Monitor] 监控已停止');
  }

  /**
   * 生成预警消息
   */
  formatAlertMessage(alert) {
    const emoji = {
      TVL_CHANGE: alert.direction,
      HIGH_APY: '🔥',
      OPPORTUNITY: '💰',
      LIQUIDATION_RISK: '⚠️',
    };

    const prefix = emoji[alert.type] || '📊';

    let message = `${prefix} **DeFi预警**\n\n`;
    message += `**类型**: ${alert.type}\n`;
    message += `**协议**: ${alert.protocol}\n`;

    if (alert.asset) message += `**资产**: ${alert.asset}\n`;
    if (alert.currentTVL) message += `**当前TVL**: ${alert.currentTVL}\n`;
    if (alert.previousTVL) message += `**上次TVL**: ${alert.previousTVL}\n`;
    if (alert.change) message += `**变化**: ${alert.change}%\n`;
    if (alert.apy) message += `**APY**: ${alert.apy}\n`;
    if (alert.message) message += `**提示**: ${alert.message}\n`;
    message += `**严重性**: ${alert.severity}\n`;

    return message;
  }
}

// 导出模块
module.exports = {
  DeFiProtocolMonitor,
  DEFI_PROTOCOLS,
};

// 如果直接运行此脚本
if (require.main === module) {
  (async () => {
    const monitor = new DeFiProtocolMonitor({
      checkInterval: 60000, // 1分钟检查一次
      tvlChangeThreshold: 5,
      enableLiquidationAlerts: false,
    });

    // 注册预警回调（打印到控制台）
    monitor.onAlert(async (alert) => {
      console.log('\n' + '='.repeat(50));
      console.log(monitor.formatAlertMessage(alert));
      console.log('='.repeat(50));
    });

    // 启动监控
    await monitor.start();

    // 获取状态概览
    const status = await monitor.getAllProtocolsStatus();
    console.log('\n📊 DeFi协议状态概览:');
    console.log(`总TVL: ${status.totalTVLFormatted}`);
    console.log('\n各协议详情:');
    for (const proto of status.protocols) {
      console.log(`  - ${proto.name}: TVL=${proto.tvl?.tvlFormatted || 'N/A'}`);
    }

    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\n正在停止监控...');
      monitor.stop();
      process.exit(0);
    });
  })();
}
