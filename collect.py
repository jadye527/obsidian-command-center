#!/usr/bin/env python3
"""
Collects live agent state and writes dashboard-state.json.
Run via cron every 5-10 minutes.
"""

import json
import os
import subprocess
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE = os.environ.get("AGENT_WORKSPACE", os.path.expanduser("~/workspace"))
DASHBOARD_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(DASHBOARD_DIR, "dashboard-state.json")
ACTIVITY_LOG = os.path.join(DASHBOARD_DIR, "activity-log.jsonl")
TRADE_DB = os.environ.get("TRADE_DB_PATH", os.path.join(WORKSPACE, "trading-bot/data/trades.db"))
TMUX_SOCK = os.environ.get("TMUX_SOCKET", os.path.expanduser("~/.tmux/default"))
X_API_DIR = os.environ.get("X_API_DIR", os.path.expanduser("~/.config/x-api"))


def run(cmd, timeout=5):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except Exception:
        return ""


def check_process(pattern):
    return bool(run(f"pgrep -f '{pattern}'"))


def check_tmux_session(name):
    out = run(f"tmux -S {TMUX_SOCK} has-session -t {name} 2>/dev/null && echo ALIVE || echo DEAD")
    return out == "ALIVE"


def get_tmux_sessions():
    out = run(f"tmux -S {TMUX_SOCK} list-sessions 2>/dev/null")
    if not out:
        return []
    sessions = []
    for line in out.splitlines():
        name = line.split(":")[0].strip()
        sessions.append(name)
    return sessions


def read_prd_progress(prd_path):
    try:
        text = Path(prd_path).read_text()
        done = text.count("- [x]")
        todo = text.count("- [ ]")
        return {"done": done, "total": done + todo, "pct": round(done / max(done + todo, 1) * 100)}
    except Exception:
        return {"done": 0, "total": 0, "pct": 0}


def get_paper_trade_stats():
    db_path = TRADE_DB
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM paper_trades")
        total = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM paper_trades WHERE resolved=1 AND won=1")
        wins = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM paper_trades WHERE resolved=1")
        resolved = c.fetchone()[0]
        c.execute("SELECT COALESCE(SUM(pnl),0) FROM paper_trades WHERE resolved=1")
        pnl = c.fetchone()[0]
        c.execute("SELECT timestamp FROM paper_trades ORDER BY rowid DESC LIMIT 1")
        last = c.fetchone()
        conn.close()
        return {
            "total": total,
            "resolved": resolved,
            "wins": wins,
            "winRate": round(wins / max(resolved, 1) * 100),
            "pnl": round(pnl, 2),
            "lastTrade": last[0] if last else "never"
        }
    except Exception:
        return {"total": 0, "resolved": 0, "wins": 0, "winRate": 0, "pnl": 0, "lastTrade": "unknown"}


def get_agent_status(agent_id):
    agent_dir = os.path.join(WORKSPACE, f"agents/{agent_id}")
    identity_file = os.path.join(agent_dir, "IDENTITY.md")

    info = {"id": agent_id, "status": "offline", "lastAction": "Unknown"}

    try:
        text = Path(identity_file).read_text()
        for line in text.splitlines():
            if line.startswith("- Name:") or line.startswith("- **Name:**"):
                info["name"] = line.split(":", 1)[1].strip().strip("*")
            if line.startswith("- Role:") or line.startswith("- **Creature:**"):
                info["role"] = line.split(":", 1)[1].strip().strip("*")
    except Exception:
        pass

    return info


def get_x_metrics():
    """Read X analytics and growth-tracker snapshots, return latest metrics."""
    empty = {
        "followers": 0, "following": 0, "totalPosts": 0,
        "totals": {"likes": 0, "replies": 0, "reposts": 0, "impressions": 0, "bookmarks": 0, "engagement": 0},
        "engagementByType": {},
        "snapshotDate": None,
    }
    try:
        analytics_path = os.path.join(X_API_DIR, "analytics.json")
        data = json.loads(Path(analytics_path).read_text())
        snapshots = data.get("snapshots", [])
        if not snapshots:
            return empty
        latest = snapshots[-1]
        result = {
            "followers": latest.get("followers", 0),
            "following": latest.get("following", 0),
            "totalPosts": latest.get("total_tweets", 0),
            "totals": latest.get("totals", empty["totals"]),
            "snapshotDate": latest.get("date"),
        }
    except Exception:
        return empty

    try:
        growth_path = os.path.join(X_API_DIR, "growth-tracker.json")
        growth = json.loads(Path(growth_path).read_text())
        growth_snaps = growth.get("snapshots", [])
        if growth_snaps:
            latest_growth = growth_snaps[-1]
            result["engagementByType"] = latest_growth.get("by_type", {})
        else:
            result["engagementByType"] = {}
    except Exception:
        result["engagementByType"] = {}

    return result


