/**
 * src/landing.js
 * پروژه «دو نیمه» (Donimeh)
 */

// ==================== STATE ====================
const STATE = { isOpen: false, dustPlayed: false };

// ==================== DOM ====================
const DOM = {
  bookEntrance: document.getElementById("bookEntrance"),
  bookClosed: document.getElementById("bookClosed"),
  bookShadow: document.getElementById("bookShadow"),
  dustOverlay: document.getElementById("dustOverlay"),
  paperLanding: document.getElementById("paperLanding"),
  customScrollbar: document.getElementById("customScrollbar"),
  scrollThumb: document.getElementById("scrollThumb"),
  progressPercent: document.getElementById("progressPercent"),
  progressFill: document.getElementById("progressFill"),
  progressLabel: document.getElementById("progressLabel"),
  episodeList: document.getElementById("episodeList"),
  journalStats: document.getElementById("journalStats"),
  storyMap: document.getElementById("storyMap"),
  btnContinue: document.getElementById("btnContinue"),
  btnRestart: document.getElementById("btnRestart"),
  quoteNav: document.getElementById("quoteNav"),
};

// ==================== EPISODES ====================
const DEFAULT_EPISODES = [
  { id: "ep1", title: "اپیزود اول", subtitle: "آشنایی با شهر برفی", order: 1 },
  { id: "ep2", title: "اپیزود دوم", subtitle: "کوچه‌های مه‌آلود", order: 2 },
  { id: "ep3", title: "اپیزود سوم", subtitle: "راز خانه قدیمی", order: 3 },
  { id: "ep4", title: "اپیزود چهارم", subtitle: "شب یلدا", order: 4 },
  { id: "ep5", title: "اپیزود پنجم", subtitle: "طلوع سپیده", order: 5 },
];
let episodesData = [...DEFAULT_EPISODES];

// ==================== PROGRESS ====================
// تابع کمکی امن برای خوندن از localStorage
function safeGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    // اول چک می‌کنیم ببینیم JSON معتبره یا نه
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    // اگه JSON نبود، خود مقدار خام رو برگردون (برای کلیدهای قدیمی)
    const raw = localStorage.getItem(key);
    // اگه مقدار خام شبیه عدد بود، عدد برگردون
    if (raw && !isNaN(raw)) return Number(raw);
    // اگه boolean بود
    if (raw === "true") return true;
    if (raw === "false") return false;
    // در غیر این صورت fallback
    return fallback;
  }
}

function getProgress() {
  const episode = safeGet("donimeh_episode", null);
  const scene = safeGet("donimeh_scene", null);
  const hasProgress = safeGet("donimeh_has_progress", false);
  const puzzleProgress = safeGet("donimeh_puzzleProgress", {});
  const inventory = safeGet("donimeh_inventory", []);
  const notes = safeGet("donimeh_notes", []);

  return {
    episode,
    scene,
    hasProgress: Boolean(hasProgress),
    completedPuzzles: Object.keys(puzzleProgress || {}).length,
    totalItems: Array.isArray(inventory) ? inventory.length : 0,
    totalNotes: Array.isArray(notes) ? notes.length : 0,
  };
}

async function loadEpisodes() {
  try {
    const r = await fetch("assets/data/episodes.json");
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d) && d.length) episodesData = d;
    }
  } catch (e) {
    episodesData = [...DEFAULT_EPISODES];
  }
}

