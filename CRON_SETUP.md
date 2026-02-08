# Crypto Hunter - Cron定时任务配置

# 每小时运行一次监控（建议时间：每小时的 :05 分运行）
5 * * * * cd /root/.openclaw/workspace/crypto-hunter && node index.js >> /var/log/crypto-hunter.log 2>&1

# 每天9点发送日报
0 9 * * * cd /root/.openclaw/workspace/crypto-hunter && node daily-report.js >> /var/log/crypto-hunter-daily.log 2>&1

# 每天18点发送晚报
0 18 * * * cd /root/.openclaw/workspace/crypto-hunter && node daily-report.js >> /var/log/crypto-hunter-evening.log 2>&1

---

# 安装方法:
# 1. 编辑 crontab: crontab -e
# 2. 添加上述配置
# 3. 保存退出

# 查看任务: crontab -l
# 删除任务: crontab -r
