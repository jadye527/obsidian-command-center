#!/bin/bash
# Collect fresh dashboard data and push to GitHub Pages
cd "$(dirname "$0")"
python3 collect.py
git add dashboard-state.json
git diff --cached --quiet || git commit -m "auto: update dashboard state $(date -u +%Y-%m-%dT%H:%M:%SZ)" && git push origin master 2>/dev/null
