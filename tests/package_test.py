import json
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_package_matches_the_extension_sources():
    out = ROOT / "dist" / "package-test"
    out.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["python3", str(ROOT / "scripts" / "package_extension.py"), str(out)],
        check=True,
        cwd=ROOT,
    )
    archives = list(out.glob("*.shell-extension.zip"))
    assert len(archives) == 1, archives
    with zipfile.ZipFile(archives[0]) as archive:
        names = set(archive.namelist())
        metadata = json.loads(archive.read("metadata.json"))
    assert names == {
        "metadata.json",
        "extension.js",
        "prefs.js",
        "policy.js",
        "effect.js",
        "corners.js",
        "LICENSE",
        "schemas/org.gnome.shell.extensions.rounded-webapp-icons.gschema.xml",
    }
    assert metadata["uuid"] == "rounded-webapp-icons@netsvetaev.dev"
    assert archives[0].name == "rounded-webapp-icons@netsvetaev.dev.shell-extension.zip"
    archives[0].unlink()


if __name__ == "__main__":
    test_package_matches_the_extension_sources()
    print("PASS package contains the extension sources and nothing else")
