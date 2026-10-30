"""Task pages for search: clean/, descale/, steam/, supplies/ are copies of index.html
with their own title, description and address, opening on their own view (body data-page).
Edit index.html only, then run:  python tools/pages.py"""
import html, pathlib, re, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://romanshevchuk.github.io/what-my-bambino-wants/'
PAGES = {
    'clean': ('Bambino Plus cleaning cycle: 1 CUP and 2 CUP flashing',
              "1 CUP and 2 CUP blinking in turn (alternating) on your Breville / Sage Bambino Plus? It's asking for a cleaning cycle. What you need and each step."),
    'descale': ('How to descale a Bambino or Bambino Plus, step by step',
                'Descale light on your Breville / Sage Bambino Plus (1 CUP + STEAM alternating with 2 CUP) or Bambino (2 CUP keeps blinking)? What you need and each step.'),
    'steam': ('Bambino Plus steam wand blocked: milk lights flashing',
              'All the milk lights blinking and STEAM off on your Breville / Sage Bambino Plus? The steam wand tip is blocked. How to clear it, step by step.'),
    'supplies': ('Bambino cleaning tablets vs descaler: which one you need',
                 'Cleaning tablets and descaler do different jobs on a Breville / Sage Bambino or Bambino Plus. Which one your light is asking for, and where each one goes.'),
}

def sub1(pat, new, s):
    s, n = re.subn(pat, lambda m: m.group(1) + new, s, count=1)
    assert n == 1, pat
    return s

src = (ROOT / 'index.html').read_text(encoding='utf-8')
for view, (title, desc) in PAGES.items():
    assert f'id="{view}"' in src, view
    s = sub1(r'(<title>)[^<]*', html.escape(title, quote=False), src)
    s = sub1(r'(<meta name="description" content=")[^"]*', html.escape(desc), s)
    s = sub1(r'(<meta property="og:title" content=")[^"]*', html.escape(title), s)
    s = sub1(r'(<meta property="og:description" content=")[^"]*', html.escape(desc), s)
    s = sub1(r'(<link rel="canonical" href=")[^"]*', BASE + view + '/', s)
    s = sub1(r'(<meta property="og:url" content=")[^"]*', BASE + view + '/', s)
    s = sub1(r'(<body )', f'data-page="{view}" ', s)
    # one h1 per page: this view's title, not the home heading
    s, n = re.subn(r'<h1 class="vt">(.*?)</h1>', r'<h2 class="vt">\1</h2>', s, flags=re.S)
    assert n == 1
    s, n = re.subn(r'(id="%s".*?)<h2 class="vt">(.*?)</h2>' % view, r'\1<h1 class="vt">\2</h1>', s, count=1, flags=re.S)
    assert n == 1
    # one folder down: local files and the footer page links need ../
    s = re.sub(r'((?:href|src|data-sage)=")(?=(?:css|js|img)/|manifest\.webmanifest|\./"|(?:%s)/")' % '|'.join(PAGES), r'\1../', s)
    s = s.replace('href=".././"', 'href="../"')
    s = s.replace('<html', '<!-- Made from index.html by tools/pages.py. Edit index.html, then rerun. -->\n<html', 1)
    (ROOT / view).mkdir(exist_ok=True)
    (ROOT / view / 'index.html').write_text(s, encoding='utf-8', newline='\n')

today = datetime.date.today().isoformat()
urls = ''.join(f'  <url><loc>{BASE}{p}</loc><lastmod>{today}</lastmod></url>\n' for p in [''] + [v + '/' for v in PAGES])
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n', encoding='utf-8', newline='\n')
print('made', ', '.join(v + '/' for v in PAGES), '+ sitemap.xml')
