#!/usr/bin/env python3
"""Build every watch and nest each at its URL path.

    python3 babuwatch/build_all.py --out dist

writes dist/babuwatch/... — one watch since Copwatch India merged fully
under Babuwatch (2026-09-23). The layout the site serves.
Each watch builds into its own staging dir first; the merge refuses to let
one watch overwrite another's file. Stdlib only; run by `npm run build`.
"""
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import profiles                                                   # noqa: E402

ENGINE = os.path.join(HERE, "engine", "build.py")


def main():
    out = os.path.abspath(profiles.cli_arg("--out", os.path.join(HERE, "dist")))
    stage_root = tempfile.mkdtemp(prefix="watches-")
    owner = {}                       # output path -> watch that wrote it
    try:
        for slug in profiles.WATCHES:
            prof = profiles.load(slug)
            stage = os.path.join(stage_root, slug)
            print("== building %s (%s)" % (slug, prof["base"]), flush=True)
            subprocess.run([sys.executable, "-B", ENGINE, "--watch", slug,
                            "--out", stage], check=True)
            dest = os.path.join(out, prof["base"].strip("/"))
            for root, _dirs, files in os.walk(stage):
                for fn in files:
                    src = os.path.join(root, fn)
                    rel = os.path.relpath(src, stage)
                    dst = os.path.join(dest, rel)
                    if dst in owner:
                        sys.exit("BUILD REFUSED: %s writes %s, already "
                                 "written by %s"
                                 % (slug, os.path.relpath(dst, out),
                                    owner[dst]))
                    owner[dst] = slug
                    if fn.endswith((".html", ".md", ".txt", ".json",
                                    ".xml", ".js")):
                        with open(src, encoding="utf-8") as f:
                            if "@ROOT@" in f.read():
                                sys.exit("BUILD REFUSED: unresolved @ROOT@ "
                                         "link in %s/%s" % (slug, rel))
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    shutil.copyfile(src, dst)
            # cleanUrls serves /<base> from <base>.html: give every watch
            # root that sibling so /babuwatch and /babuwatch/copwatchindia
            # resolve without relying on directory-index behaviour.
            root_html = dest.rstrip("/") + ".html"
            if root_html in owner:
                sys.exit("BUILD REFUSED: %s root page collides with %s"
                         % (slug, owner[root_html]))
            owner[root_html] = slug
            shutil.copyfile(os.path.join(stage, "index.html"), root_html)
            print("== %s: %d files -> %s" % (
                slug, sum(1 for v in owner.values() if v == slug),
                os.path.relpath(dest, os.getcwd())), flush=True)
    finally:
        shutil.rmtree(stage_root, ignore_errors=True)


if __name__ == "__main__":
    main()
