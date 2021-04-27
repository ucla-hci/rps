

#  creating a local https server
# 
#  by xac@ucla.edu, v2.0 03/2021
#

import http.server
import socketserver
from sys import argv
import ssl

PORT = 8888

Handler = http.server.SimpleHTTPRequestHandler

if __name__ == "__main__":

    if len(argv) > 1:
        PORT = int(argv[1])

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("Serving at port", PORT)
        httpd.socket = ssl.wrap_socket(
        httpd.socket, certfile='./server.pem', server_side=True)
        httpd.serve_forever()