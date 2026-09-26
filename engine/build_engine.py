"""Bundle the native engine into a standalone folder (engine/dist/mdify-engine) with PyInstaller."""

from pathlib import Path

import PyInstaller.__main__

HERE = Path(__file__).parent

PyInstaller.__main__.run([
    str(HERE / "mdify_engine.py"),
    "--noconfirm",
    "--clean",
    "--onedir",
    "--console",
    "--name", "mdify-engine",
    "--distpath", str(HERE / "dist"),
    "--workpath", str(HERE / "build"),
    "--specpath", str(HERE / "build"),
    "--collect-all", "markitdown",
    "--collect-all", "magika",
    "--collect-data", "pdfminer",
    "--copy-metadata", "markitdown",
    "--copy-metadata", "magika",
])
