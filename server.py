#!/usr/bin/env python3
"""Local development server for CDSU with zero caching and clean-URL support."""
import http.server
import os
import socketserver
import sys
from urllib.parse import urlsplit, urlunsplit

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class CDSURequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        # Strip conditional cache headers so the browser always receives fresh 200 OK responses
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        if "If-None-Match" in self.headers:
            del self.headers["If-None-Match"]

        parts = urlsplit(self.path)
        clean_path = parts.path.rstrip("/")
        if clean_path and not os.path.splitext(clean_path)[1]:
            candidate = os.path.join(ROOT, clean_path.lstrip("/") + ".html")
            if os.path.isfile(candidate):
                self.path = urlunsplit(("", "", clean_path + ".html", parts.query, parts.fragment))

        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableTCPServer(("0.0.0.0", PORT), CDSURequestHandler) as httpd:
        print(f"Serving CDSU on http://localhost:{PORT} (no-cache enabled) ...", flush=True)
        httpd.serve_forever()
