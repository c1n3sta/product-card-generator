#!/bin/bash
case "$1" in
  start)
    echo "🚀 Starting application..."
    cd ~/product-card-app
    nohup ~/bin/node server.js > app.log 2>&1 &
    echo $! > app.pid
    echo "✅ Application started with PID $(cat app.pid)"
    ;;
  stop)
    if [ -f app.pid ]; then
      echo "🛑 Stopping application..."
      kill $(cat app.pid) 2>/dev/null || true
      rm -f app.pid
      echo "✅ Application stopped"
    else
      echo "⚠️  No running application found"
    fi
    ;;
  status)
    if [ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null; then
      echo "✅ Application is running (PID: $(cat app.pid))"
    else
      echo "❌ Application is not running"
    fi
    ;;
  logs)
    if [ -f ~/product-card-app/app.log ]; then
      tail -f ~/product-card-app/app.log
    else
      echo "⚠️  No log file found"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status|logs}"
    exit 1
    ;;
esac