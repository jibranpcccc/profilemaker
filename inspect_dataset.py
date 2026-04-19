import json, os

# Check platform_dataset.json
dataset_path = os.path.join(os.path.dirname(__file__), 'src', 'ProfileSubmissionAssistant', 'platform_dataset.json')
if not os.path.exists(dataset_path):
    dataset_path = os.path.join(os.path.dirname(__file__), 'platform_dataset.json')

with open(dataset_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

sites = data.get('sites', data) if isinstance(data, dict) else data
if isinstance(data, dict) and 'sites' not in data:
    # Maybe it's a flat dict of domain -> config
    sites = list(data.keys())
    print(f"Total domains in dataset (flat dict): {len(sites)}")
    for s in sites:
        print(f"  {s}")
else:
    if isinstance(sites, list):
        print(f"Total domains in dataset: {len(sites)}")
        for s in sites:
            domain = s.get('domain', s.get('name', str(s)))
            print(f"  {domain}")
    else:
        print(f"Sites type is: {type(sites)}")
        print(json.dumps(list(sites.items())[:5], indent=2))
