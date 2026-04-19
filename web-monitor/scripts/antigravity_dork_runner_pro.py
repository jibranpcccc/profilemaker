import time
import random
import concurrent.futures
from googlesearch import search
import pandas as pd
from datetime import datetime
import threading
import argparse
import sys
import os

# Force UTF-8 encoding for Windows terminals
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# ==================== ALL 16 VALIDATED DORKS ====================
dorks = [
    'site:.edu OR site:.gov inurl:/profile/ ("create an account" OR "register now" OR "join now" OR "sign up" OR inurl:signup OR inurl:register)',
    'site:.edu OR site:.gov inurl:/members/ ("create an account" OR "register" OR "join the community" OR "sign up free")',
    'site:.edu OR site:.gov inurl:/miembros/ ("registrarse" OR "crear cuenta" OR "unirse ahora" OR "inscríbete")',
    'site:.edu OR site:.gov ("buddypress" OR "buddypress profile") ("register" OR "create account" OR "join")',
    'site:.edu OR site:.gov inurl:profile ("activity" OR "members") ("register now" OR "create your profile" OR "join today")',
    'site:.edu OR site:.gov inurl:/xoops/modules/profile/ ("register" OR "create account" OR "join" OR "sign up")',
    'site:.edu OR site:.gov inurl:/xoops/ "userinfo.php" ("register" OR "create an account")',
    'site:.edu OR site:.gov "xoops" ("profile" OR "modules/profile") ("register now" OR "sign up")',
    'site:.edu OR site:.gov inurl:modules/profile/userinfo.php ("register" OR "join")',
    'site:.edu OR site:.gov inurl:/bin/view/Main/ ("register" OR "create account" OR "join wiki" OR "sign up")',
    'site:.edu OR site:.gov inurl:/bin/view/ ("TWiki" OR "Foswiki") ("register" OR "create account")',
    'site:.edu OR site:.gov "bin/view/Main" ("edit this page" OR "register")',
    'site:.edu OR site:.gov inurl:view/Main ("user registration" OR "create account")',
    'site:.edu OR site:.gov inurl:/employer/ ("register as employer" OR "create account" OR "post a job" OR "sign up")',
    'site:.edu OR site:.gov inurl:/jobs/ ("employer" OR "recruiter") ("register now" OR "create account" OR "join")',
    'site:.edu OR site:.gov "employer profile" ("register" OR "sign up" OR "create account")'
]

results = []
results_lock = threading.Lock()
proxies_list = []

def load_proxies(filepath):
    global proxies_list
    if not os.path.exists(filepath):
        print(f"[WARN] Proxy file {filepath} not found.")
        return
        
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            parts = line.split(':')
            if len(parts) == 4:
                ip, port, user, pw = parts
                proxies_list.append(f"http://{user}:{pw}@{ip}:{port}")
            elif len(parts) == 2:
                ip, port = parts
                proxies_list.append(f"http://{ip}:{port}")

def get_random_proxy():
    if proxies_list:
        return random.choice(proxies_list)
    return None

def process_dork(dork, index, total, args):
    print(f"[{index}/{total}] Searching: {dork[:70]}...")
    try:
        search_kwargs = {"num_results": args.num_results, "lang": "en", "sleep_interval": 2}
        proxy = get_random_proxy()
        
        if proxy:
            search_kwargs["proxy"] = proxy
        elif args.proxy:
            search_kwargs["proxy"] = args.proxy
            
        urls = list(search(dork, **search_kwargs))
        
        valid_urls = []
        for url in urls:
            domain = url.split("/")[2] if "://" in url else url
            
            # Apply filter if edu_only toggle is on
            if args.edu_only and not (domain.endswith('.edu') or domain.endswith('.gov') or '.edu.' in domain or '.gov.' in domain):
                continue
                
            valid_urls.append({
                "Dork_Used": dork,
                "Domain": domain,
                "Full_URL": url,
                "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
        with results_lock:
            results.extend(valid_urls)
            
        print(f"    * [{index}/{total}] Found {len(valid_urls)} valid results")
        time.sleep(random.uniform(args.min_delay, args.max_delay))
        
    except Exception as e:
        print(f"    [WARN] Error with dork [{index}]: {e}")
        time.sleep(10)

def main():
    parser = argparse.ArgumentParser(description="Antigravity Pro Dork Runner")
    parser.add_argument("--workers", type=int, default=3, help="Number of concurrent threads (default: 3)")
    parser.add_argument("--num-results", type=int, default=80, help="Number of search results per dork (default: 80)")
    parser.add_argument("--edu-only", action="store_true", help="Filter and keep only .edu or .gov domains")
    parser.add_argument("--proxy", type=str, default=None, help="Proxy URL (e.g., http://user:pass@ip:port)")
    parser.add_argument("--proxy-file", type=str, default=None, help="Path to text file containing a list of proxies")
    parser.add_argument("--min-delay", type=int, default=4, help="Minimum delay between searches in seconds (default: 4)")
    parser.add_argument("--max-delay", type=int, default=8, help="Maximum delay between searches in seconds (default: 8)")
    
    args = parser.parse_args()

    if args.proxy_file:
        load_proxies(args.proxy_file)

    print("[START] Antigravity Pro Dork Runner Started")
    print(f"Total Dorks: {len(dorks)}")
    print(f"Workers: {args.workers} | Filter .edu/.gov: {args.edu_only} | Proxies Loaded: {len(proxies_list) if proxies_list else ('Yes' if args.proxy else 'No')}\n")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = []
        for index, dork in enumerate(dorks, 1):
            futures.append(executor.submit(process_dork, dork, index, len(dorks), args))
            
        concurrent.futures.wait(futures)

    # Save results
    if results:
        df = pd.DataFrame(results)
        df.drop_duplicates(subset=["Full_URL"], inplace=True)

        filename = f"antigravity_pro_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        df.to_csv(filename, index=False)

        print("\n" + "="*60)
        print(f"[OK] FINISHED! Saved {len(df)} unique URLs to: {filename}")
        print("="*60)
    else:
        print("\n[FAIL] No results found. All proxies might have been blocked or Google is rate limiting you.")

if __name__ == "__main__":
    main()
