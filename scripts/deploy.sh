#!/bin/bash
set -euo pipefail

LOG=/tmp/deploy.log
APP_DIR=/home/ec2-user/app

# Detect which home user exists
if id ec2-user &>/dev/null; then
  APP_USER=ec2-user
elif id ubuntu &>/dev/null; then
  APP_USER=ubuntu
  APP_DIR=/home/ubuntu/app
else
  APP_USER=$(whoami)
  APP_DIR=/home/$APP_USER/app
fi

echo "=== Deploy started at $(date) | user=$APP_USER | dir=$APP_DIR ===" | tee $LOG

run_as() {
  if [ "$(whoami)" = "$APP_USER" ]; then
    bash -c "$*" 2>&1 | tee -a $LOG
  else
    su - "$APP_USER" -c "$*" 2>&1 | tee -a $LOG
  fi
}

# Clone if missing
if [ ! -d "$APP_DIR/.git" ]; then
  echo "Cloning repo..." | tee -a $LOG
  mkdir -p "$(dirname $APP_DIR)"
  run_as "git clone https://github.com/Alioskillers/JIRA.git $APP_DIR"
fi

# Pull latest
echo "--- git pull ---" | tee -a $LOG
run_as "git -C $APP_DIR fetch origin main"
run_as "git -C $APP_DIR reset --hard origin/main"

# Backend
echo "--- backend build ---" | tee -a $LOG
run_as "cd $APP_DIR/backend && npm install --production=false && npm run build"

# Frontend
echo "--- frontend build ---" | tee -a $LOG
run_as "cd $APP_DIR/frontend && npm install && npm run build"

# PM2
echo "--- pm2 restart ---" | tee -a $LOG
run_as "cd $APP_DIR/backend && pm2 restart mini-jira 2>/dev/null || pm2 start dist/main.js --name mini-jira"
run_as "cd $APP_DIR/frontend && pm2 restart mini-jira-frontend 2>/dev/null || pm2 start npm --name mini-jira-frontend -- start -- -p 3001"
run_as "pm2 save"

# Health check
echo "--- health check ---" | tee -a $LOG
sleep 5
curl -sf http://localhost:3000/api/health && echo " Backend OK" | tee -a $LOG || echo " Backend FAILED" | tee -a $LOG

echo "=== Deploy complete at $(date) ===" | tee -a $LOG
