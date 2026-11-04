#!/usr/bin/env python3
"""Local static preview with byte ranges, so native video seeking works."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re


class RangeHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def send_head(self):
        self.byte_range = None
        path = Path(self.translate_path(self.path))
        value = self.headers.get('Range', '')
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', value)
        if not match or not path.is_file():
            return super().send_head()
        stat = path.stat()
        modified = self.date_time_string(stat.st_mtime)
        if self.headers.get('If-Range', modified) != modified:
            return super().send_head()
        size = stat.st_size
        first, last = match.groups()
        start = int(first) if first else max(0, size - int(last or 0))
        end = min(int(last), size - 1) if first and last else size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        try:
            handle = path.open('rb')
        except OSError:
            self.send_error(404)
            return None
        self.byte_range = (start, end)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Last-Modified', modified)
        self.end_headers()
        return handle

    def copyfile(self, source, destination):
        try:
            if self.byte_range is None:
                return super().copyfile(source, destination)
            start, end = self.byte_range
            source.seek(start)
            remaining = end - start + 1
            while remaining:
                chunk = source.read(min(65536, remaining))
                if not chunk:
                    break
                destination.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # Browsers cancel obsolete ranges when the user seeks again.


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8876)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(RangeHandler, directory=str(root)))
    print(f'Local preview: http://127.0.0.1:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