// ==================== DUST ====================
function spawnDust() {
  const ov = DOM.dustOverlay;
  const pr = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const im = window.innerWidth < 480;
  const cnt = pr ? 6 : im ? 50 : 100;
  const cols = [
    "#d4a846",
    "#c0c8d4",
    "#8a7540",
    "#e8edf2",
    "#b8963c",
    "#d9dfe8",
    "#a08030",
  ];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < cnt; i++) {
    const p = document.createElement("div");
    p.classList.add("dust-particle");
    const sz = 2 + Math.random() * 7,
      cl = cols[Math.floor(Math.random() * cols.length)],
      op = 0.5 + Math.random() * 0.5;
    const dur = pr ? 0.2 : 2 + Math.random() * 1,
      sx = Math.random() * window.innerWidth,
      sy = Math.random() * window.innerHeight;
    const ang = Math.random() * Math.PI * 2,
      dist = 80 + Math.random() * 250,
      dx = Math.cos(ang) * dist,
      dy = Math.sin(ang) * dist - 60;
    p.style.cssText = `left:${sx}px;top:${sy}px;width:${sz}px;height:${sz}px;background:${cl};box-shadow:0 0 ${sz * 3}px ${cl};--dust-duration:${dur}s;--dust-opacity:${op};--drift-x:${dx}px;--drift-y:${dy}px;`;
    frag.appendChild(p);
  }
  ov.appendChild(frag);
  setTimeout(() => {
    while (ov.firstChild) ov.removeChild(ov.firstChild);
  }, 3200);
}

// ==================== OPEN BOOK ====================
function openBook() {
  if (STATE.isOpen) return;
  STATE.isOpen = true;
  STATE.dustPlayed = true;
  DOM.bookClosed.classList.add("book-closed--opening");
  DOM.bookShadow.style.opacity = "0";
  setTimeout(() => {
    DOM.dustOverlay.classList.add("dust-overlay--active");
    spawnDust();
  }, 400);
  setTimeout(() => {
    DOM.dustOverlay.classList.remove("dust-overlay--active");
    setTimeout(() => {
      DOM.bookEntrance.classList.add("book-entrance--hidden");
      DOM.paperLanding.classList.add("paper-landing--visible");
      DOM.customScrollbar.classList.add("custom-scrollbar--visible");
      renderLanding();
    }, 500);
  }, 2900);
}

// ==================== RENDER LANDING ====================
function renderLanding() {
  const pg = getProgress();
  const totalEps = episodesData.length;
  const curEp = pg.episode ? parseInt(pg.episode) : 0;
  const completed = pg.hasProgress ? Math.max(1, curEp) : 0;
  const pct = totalEps > 0 ? Math.round((completed / totalEps) * 100) : 0;

  DOM.progressPercent.textContent = `${pct}٪`;
  DOM.progressFill.style.width = `${pct}%`;
  DOM.progressLabel.textContent = `${completed} از ${totalEps} اپیزود کامل شده`;

  // اپیزودها
  let epHTML = "";
  episodesData.forEach((ep, i) => {
    const eid = ep.id || `ep${i + 1}`,
      eo = ep.order || i + 1;
    let st = "🔒",
      cl = "",
      clk = false;
    if (pg.hasProgress) {
      const co = pg.episode ? parseInt(pg.episode) : 0;
      if (eo < co || (eo === co && pg.scene)) {
        st = "✅";
        clk = true;
        cl = " episode-item--clickable";
      } else if (eo === co || (!pg.scene && eo === 1)) {
        st = "🔄";
        clk = true;
        cl = " episode-item--clickable";
      }
    } else if (i === 0) {
      st = "🔄";
      clk = true;
      cl = " episode-item--clickable";
    }
    epHTML += `<div class="episode-item${cl}" data-ep-id="${eid}" data-clickable="${clk}"><span class="episode-status">${st}</span><div class="episode-info"><div class="episode-title">${escapeHTML(ep.title)}</div><div class="episode-subtitle">${escapeHTML(ep.subtitle || "")}</div></div></div>`;
  });
  DOM.episodeList.innerHTML = epHTML;
  DOM.episodeList.querySelectorAll('[data-clickable="true"]').forEach((it) => {
    it.addEventListener("click", () => {
      const eid = it.getAttribute("data-ep-id");
      if (eid) window.location.href = `game.html?ep=${encodeURIComponent(eid)}`;
    });
  });

  // دفترچه
  DOM.journalStats.innerHTML = `
        <div class="journal-row"><span class="journal-label">🧩 پازل‌های حل شده</span><span class="journal-value">${pg.completedPuzzles} از ۵</span></div>
        <div class="journal-row"><span class="journal-label">🗝️ آیتم‌های جمع‌آوری شده</span><span class="journal-value">${pg.totalItems} عدد</span></div>
        <div class="journal-row"><span class="journal-label">✍️ انتخاب‌های مهم</span><span class="journal-value">${pg.totalNotes} مورد</span></div>
    `;

  // نقشه
  let mapHTML = "";
  episodesData.forEach((ep, i) => {
    const eo = ep.order || i + 1;
    let dc = "map-dot--locked",
      lc = "map-label--dim";
    if (pg.hasProgress) {
      const co = pg.episode ? parseInt(pg.episode) : 0;
      if (eo < co) {
        dc = "map-dot--completed";
        lc = "";
      } else if (eo === co) {
        dc = "map-dot--active";
        lc = "";
      }
    } else if (i === 0) {
      dc = "map-dot--active";
      lc = "";
    }
    mapHTML += `<div class="map-point"><span class="map-dot ${dc}"></span><span class="map-label ${lc}">${escapeHTML(ep.title)}</span></div>`;
  });
  DOM.storyMap.innerHTML = mapHTML;

  // نقل قول‌ها
  renderQuotes();

  // CTA
  if (pg.hasProgress) {
    DOM.btnContinue.style.display = "inline-block";
    DOM.btnRestart.textContent = "🚀 شروع از اول";
  } else {
    DOM.btnContinue.style.display = "none";
    DOM.btnRestart.textContent = "🚀 شروع ماجرا";
  }

  // Reveal on scroll
  observeReveal();
}

