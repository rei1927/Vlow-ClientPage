#!/bin/bash
cd /root/Vlow-ClientPage || cd /root/vlow || exit
git pull
docker compose up -d --build
