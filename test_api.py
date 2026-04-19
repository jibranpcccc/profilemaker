import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Test 2Captcha
try:
    print('Testing 2Captcha API...')
    req = urllib.request.Request('http://2captcha.com/res.php?key=234941760330b5686cce13e55d2f60a0&action=getbalance&json=1')
    res = urllib.request.urlopen(req)
    balance_info = json.loads(res.read())
    if balance_info.get('status') == 1:
        print(f"✅ 2Captcha OK! Balance: ${balance_info.get('request')}")
    else:
        print(f"❌ 2Captcha Error: {balance_info}")
except Exception as e:
    print(f"❌ 2Captcha Exception: {e}")

# 2. Test DeepSeek
try:
    print('\nTesting DeepSeek API...')
    data = {'model': 'deepseek-chat', 'messages': [{'role': 'user', 'content': 'Hello, are you connected? Please reply with just \"Yes\".'}], 'max_tokens': 10}
    # Some older endpoints might use /v1/chat/completions or /chat/completions depending on deepseek API docs
    req = urllib.request.Request('https://api.deepseek.com/chat/completions', data=json.dumps(data).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer sk-d72ecbf560c24654a342a424a2d73747'})
    res = urllib.request.urlopen(req)
    ai_info = json.loads(res.read())
    reply = ai_info['choices'][0]['message']['content'].strip()
    print(f"✅ DeepSeek OK! Reply: {reply}")
except Exception as e:
    print(f"❌ DeepSeek Exception: {e}")

