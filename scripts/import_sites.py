import sqlite3
import os
import json
from urllib.parse import urlparse

# User provided URLs
raw_urls = """
https://www.haphong.edu.vn/profile/spencetygbray81811/profile
https://holycrossconvent.edu.na/profile/knudsenygsditlevsen74318/profile
https://www.rosewood.edu.na/profile/stantonmjihoffman70478/profile
https://www.woorips.vic.edu.au/profile/barefootikpmunn28258/profile
https://www.orkhonschool.edu.mn/profile/skyttepmhknapp75031/profile
https://www.lasallesancristobal.edu.mx/profile/tanfnwgregory72545/profile
https://www.lanubedocente.21.edu.ar/profile/kaspersenswuself97122/profile
http://pandora.nla.gov.au/external.html?link=https://megawin188.id/
https://www.tarauaca.ac.gov.br/profile/hutchinsonmbtpatrick77799/profile
https://www.sarkariresult.education/profile/lanodal10536112/profile
https://ensp.edu.mx/members/megawin1888/activity/mentions/
https://wiki.ling.washington.edu/bin/view/Main/Megawin188Megawin188
https://www.centrotecnologico.edu.mx/profile/rimemo875449951/profile
http://www.stes.tyc.edu.tw/xoops/modules/profile/userinfo.php?uid=3938075
https://institutocrecer.edu.co/profile/megawin188/
https://aiti.edu.vn/members/megawin188.42239/
https://edu.learningsuite.id/profile/megawin188/
https://ensp.edu.mx/members/megawin18888/
https://learndash.aula.edu.pe/miembros/megawin188/activity/
https://academy.edutic.id/profile/megawin188/
https://jobs.lifewest.edu/employer/vikot60629/?v=1cd3c693132f
https://bbiny.edu/profile/megawin188
http://pibelearning.gov.bd/profile/megawin188
http://blac.edu.pl/profile/megawin188
https://academia.sanpablo.edu.ec/profile/megawin188
"""

# 1. Clean up and get base domains
domains_set = set()
sites_to_add = []

for line in raw_urls.strip().split('\n'):
    url = line.strip()
    if not url: continue
    
    # Handle the pandora redirect one
    if 'pandora.nla.gov.au' in url:
        parsed = urlparse('http://pandora.nla.gov.au')
    else:
        parsed = urlparse(url)
    
    domain = parsed.netloc
    
    if domain not in domains_set:
        domains_set.add(domain)
        base_url = f"{parsed.scheme}://{domain}"
        sites_to_add.append({'SiteName': domain, 'SignupUrl': base_url})

# 2. Add them to DB
db_path = os.path.join(os.environ['LOCALAPPDATA'], 'ProfileSubmissionAssistant', 'data.db')
db = sqlite3.connect(db_path)
c = db.cursor()

# Wipe old data related to sites
print("Wiping old sites...")
c.execute("DELETE FROM Proofs")
c.execute("DELETE FROM SiteTasks")
c.execute("DELETE FROM Sites")

# Check if Projects table exists, ensure Default project is there
c.execute("SELECT COUNT(*) FROM Projects")
if c.fetchone()[0] == 0:
    c.execute("INSERT INTO Projects (Id, Name, BrandName, Niche, WebsiteUrl) VALUES (1, 'DefaultBrand', 'DefaultBrand', 'SEO', 'https://example.com')")

print(f"Adding {len(sites_to_add)} unique sites...")
for site in sites_to_add:
    c.execute("INSERT INTO Sites (ProjectId, SiteName, SignupUrl, IsActive, ReliabilityScore, SpeedScore) VALUES (1, ?, ?, 1, 95, 95)", 
              (site['SiteName'], site['SignupUrl']))

db.commit()
db.close()
print("Database updated completely!")
