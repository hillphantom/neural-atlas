"""Local-only static preview. Does not launch or control any AI services."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
if __name__ == '__main__':
    root = Path(__file__).resolve().parent
    print('Maker Node: http://127.0.0.1:4182/app/')
    print('Your events: http://127.0.0.1:4182/app/?source=external')
    print('Local PC only. Ctrl+C to stop.')
    ThreadingHTTPServer(('127.0.0.1', 4182), partial(SimpleHTTPRequestHandler, directory=str(root))).serve_forever()
