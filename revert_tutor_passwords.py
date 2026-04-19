import json
import os

file_path = os.path.join(os.getcwd(), 'platform_dataset.json')

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item.get('platform') == 'Tutor LMS':
        item['fields']['password'] = 'input[name="password"]'
        item['fields']['password_confirmation'] = 'input[name="password_confirmation"]'

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Reverted Tutor LMS password selectors in platform_dataset.json")
