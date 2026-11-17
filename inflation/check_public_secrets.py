#!/usr/bin/env python3
"""Fail publication on Google API key candidates; report paths/counts, never values."""
import argparse
from pathlib import Path
import subprocess
import sys

from evidence_safety import key_count

ROOT = Path(__file__).resolve().parents[1]


def source_paths(root):
    names = subprocess.check_output(
        ['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd=root,
    ).decode().split('\0')
    paths = {root / name for name in names if name}
    # Public inputs are copied by Vite even when ignored or absent from manifests.
    paths.update((root / 'public').rglob('*'))
    return sorted(paths)


def scan(paths, root):
    problems, checked = [], 0
    for path in paths:
        if path.is_symlink():
            problems.append((str(path.relative_to(root)), 'symlink requires review'))
        elif path.is_file():
            checked += 1
            try:
                count = key_count(path.read_bytes())
                if count:
                    problems.append((str(path.relative_to(root)), f'{count} Google API key candidate(s)'))
            except (ValueError, UnicodeError):
                problems.append((str(path.relative_to(root)), 'unreadable encoded evidence'))
    return checked, problems


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', action='store_true', help='Scan the complete built publication directory')
    args = parser.parse_args()
    directory = ROOT / 'dist'
    if args.dist and not directory.is_dir():
        parser.exit(1, 'Public secret scan failed: dist is missing\n')
    checked, problems = scan(sorted(directory.rglob('*')) if args.dist else source_paths(ROOT), ROOT)
    for path, reason in problems:
        print(f'{path}: {reason}; values withheld', file=sys.stderr)
    print(f'Public secret scan: {checked} files checked; {len(problems)} unsafe file(s).')
    return 1 if problems else 0


if __name__ == '__main__':
    raise SystemExit(main())