// ==================== QUOTES ====================
function renderQuotes() {
  const items = document.querySelectorAll(".quote-item");
  const nav = DOM.quoteNav;
  nav.innerHTML = "";
  let cur = 0,
    timer;
  items.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "q-dot" + (i === 0 ? " active" : "");
    d.addEventListener("click", () => goTo(i));
    nav.appendChild(d);
  });
  function goTo(n) {
    items[cur].classList.remove("active");
    nav.children[cur].classList.remove("active");
    cur = (n + items.length) % items.length;
    items[cur].classList.add("active");
    nav.children[cur].classList.add("active");
    resetTimer();
  }
  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(cur + 1), 5000);
  }
  resetTimer();
}

// ==================== SCROLLBAR + REVEAL ====================
function observeReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// اسکرول‌بار
// اسکرول‌بار کاستوم
function updateScrollbar() {
  const paper = DOM.paperLanding;
  const scrollTop = paper.scrollTop;
  const scrollHeight = paper.scrollHeight;
  const clientHeight = paper.clientHeight;
  const maxScroll = scrollHeight - clientHeight;

  if (maxScroll <= 0) {
    DOM.customScrollbar.classList.remove("custom-scrollbar--visible");
    return;
  }

  DOM.customScrollbar.classList.add("custom-scrollbar--visible");

  // ارتفاع thumb متناسب با نسبت
  const thumbHeight = Math.max(
    30,
    (clientHeight / scrollHeight) * clientHeight,
  );
  DOM.scrollThumb.style.height = thumbHeight + "px";

  // موقعیت thumb
  const thumbTop = (scrollTop / maxScroll) * (clientHeight - thumbHeight);
  DOM.scrollThumb.style.top = thumbTop + "px";
}

// توی DOMContentLoaded یا بعد از نمایش لندینگ:
DOM.paperLanding.addEventListener("scroll", updateScrollbar, { passive: true });
window.addEventListener("resize", updateScrollbar);
// ==================== EVENTS ====================
DOM.bookClosed.addEventListener("click", (e) => {
  e.preventDefault();
  openBook();
});
DOM.bookClosed.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openBook();
  }
});

// ==================== INIT ====================
async function init() {
  await loadEpisodes();
  console.log("📖 دو نیمه آماده است");
}
function escapeHTML(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
document.addEventListener("DOMContentLoaded", init);
