import requests

url = "https://geezek.com/webmail"
print(f"Checking {url}")
try:
    r = requests.get(url, allow_redirects=False, timeout=5)
    print(f"Status: {r.status_code}")
    if r.status_code in (301, 302, 303, 307, 308):
        print(f"Redirects to: {r.headers['Location']}")
except Exception as e:
    print(f"Error: {e}")
