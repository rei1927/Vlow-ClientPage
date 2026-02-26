#!/bin/bash
for i in {1..30}; do
  if curl -s -f -o /dev/null -I https://vlow.ai/api/health; then
    echo "Server is up!"
    exit 0
  fi
  sleep 10
done
echo "Timeout"
