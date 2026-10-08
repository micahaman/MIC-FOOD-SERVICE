"""Local preview server that mirrors production clean URLs (/about -> about.html)."""
import http.server
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def production_csp():
    """The Content-Security-Policy from .htaccess, so local testing matches the live site."""
    try:
        with open(os.path.join(ROOT, ".htaccess"), encoding="utf-8") as f:
            match = re.search(r'Header always set (Content-Security-Policy(?:-Report-Only)?) "([^"]+)"', f.read())
    except OSError:
        return None
    if not match:
        return None
    # the preview runs on plain http://localhost, where upgrading requests would break loading
    directives = [d for d in match.group(2).split(";") if d.strip() != "upgrade-insecure-requests"]
    return match.group(1), ";".join(directives)


class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        csp = production_csp()
        if csp:
            self.send_header(*csp)
        super().end_headers()

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

    def send_error(self, code, message=None, explain=None):
        # Mirror production's ErrorDocument: missing pages get the branded 404
        page = os.path.join(ROOT, "404.html")
        if code == 404 and os.path.isfile(page):
            with open(page, "rb") as f:
                body = f.read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    http.server.ThreadingHTTPServer(("", port), CleanUrlHandler).serve_forever()
