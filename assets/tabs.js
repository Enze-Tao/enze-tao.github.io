// Tabs for the four sections. Each tab is a plain #link, so without this script
// the page simply shows every section; with it, one section shows at a time and
// the URL hash (#publications, #experience, ...) picks which.
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const tablist = document.querySelector('[role="tablist"]');
  if (!tablist) return;
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const names = tabs.map(t => t.getAttribute("aria-controls"));
  const panels = names.map(n => document.getElementById(n));
  const indicator = tablist.querySelector(".indicator");
  if (panels.some(p => !p)) return;

  document.documentElement.classList.add("has-tabs");
  let current = null;

  function place() {
    const i = names.indexOf(current);
    if (!indicator || i < 0) return;
    indicator.style.width = tabs[i].offsetWidth + "px";
    indicator.style.transform = "translateX(" + tabs[i].offsetLeft + "px)";
  }

  function show(name, focus) {
    if (!names.includes(name)) name = names[0];
    const changed = current !== null && name !== current;
    names.forEach((n, i) => {
      const on = n === name;
      tabs[i].setAttribute("aria-selected", on ? "true" : "false");
      tabs[i].tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on && changed) {
        panels[i].classList.remove("enter");
        void panels[i].offsetWidth; // restart the entrance animation
        panels[i].classList.add("enter");
      }
    });
    current = name;
    place();
    if (focus) tabs[names.indexOf(name)].focus();
  }

  function go(name, focus) {
    if (name !== current) {
      try { history.pushState(null, "", "#" + name); } catch (e) { /* sandboxed: keep going */ }
    }
    show(name, focus);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", e => { e.preventDefault(); go(names[i], false); });
  });

  tablist.addEventListener("keydown", e => {
    const i = names.indexOf(current);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: names.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    go(names[(next + names.length) % names.length], true);
  });

  const fromHash = () => decodeURIComponent(location.hash.slice(1));
  window.addEventListener("hashchange", () => show(fromHash(), false));
  window.addEventListener("popstate", () => show(fromHash(), false));

  show(fromHash(), false);
  // A link straight to #publications etc. should open at the top, with the header in view.
  if (location.hash) window.scrollTo(0, 0);

  if ("ResizeObserver" in window) new ResizeObserver(place).observe(tablist);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  requestAnimationFrame(() => indicator && indicator.classList.add("ready"));
})();
