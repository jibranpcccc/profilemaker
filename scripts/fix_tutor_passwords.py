import json
import os

file_path = os.path.join(os.getcwd(), 'platform_dataset.json')

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item.get('platform') == 'Tutor LMS':
        item['fields']['password'] = 'form:not(#loginform) input[name="password"]'
        item['fields']['password_confirmation'] = 'form:not(#loginform) input[name="password_confirmation"]'
        
        # We also rename password_confirm to password_confirmation for consistency if it exists
        if 'password_confirm' in item['fields']:
            del item['fields']['password_confirm']

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Updated Tutor LMS password selectors in platform_dataset.json")
