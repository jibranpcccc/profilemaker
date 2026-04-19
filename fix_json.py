import json
import os

file_path = os.path.join(os.getcwd(), 'platform_dataset.json')

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if 'profile_edit_url' in item:
        item['profile_edit_url'] = item['profile_edit_url'].replace('dashboard/settings/social-profile/', 'dashboard/settings/')

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Updated profile_edit_url in platform_dataset.json")
