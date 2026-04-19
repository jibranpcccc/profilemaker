from http.server import HTTPServer, BaseHTTPRequestHandler
class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if '/register' in self.path:
            self.send_response(200)
            self.send_header('Content-type','text/html')
            self.end_headers()
            self.wfile.write(b"<!DOCTYPE html><html><head><title>Mock XenForo</title></head><body><form action='/register/submit' method='POST' id='regForm'><input name='username' type='text'><input name='email' type='text'><input name='password' type='password'><input name='pass2' id='pass2' type='password'><iframe src='https://www.google.com/recaptcha/api2/anchor?k=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'></iframe><input name='g-recaptcha-response' id='g-recaptcha-response'><button type='submit' id='signup_submit'>Register</button></form></body></html>")
        elif '/check_email' in self.path:
            self.send_response(200)
            self.send_header('Content-type','text/html')
            self.end_headers()
            self.wfile.write(b"Registration successful. Please click the link in your email to verify.")
        elif '/activate' in self.path:
            self.send_response(200)
            self.send_header('Content-type','text/html')
            self.end_headers()
            self.wfile.write(b"Account verified. <a href='/profile/testuser'>Go to Profile</a>")
        elif '/profile' in self.path:
            self.send_response(200)
            self.send_header('Content-type','text/html')
            self.end_headers()
            self.wfile.write(b"Public profile testuser.")
        else:
            self.send_response(404)
            self.end_headers()
            
    def do_POST(self):
        if '/register' in self.path:
            self.send_response(200)
            self.send_header('Content-type','text/html')
            self.end_headers()
            self.wfile.write(b"<script>window.location.href='/check_email';</script>")

server = HTTPServer(('127.0.0.1', 8080), SimpleHandler)
print('Hosting mock Xenforo on port 8080')
server.serve_forever()
