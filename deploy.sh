#!/bin/bash
# Stop on first error
set -e

cd /var/www/bots-prompt2pathway

git reset --hard
git pull origin main

npm install
npm run build

cd /var/www/bots-prompt2pathway/server

npm install
pm2 restart bots || pm2 start server.js --name bots

echo "Deployment finished!"