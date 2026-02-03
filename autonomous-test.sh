#!/bin/bash
echo "Testing deployed endpoints:"
curl -s http://localhost:3000/api/trpc/auth.me | grep -q "local-user" && echo "✅ Auth endpoint working" || echo "❌ Auth endpoint failed"
curl -s http://localhost:3000/api/trpc/system.health | grep -q "ok" && echo "✅ Health endpoint working" || echo "❌ Health endpoint failed"
echo "Server URL: http://print-lab-spb.ru:3000/"
