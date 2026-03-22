#!/bin/bash

set -e
cd /var/www/sites/stella/girlypopchat.com/secret

case "$1" in
  build)
    echo "Building..."
    npm run build
    ;;
  start)
    echo "Starting PM2..."
    pm2 restart all
    ;;
  stop)
    echo "Stopping PM2..."
    pm2 stop all
    ;;
  logs)
    pm2 logs
    ;;
  status)
    pm2 status
    ;;
  clean)
    echo "Cleaning .next..."
    rm -rf .next
    ;;
  deploy)
    echo "Full deploy: clean, build, restart..."
    rm -rf .next
    npm run build
    pm2 restart all
    echo "Done! Hard refresh your browser."
    ;;
  quick)
    echo "Quick build & restart..."
    npm run build
    pm2 restart all
    ;;
  *)
    echo "Usage: $0 {build|start|stop|logs|status|clean|deploy|quick}"
    echo ""
    echo "Commands:"
    echo "  build  - Run npm run build"
    echo "  start  - Restart PM2"
    echo "  stop   - Stop PM2"
    echo "  logs   - Show PM2 logs"
    echo "  status - Show PM2 status"
    echo "  clean  - Delete .next folder"
    echo "  deploy - Clean, build, restart (full deploy)"
    echo "  quick  - Build & restart (no clean)"
    exit 1
    ;;
esac
