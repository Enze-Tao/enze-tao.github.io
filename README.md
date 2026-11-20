# enze-tao.github.io

Personal website, served by GitHub Pages from the `master` branch.

It is plain HTML and CSS with no build step (`.nojekyll` turns Jekyll off):

- `index.html`: all the content, in four tabs (About, Publications, Experience, Awards).
  Each tab is a `<section class="panel">`; `#publications` etc. open that tab directly.
  To add a paper, copy one `<li class="pub">` block in the Publications section (newest first).
- `assets/tabs.js`: tab switching. Without JavaScript every section is shown in turn.
- `style.css`: the styles, including the dark-mode colours at the top.
- `assets/`: photo, favicon and touch icon.
- `publications/`, `experience/`, `awards/`, `about/`: redirects from the old URLs to the matching section.
- `google8fe88d5fa421215c.html`: Google Search Console verification. Keep it.

Preview locally with `python3 -m http.server` and open http://localhost:8000.
