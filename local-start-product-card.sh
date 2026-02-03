#!/bin/bash
cd ~/product-card-app
export NODE_ENV=production
export PORT=3000
echo "🚀 Starting Product Card Generator..."
~/bin/node server.js