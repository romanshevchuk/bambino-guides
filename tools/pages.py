"""Builds the published pages from _index.html (the hand-edited source, with every view in it).
index.html gets the home view, clean/ descale/ steam/ supplies/ get their own view only, with their
own title, description and address, so each page is one topic to a search engine. app.js fetches
the other views from their pages when someone opens them. Also rewrites sitemap.xml.
_index.html isn't published: GitHub Pages (Jekyll) skips files starting with _.
Edit _index.html only, then run:  python tools/pages.py"""
import html, pathlib, re, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://romanshevchuk.github.io/what-my-bambino-wants/'
PAGES = {
    'clean': ('Bambino Plus cleaning cycle: 1 CUP and 2 CUP flashing',
              "Two buttons, 1 CUP and 2 CUP, blinking in turn on your Breville / Sage Bambino Plus? It's asking for a cleaning cycle. What you need and each step."),
    'descale': ('How to descale a Bambino or Bambino Plus, step by step',
                'Descale light on your Breville / Sage Bambino Plus (1 CUP + STEAM alternating with 2 CUP) or Bambino (2 CUP keeps blinking)? What you need and each step.'),
    'steam': ('Bambino Plus steam wand blocked: milk lights flashing',
              'All the milk lights blinking and STEAM off on your Breville / Sage Bambino Plus? The steam wand tip is blocked. How to clear it, step by step.'),
    'supplies': ('Bambino cleaning tablets vs descaler: which one you need',
                 'Cleaning tablets and descaler do different jobs on a Breville / Sage Bambino or Bambino Plus. Which one your light is asking for, and where each one goes.'),
}
VIEW = re.compile(r'(?:<!-- =+ [A-Z ]+ =+ -->\n)?<section class="view" id="([a-z]+)".*?</section>\n*', re.S)
NOTE = '<!-- Made from _index.html by tools/pages.py. Edit _index.html, then rerun. -->\n'

def sub1(pat, new, s):
    s, n = re.subn(pat, lambda m: m.group(1) + new, s, count=1)
    assert n == 1, pat
    return s

def only(view, s):
    """Keep one view, drop the others."""
    ids = VIEW.findall(s)
    assert view in ids and len(ids) == len(PAGES) + 1, ids
    return VIEW.sub(lambda m: m.group(0) if m.group(1) == view else '', s)

def write(path, s):
    path.parent.mkdir(exist_ok=True)
    path.write_text(s.replace('<html', NOTE + '<html', 1), encoding='utf-8', newline='\n')

src = (ROOT / '_index.html').read_text(encoding='utf-8')
write(ROOT / 'index.html', only('home', src))
for view, (title, desc) in PAGES.items():
    s = only(view, src)
    s = sub1(r'(<title>)[^<]*', html.escape(title, quote=False), s)
    s = sub1(r'(<meta name="description" content=")[^"]*', html.escape(desc), s)
    s = sub1(r'(<meta property="og:title" content=")[^"]*', html.escape(title), s)
    s = sub1(r'(<meta property="og:description" content=")[^"]*', html.escape(desc), s)
    s = sub1(r'(<link rel="canonical" href=")[^"]*', BASE + view + '/', s)
    s = sub1(r'(<meta property="og:url" content=")[^"]*', BASE + view + '/', s)
    s = sub1(r'(<body )', f'data-page="{view}" ', s)
    # one folder down: local files and the footer page links need ../
    s = re.sub(r'((?:href|src|data-sage)=")(?=(?:css|js|img)/|manifest\.webmanifest|\./"|(?:%s)/")' % '|'.join(PAGES), r'\1../', s)
    s = s.replace('href=".././"', 'href="../"')
    write(ROOT / view / 'index.html', s)

today = datetime.date.today().isoformat()
urls = ''.join(f'  <url><loc>{BASE}{p}</loc><lastmod>{today}</lastmod></url>\n' for p in [''] + [v + '/' for v in PAGES])
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n', encoding='utf-8', newline='\n')
print('made index.html,', ', '.join(v + '/' for v in PAGES), '+ sitemap.xml')
