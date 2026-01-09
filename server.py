#!/usr/bin/env python3
"""
Minimal HTTP server for resume-blastroid game and tests.

Routes:
  /       -> index.html (game)
  /tests  -> tests/tests.html (test runner)
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os


class GameServer(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Route /tests to tests/tests.html
        if self.path == '/tests' or self.path == '/tests/':
            self.path = '/tests/tests.html'
        # Route / to index.html
        elif self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

    def log_message(self, format, *args):
        # Color-coded logging
        status = args[1] if len(args) > 1 else ''
        if str(status).startswith('2'):
            color = '\033[92m'  # Green
        elif str(status).startswith('4'):
            color = '\033[93m'  # Yellow
        elif str(status).startswith('5'):
            color = '\033[91m'  # Red
        else:
            color = '\033[0m'   # Default
        reset = '\033[0m'
        print(f"{color}{self.address_string()} - {format % args}{reset}")


def main():
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    host = 'localhost'
    port = 8000

    server = HTTPServer((host, port), GameServer)

    print(f"\033[1m")
    print(f"  Resume-Blastroid Server")
    print(f"  =======================")
    print(f"\033[0m")
    print(f"  Game:  http://{host}:{port}/")
    print(f"  Tests: http://{host}:{port}/tests")
    print(f"")
    print(f"  Press Ctrl+C to stop")
    print(f"")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
        server.shutdown()


if __name__ == '__main__':
    main()
