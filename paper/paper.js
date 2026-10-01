/**
 * @file paper/paper.js
 * Progressive touches for the paper site. The page is complete without this:
 * it only names the current section in the running header, draws figures in
 * once, and opens collapsed notes for printing or when linked directly.
 */

const root = document.documentElement;
root.classList.add("js");

// Running header: a hairline once scrolled, and the section being read.
// The terminal used to live at /, and its ?cmd= deep links still point here.
if (location.pathname === "/" && new URLSearchParams(location.search).has("cmd")) {
  location.replace(`/matrix/${location.search}${location.hash}`);
}

const runhead = document.querySelector(".runhead");
const label = document.querySelector("[data-runhead]");
const fallback = label?.textContent ?? "";
const onScroll = () => runhead?.classList.toggle("is-stuck", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const sections = [...document.querySelectorAll("[data-title]")];
if (label && sections.length) {
  const visible = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      // Of the sections inside the reading band, the first in page order wins.
      const current = sections.find((s) => visible.has(s));
      label.textContent = current ? current.dataset.title : fallback;
    },
    { rootMargin: "-15% 0px -70% 0px" },
  );
  sections.forEach((s) => observer.observe(s));
}

// Figures draw themselves in once, unless the reader prefers less motion.
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  root.classList.add("draw");
  const drawer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-drawn");
        drawer.unobserve(e.target);
      }
    },
    { threshold: 0.35 },
  );
  document.querySelectorAll(".fig, .thumb").forEach((f) => drawer.observe(f));
}

// A link to an inline note (/#note-x) opens it.
function openLinkedNote() {
  if (!location.hash) return;
  let id;
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch {
    return; // a malformed hash ("#%") names nothing
  }
  document.getElementById(id)?.querySelector("details")?.setAttribute("open", "");
}
window.addEventListener("hashchange", openLinkedNote);
openLinkedNote();

// Print everything: collapsed notes open for the printout, then restore.
let closedForPrint = [];
window.addEventListener("beforeprint", () => {
  closedForPrint = [...document.querySelectorAll("details:not([open])")];
  closedForPrint.forEach((d) => (d.open = true));
});
window.addEventListener("afterprint", () => {
  closedForPrint.forEach((d) => (d.open = false));
  closedForPrint = [];
});
