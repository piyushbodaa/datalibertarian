#!/usr/bin/env python3
"""Sanitize a downloaded retailer HTML response before adding public evidence."""
import argparse
import json
from pathlib import Path

from evidence_safety import sanitize_html


def capture(input_path, output_path):
    if not output_path.name.endswith('.html.txt'):
        raise ValueError('Public HTML evidence must use the .html.txt suffix')
    published, metadata = sanitize_html(input_path.read_bytes())
    # Never silently overwrite an existing capture or an input download.
    if input_path.resolve() == output_path.resolve() or output_path.exists():
        raise ValueError('Choose a new output path; preserve existing observations')
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('xb') as target:
        target.write(published)
    return metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True, help='Private downloaded response outside public/')
    parser.add_argument('--output', type=Path, required=True, help='New public .html.txt evidence path')
    args = parser.parse_args()
    try:
        metadata = capture(args.input, args.output)
    except (ValueError, UnicodeError) as error:
        parser.exit(1, f'Capture rejected: {error}\n')
    print(json.dumps(metadata, indent=2))


if __name__ == '__main__':
    main()
