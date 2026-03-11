#!/usr/bin/env python3
"""Tests for get_x_metrics() in collect.py."""

import json
import os
import tempfile
import unittest

# Override X_API_DIR before importing collect
_tmpdir = tempfile.mkdtemp()
os.environ["X_API_DIR"] = _tmpdir

from collect import get_x_metrics


class TestGetXMetrics(unittest.TestCase):

    def setUp(self):
        """Clean up temp dir before each test."""
        for f in os.listdir(_tmpdir):
            os.remove(os.path.join(_tmpdir, f))

    def test_returns_empty_when_no_files(self):
        result = get_x_metrics()
        self.assertEqual(result["followers"], 0)
        self.assertEqual(result["totalPosts"], 0)
        self.assertIsNone(result["snapshotDate"])

    def test_reads_latest_analytics_snapshot(self):
        analytics = {
            "snapshots": [
                {
                    "timestamp": 1000,
                    "date": "2026-03-09 08:00",
                    "followers": 5,
                    "following": 20,
                    "total_tweets": 10,
                    "totals": {"likes": 2, "replies": 1, "reposts": 0, "impressions": 50, "bookmarks": 0, "engagement": 3},
                    "posts": []
                },
                {
                    "timestamp": 2000,
                    "date": "2026-03-10 09:00",
                    "followers": 8,
                    "following": 30,
                    "total_tweets": 15,
                    "totals": {"likes": 5, "replies": 3, "reposts": 1, "impressions": 100, "bookmarks": 2, "engagement": 11},
                    "posts": []
                }
            ]
        }
        with open(os.path.join(_tmpdir, "analytics.json"), "w") as f:
            json.dump(analytics, f)

        result = get_x_metrics()
        self.assertEqual(result["followers"], 8)
        self.assertEqual(result["following"], 30)
        self.assertEqual(result["totalPosts"], 15)
        self.assertEqual(result["totals"]["likes"], 5)
        self.assertEqual(result["totals"]["impressions"], 100)
        self.assertEqual(result["snapshotDate"], "2026-03-10 09:00")

    def test_reads_growth_tracker_engagement_by_type(self):
        analytics = {
            "snapshots": [{
                "timestamp": 1000, "date": "2026-03-10", "followers": 1,
                "following": 10, "total_tweets": 5,
                "totals": {"likes": 0, "replies": 0, "reposts": 0, "impressions": 0, "bookmarks": 0, "engagement": 0},
                "posts": []
            }]
        }
        growth = {
            "snapshots": [
                {"timestamp": "2026-03-10T20:00:00Z", "by_type": {"reply": {"count": 2}}, "total_posts": 5, "total_engagement": 3},
                {"timestamp": "2026-03-10T21:00:00Z", "by_type": {"value": {"count": 4}}, "total_posts": 8, "total_engagement": 10},
            ]
        }
        with open(os.path.join(_tmpdir, "analytics.json"), "w") as f:
            json.dump(analytics, f)
        with open(os.path.join(_tmpdir, "growth-tracker.json"), "w") as f:
            json.dump(growth, f)

        result = get_x_metrics()
        self.assertIn("value", result["engagementByType"])
        self.assertEqual(result["engagementByType"]["value"]["count"], 4)

    def test_handles_empty_snapshots_array(self):
        with open(os.path.join(_tmpdir, "analytics.json"), "w") as f:
            json.dump({"snapshots": []}, f)

        result = get_x_metrics()
        self.assertEqual(result["followers"], 0)

    def test_handles_malformed_json(self):
        with open(os.path.join(_tmpdir, "analytics.json"), "w") as f:
            f.write("not json")

        result = get_x_metrics()
        self.assertEqual(result["followers"], 0)
        self.assertIsNone(result["snapshotDate"])

    def test_analytics_ok_but_growth_missing(self):
        analytics = {
            "snapshots": [{
                "timestamp": 1000, "date": "2026-03-10", "followers": 3,
                "following": 15, "total_tweets": 7,
                "totals": {"likes": 1, "replies": 0, "reposts": 0, "impressions": 10, "bookmarks": 0, "engagement": 1},
                "posts": []
            }]
        }
        with open(os.path.join(_tmpdir, "analytics.json"), "w") as f:
            json.dump(analytics, f)

        result = get_x_metrics()
        self.assertEqual(result["followers"], 3)
        self.assertEqual(result["engagementByType"], {})

    def test_analytics_ok_but_growth_malformed(self):
        analytics = {
            "snapshots": [{
                "timestamp": 1000, "date": "2026-03-10", "followers": 2,
                "following": 5, "total_tweets": 3,
                "totals": {"likes": 0, "replies": 0, "reposts": 0, "impressions": 0, "bookmarks": 0, "engagement": 0},
                "posts": []
            }]
        }
        with open(os.path.join(_tmpdir, "analytics.json"), "w") as f:
            json.dump(analytics, f)
        with open(os.path.join(_tmpdir, "growth-tracker.json"), "w") as f:
            f.write("{bad json")

        result = get_x_metrics()
        self.assertEqual(result["followers"], 2)
        self.assertEqual(result["engagementByType"], {})


if __name__ == "__main__":
    unittest.main()
