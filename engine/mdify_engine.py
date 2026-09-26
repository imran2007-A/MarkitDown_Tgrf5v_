"""Mdify native engine: newline-delimited JSON over stdin/stdout, backed by Microsoft MarkItDown."""

import json
import sys

from markitdown import MarkItDown


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stdin.reconfigure(encoding="utf-8")
    md = MarkItDown(enable_plugins=False)
    print(json.dumps({"ready": True}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        req_id = None
        try:
            req = json.loads(line)
            req_id = req.get("id")
            result = md.convert(req["path"])
            resp = {"id": req_id, "markdown": result.markdown}
        except Exception as exc:  # report every failure back to the app instead of crashing
            resp = {"id": req_id, "error": f"{type(exc).__name__}: {exc}"}
        print(json.dumps(resp, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
