# 🐂 Crypto Hunter

> 加密货币异动监控器 - 自动监控涨幅榜、交易量突增、新币上市

## 功能特性

### 🔍 实时监控
- **24小时涨幅榜** - 追踪涨幅超过阈值的代币
- **交易量突增** - 发现异常交易量变化
- **新币上市提醒** - 追踪新上交易所的代币
- **价格预警** - 自定义价格触发通知

### 📊 数据分析
- 多数据源聚合（CoinMarketCap、 CoinGecko）
- 交易量/市值比分析
- 市值排行筛选
- AI驱动的趋势分析（可选）

### 🔔 通知渠道
- 控制台输出
- 钉钉机器人
- Telegram Bot
- Email 邮件
- Web Dashboard

## 快速开始

### 1. 安装依赖
```bash
cd /root/.openclaw/workspace/crypto-hunter
npm install
```

### 2. 配置
编辑 `config.js`:
```javascript
module.exports = {
    thresholds: {
        minGain24h: 10,      // 最小涨幅阈值 (%)
        minVolumeRatio: 3,   // 最小交易量/市值比
    },
    notifications: {
        dingtalk: {
            enabled: true,
            webhook: 'YOUR_WEBHOOK_URL',
        },
    },
};
```

### 3. 运行
```bash
# 单次运行
node index.js

# 持续监控（每小时）
node monitor.sh

# 启动Web仪表板
# 直接在浏览器打开 dashboard.html
```

### 4. 设置定时任务
```bash
# 编辑 crontab
crontab -e

# 添加（每小时 :05 分运行）
5 * * * * cd /root/.openclaw/workspace/crypto-hunter && node index.js >> /var/log/crypto-hunter.log
```

## 项目结构

```
crypto-hunter/
├── index.js          # 主程序
├── config.js         # 配置文件
├── dashboard.html    # Web仪表板
├── daily-report.js   # 日报生成器
├── monitor.sh        # 持续监控脚本
├── CRON_SETUP.md    # Cron配置说明
└── README.md         # 本文档
```

## 使用示例

### 控制台输出
```
🐂 Crypto Hunter 启动...
==================================================
🐂 Crypto Hunter - 加密货币异动报告
生成时间: 2026-02-08 16:30:00
==================================================

🚨 高优先级异动 (2)
  🚀 PEPE 24小时涨幅 25.67%
  📊 BONK 交易量激增 (30.5% of 市值)

⚡ 中优先级异动 (3)
  ...

📈 统计:
  - 涨幅榜异常: 5
  - 交易量突增: 3
  - 价格预警: 0
```

### Web仪表板
直接在浏览器打开 `dashboard.html`，查看可视化数据。

## 高级配置

### 钉钉通知
1. 创建钉钉群机器人
2. 获取 Webhook URL
3. 在 `config.js` 中启用并配置

### Telegram通知
1. 创建 Telegram Bot
2. 获取 Bot Token 和 Chat ID
3. 在 `config.js` 中配置

## 技术栈
- Node.js - 运行时
- HTTPS - 数据获取
- Cron - 定时任务
- HTML/CSS/JS - Web仪表板

## 扩展方向
- ✅ 集成交易所API（币安、OKX等）
- ✅ 套利机会检测
- ✅ 社交媒体情绪分析
- ✅ 链上数据分析（ETH Gas追踪）
- ✅ 机器学习预测模型

## License
MIT

---

**风险提示**: 加密货币市场波动剧烈，本工具仅供信息参考，不构成投资建议。请DYOR！
