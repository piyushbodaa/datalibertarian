#!/usr/bin/env python3
"""Internal link checker for the built watches. Exit 1 on any broken link.

    python3 babuwatch/engine/check_links.py --root dist [--scope /babuwatch]

--root is the directory served at the site root (build_all.py's --out).
Every root-relative href/src/action in the HTML under <root><scope> must
resolve to a file under <root>, the way Vercel serves it (cleanUrls: /x
serves x.html or x/index.html). Links outside the scope (e.g. the rest of
datalibertarian.in) are counted but not resolved, since they may belong to
another build step.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import profiles                                                   # noqa: E402

HREF = re.compile(r'''(?:href|src|action)="(/[^"#?]*)''')


def resolves(root, urlpath):
    rel = urlpath.strip("/")
    full = os.path.join(root, rel)
    if rel == "":
        return os.path.isfile(os.path.join(root, "index.html"))
    if os.path.isfile(full) or os.path.isfile(full + ".html"):
        return True
    return os.path.isfile(os.path.join(full, "index.html"))


def main():
    root = os.path.abspath(profiles.cli_arg("--root", "dist"))
    scope = "/" + profiles.cli_arg("--scope", "/babuwatch").strip("/")
    errors, pages, outside = [], 0, set()
    start = os.path.join(root, scope.strip("/"))
    for dirpath, _dirs, files in os.walk(start):
        for fn in files:
            if not fn.endswith(".html"):
                continue
            pages += 1
            p = os.path.join(dirpath, fn)
            with open(p, encoding="utf-8") as f:
                html = f.read()
            for m in HREF.finditer(html):
                u = m.group(1)
                if u.startswith("//"):
                    continue
                if not (u == scope or u.startswith(scope + "/")):
                    outside.add(u)
                    continue
                if not resolves(root, u):
                    errors.append("%s -> %s" % (os.path.relpath(p, root), u))
    print("checked %d pages under %s: %d broken internal links; "
          "%d distinct links outside the scope (not checked): %s"
          % (pages, scope, len(errors), len(outside),
             ", ".join(sorted(outside)[:10])))
    for e in errors[:50]:
        print("BROKEN:", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
