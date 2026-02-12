# 🐂 Crypto Hunter v3.0 - 加密货币 + DeFi + 链上智能监控系统

## ✨ v3.0 新增功能：链上数据监控器

### 🐋 On-Chain Data Monitor
- **交易所资金流向**: 实时追踪 Binance/Coinbase/Kraken 的 BTC 净流入/流出
- **稳定币流动性监测**: USDT/USDC/DAI 链上交易量与分布
- **巨鲸交易追踪**: 实时监控大额链上转移
- **市场活动评分**: 综合评分系统，量化市场活跃度

### 📊 v3.0 功能对比

| 功能 | v2.2 | v3.0 |
|------|------|------|
| 基础价格监控 | ✅ | ✅ |
| 技术指标分析 | ✅ | ✅ |
| DeFi协议监控 | ✅ | ✅ |
| 交易所资金流向 | ❌ | ✅ ⭐NEW |
| 稳定币流动性 | ❌ | ✅ ⭐NEW |
| 巨鲸交易追踪 | ❌ | ✅ ⭐NEW |
| 市场活动评分 | ❌ | ✅ ⭐NEW |

### 📁 v3.0 文件结构
```
crypto-hunter/
├── index.js              # 主程序
├── dashboard.v2.html     # 增强版仪表板
├── dashboard.onchain.html # 链上数据监控 ⭐NEW
├── config.js             # 配置文件
├── src/
│   ├── on-chain-monitor.js    # 链上监控器 ⭐NEW
│   ├── defi-monitor.js        # DeFi监控器
│   ├── TechnicalAnalysis.js   # 技术分析
│   └── ...
└── README.md
```

### 🚀 快速开始 v3.0

#### 1. 打开链上监控仪表板
```bash
# 在浏览器中打开
open /root/.openclaw/workspace/crypto-hunter/dashboard.onchain.html

# 或使用Python HTTP服务器
cd /root/.openclaw/workspace/crypto-hunter
python3 -m http.server 8080
# 访问 http://localhost:8080/dashboard.onchain.html
```

#### 2. 命令行链上监控
```bash
# 启动链上数据监控器
node src/on-chain-monitor.js

# 查看帮助
node src/on-chain-monitor.js --help
```

### 📊 链上数据解读

#### 市场活动评分
| 分数 | 含义 | 颜色 |
|------|------|------|
| 70-100 | 高度活跃 | 🟢 绿色 |
| 40-69 | 中等活跃 | 🟡 黄色 |
| 0-39 | 低活跃 | 🔴 红色 |

#### 交易所资金流向
- **净流入 > 0**: BTC 流入交易所，可能预示抛压
- **净流入 < 0**: BTC 流出交易所，可能预示吸筹

#### 巨鲸交易信号
- **转入交易所**: 巨鲸准备出货，警惕回调
- **转出交易所**: 巨鲸吸筹，可能上涨

---

## 🥷 v2.2 DeFi Protocol Monitor 快速使用

### 1. 增强版价格预警系统
- ✅ 自定义价格阈值设置
- ✅ 价格波动百分比监控（正常/警告/紧急）
- ✅ 多级别预警系统
- ✅ 预警冷却机制（防止重复通知）

### 2. 技术指标分析
- 📊 RSI（相对强弱指标）- 超买/超卖信号
- 📈 MACD（移动平均收敛发散）- 趋势信号
- 🎯 布林带 - 波动率分析
- 💡 综合评分与买卖建议

### 3. Web仪表板增强版
- 🎨 深色主题UI
- 📉 实时价格走势图
- 📊 交易量趋势图
- 🔔 预警统计面板

## 🚀 快速开始

### 1. 启动Web仪表板
```bash
# 在浏览器中打开
open /root/.openclaw/workspace/crypto-hunter/dashboard.v2.html

# 或使用Python HTTP服务器
cd /root/.openclaw/workspace/crypto-hunter
python3 -m http.server 8080
# 然后访问 http://localhost:8080/dashboard.v2.html
```

### 2. 命令行监控
```bash
# 实时监控并输出报告
node index.js

# 查看帮助
node index.js --help

# 设置价格预警
node index.js --set-threshold BTC 80000
node index.js --set-threshold ETH 2000 below

# 列出所有预警
node index.js --list-thresholds
```

### 3. 添加自定义价格预警（Web界面）
1. 打开 `dashboard.v2.html`
2. 滚动到"价格预警设置"板块
3. 输入币种符号（如：BTC）
4. 输入目标价格（如：75000）
5. 选择触发方向（Above/Below）
6. 点击"添加价格预警"

## 📊 技术指标说明

### RSI (Relative Strength Index)
- **范围**: 0-100
- **超买区域**: RSI > 70（考虑卖出）
- **超卖区域**: RSI < 30（考虑买入）
- **中性区域**: 30 < RSI < 70

