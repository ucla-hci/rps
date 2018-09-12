#!/usr/bin/env python

###
###	old insecure server
###

# from sys import argv
# import subprocess

# if __name__ == "__main__":
# 	if len(argv) < 2:
# 		print 'usage: ./serverup.py <port_number>'
# 		quit()

# 	subprocess.call('nohup python -mSimpleHTTPServer ' + argv[1] + ' > /dev/null 2>&1 &', shell=True)

###
###	new secure server
###

from sys import argv
import BaseHTTPServer, SimpleHTTPServer
import ssl
import subprocess

httpd = BaseHTTPServer.HTTPServer(('0.0.0.0', int(argv[1])),
                                  SimpleHTTPServer.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(
    httpd.socket, certfile='./server.pem', server_side=True)
httpd.serve_forever()