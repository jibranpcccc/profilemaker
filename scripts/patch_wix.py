import json, os
path = os.path.abspath('platform_dataset.json')
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

wix_sites = [
    'haphong.edu.vn', 'holycrossconvent.edu.na', 'rosewood.edu.na',
    'woorips.vic.edu.au', 'orkhonschool.edu.mn', 'lasallesancristobal.edu.mx',
    'lanubedocente.21.edu.ar', 'tarauaca.ac.gov.br', 'centrotecnologico.edu.mx'
]

for domain in wix_sites:
    exists = False
    for x in data:
        if x['domain'] == domain:
            exists = True
            break
    if not exists:
        data.append({
            'platform': 'Wix',
            'domain': domain,
            'register_url': f'https://www.{domain}' if not domain.startswith('www') else f'https://{domain}',
            'pre_fill_actions': [
                '#loginText, [data-testid="login"], button:has-text("Log In"), button:has-text("Sign In")',
                'button[data-testid="signUp.switchToSignUp"], [data-testid="signUp"], button:has-text("Sign Up")'
            ],
            'fields': {
                'email': 'input[type="email"]',
                'password': 'input[type="password"]'
            },
            'save_button': 'button[data-testid="submit"], [data-testid="buttonElement"]',
            'profile_edit_url': f'https://www.{domain}/profile/{{username}}/profile' if not domain.startswith('www') else f'https://{domain}/profile/{{username}}/profile',
            'profile_fields': {
                'website': 'input[name="website"], input[type="url"]',
                'bio': 'textarea[name="bio"], textarea[name="about"]'
            },
            'email_verification': 'FALSE',
            'captcha': {
                'type': 'none',
                'sitekey': ''
            }
        })

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)
print(f'Added {len(wix_sites)} Wix sites to dataset')
