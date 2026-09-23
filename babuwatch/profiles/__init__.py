"""Watch profiles: one per register the engine can build.

A profile is a module profiles/<slug>.py exporting PROFILE, a dict holding
everything site-specific: base path, names, which datasets to load, which
template folder to read, navigation, category vocabulary and every sentence
of copy the engine emits. The engine (engine/build.py) holds none of these.

WATCHES (below) is the registry: the order in which build_all.py builds the
watches and in which the header switcher lists them. To add a watch (e.g.
iaswatch): write profiles/iaswatch.py, add a data/<dir>/ and a
templates/<dir>/, then add the slug here. See babuwatch/README.md.
"""
import importlib
import sys

# Build order + switcher order. Owner decision 2026-09-23: Copwatch India
# is merged fully under Babuwatch — one watch, one nav, every record in a
# single URL space. Old /copwatchindia/* URLs redirect permanently
# (see vercel.json). Only slugs listed here are built.
WATCHES = ["babuwatch"]


def cli_arg(flag, default=None):
    """Value of `--flag value` or `--flag=value` from sys.argv."""
    argv = sys.argv[1:]
    for i, a in enumerate(argv):
        if a == flag and i + 1 < len(argv):
            return argv[i + 1]
        if a.startswith(flag + "="):
            return a.split("=", 1)[1]
    return default


def load(slug):
    if slug not in WATCHES:
        raise SystemExit("unknown watch %r (known: %s)"
                         % (slug, ", ".join(WATCHES)))
    prof = importlib.import_module("profiles." + slug).PROFILE
    prof.setdefault("slug", slug)
    return prof


def registry():
    """[{slug, name, short_name, base, parent, blurb}] for every watch."""
    out = []
    for slug in WATCHES:
        p = load(slug)
        out.append({"slug": slug, "name": p["site_name"],
                    "short_name": p["short_name"], "base": p["base"],
                    "parent": p.get("parent"),
                    "blurb": p.get("switcher_blurb", "")})
    return out
