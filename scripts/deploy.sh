#!/bin/bash
set -euo pipefail

APP_DIR=/home/ec2-user/app
LOG=/var/log/deploy.log

echo "=== Deploy started at $(date) ===" | tee -a $LOG

# Clone if missing
if [ ! -d "$APP_DIR/.git" ]; then
  echo "Cloning repo..." | tee -a $LOG
  sudo -u ec2-user git clone https://github.com/Alioskillers/JIRA.git "$APP_DIR" 2>&1 | tee -a $LOG
fi

# Pull latest
echo "--- git pull ---" | tee -a $LOG
sudo -u ec2-user git -C "$APP_DIR" fetch origin main 2>&1 | tee -a $LOG
sudo -u ec2-user git -C "$APP_DIR" reset --hard origin/main 2>&1 | tee -a $LOG

# Backend
echo "--- backend build ---" | tee -a $LOG
cd "$APP_DIR/backend"
sudo -u ec2-user npm install --production=false 2>&1 | tee -a $LOG
sudo -u ec2-user npm run build 2>&1 | tee -a $LOG

# Frontend
echo "--- frontend build ---" | tee -a $LOG
cd "$APP_DIR/frontend"
sudo -u ec2-user npm install 2>&1 | tee -a $LOG
sudo -u ec2-user npm run build 2>&1 | tee -a $LOG

# PM2 restart
echo "--- pm2 restart ---" | tee -a $LOG
sudo -u ec2-user bash -c "cd $APP_DIR/backend && pm2 restart mini-jira 2>/dev/null || pm2 start dist/main.js --name mini-jira"
sudo -u ec2-user bash -c "cd $APP_DIR/frontend && pm2 restart mini-jira-frontend 2>/dev/null || pm2 start npm --name mini-jira-frontend -- start -- -p 3001"
sudo -u ec2-user pm2 save

# Health check
echo "--- health check ---" | tee -a $LOG
sleep 5
curl -sf http://localhost:3000/api/health && echo "Backend OK" || echo "Backend FAILED"

echo "=== Deploy complete at $(date) ===" | tee -a $LOG
