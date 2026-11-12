"""Release tag must name the version in metadata.json."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def release_error(tag: str, metadata: dict) -> str | None:
    version_name = metadata.get("version-name")
    version = metadata.get("version")
    if not isinstance(version, int) or isinstance(version, bool) or version < 1:
        return "metadata.json version must be an integer greater than zero"
    if not isinstance(version_name, str) or not version_name:
        return "metadata.json version-name is missing"
    if not tag.startswith("v") or tag[1:] != version_name:
        return f"tag {tag} does not match version-name {version_name}; expected v{version_name}"
    return None


def metadata() -> dict:
    return json.loads((ROOT / "metadata.json").read_text())


def main() -> None:
    import os
    tag = os.environ.get("RELEASE_TAG", "")
    error = release_error(tag, metadata())
    if error:
        raise SystemExit(error)


if __name__ == "__main__":
    main()
