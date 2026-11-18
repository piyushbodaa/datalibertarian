"""Regression tests for capture, admission and publication of retailer evidence."""
from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from capture_evidence import capture
from check_public_secrets import scan, source_paths
from evidence_safety import MARKER, key_count, require_safe, sanitize_html
from verify_independent import ROOT, verify_archive, visible_text

# A synthetic shape only; deliberately assembled so source scans need no allowlist.
KEY = ('AI' + 'za' + '0' * 34 + '_').encode()


class EvidenceSafetyTests(unittest.TestCase):
    def page(self, key=KEY):
        return b'<html><script>config="' + key + b'";</script><p>Price Rs. 449</p></html>'

    def test_redaction_preserves_visible_prices_and_original_provenance(self):
        raw = self.page()
        clean, metadata = sanitize_html(raw)
        self.assertEqual(clean, self.page(MARKER))
        self.assertEqual(visible_text(raw), visible_text(clean))
        self.assertEqual(metadata['sha256'], sha256(clean).hexdigest())
        self.assertEqual(metadata['sanitization']['originalSha256'], sha256(raw).hexdigest())
        self.assertEqual(metadata['sanitization']['originalBytes'], len(raw))
        self.assertEqual(metadata['sanitization']['redactions'], 1)
        self.assertEqual(metadata['bytes'], len(clean))
        self.assertEqual(metadata['evidenceType'], 'sanitized-fetched-html')
        require_safe(clean)

    def test_escape_forms_are_removed_without_rewriting_other_bytes(self):
        forms = [
            b''.join(f'&#{x};'.encode() for x in KEY),
            b''.join(f'&#x{x:02x};'.encode() for x in KEY),
            b''.join(f'%{x:02X}'.encode() for x in KEY),
            b''.join(f'\\u{x:04x}'.encode() for x in KEY),
            b''.join(f'\\x{x:02x}'.encode() for x in KEY),
            b''.join(f'\\u{{{x:x}}}'.encode() for x in KEY),
            KEY[:-1] + b'&lowbar;',
            KEY[:-1] + b'&UnderBar;',
            b''.join(f'%{x:02X}'.encode() for x in KEY).replace(b'%', b'&amp;percnt;'),
        ]
        for encoded in forms:
            with self.subTest(form=forms.index(encoded)):
                self.assertEqual(key_count(self.page(encoded)), 1)
                clean, record = sanitize_html(self.page(encoded))
                self.assertEqual(clean, self.page(MARKER))
                self.assertEqual(record['sanitization']['redactions'], 1)

    def test_multiple_occurrences_and_metadata_are_screened(self):
        raw = self.page(KEY + b' ' + KEY)
        self.assertEqual(key_count(raw), 2)
        clean, record = sanitize_html(raw)
        self.assertEqual(record['sanitization']['redactions'], 2)
        require_safe(clean)
        for raw in [b'https://example.test/?key=' + KEY, json.dumps({'url': KEY.decode()}).encode()]:
            with self.assertRaisesRegex(ValueError, 'value withheld'):
                require_safe(raw)

    def test_utf16_candidates_are_rejected(self):
        self.assertEqual(key_count(KEY.decode().encode('utf-16')), 1)

    def test_clean_capture_preserves_exact_response_including_unpaired_escape(self):
        raw = self.page(b'ordinary') + b'<!-- \\ud800 &amp; text -->'
        with tempfile.TemporaryDirectory() as directory:
            source, output = Path(directory) / 'input', Path(directory) / 'safe.html.txt'
            source.write_bytes(raw)
            record = capture(source, output)
            self.assertEqual(output.read_bytes(), raw)
            self.assertEqual(record['evidenceType'], 'complete-fetched-html')
            self.assertNotIn('sanitization', record)
            with self.assertRaisesRegex(ValueError, 'new output'):
                capture(source, output)

    def test_capture_never_publishes_original_secret_or_an_active_html_suffix(self):
        with tempfile.TemporaryDirectory() as directory:
            source, output = Path(directory) / 'input', Path(directory) / 'public' / 'safe.html.txt'
            source.write_bytes(self.page())
            record = capture(source, output)
            self.assertEqual(key_count(output.read_bytes()), 0)
            self.assertEqual(record['sanitization']['redactions'], 1)
            self.assertEqual(source.read_bytes(), self.page())
            with self.assertRaisesRegex(ValueError, 'suffix'):
                capture(source, output.with_suffix(''))

    def test_admission_rejects_key_even_with_consistent_new_checksum(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            file = root / 'public/data/inflation/sources/independent/injected.html.txt'
            file.parent.mkdir(parents=True)
            raw = self.page()
            file.write_bytes(raw)
            source = {'archive': '/data/inflation/sources/independent/injected.html.txt',
                      'sha256': sha256(raw).hexdigest(), 'bytes': len(raw),
                      'evidenceType': 'complete-fetched-html'}
            with self.assertRaisesRegex(ValueError, 'value withheld'):
                verify_archive(source, root)

    def test_sanitized_captures_cannot_lose_or_mislabel_provenance(self):
        data = json.loads((ROOT / 'src/data/inflation/independent-quotes.json').read_text())
        source = next(s for s in data['sources'] if s['id'] == 'ikea-marius')
        for mutate, message in [
            (lambda s: s.pop('sanitization'), 'known transformation'),
            (lambda s: s.update(evidenceType='complete-fetched-html'), 'must not be labelled'),
            (lambda s: s['sanitization'].update(redactions=2), 'redaction count'),
            (lambda s: s['sanitization'].update(originalSha256=s['sha256']), 'original response hash'),
        ]:
            changed = deepcopy(source)
            mutate(changed)
            with self.assertRaisesRegex(ValueError, message):
                verify_archive(changed, ROOT)

    def test_orphan_ignored_public_files_and_generated_copies_cannot_bypass_scan(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(['git', 'init', '-q', str(root)], check=True)
            (root / '.gitignore').write_text('*.dat\ndist/\n')
            public = root / 'public'
            public.mkdir()
            (public / 'orphan.dat').write_bytes(self.page())
            (root / 'metadata.json').write_bytes(b'{"url":"' + KEY + b'"}')
            _, problems = scan(source_paths(root), root)
            self.assertEqual({p for p, _ in problems}, {'public/orphan.dat', 'metadata.json'})
            dist = root / 'dist'
            dist.mkdir()
            (dist / 'stale.txt').write_bytes(KEY)
            self.assertEqual(len(scan(sorted(dist.rglob('*')), root)[1]), 1)


if __name__ == '__main__':
    unittest.main()