def collect():
    now = datetime.now(timezone.utc)

    # Agent statuses
    obsidian = get_agent_status("obsidian")
    obsidian.update({
        "name": "Obsidian", "role": "CEO / Strategy", "emoji": "\U0001f9e0",
        "model": "Claude Opus", "color": "purple"
    })

    sentinel = get_agent_status("sentinel")
    sentinel.update({
        "name": "Sentinel", "role": "Trading Ops", "emoji": "\U0001f6e1\ufe0f",
        "model": "Claude Sonnet", "color": "red"
    })

    ralph_sessions = [s for s in get_tmux_sessions() if "ralph" in s.lower()]
    ralph = {
        "id": "ralph", "name": "Ralph", "role": "Developer", "emoji": "\U0001f528",
        "model": "Codex (GPT)", "color": "green",
        "status": "active" if ralph_sessions else "offline",
        "lastAction": f"tmux: {ralph_sessions[0]}" if ralph_sessions else "No active session"
    }

    # Process health — process patterns loaded from env to avoid leaking infra details
    health_checks = json.loads(os.environ.get("HEALTH_CHECKS", "[]"))
    health = []
    for hc in health_checks:
        running = check_process(hc["pattern"])
        health.append({
            "name": hc["name"],
            "status": "healthy" if running else hc.get("fail_status", "error"),
            "detail": "Running" if running else "Not running",
        })

    # Ralph tmux
    for s in ralph_sessions:
        health.append({"name": f"Ralph ({s})", "status": "healthy", "detail": "Active in tmux"})

    # Trading stats
    trades = get_paper_trade_stats()

    # PRD progress
    prd_path = os.environ.get("PRD_PATH", os.path.join(WORKSPACE, "growth-kit/PRD.md"))
    growth_kit_prd = read_prd_progress(prd_path)

    # Costs (static for now, can be updated manually in cost-tracker.json)
    cost_file = os.path.join(DASHBOARD_DIR, "cost-tracker.json")
    try:
        costs = json.loads(Path(cost_file).read_text())
    except Exception:
        costs = {
            "claudeMax": {"label": "Claude Max", "amount": 200, "icon": "\U0001f9e0"},
            "codex": {"label": "Codex / ChatGPT", "amount": 20, "icon": "\U0001f528"},
            "haiku": {"label": "Haiku Crons", "amount": 3.20, "icon": "\u26a1"},
            "xApi": {"label": "X API", "amount": 5.00, "icon": "\U0001f426"}
        }

    # Activity log (last 20 entries)
    timeline = []
    try:
        lines = Path(ACTIVITY_LOG).read_text().strip().splitlines()
        for line in lines[-20:]:
            timeline.append(json.loads(line))
        timeline.reverse()
    except Exception:
        timeline = [{"time": now.strftime("%I:%M %p"), "agent": "obsidian", "action": "Dashboard data collected"}]

    # X metrics
    x_metrics = get_x_metrics()

    # Build state
    state = {
        "updated": now.isoformat(),
        "agents": [obsidian, sentinel, ralph],
        "costs": costs,
        "budget": 250,
        "health": health,
        "trading": trades,
        "xMetrics": x_metrics,
        "prdProgress": {"growthKit": growth_kit_prd},
        "timeline": timeline,
        "tasks": [],  # Can be populated from PRD files
        "delegations": [
            {"from": "obsidian", "to": "ralph", "task": "Dashboard improvements", "status": "active" if ralph_sessions else "idle"},
            {"from": "obsidian", "to": "sentinel", "task": "Market scanning & trading", "status": "active"},
            {"from": "jason", "to": "obsidian", "task": "Company operations", "status": "active"},
        ]
    }

    with open(OUTPUT, "w") as f:
        json.dump(state, f, indent=2)

    print(f"[{now.strftime('%H:%M:%S UTC')}] Dashboard state written to {OUTPUT}")


def log_activity(agent, action):
    """Append an activity to the log. Call from other scripts."""
    entry = {
        "time": datetime.now(timezone.utc).strftime("%I:%M %p"),
        "agent": agent,
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    with open(ACTIVITY_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")


if __name__ == "__main__":
    collect()
