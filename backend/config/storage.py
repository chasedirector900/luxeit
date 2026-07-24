"""Static-files storage for production.

WhiteNoise's manifest storage rewrites and hashes every asset and, being strict,
fails the whole build if a CSS/JS file references a file that isn't shipped.
Some third-party packages (e.g. Jazzmin's bootstrap.bundle.min.js) point at a
`.map` source map that isn't included — a harmless dev-only reference. This
subclass keeps all the compression + cache-busting benefits but leaves such a
missing reference untouched instead of aborting `collectstatic`.
"""
from whitenoise.storage import CompressedManifestStaticFilesStorage


class ForgivingManifestStaticFilesStorage(CompressedManifestStaticFilesStorage):
    # Don't 500 at request time if a hashed name is missing from the manifest.
    manifest_strict = False

    def hashed_name(self, name, content=None, filename=None):
        try:
            return super().hashed_name(name, content, filename)
        except ValueError:
            # A referenced file (typically a `.map`) isn't present. Keep the
            # original reference rather than failing the build over it.
            return name
