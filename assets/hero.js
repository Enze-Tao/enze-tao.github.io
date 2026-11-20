// Header animation: the unit sphere a 360-degree panorama is mapped onto,
// drawn as a latitude-longitude grid of dots. A few patches are tinted like
// segmented objects, and a sweeping meridian lights up the dots it passes.
(() => {
  const canvas = document.getElementById("sphere");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const readout = document.getElementById("sphere-az");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const DEG = Math.PI / 180;

  // Patches in (azimuth, elevation) degrees, like a floor, a sofa and a window.
  const REGIONS = [
    { az: [0, 360], el: [-90, -52], tone: 1 },
    { az: [28, 74], el: [-24, 6], tone: 2 },
    { az: [196, 242], el: [6, 36], tone: 3 },
  ];

  const pts = [];
  const LAT = 17, LON = 52;
  for (let i = 1; i < LAT; i++) {
    const el = -Math.PI / 2 + (Math.PI * i) / LAT;
    const n = Math.max(8, Math.round(LON * Math.cos(el)));
    for (let j = 0; j < n; j++) {
      const az = (2 * Math.PI * j) / n;
      const azd = az / DEG, eld = el / DEG;
      const region = REGIONS.find(r => azd >= r.az[0] && azd < r.az[1] && eld >= r.el[0] && eld < r.el[1]);
      pts.push({
        x: Math.cos(el) * Math.sin(az),
        y: Math.sin(el),
        z: Math.cos(el) * Math.cos(az),
        az,
        tone: region ? region.tone : 0,
        glow: 0,
      });
    }
  }

  let colors = {};
  function readColors() {
    const s = getComputedStyle(document.documentElement);
    const get = name => s.getPropertyValue(name).trim();
    colors = { 0: get("--dot"), 1: get("--seg-1"), 2: get("--seg-2"), 3: get("--seg-3"), sweep: get("--accent") };
  }

  let w = 0, h = 0, dpr = 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0);
  }

  let yaw = -0.6, tilt = 0.32, tiltTarget = 0.32, yawNudge = 0, yawNudgeTarget = 0;
  let sweep = 0;

  function draw(dt) {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2;
    const cy0 = Math.cos(yaw + yawNudge), sy0 = Math.sin(yaw + yawNudge);
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const decay = Math.pow(0.986, dt / 16.7);

    // Sweep position in the sphere's own frame: one turn every ~9 s.
    for (const p of pts) {
      let d = Math.abs(((p.az - sweep) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      if (d < 0.05) p.glow = 1; else p.glow *= decay;
    }

    for (let pass = 0; pass < 2; pass++) {
      for (const p of pts) {
        const x1 = p.x * cy0 + p.z * sy0;
        const z1 = -p.x * sy0 + p.z * cy0;
        const y2 = p.y * ct - z1 * st;
        const z2 = p.y * st + z1 * ct;
        if ((pass === 0) !== (z2 < 0)) continue;
        const persp = 2.8 / (2.8 - z2);
        const px = cx + x1 * R * persp;
        const py = cy - y2 * R * persp;
        const front = (z2 + 1) / 2;
        let alpha = (p.tone ? 0.25 : 0.12) + (p.tone ? 0.7 : 0.5) * front;
        let size = 0.55 + 1.25 * front + (p.tone ? 0.35 : 0);
        let color = colors[p.tone];
        if (p.glow > 0.04) {
          alpha = Math.min(1, alpha + p.glow * 0.6 * (0.4 + front));
          size += p.glow * 0.9;
          if (!p.tone && p.glow > 0.25) color = colors.sweep;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  let last = 0, running = false, visible = true, raf = 0;
  function tick(t) {
    const dt = last ? Math.min(t - last, 50) : 16.7;
    last = t;
    yaw += dt * 0.00011;
    sweep = (sweep + dt * 0.0007) % (2 * Math.PI);
    tilt += (tiltTarget - tilt) * 0.04;
    yawNudge += (yawNudgeTarget - yawNudge) * 0.04;
    draw(dt);
    if (readout) readout.textContent = String(Math.round(sweep / DEG)).padStart(3, " ") + "°";
    raf = requestAnimationFrame(tick);
  }
  function update() {
    const should = visible && !document.hidden && !reduce.matches;
    if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(tick); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }

  window.addEventListener("pointermove", e => {
    if (reduce.matches) return;
    const r = canvas.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / window.innerWidth * 2));
    const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / window.innerHeight * 2));
    tiltTarget = 0.32 + ny * 0.35;
    yawNudgeTarget = nx * 0.5;
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(canvas);
  }
  document.addEventListener("visibilitychange", update);
  reduce.addEventListener?.("change", () => { update(); draw(0); });

  const refresh = () => { readColors(); draw(0); };
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", refresh);
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  readColors();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  resize();
  update();

  // Section labels: draw their accent tick the first time each section scrolls into view.
  const sections = document.querySelectorAll("main section");
  if ("IntersectionObserver" in window && !reduce.matches) {
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -15% 0px" });
    sections.forEach(s => io.observe(s));
  }
})();
