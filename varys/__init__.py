"""Varys — your DS assistant for Jupyter Notebook."""
import os.path as osp

try:
    from ._version import __version__
except ImportError:
    import importlib.metadata
    try:
        __version__ = importlib.metadata.version("varys")
    except importlib.metadata.PackageNotFoundError:
        __version__ = "0.0.0"

from .app import DSAssistantExtension


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "varys"}]


def _jupyter_server_extension_points():
    return [{"module": "varys", "app": DSAssistantExtension}]


def load_jupyter_server_extension(serverapp):
    """Load the Jupyter server extension (legacy support)."""
    extension = DSAssistantExtension()
    extension.serverapp = serverapp
    extension.initialize()
