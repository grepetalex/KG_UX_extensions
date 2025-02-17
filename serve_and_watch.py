import http.server
import socketserver
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import threading

DIRECTORY_TO_WATCH = "F:/Dev/KG_Goodies"
PORT = 8080

# HTTP Server setup
Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)
httpd.allow_reuse_address = True

# File change handler
class ChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        print(f"\nFile changed: {event.src_path}. Refresh your browser!")

def start_server():
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()

# Start HTTP server in a thread
server_thread = threading.Thread(target=start_server)
server_thread.daemon = True
server_thread.start()

# Start file watcher
observer = Observer()
observer.schedule(ChangeHandler(), DIRECTORY_TO_WATCH, recursive=True)
observer.start()

try:
    while True:
        pass
except KeyboardInterrupt:
    httpd.shutdown()
    observer.stop()
    observer.join()