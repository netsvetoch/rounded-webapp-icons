import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.release_check import release_error

metadata = {"version": 1, "version-name": "1.0.0"}
assert release_error("v1.0.0", metadata) is None
assert release_error("v1.0.1", metadata) is not None
assert release_error("1.0.0", metadata) is not None
assert release_error("v1.0.0", {"version": 0, "version-name": "1.0.0"}) is not None
assert release_error("v1.0.0", {"version": True, "version-name": "1.0.0"}) is not None
print("PASS a release tag must match version-name")