### MACD (Moving Average Convergence Divergence)
- **金叉**: MACD线突破信号线 → 买入信号
- **死叉**: MACD线跌破信号线 → 卖出信号
- **Histogram**: 显示趋势强度

### Bollinger Bands (布林带)
- **Upper Band**: 价格压力位
- **Middle Band**: 移动平均线
- **Lower Band**: 价格支撑位
- **价格触及上轨**: 可能超买
- **价格触及下轨**: 可能超卖

## ⚙️ 配置说明

### 环境变量
```bash
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
export FEISHU_WEBHOOK_URL="your_webhook_url"
```

### 预警阈值配置 (config.js)
```javascript
volatilityThresholds: {
    warning: 5,     // 警告波动 %
    critical: 10    // 紧急波动 %
}

priceThresholds: {
    'BTC': 75000,
    'ETH': 2500,
    'SOL': 100,
    'BNB': 700,
    'HYPE': 35
}
```

## 📁 文件结构

```
crypto-hunter/
├── index.js           # 主程序（命令行版）
├── dashboard.html     # 基础仪表板
├── dashboard.v2.html  # 增强版仪表板 ⭐
├── config.js          # 配置文件
├── src/
│   ├── TechnicalAnalysis.js  # 技术分析模块
│   ├── MLPredictor.js        # ML预测模块
│   └── PriceAlertSystem.js   # 价格预警系统 ⭐
└── README.md          # 说明文档
```

## 🎯 功能对比

| 功能 | v1.0 | v2.0 |
|------|------|------|
| 基础价格监控 | ✅ | ✅ |
| 涨幅榜监控 | ✅ | ✅ |
| 交易量突增检测 | ✅ | ✅ |
| 自定义价格阈值 | ❌ | ✅ |
| 波动百分比监控 | ❌ | ✅ |
| 多级别预警 | ❌ | ✅ |
| RSI技术指标 | ❌ | ✅ |
| MACD技术指标 | ❌ | ✅ |
| 布林带分析 | ❌ | ✅ |
| 综合评分 | ❌ | ✅ |
| 深色主题UI | ❌ | ✅ |
| 价格走势图 | ❌ | ✅ |

## 📈 使用建议

1. **新手建议**: 使用Web仪表板，界面直观易用
2. **高级用户**: 使用命令行版本，支持自动化脚本
3. **交易信号**: 综合多个指标（RSI+MACD）做出决策
4. **风险管理**: 设置合理的预警阈值，避免过度交易

## 🔔 预警级别说明

| 级别 | 颜色 | 含义 | 建议 |
|------|------|------|------|
| 🚨 紧急 | 红色 | 波动>10%或涨幅>30% | 密切关注，考虑止盈/止损 |
| ⚠️ 警告 | 黄色 | 波动5-10%或涨幅15-30% | 关注趋势变化 |
| 📊 正常 | 绿色 | 波动<5% | 继续监控 |

## 📝 更新日志

### v2.0.0 (2026-02-11)
- ✨ 全新增强版价格预警系统
- ✨ 技术指标分析模块
- ✨ 深色主题Web仪表板
- ✨ 实时图表展示
- ✨ 综合评分系统

---
**Happy Trading! 🚀**

## 🥷 v2.2 DeFi Protocol Monitor 快速使用

### 启动DeFi监控
```bash
# 独立启动DeFi监控
cd /root/.openclaw/workspace/crypto-hunter
node src/defi-monitor.js

# 集成模式（与价格监控同时运行）
node src/defi-integration.js
```

### DeFi监控配置
```bash
# 环境变量配置
export DEFI_MONITOR=true                    # 启用DeFi监控
export DEFI_CHECK_INTERVAL=300000           # 检查间隔（毫秒）
export DEFI_TVL_THRESHOLD=5                 # TVL变化阈值%
export DEFI_APY_THRESHOLD=20                # APY异常阈值%
```

### API配置
```javascript
// config.js
defiMonitor: {
    enabled: true,
    checkInterval: 300000,
    tvlThreshold: 5,
    apyThreshold: 20,
    protocols: ['aave', 'compound', 'uniswap', 'curve'],
}
```

### 文件结构 (v2.2)
```
crypto-hunter/
├── index.js              # 主程序（命令行版）
├── dashboard.v2.html     # 增强版仪表板
├── config.js             # 配置文件
├── src/
│   ├── defi-monitor.js        # DeFi协议监控器 ⭐NEW
│   ├── defi-integration.js    # 集成脚本 ⭐NEW
│   ├── TechnicalAnalysis.js    # 技术分析模块
│   ├── MLPredictor.js         # ML预测模块
│   └── PriceAlertSystem.js    # 价格预警系统
└── README.md             # 说明文档
```
