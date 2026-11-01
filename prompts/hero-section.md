Build ONE self-contained file: index.html. No build step, no npm, no framework, no Tailwind, no JS libraries. One document with inline <style>, inline SVG and vanilla JavaScript. The only things loaded from outside are two Google Fonts and three images hosted on thinkingods.com (listed below). The page is a single full-screen hero for a fictional field-guide studio called FERNROOT. <title>: "Fernroot". Language: en.

IMAGES (hosted: use these exact URLs, never generate, redraw or substitute them)
LOG_PLAIN   https://thinkingods.com/demos/fernroot-hero/assets/base.webp        2752x700, transparent, a weathered fallen log
LOG_COLOUR  https://thinkingods.com/demos/fernroot-hero/assets/reveal.webp      2752x700, the SAME log with moss, quartz and wildflowers growing on it. Identical crop and framing to LOG_PLAIN so the two overlay exactly
BRUSH_WIPE  https://thinkingods.com/demos/fernroot-hero/assets/brush-wipe.webp  900x1100 transparent alpha mask: solid on its right side, ragged bristle strokes on its left side. It is the leading edge of the entrance wipe and is used ONLY as a CSS mask-image
Plain <img src="..." decoding="async"> for the two logs. No crossorigin attribute on them.

FONTS
<link rel="preconnect" href="https://fonts.googleapis.com"> and <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>, then the stylesheet https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@1&display=swap
Inter = all UI text and headline line 2. Instrument Serif italic = the logo word and headline line 1.

