import urllib.request
import urllib.parse
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

def post_json(url, payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        return None

print('1. Generating Persona...')
persona_res = post_json('http://localhost:3001/api/personas', {'action': 'generate', 'niche': 'Web Development', 'websiteUrl': 'https://devguy.com'})
if not persona_res or 'generated' not in persona_res:
    print('Failed to generate persona')
    exit()
persona = persona_res['generated']
print(f" - Persona generated: {persona['Name']} | {persona['Email']}")

print('2. Saving Persona...')
save_res = post_json('http://localhost:3001/api/personas', {'action': 'save', 'persona': persona})
persona_id = save_res['id']
print(f" - Persona saved with ID {persona_id}")

print('3. Creating Campaign with 5 sites...')
camp_res = post_json('http://localhost:3001/api/campaigns', {
    'action': 'create',
    'name': 'Auto Test Valid Platforms',
    'personaId': persona_id,
    'targetSites': [1285, 1289, 1286, 1288, 1281]
})
campaign_id = camp_res['campaignId']
print(f" - Campaign created with ID {campaign_id}")

print('4. Starting execution...')
run_res = post_json('http://localhost:3001/api/run', {
    'action': 'start',
    'campaignId': campaign_id,
    'executionMode': 'all',
    'threadCount': 2
})
print(" - Execution started!")
