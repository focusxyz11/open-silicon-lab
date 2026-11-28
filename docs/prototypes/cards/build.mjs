import fs from 'node:fs';
/* Build the core question cards prototype into one self-contained page. A reference to port from, not part of the site.
   Run from the repository's root:  node docs/prototypes/cards/build.mjs  (after extract.mjs when the frame's data changed) */
const r = f => fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const data = r('data.json');
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Core question cards</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;700&family=Besley:ital,wght@0,400;0,700;1,400&family=Martian+Mono:wdth,wght@75..112.5,400..600&display=swap" rel="stylesheet">
<style>
${r('style.css')}</style>
</head>
<body>
<div class="wrap">
  <header class="bar">
    <span class="logo" aria-hidden="true"></span><b>Open Silicon Lab</b><span class="sub">Core question cards · prototype</span><span class="sp"></span>
    <button type="button" class="tbtn" id="theme">Day / night</button>
  </header>
  <main>
    <article class="card" aria-live="off">
      <div class="alone">
        <div class="head"><p class="kick" id="kick"></p><h1 class="q" id="q"></h1><p class="stand" id="stand"></p></div>
        <figure class="fig">
          <div class="pic" id="pic">
            <canvas id="cv" role="img" aria-label="The question's picture. Its controls are the sliders under it."></canvas>
            <div id="labels" aria-hidden="true"></div>
          </div>
          <figcaption id="cap"></figcaption>
        </figure>
        <div class="band">
          <div class="ctl">
            <p class="hint">Drag on the picture, or here</p>
            <div class="hs"><label for="hu"><span class="ar" aria-hidden="true">↔</span><span id="hname"></span></label><input type="range" id="hu" min="0" max="1000" value="500"><div class="ends"><span id="hl"></span><span id="hr"></span></div></div>
            <div class="hs" id="vwrap" hidden><label for="vv"><span class="ar" aria-hidden="true">↕</span><span id="vname"></span></label><input type="range" id="vv" min="0" max="1000" value="500"><div class="ends"><span id="vl"></span><span id="vr"></span></div></div>
          </div>
          <div class="reads" id="reads" aria-live="polite"></div>
        </div>
      </div>
      <aside class="inlab" aria-label="The same question, in the lab">
        <section class="foot"><h2>Where it lives</h2><div id="foot"></div><p class="where" id="where"></p></section>
        <section><h2>It meets</h2><div class="mks" id="mks"></div><p class="join" id="join"></p></section>
        <section><h2>It also asks</h2><ul class="asks" id="asks"></ul><p class="counts" id="counts"></p></section>
      </aside>
      <div class="text">
        <section class="why" aria-labelledby="whyh"><h2 id="whyh">Why it matters</h2><div class="cols" id="why"></div></section>
        <div class="say"><p id="true"></p><p id="open"></p></div>
      </div>
    </article>
  </main>
  <nav class="review" aria-label="For review">
    <p><b>For review only.</b> The lab never shows the thirteen side by side: a visitor reaches a card from the picture it lives on, or from a question it meets. Use these, or the arrow keys, to see all thirteen.</p>
    <div class="ticks" id="ticks"></div>
  </nav>
  <p class="note" id="note"></p>
</div>
<script>
const DATA = ${data};
${r('cards.js')}
${r('inst1.js')}
${r('inst2.js')}
${r('inst3.js')}
${r('app.js')}
</script>
</body>
</html>
`;
fs.writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('built', (html.length / 1024).toFixed(0), 'KB');
