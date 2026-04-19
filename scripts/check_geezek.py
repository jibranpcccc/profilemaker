import requests
import socket

def check(url):
    try:
        r = requests.get(url, timeout=5)
        print(f"{url} -> {r.status_code}")
    except Exception as e:
        print(f"{url} -> Error: {e}")

hostname = "geezek.com"
print("DNS Result:", socket.gethostbyname(hostname))
check("https://geezek.com")
check("https://geezek.com:2096")
check("http://webmail.geezek.com")
check("https://webmail.geezek.com")
