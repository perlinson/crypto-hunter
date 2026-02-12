/**
 * DeFi Monitor Integration - 集成到Crypto Hunter主应用
 * 
 * 功能：
 * 1. 将DeFi预警发送到Telegram/飞书/钉钉
 * 2. 在Web仪表板显示DeFi状态
 * 3. 统一配置管理
 */

const { DeFiProtocolMonitor } = require('./defi-monitor');
const axios = require('axios');

// 加载配置
const config = require('../config');

// 创建DeFi监控器实例
const defiMonitor = new DeFiProtocolMonitor({
  checkInterval: config.defiCheckInterval || 300000, // 默认5分钟
  tvlChangeThreshold: config.defiTvlThreshold || 5,
  apyThreshold: config.defiApyThreshold || 2,
  enableTvlAlerts: config.defiEnableTvl !== false,
  enableApyAlerts: config.defiEnableApy !== false,
});

/**
 * 发送到Telegram
 */
async function sendToTelegram(message) {
  if (!config.telegramEnabled) return;
  
  try {
    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    await axios.post(url, {
      chat_id: config.telegramChatId,
      text: message,
      parse_mode: 'Markdown',
    });
    console.log('[DeFi->Telegram] 发送成功');
  } catch (error) {
    console.error('[DeFi->Telegram] 发送失败:', error.message);
  }
}

/**
 * 发送到飞书
 */
async function sendToFeishu(message) {
  if (!config.feishuWebhookUrl) return;
  
  try {
    await axios.post(config.feishuWebhookUrl, {
      msg_type: 'text',
      content: { text: message },
    });
    console.log('[DeFi->Feishu] 发送成功');
  } catch (error) {
    console.error('[DeFi->Feishu] 发送失败:', error.message);
  }
}

/**
 * 发送到钉钉
 */
async function sendToDingtalk(message) {
  if (!config.dingtalkWebhookUrl) return;
  
  try {
    await axios.post(config.dingtalkWebhookUrl, {
      msgtype: 'text',
      text: { content: message },
    });
    console.log('[DeFi->Dingtalk] 发送成功');
  } catch (error) {
    console.error('[DeFi->Dingtalk] 发送失败:', error.message);
  }
}

/**
 * 发送到所有渠道
 */
async function sendAlertToAllChannels(alert) {
  const message = defiMonitor.formatAlertMessage(alert);
  
  await Promise.all([
    sendToTelegram(message),
    sendToFeishu(message),
    sendToDingtalk(message),
  ]);
}

/**
 * 保存预警到文件
 */
function saveAlertToFile(alert) {
  const fs = require('fs');
  const path = require('path');
  
  const logFile = path.join(__dirname, '../data/defi-alerts.log');
  const logEntry = {
    ...alert,
    timestamp: new Date().toISOString(),
  };
  
  try {
    const logs = fs.existsSync(logFile) 
      ? JSON.parse(fs.readFileSync(logFile, 'utf8'))
      : [];
    logs.unshift(logEntry);
    // 只保留最近100条
    if (logs.length > 100) logs.pop();
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('[DeFi] 保存日志失败:', error.message);
  }
}

// 注册预警回调
defiMonitor.onAlert(async (alert) => {
  console.log('\n🚨 DeFi预警触发!');
  console.log(JSON.stringify(alert, null, 2));
  
  // 发送到各渠道
  await sendAlertToAllChannels(alert);
  
  // 保存到本地日志
  saveAlertToFile(alert);
});

/**
 * 启动DeFi监控
 */
async function startDeFiMonitor() {
  console.log('\n========================================');
  console.log('🚀 启动 DeFi Protocol Monitor...');
  console.log('========================================\n');
  
  try {
    // 获取初始状态
    const status = await defiMonitor.getAllProtocolsStatus();
    console.log('📊 当前DeFi协议状态:');
    console.log(`   总TVL: ${status.totalTVLFormatted}`);
    console.log('');
    
    for (const proto of status.protocols) {
      console.log(`   ${proto.name}:`);
      console.log(`     TVL: ${proto.tvl?.tvlFormatted || 'N/A'}`);
      console.log(`     24h变化: ${proto.tvl?.change24h?.toFixed(2) || 0}%`);
    }
    console.log('');
    
    // 启动监控
    await defiMonitor.start();
    
    console.log('\n✅ DeFi监控已启动!');
    console.log('   - TVL变化监测: 启用');
    console.log('   - APY异常预警: 启用');
    console.log('   - 预警通知: Telegram/飞书/钉钉\n');
    
    return defiMonitor;
  } catch (error) {
    console.error('❌ 启动DeFi监控失败:', error.message);
    throw error;
  }
}

/**
 * 停止DeFi监控
 */
function stopDeFiMonitor() {
  defiMonitor.stop();
  console.log('🛑 DeFi监控已停止');
}

// 导出模块
module.exports = {
  startDeFiMonitor,
  stopDeFiMonitor,
  defiMonitor,
};

// 如果直接运行
if (require.main === module) {
  startDeFiMonitor().catch(console.error);
  
  process.on('SIGINT', () => {
    console.log('\n正在停止DeFi监控...');
    stopDeFiMonitor();
    process.exit(0);
  });
}