WHAT IT IS
A light grey hero (#efefee). A huge angled log runs from bottom-left to top-right and sits IN FRONT of the two-line headline so it partly covers it. A bristle-brush wipe reveals the log from right to left on load. Afterwards the log shifts diagonally with the cursor (parallax), and the colour layer of the same log (moss, quartz, wildflowers) shows only inside a soft circle that follows the cursor. A frosted, dotted "liquid glass" note sits bottom-left over the wood, and a short copy + green CTA sits bottom-right.

STRUCTURE (write exactly this markup, same classes and order)
<nav>
  <div class="brand">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 22V10.5" fill="none" stroke="#161616" stroke-width="1.7" stroke-linecap="round"/><path d="M12 12.5C12 7.6 8.4 4.6 3.5 4.6c0 4.9 3.3 7.9 8.5 7.9z" fill="#3f7d4e"/><path d="M12 15.2c0-4.2 3-6.9 8.5-6.9 0 4.4-3.2 6.9-8.5 6.9z" fill="#161616"/></svg>
    <span>Fernroot</span>
  </div>
  <div class="pill">
    <button class="on">Field Guide</button><button>Finds</button><button>Seasons</button><button>Atlas</button><button>Contact</button>
  </div>
  <div>
    <button class="join">Explore</button>
    <button class="burger" aria-label="Open menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg></button>
  </div>
</nav>

<section class="hero" id="hero">

  <div class="headline">
    <h1>
      <span class="l1 a rv" style="animation-delay:.25s">Where the forest</span>
      <span class="l2 a rv" style="animation-delay:.42s">keeps its secrets</span>
    </h1>
  </div>

  <div class="log-stage" id="stage">
    <div class="layer">
      <div class="pose"><img src="https://thinkingods.com/demos/fernroot-hero/assets/base.webp" alt="Weathered fallen timber" decoding="async" /></div>
    </div>
    <div class="layer reveal">
      <div class="pose"><img src="https://thinkingods.com/demos/fernroot-hero/assets/reveal.webp" alt="" decoding="async" /></div>
    </div>
  </div>

  <div class="glass a fu" style="animation-delay:.7s">
    <p>Nothing here is waste. Lichen, crystal and wildflower all make a home in the one piece of timber the forest let go.</p>
  </div>

  <div class="cta-block a fu" style="animation-delay:.85s">
    <p>Drag your cursor across the timber to peel back the colour hidden in its grain, then wander into the field guide.</p>
    <button class="cta">Open the Field Guide</button>
  </div>
</section>

STYLES (write exactly this CSS; every value was tuned, do not round or restyle)
  :root{
    --bg:#efefee;
    --ink:#161616;
    --ink-soft:rgba(22,22,22,.68);
    --accent:#3f7d4e;
    --out:cubic-bezier(.16,1,.3,1);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:var(--bg)}
  body{font-family:Inter,system-ui,sans-serif;color:var(--ink);letter-spacing:-.02em;-webkit-font-smoothing:antialiased;overflow:hidden}
  button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}

  /* ------------------------------------------------------------------ hero */
  .hero{
    position:relative;width:100%;height:100vh;height:100dvh;
    overflow:hidden;background:var(--bg);
    container-type:size;
    touch-action:none;
    /* log pose, fitted to the Figma reference */
    --log-w:max(163.45cqw,118cqh);
    --log-x:43.62cqw;
    --log-y:49cqh;
    --log-rot:-16.6deg;
    /* cursor reveal radius */
    --r:clamp(150px,23.2cqw,460px);
    --mx:-9999px;--my:-9999px;
    --tx:0px;--ty:0px;
    /* brush-wipe position: hidden until the intro starts */
    --ix:110vw;--ew:60vw;
  }

  /* ----------------------------------------------------------- headline (behind the log) */
  .headline{
    position:absolute;top:14%;left:0;right:0;z-index:5;
    display:flex;flex-direction:column;align-items:center;text-align:center;
    padding:0 20px;pointer-events:none;
  }
  .headline h1{line-height:.95;font-weight:400;font-size:clamp(3rem,33.5px + 3.72cqw,9rem)}
  .headline .l1{display:block;font-family:'Instrument Serif',serif;font-style:italic;letter-spacing:-.025em}
  .headline .l2{display:block;letter-spacing:-.08em;margin-top:-.04em}

  /* ------------------------------------------------------------------ log */
  .log-stage{
    position:absolute;inset:0;z-index:10;pointer-events:none;
    /* brush-wipe mask: ragged leading edge + solid ink behind it. JS slides both leftwards. */
    -webkit-mask-image:url("https://thinkingods.com/demos/fernroot-hero/assets/brush-wipe.webp"),linear-gradient(#000,#000);
            mask-image:url("https://thinkingods.com/demos/fernroot-hero/assets/brush-wipe.webp"),linear-gradient(#000,#000);
    -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
    -webkit-mask-size:var(--ew) 100%,300% 100%;
            mask-size:var(--ew) 100%,300% 100%;
    -webkit-mask-position:var(--ix) 0,calc(var(--ix) + var(--ew) - 2px) 0;
            mask-position:var(--ix) 0,calc(var(--ix) + var(--ew) - 2px) 0;
  }
  .log-stage.done{-webkit-mask-image:none;mask-image:none}
  .layer{position:absolute;inset:0}
  .pose{
    position:absolute;left:var(--log-x);top:var(--log-y);
    width:var(--log-w);aspect-ratio:2752/700;
    transform:translate3d(var(--tx),var(--ty),0) translate(-50%,-50%) rotate(var(--log-rot));
    transform-origin:50% 50%;
    will-change:transform;
  }
  .pose img{position:absolute;inset:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none}
  /* the colored layer is only visible inside a soft circle that follows the cursor */
  .reveal{
    -webkit-mask-image:radial-gradient(circle var(--r) at var(--mx) var(--my),#000 0,#000 40%,rgba(0,0,0,.75) 60%,rgba(0,0,0,.4) 75%,rgba(0,0,0,.12) 88%,transparent 100%);
            mask-image:radial-gradient(circle var(--r) at var(--mx) var(--my),#000 0,#000 40%,rgba(0,0,0,.75) 60%,rgba(0,0,0,.4) 75%,rgba(0,0,0,.12) 88%,transparent 100%);
  }

  /* --------------------------------------------------------------- nav */
  nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:1.25rem}
  .brand{display:flex;align-items:center;gap:.5rem}
  .brand svg{width:26px;height:26px;display:block}
  .brand span{font-family:'Instrument Serif',serif;font-style:italic;font-size:1.5rem;line-height:2rem;letter-spacing:-.02em}
  .pill{
    position:absolute;left:50%;transform:translateX(-50%);
    display:none;align-items:center;gap:.25rem;padding:.5rem;border-radius:999px;
    background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.09);
    -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  }
  .pill button{padding:.375rem 1rem;border-radius:999px;font-size:.875rem;line-height:1.25rem;font-weight:500;color:rgba(22,22,22,.62);transition:color .15s,background .15s}
  .pill button:hover{background:rgba(0,0,0,.06);color:var(--ink)}
  .pill button.on{color:var(--ink)}
  .join{display:none;background:var(--ink);color:#fff;font-size:.875rem;font-weight:600;padding:.625rem 1.5rem;border-radius:999px;transition:background .15s}
  .join:hover{background:#333}
  .burger{padding:.5rem;display:block}
  .burger svg{width:24px;height:24px;display:block}
  @media (min-width:768px){.pill{display:flex}.join{display:block}.burger{display:none}}
  @media (min-width:640px){nav{padding:1.25rem}}

  /* --------------------------------------------------- frosted dotted glass panel */
  .glass{
    position:absolute;z-index:20;
    left:clamp(16px,2.5cqw,48px);bottom:clamp(20px,4.4cqh,52px);
    width:min(310px,36cqw);
    padding:22px 24px 24px;border-radius:24px;
    overflow:hidden;isolation:isolate;display:none;
    background:linear-gradient(140deg,rgba(255,255,255,.62),rgba(255,255,255,.26) 58%,rgba(255,255,255,.42));
    -webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3);
    border:1px solid rgba(255,255,255,.6);
    box-shadow:
      inset 0 1.5px 0 rgba(255,255,255,.9),
      inset 0 -1px 0 rgba(255,255,255,.22),
      inset 0 0 34px rgba(255,255,255,.2),
      0 22px 44px -20px rgba(45,32,20,.4),
      0 2px 8px rgba(0,0,0,.05);
  }
  /* halftone dots, dense at the top-left and dissolving toward the bottom-right */
  .glass::before{
    content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.6;
    background-image:radial-gradient(circle,rgba(255,255,255,.9) 0 .9px,transparent 1.4px);
    background-size:6px 6px;
    -webkit-mask-image:linear-gradient(135deg,#000 0%,rgba(0,0,0,.45) 34%,transparent 78%);
            mask-image:linear-gradient(135deg,#000 0%,rgba(0,0,0,.45) 34%,transparent 78%);
  }
  /* film grain + a soft specular bloom in the corner */
  .glass::after{
    content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;
    background:
      radial-gradient(120% 90% at 0% 0%,rgba(255,255,255,.55),transparent 55%),
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    background-blend-mode:normal,normal;
    mix-blend-mode:soft-light;opacity:.55;
  }
  .glass p{font-size:.875rem;line-height:1.625;color:rgba(22,22,22,.82)}
  @media (min-width:640px){.glass{display:block}}

  /* --------------------------------------------------------- right copy + CTA */
  .cta-block{
    position:absolute;z-index:20;bottom:2.5rem;left:1.25rem;right:1.25rem;
    display:flex;flex-direction:column;align-items:flex-start;gap:1rem;
  }
  .cta-block p{font-size:.75rem;line-height:1.625;color:var(--ink-soft)}
  .cta{background:var(--accent);color:#fff;font-size:.875rem;font-weight:500;padding:.75rem 1.75rem;border-radius:999px;transition:transform .2s,background .2s,box-shadow .2s}
  .cta:hover{background:#336640;transform:scale(1.03);box-shadow:0 10px 24px -10px rgba(63,125,78,.55)}
  .cta:active{transform:scale(.95)}
  @media (min-width:640px){
    .cta-block{bottom:6rem;left:auto;right:3.5rem;max-width:260px;gap:1.25rem}
    .cta-block p{font-size:.875rem}
  }

  /* ----------------------------------------------------- text entrance (after the wipe starts) */
  .a{opacity:0}
  .is-in .a{animation-fill-mode:forwards;animation-timing-function:var(--out)}
  .is-in .rv{animation-name:heroReveal;animation-duration:1.1s}
  .is-in .fu{animation-name:heroFadeUp;animation-duration:1s}
  @keyframes heroReveal{0%{opacity:0;transform:translateY(28px);filter:blur(12px)}to{opacity:1;transform:none;filter:blur(0)}}
  @keyframes heroFadeUp{0%{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}

  @media (prefers-reduced-motion:reduce){.a{opacity:1}.is-in .a{animation:none}}

SCRIPT (write exactly this logic)
(function(){
  var hero  = document.getElementById('hero');
  var stage = document.getElementById('stage');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touchOnly = window.matchMedia('(hover: none)').matches;

  /* ---- tunables ------------------------------------------------------------ */
  var AXIS   = -16.6 * Math.PI / 180;   /* same angle the log is rotated by: parallax runs along the log */
  var AX = Math.cos(AXIS), AY = Math.sin(AXIS);
  var PAR    = 0.075;                    /* parallax travel each way, as a share of viewport width */
  var PAR_LERP = 0.07;
  var REV_LERP = 0.10;                  /* cursor reveal follow speed */
  var WIPE_MS = 2300, SLIDE_MS = 3000;  /* brush wipe / slide-in durations */
  var SLIDE = 0.11;                     /* how far the log slides in along its axis (share of width) */

  var BRUSH = 'https://thinkingods.com/demos/fernroot-hero/assets/brush-wipe.webp', maskOK = true;
  var W = 0, H = 0;
  function measure(){ W = hero.clientWidth; H = hero.clientHeight; }
  measure(); window.addEventListener('resize', measure);

  var m = { x:-9999, y:-9999, tx:-9999, ty:-9999, seen:false };
  var par = { d:0, target:0 };
  var intro = { on:false, t0:0, doneAt:0 };
  var last = {};

  function setVar(k, v){ if (last[k] !== v){ last[k] = v; hero.style.setProperty(k, v); } }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function easeOut(t,p){ return 1 - Math.pow(1 - t, p); }

  window.addEventListener('pointermove', function(e){
    if (!m.seen && m.tx === -9999){ m.x = e.clientX; m.y = e.clientY; }
    m.seen = true;
    m.tx = e.clientX; m.ty = e.clientY;
    par.target = -clamp((e.clientX - W/2) / (W/2), -1, 1);      /* cursor left → log right, and vice versa */
  }, { passive:true });

  /* hover-less devices: a gentle self-playing sweep along the log until the first touch */
  function demo(now){
    var s = Math.sin(now / 1500);
    var x = W * (0.5 + 0.30 * s);
    var y = H * 0.49 + (x - W * 0.4362) * Math.tan(AXIS);
    m.tx = x; m.ty = y; if (m.x === -9999){ m.x = x; m.y = y; }
  }

  function frame(now){
    /* intro: brush wipe + slide */
    var slide = 0;
    if (intro.on){
      var t = now - intro.t0;
      var pw = easeOut(clamp(t / WIPE_MS, 0, 1), 1.75);
      var ps = easeOut(clamp(t / SLIDE_MS, 0, 1), 4);
      var ew = 0.818 * H;                                      /* keeps the brush texture at its native aspect */
      setVar('--ew', ew + 'px');
      setVar('--ix', (W - pw * (W + ew)) + 'px');
      slide = (1 - ps) * SLIDE * W;
      if (t >= Math.max(WIPE_MS, SLIDE_MS)){
        intro.on = false; intro.doneAt = now;
        stage.classList.add('done');
      }
    }

    if (touchOnly && !m.seen && !intro.on && intro.doneAt && now - intro.doneAt > 600) demo(now);

    /* cursor reveal (follows with a little lag) */
    if (m.tx !== -9999){
      m.x += (m.tx - m.x) * REV_LERP; m.y += (m.ty - m.y) * REV_LERP;
      setVar('--mx', m.x.toFixed(1) + 'px'); setVar('--my', m.y.toFixed(1) + 'px');
    }

    /* diagonal parallax along the log's own axis */
    par.d += (par.target - par.d) * PAR_LERP;
    var dist = (reduce ? 0 : par.d * PAR * W) + slide;
    setVar('--tx', (dist * AX).toFixed(2) + 'px');
    setVar('--ty', (dist * AY).toFixed(2) + 'px');

    requestAnimationFrame(frame);
  }

  function start(){
    if (reduce || !maskOK){ stage.classList.add('done'); hero.classList.add('is-in'); requestAnimationFrame(frame); return; }
    hero.classList.add('is-in');
    intro.on = true; intro.t0 = performance.now();
    requestAnimationFrame(frame);
  }

  var imgs = Array.prototype.slice.call(document.images);
  var pre = imgs.map(function(i){ return i.decode ? i.decode().catch(function(){}) : Promise.resolve(); });
  pre.push(fetch(BRUSH, { mode:'cors' }).then(function(r){ if (!r.ok) throw 0; }).catch(function(){ maskOK = false; }));
  Promise.all(pre)
    .then(function(){ return Promise.race([document.fonts ? document.fonts.ready : null, new Promise(function(r){ setTimeout(r, 900); })]); })
    .then(function(){ requestAnimationFrame(start); });
})();

NOTES ON THE PARTS THAT MATTER
- The log is positioned with container units on a size container (.hero{container-type:size}): width max(163.45cqw,118cqh), centre at 43.62cqw / 49cqh, rotated -16.6deg. Never use px for the log.
- Two layers are stacked inside .log-stage: plain on the bottom, colour on top. Only the colour layer carries the cursor mask (--r radius, soft falloff). Both .pose elements receive the same --tx/--ty, so the colour always stays locked to the wood.
- The entrance wipe is a mask on .log-stage made of the BRUSH_WIPE image (size --ew by 100%) followed by a solid layer that starts 2px inside the brush and is 300% wide. JS moves both leftwards by changing --ix, so a ragged brush edge drags a solid fill behind it. Brush height is 100% of the stage, brush width is 0.818 x stage height so its texture keeps its native 900:1100 ratio. When the wipe and slide are finished, class "done" removes the mask.
- Parallax: the pointer's horizontal position maps to -1..1 across the screen (cursor left = log moves right, cursor right = log moves left), travel 7.5% of the viewport width in each direction, eased with a 0.07 lerp, applied along the log's own -16.6deg axis (cos/sin of the angle), never plain horizontal.
- Cursor reveal follows the pointer with a 0.10 lerp. On hover-less devices it plays a gentle automatic sweep along the log until the first touch.
- The headline is behind the log (z-index 5 vs 10). The glass note and CTA block are in front of everything (z-index 20).
- The brush texture is fetched once before the intro starts; if it cannot be loaded (for example blocked cross-origin) the intro is skipped and the log is simply shown, instead of staying hidden.

ACCESSIBILITY
Real <nav>, <button>s with aria-labels where there is no text, alt text on the plain log, empty alt on the colour layer, text contrast on the glass note is dark ink on a light frosted surface. prefers-reduced-motion: no wipe, no slide, no parallax, text simply visible.

DONE WHEN
1) On load the log wipes in from the right with a ragged bristle edge while sliding left a little, the headline and the glass note and CTA fade up after it starts. 2) The log covers part of the headline. 3) Moving the mouse shifts the log diagonally the opposite way to the cursor, very subtly. 4) The cursor uncovers the moss, quartz and flowers inside a soft circle that follows it. 5) The glass note looks like frosted glass with fine white dots dissolving toward the bottom-right and a soft highlight in the top-left corner. 6) On a phone the glass note is hidden, the copy and CTA sit at the bottom, and the reveal sweeps by itself.