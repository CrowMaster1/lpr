from http.server import SimpleHTTPRequestHandler, HTTPServer
import os
import argparse
import functools

class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"{self.log_date_time_string()} - {self.address_string()} - {format % args}")

    def translate_path(self, path):
        if '?' in path:
            path = path.split('?', 1)[0]
        return super().translate_path(path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Start a simple HTTP server with caching disabled.")
    parser.add_argument('--port', type=int, default=8000, help='Port to run the server on (default: 8000)')
    parser.add_argument('--directory', type=str, default='.', help='Directory to serve (default: current directory)')
    args = parser.parse_args()

    server_address = ('', args.port)

    # Use functools.partial to create a handler with the directory argument pre-filled.
    Handler = functools.partial(NoCacheHTTPRequestHandler, directory=args.directory)

    httpd = HTTPServer(server_address, Handler)

    print(f"Serving files from '{os.path.abspath(args.directory)}' at http://localhost:{args.port}")
    print("Cache-Control headers are set to prevent caching.")
    print("For best results, also disable your browser's cache in the Network tab of the DevTools.")
    print("Press Ctrl+C to stop the server.")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()
