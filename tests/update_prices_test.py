"""Offline coverage of the migrated JSON price-update pipeline."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location(
    "update_prices", Path(__file__).resolve().parents[1] / "tooling" / "data" / "update-prices.py"
)
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class PriceUpdateTests(unittest.TestCase):
    def test_json_round_trip_preserves_regex_and_unmatched_entries(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "beasts.json"
            original = {
                "黒のモリガン": {"engName": "Black Mórrigan", "regex": "リガ", "chaosValue": "10"},
                "未取得": {"engName": "Unmatched", "regex": "未", "chaosValue": "7"},
            }
            updater.save_json_data(output, original)
            updater.update_prices(output, {"Black Morrigan": 12.5})
            actual = updater.load_json_data(output)
            self.assertEqual(actual["黒のモリガン"]["chaosValue"], "12.5")
            self.assertEqual(actual["黒のモリガン"]["regex"], "リガ")
            self.assertEqual(actual["未取得"], original["未取得"])
            self.assertTrue(output.read_bytes().endswith(b"\n"))
            self.assertEqual(json.loads(output.read_text(encoding="utf-8")), actual)

    def test_missing_source_fails_without_silently_replacing_the_data(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(FileNotFoundError):
                updater.load_json_data(Path(directory) / "missing.json")


if __name__ == "__main__":
    unittest.main()
