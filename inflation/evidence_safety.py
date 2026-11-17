"""Google API key screening for public evidence; never log matched values.

Recognizes literal keys and HTML entity, percent, JSON Unicode and JS hex
escapes, including nested combinations. This is not a general secret detector.
"""
from hashlib import sha256
from html import unescape
import re

GOOGLE_KEY = re.compile(r'AIza[0-9A-Za-z_-]{35}')
ESCAPE = re.compile(r'\\u\{[0-9a-fA-F]{1,6}\}|\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}|%[0-9a-fA-F]{2}|&#(?:[xX][0-9a-fA-F]+|[0-9]+);?|&[a-zA-Z][a-zA-Z0-9]*;?')
MARKER = b'[REDACTED_GOOGLE_API_KEY]'
METHOD = 'google-api-key-redaction-v1'


def decode_escape(match):
    token = match.group()
    if token.startswith('\\u{'):
        return chr(int(token[3:-1], 16))
    if token.startswith('\\'):
        return chr(int(token[2:], 16))
    if token.startswith('%'):
        return chr(int(token[1:], 16))
    return unescape(token)


def normalized(raw):
    # latin1 keeps a one-to-one byte view, including otherwise non-UTF8 assets.
    text = raw.decode('latin1')
    for _ in range(8):
        decoded = ESCAPE.sub(decode_escape, text)
        if decoded == text:
            return text
        text = decoded
    if ESCAPE.sub(decode_escape, text) != text:
        raise ValueError('Public evidence exceeds the supported escape nesting limit')
    return text


def key_count(raw):
    count = len(GOOGLE_KEY.findall(normalized(raw)))
    if raw.startswith((b'\xff\xfe', b'\xfe\xff')):
        # Cover text artifacts saved as UTF16 as well as ordinary UTF8 bytes.
        count += len(GOOGLE_KEY.findall(normalized(raw.decode('utf-16').encode('utf-8'))))
    return count


def require_safe(raw):
    if key_count(raw):
        raise ValueError('Google API key candidate in public evidence (value withheld)')


def sanitize_html(raw):
    """Return sanitized bytes and metadata, preserving all other original bytes."""
    raw.decode('utf-8-sig')  # Public HTML evidence has always required UTF8.
    if b'<html' not in raw.lower():
        raise ValueError('Expected a complete UTF8 HTML response')
    original = {'originalSha256': sha256(raw).hexdigest(), 'originalBytes': len(raw)}
    text = normalized(raw)
    matches = list(GOOGLE_KEY.finditer(text))
    spans = []
    if matches:
        # Map decoded characters back to the exact byte ranges in the response.
        view = raw.decode('latin1')
        starts, ends = list(range(len(view))), list(range(1, len(view) + 1))
        for _ in range(8):
            parts, next_starts, next_ends, last = [], [], [], 0
            for escape in ESCAPE.finditer(view):
                parts.append(view[last:escape.start()])
                next_starts.extend(starts[last:escape.start()])
                next_ends.extend(ends[last:escape.start()])
                replacement = decode_escape(escape)
                parts.append(replacement)
                next_starts.extend([starts[escape.start()]] * len(replacement))
                next_ends.extend([ends[escape.end() - 1]] * len(replacement))
                last = escape.end()
            parts.append(view[last:])
            next_starts.extend(starts[last:])
            next_ends.extend(ends[last:])
            decoded = ''.join(parts)
            if decoded == view:
                break
            view, starts, ends = decoded, next_starts, next_ends
        for match in GOOGLE_KEY.finditer(view):
            span = (starts[match.start()], ends[match.end() - 1])
            if spans and span[0] < spans[-1][1]:
                spans[-1] = (spans[-1][0], max(spans[-1][1], span[1]))
            else:
                spans.append(span)
    published = raw
    for start, end in reversed(spans):
        published = published[:start] + MARKER + published[end:]
    require_safe(published)
    metadata = {
        'sha256': sha256(published).hexdigest(), 'bytes': len(published),
        'evidenceType': 'sanitized-fetched-html' if spans else 'complete-fetched-html',
    }
    if spans:
        metadata['sanitization'] = {**original, 'method': METHOD, 'redactions': len(spans)}
    return published, metadata
