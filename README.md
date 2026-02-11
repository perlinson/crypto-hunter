# 🐂 Crypto Hunter - 加密货币异动监控器

<div align="center">

![Crypto Hunter](https://img.shields.io/badge/Crypto-Hunter-yellow)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-14+-green)

实时监控加密货币异常波动，自动发送预警通知到 Telegram、飞书、钉钉！

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [通知配置](#-通知配置) • [API 文档](#-api-文档)

</div>

## ✨ 功能特性

### 📊 实时监控
- **涨幅榜异常** - 监控 24h 涨幅超过 15% 的币种
- **交易量突增** - 检测交易量/市值比超过 5x 的异常交易
- **价格预警** - 自动监控 BTC、ETH、SOL 等主流币种价格

### 🔔 多渠道通知
- **Telegram Bot** - 实时推送预警消息
- **飞书 Webhook** - 企业群机器人通知
- **钉钉机器人** - 钉钉群消息通知

### 🎨 Web 仪表板
- 实时数据可视化
- 预警状态一目了然
- 一键配置通知

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /root/.openclaw/workspace/crypto-hunter
npm install
```

### 2. 配置通知（可选）

```bash
# Telegram Bot
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"

# 飞书 Webhook
export FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"

# 钉钉机器人
export DINGTALK_ACCESS_TOKEN="your_token"
export DINGTALK_SECRET="your_secret"
```

### 3. 运行

```bash
# 手动运行一次
node index.js

# 或使用 crontab 定时运行
*/5 * * * * cd /root/.openclaw/workspace/crypto-hunter && node index.js >> /tmp/crypto-hunter.log 2>&1

# 或启动 Web 仪表板
python3 -m http.server 8080
# 访问 http://localhost:8080/dashboard.html
```

### 4. 设置 Telegram Bot

1. 找 @BotFather 创建新 Bot
2. 获取 Bot Token
3. 创建群组，把 Bot 拉进去
4. 获取群组 Chat ID（用 @userinfobot）
5. 设置环境变量

```bash
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
export TELEGRAM_CHAT_ID="-100123456789"
```

### 5. 设置飞书 Webhook

1. 打开飞书群组设置
2. 添加"群机器人"
3. 选择"自定义机器人"
4. 复制 Webhook URL
5. 设置环境变量

```bash
export FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
```

## 📁 文件结构

```
crypto-hunter/
├── index.js          # 主程序（CLI 监控）
├── dashboard.html     # Web 仪表板
├── config.js         # 配置文件
├── package.json       # 项目配置
├── start.sh          # 启动脚本
├── CRON_SETUP.md     # Crontab 配置说明
├── README.md         # 本文档
└── data/             # 数据缓存目录
```

## ⚙️ 配置说明

### config.js

```javascript
module.exports = {
    // 涨幅阈值 (%)
    MIN_GAINERS_24H: 15,
    
    // 交易量倍数阈值
    VOLUME_MULTIPLIER: 5,
    
    // 价格预警
    PRICE_ALERTS: [
        { symbol: 'BTC', target: 75000, direction: 'above' },
        { symbol: 'ETH', target: 2500, direction: 'above' },
        { symbol: 'SOL', target: 100, direction: 'above' },
    ],
    
    // 稳定币排除列表
    STABLECOINS: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDD'],
};
```

### 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | Telegram 通知必填 |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | Telegram 通知必填 |
| `FEISHU_WEBHOOK_URL` | 飞书 Webhook URL | 飞书通知必填 |
| `DINGTALK_ACCESS_TOKEN` | 钉钉 Access Token | 钉钉通知必填 |
| `DINGTALK_SECRET` | 钉钉加签密钥 | 钉钉加签必填 |

## 📈 使用示例

### 终端输出示例

```
==================================================
🐂 Crypto Hunter - 加密货币异动报告
生成时间: 2026/2/10 12:00:00
==================================================

🚨 高优先级异动 (2)
────────────────────────────
  🚀 BONK (Bonk) 24h +45.32% 📈
  🚀 PEPE (Pepe) 24h +25.67% 📈

⚡ 中优先级异动 (1)
────────────────────────────
  📊 HYPE 交易量激增 412%

📈 统计:
  - 涨幅榜异常: 3
  - 交易量突增: 1
  - 价格预警: 0

==================================================
```

### Telegram 通知示例

```
🐂 Crypto Hunter Alert

🚀 BONK 24小时涨幅 45.32%
🚀 PEPE 24小时涨幅 25.67%
📊 HYPE 交易量突增 412%
```

## 🔧 高级配置

### Crontab 定时任务

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每5分钟检查一次）
*/5 * * * * cd /root/.openclaw/workspace/crypto-hunter && node index.js >> /tmp/crypto-hunter.log 2>&1

# 查看日志
tail -f /tmp/crypto-hunter.log
```

### Systemd 服务（Linux）

```ini
# /etc/systemd/system/crypto-hunter.service
[Unit]
Description=Crypto Hunter - 加密货币监控器
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/.openclaw/workspace/crypto-hunter
ExecStart=/usr/bin/node index.js
Restart=always
Environment=TELEGRAM_BOT_TOKEN=xxx
Environment=TELEGRAM_CHAT_ID=xxx

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动
sudo systemctl enable crypto-hunter
sudo systemctl start crypto-hunter
sudo systemctl status crypto-hunter
```

### 钉钉机器人加签

```javascript
const crypto = require('crypto');

function sign(secret) {
    const timestamp = Date.now().toString();
    const stringToSign = `${timestamp}\n${secret}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(stringToSign);
    const signature = hmac.digest('base64');
    return { timestamp, signature };
}
```

## 📊 Web 仪表板

打开 `dashboard.html` 即可看到：

- 📈 实时涨幅榜
- 📊 交易量监控
- 🔔 预警历史
- ⚙️ 一键配置通知

```bash
# 启动本地服务器
cd /root/.openclaw/workspace/crypto-hunter
python3 -m http.server 8080

# 访问
open http://localhost:8080/dashboard.html
```

## 🐛 常见问题

### Q: 收不到 Telegram 通知？
A: 检查以下配置：
1. Bot Token 是否正确
2. Chat ID 是否是负数格式（群组 ID）
3. Bot 是否已加入群组

### Q: 飞书 Webhook 报错？
A: 
1. 确认 Webhook URL 格式正确
2. 检查 IP 白名单（如果设置了）
3. 确认机器人已添加到群组

### Q: 如何增加新的监控币种？
A: 修改 `config.js` 中的 `PRICE_ALERTS` 数组：

```javascript
PRICE_ALERTS: [
    { symbol: 'BTC', target: 75000, direction: 'above' },
    { symbol: 'DOGE', target: 0.1, direction: 'above' },
]
```

### Q: 数据源是什么？
A: 目前使用 CoinMarketCap 网站数据（无需 API key）。

## 📝 更新日志

### v2.0 (2026-02-10)
- ✨ 新增 Telegram Bot 通知
- ✨ 新增飞书 Webhook 通知
- ✨ 新增钉钉机器人通知
- 🎨 全新 Web 仪表板界面
- ⚡ 优化数据抓取逻辑
- 🐛 修复各种 BUG

### v1.0 (2026-02-09)
- 🎉 初始版本
- 📈 基础涨幅监控
- 📊 交易量突增检测
- 💰 价格预警功能

## 📄 许可证

MIT License - 随意使用和修改！

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">
Made with ❤️ by Crypto Hunter
</div>
