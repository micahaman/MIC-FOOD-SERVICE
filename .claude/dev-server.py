"""Local preview server that mirrors production clean URLs (/about -> about.html)."""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if path.endswith(".html") and path != "/index.html":
            self.send_response(301)
            self.send_header("Location", path[:-5] + self.path[len(path):])
            self.end_headers()
            return None
        if path != "/" and "." not in os.path.basename(path):
            candidate = os.path.join(ROOT, path.lstrip("/") + ".html")
            if os.path.isfile(candidate):
                self.path = path + ".html" + self.path[len(path):]
        return super().send_head()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    http.server.ThreadingHTTPServer(("", port), CleanUrlHandler).serve_forever()
