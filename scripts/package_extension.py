#!/usr/bin/env python3
"""Build the zip that extensions.gnome.org expects.

The member list matches `gnome-extensions pack` for this extension:
sources at the archive root, schema under schemas/, no tests or README.
"""

import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEMBERS = (
    "metadata.json",
    "extension.js",
    "prefs.js",
    "policy.js",
    "effect.js",
    "corners.js",
    "LICENSE",
    "schemas/org.gnome.shell.extensions.rounded-webapp-icons.gschema.xml",
)


def package(output_dir: Path) -> Path:
    metadata = json.loads((ROOT / "metadata.json").read_text())
    uuid = metadata["uuid"]
    output_dir.mkdir(parents=True, exist_ok=True)
    archive_path = output_dir / f"{uuid}.shell-extension.zip"
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for member in MEMBERS:
            source = ROOT / member
            if not source.is_file():
                raise SystemExit(f"missing {member}")
            archive.write(source, member)
    return archive_path


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist"
    print(package(output))


if __name__ == "__main__":
    main()
