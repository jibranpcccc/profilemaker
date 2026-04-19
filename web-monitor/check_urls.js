const urls = [
  { site: 'aiti.edu.vn', url: 'https://aiti.edu.vn/members/alexwg82421/' },
  { site: 'sanpablo.edu.ec', url: 'https://academia.sanpablo.edu.ec/profile/alexwg94000/' },
  { site: 'blac.edu.pl', url: 'https://blac.edu.pl/profile/alexwg42159/' },
  { site: 'pibelearning.gov.bd', url: 'https://pibelearning.gov.bd/profile/alexwg39896/' },
  { site: 'bbiny.edu', url: 'https://bbiny.edu/profile/alexwg82943/' },
  { site: 'ensp.edu.mx', url: 'https://ensp.edu.mx/members/alexwg88803/' },
  { site: 'edutic.id', url: 'https://academy.edutic.id/profile/alexwg71518/' },
  { site: 'aula.edu.pe', url: 'https://learndash.aula.edu.pe/miembros/alexwg69806/' },
  { site: 'centrotecnologico.edu.mx', url: 'https://www.centrotecnologico.edu.mx/profile/alexwg79411/profile' },
  { site: 'lifewest.edu', url: 'https://jobs.lifewest.edu/employer/alexwg45169/' },
  { site: 'stes.tyc.edu.tw', url: 'http://www.stes.tyc.edu.tw/xoops/' },
  { site: 'learningsuite.id', url: 'https://edu.learningsuite.id/profile/alexwg44974/' },
  { site: 'institutocrecer.edu.co', url: 'https://institutocrecer.edu.co/profile/alexwg75802/' },
  { site: 'holycrossconvent.edu.na', url: 'https://www.holycrossconvent.edu.na/profile/alexwg53273/profile' },
  { site: 'woorips.vic.edu.au', url: 'https://www.woorips.vic.edu.au/profile/alexwg96146/profile' },
  { site: 'tarauaca.ac.gov.br', url: 'https://www.tarauaca.ac.gov.br/profile/alexwg75177/profile' },
  { site: 'lanubedocente.21.edu.ar', url: 'https://www.lanubedocente.21.edu.ar/profile/alexwg92759/profile' },
  { site: 'orkhonschool.edu.mn', url: 'https://www.orkhonschool.edu.mn/profile/alexwg22739/profile' },
  { site: 'haphong.edu.vn', url: 'https://www.haphong.edu.vn/profile/alexwg16066/profile' },
  { site: 'rosewood.edu.na', url: 'https://www.rosewood.edu.na/profile/alexwg71925/profile' },
  { site: 'lasallesancristobal.edu.mx', url: 'https://www.lasallesancristobal.edu.mx/profile/alexwg92627/profile' },
];

async function check() {
  console.log('SITE                          | HTTP | HAS USERNAME | HAS BIO/BACKLINK | VERDICT');
  console.log('-'.repeat(100));
  
  for (const {site, url} of urls) {
    try {
      const r = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });
      const status = r.status;
      const html = await r.text();
      const title = (html.match(/<title>(.*?)<\/title>/i) || ['',''])[1].substring(0, 40);
      const username = url.match(/alexwg\d+/)?.[0] || '';
      const hasUsername = html.includes(username);
      const hasBio = html.toLowerCase().includes('professional') || html.toLowerCase().includes('bio') || html.includes('megawin') || html.includes('google.com');
      const is404 = html.toLowerCase().includes('404') || html.toLowerCase().includes('page not found') || html.toLowerCase().includes('not found');
      const isError = status >= 400;
      
      let verdict = '❌ DEAD';
      if (status === 200 && hasUsername && hasBio && !is404) verdict = '✅ LIVE+BIO';
      else if (status === 200 && hasUsername && !is404) verdict = '⚠️ LIVE (no bio)';
      else if (status === 200 && !is404) verdict = '⚠️ PAGE OK (no user)';
      else if (is404) verdict = '❌ 404';
      else if (isError) verdict = '❌ HTTP ' + status;
      
      const s = site.padEnd(30);
      console.log(`${s}| ${status} | ${hasUsername ? 'YES' : 'NO '}          | ${hasBio ? 'YES' : 'NO '}              | ${verdict} | ${title}`);
    } catch(e) {
      const s = site.padEnd(30);
      console.log(`${s}| ERR  | ---          | ---              | ❌ TIMEOUT/ERR`);
    }
  }
}

check();
