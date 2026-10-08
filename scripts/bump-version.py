#!/usr/bin/env python3
"""Bump the plugin version when files that ship with the mod changed between two revisions."""

import argparse
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / ".claude-plugin" / "plugin.json"
SHIPPED = ("hooks/", "types/", ".claude-plugin/marketplace.json")


def bump_part(base: str, head: str) -> str | None:
    """Minor when a shipped file was added, patch for any other shipped change, None otherwise."""
    output = subprocess.run(
        ["git", "diff", "--name-status", base, head],
        cwd=ROOT, check=True, capture_output=True, text=True,
    ).stdout
    part = None
    for line in output.splitlines():
        status, path = line.split("\t", 1)[0], line.rsplit("\t", 1)[-1]
        if not path.startswith(SHIPPED):
            continue
        if status.startswith("A"):
            return "minor"
        part = "patch"
    return part


def bump(version: str, part: str) -> str:
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", version)
    if not match:
        raise ValueError(f"Cannot bump non-semver version: {version}")
    major, minor, patch = (int(value) for value in match.groups())
    return f"{major}.{minor + 1}.0" if part == "minor" else f"{major}.{minor}.{patch + 1}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--changed-from", required=True)
    parser.add_argument("--changed-to", default="HEAD")
    args = parser.parse_args()

    part = bump_part(args.changed_from, args.changed_to)
    if part is None:
        print("No shipped files changed; version unchanged.")
        return

    text = MANIFEST.read_text(encoding="utf-8")
    current = re.search(r'"version"\s*:\s*"([^"]+)"', text).group(1)
    updated = bump(current, part)
    MANIFEST.write_text(text.replace(f'"version": "{current}"', f'"version": "{updated}"', 1), encoding="utf-8")
    print(f"Bumped {current} -> {updated} ({part}).")


if __name__ == "__main__":
    main()
