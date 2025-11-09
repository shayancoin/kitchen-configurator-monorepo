"""AI advisor service package."""

from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("ai-advisor")
except PackageNotFoundError:  # pragma: no cover
    __version__ = "0.0.0"

__all__ = ["__version__"]
