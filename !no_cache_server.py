from http.server import SimpleHTTPRequestHandler, HTTPServer
import time
from urllib.parse import urljoin

class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    cache_buster = None

    def end_headers(self):
        # Add headers to ensure no caching
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Improved logging with timestamps and client address
        print(f"{self.log_date_time_string()} - {self.address_string()} - {format % args}")

    def translate_path(self, path):
        # Remove the cache-busting query parameter before finding the file
        if '?' in path:
            path = path.split('?', 1)[0]
        return super().translate_path(path)

    def do_GET(self):
        # Log the request
        self.log_message("Serving file: %s", self.path)
        super().do_GET()

    @classmethod
    def generate_cache_buster(cls):
        # Generate a cache-busting parameter based on the current timestamp
        cls.cache_buster = f"?v={int(time.time())}"

    @classmethod
    def print_refreshed_files(cls, directory):
        # List all files being served with the cache-busting query parameter
        for root, _, files in os.walk(directory):
            for file in files:
                file_path = urljoin('/', os.path.relpath(os.path.join(root, file), directory))
                print(f"Refreshed URL: {file_path}{cls.cache_buster}")


def run_server(port=8000, directory='.'):
    server_address = ('', port)
    NoCacheHTTPRequestHandler.generate_cache_buster()
    NoCacheHTTPRequestHandler.print_refreshed_files(directory)

    httpd = HTTPServer(server_address, NoCacheHTTPRequestHandler)
    print(f"Serving files at http://localhost:{port}")
    print("Cache is cleared using cache-busting. Reload the browser to see updated content.")
    print("Press Ctrl+C to stop the server.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()


if __name__ == "__main__":
    import argparse
    import os

    parser = argparse.ArgumentParser(description="Start a simple HTTP server with caching disabled.")
    parser.add_argument('--port', type=int, default=8000, help='Port to run the server on (default: 8000)')
    parser.add_argument('--directory', type=str, default='.', help='Directory to serve (default: current directory)')
    args = parser.parse_args()

    os.chdir(args.directory)
    run_server(port=args.port, directory=args.directory)
