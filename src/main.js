import { state } from "./engine/gameState.js";
import {
  getScene,
  applyEffects,
  getValidChoices,
} from "./engine/storyEngine.js";

// ================================================================
// ===== EXPOSE STATE =====
// ================================================================

window.__gameState = state;
window.state = state;

// ================================================================
// ===== MEMORY =====
// ================================================================

if (!state.memory) state.memory = {};
if (!state.memory.inventory) state.memory.inventory = [];
if (!state.memory.notes) state.memory.notes = [];
if (!state.memory.chatHistory) state.memory.chatHistory = {};
if (!state.memory.puzzleProgress) state.memory.puzzleProgress = {};

// ================================================================
// ===== VARIABLES =====
// ================================================================

let UI = null;
let episodesData = null;
let currentEpisode = null;
let currentScene = null;
let isTyping = false;

// کش عکس‌ها
const portraitCache = {};
let allPortraits = [];
let isPreloadingComplete = false;

// ================================================================
// ===== WAIT FOR UI =====
// ================================================================

function waitForUI() {
  if (window.DonimehUI) {
    UI = window.DonimehUI;
    console.log("✅ DonimehUI آماده است");
    initGame();
  } else {
    console.log("⏳ منتظر DonimehUI...");
    setTimeout(waitForUI, 100);
  }
}

// ================================================================
// ===== پیش‌بارگذاری همه عکس‌ها =====
// ================================================================

function extractAllPortraits() {
  if (!episodesData || !episodesData.episodes) return [];
  const portraits = new Set();
  episodesData.episodes.forEach((ep) => {
    Object.keys(ep.scenes).forEach((key) => {
      const scene = ep.scenes[key];
      if (scene.portrait) portraits.add(scene.portrait);
    });
  });
  return Array.from(portraits);
}

function preloadAllPortraits(portraits, onComplete) {
  if (!portraits || portraits.length === 0) {
    isPreloadingComplete = true;
    onComplete && onComplete();
    return;
  }

  let loaded = 0;
  const total = portraits.length;

  portraits.forEach((src) => {
    if (portraitCache[src]) {
      loaded++;
      if (loaded === total) {
        isPreloadingComplete = true;
        onComplete && onComplete();
      }
      return;
    }

    const img = new Image();
    img.onload = () => {
      portraitCache[src] = img;
      loaded++;
      if (loaded === total) {
        isPreloadingComplete = true;
        onComplete && onComplete();
      }
    };
    img.onerror = () => {
      loaded++;
      if (loaded === total) {
        isPreloadingComplete = true;
        onComplete && onComplete();
      }
    };
    img.src = src;
  });
}

// ================================================================
// ===== INIT GAME =====
// ================================================================

async function initGame() {
  try {
    console.log("🚀 شروع بارگذاری بازی...");

    const res = await fetch("assets/data/episodes.json");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    episodesData = await res.json();
    console.log("✅ episodes.json لود شد");

    if (!episodesData.episodes && Array.isArray(episodesData)) {
      episodesData = { episodes: episodesData };
    }

    allPortraits = extractAllPortraits();
    console.log(`🖼️ ${allPortraits.length} عکس برای پیش‌بارگذاری`);

    const urlParams = new URLSearchParams(window.location.search);
    const restart = urlParams.get("restart") === "true";
    const epParam = urlParams.get("ep");

    if (restart) {
      console.log("🔄 ریست کامل بازی...");
      localStorage.clear();
      state.episodeId = 1;
      state.sceneId = "station_intro";
      state.history = [];
      state.historyIndex = -1;
      state.memory = {};
      state.memory.inventory = [];
      state.memory.notes = [];
      state.memory.chatHistory = {};
      state.memory.puzzleProgress = {};

      loadCurrentEpisode();
      preloadAllPortraits(allPortraits, () => {
        renderScene();
        console.log("✅ بازی از اول شروع شد");
      });
      return;
    }

    if (epParam) {
      const epId = parseInt(epParam);
      const found = episodesData.episodes.find((e) => e.id === epId);
      if (found) {
        state.episodeId = epId;
        state.sceneId = found.startScene || Object.keys(found.scenes)[0];
        loadCurrentEpisode();
        console.log(`📺 رفتن به اپیزود ${epId}`);
        preloadAllPortraits(allPortraits, () => {
          renderScene();
        });
        return;
      }
    }

    const savedEpisode = localStorage.getItem("donimeh_episode");
    const savedScene = localStorage.getItem("donimeh_scene");

    state.episodeId = savedEpisode ? parseInt(savedEpisode) : 1;
    loadCurrentEpisode();

    if (savedScene && currentEpisode?.scenes[savedScene]) {
      state.sceneId = savedScene;
      console.log(`📂 sceneId بازیابی شد: ${savedScene}`);
    } else {
      state.sceneId =
        currentEpisode?.startScene ||
        Object.keys(currentEpisode?.scenes || {})[0];
      console.log(`📂 sceneId پیش‌فرض: ${state.sceneId}`);
    }

    console.log(`📺 اپیزود ${state.episodeId}، صحنه ${state.sceneId}`);

    preloadAllPortraits(allPortraits, () => {
      renderScene();
    });
  } catch (err) {
    console.error("❌ خطا در initGame:", err);
  }
}

// ================================================================
// ===== LOAD CURRENT EPISODE =====
// ================================================================

function loadCurrentEpisode() {
  console.log(
    `📖 loadCurrentEpisode called, state.episodeId: ${state.episodeId}`,
  );

  if (!episodesData || !episodesData.episodes) {
    console.warn("⚠️ episodesData یا episodesData.episodes خالی است!");
    return;
  }

  currentEpisode = episodesData.episodes.find(
    (ep) => Number(ep.id) === Number(state.episodeId),
  );

  if (!currentEpisode) {
    console.warn(`⚠️ اپیزود ${state.episodeId} پیدا نشد، رفتن به اپیزود 1`);
    currentEpisode = episodesData.episodes[0];
    state.episodeId = 1;
  }

  console.log(`📖 اپیزود ${state.episodeId} لود شد: ${currentEpisode?.title}`);
}

// ================================================================
// ===== NAVIGATION =====
// ================================================================

function updateNavButtons() {
  const prevBtn = document.getElementById("prevSceneBtn");
  const nextBtn = document.getElementById("nextSceneBtn");
  const indicator = document.getElementById("navIndicator");

  if (!prevBtn || !nextBtn || !indicator) return;

  const total = state.history.length;
  const current = state.historyIndex + 1;

  prevBtn.disabled = state.historyIndex <= 0;

  const hasNext = currentScene?.next || currentScene?.nextEpisode;
  const isEnd = state.historyIndex >= total - 1;
  nextBtn.disabled = isEnd && !hasNext;

  indicator.textContent = total > 0 ? `${current}/${total}` : "0/0";
}

function hideNavControls(hide) {
  const controls = document.querySelector(".nav-controls");
  if (controls) {
    controls.classList.toggle("hidden", hide);
  }
}

// ================================================================
// ===== ADVANCE SCENE =====
// ================================================================

function advanceScene() {
  console.log("🔍 advanceScene called");

  if (!UI || !currentEpisode) {
    console.warn("⚠️ UI یا currentEpisode آماده نیست!");
    return;
  }

  if (UI.isPhoneVisible?.()) {
    console.log("📱 گوشی باز است، advanceScene متوقف شد");
    return;
  }

  if (isTyping) {
    console.log("⌨️ تایپ در حال انجام، skip می‌شود");
    UI.skipTyping();
    isTyping = false;
    return;
  }

  const choices = getValidChoices(currentScene, state);
  if (choices.length > 0) {
    console.log("ℹ️ انتخاب وجود دارد، advanceScene متوقف شد");
    return;
  }

  if (currentScene?.nextEpisode != null) {
    const nextEp = Number(currentScene.nextEpisode);
    console.log(`📺 رفتن به اپیزود ${nextEp}`);

    UI.closePhone();
    UI.hidePuzzle();

    state.episodeId = nextEp;
    loadCurrentEpisode();

    if (!currentEpisode) {
      console.error(`❌ اپیزود ${state.episodeId} لود نشد!`);
      return;
    }

    state.history = [];
    state.historyIndex = -1;

    state.sceneId =
      currentEpisode.startScene || Object.keys(currentEpisode.scenes)[0];
    console.log(`✅ اپیزود ${state.episodeId} شروع شد، صحنه: ${state.sceneId}`);

    hideNavControls(false);
    saveProgress();
    renderScene();
    return;
  }

  if (currentScene?.next) {
    console.log(`➡️ رفتن به صحنه بعدی: ${currentScene.next}`);

    if (!currentEpisode.scenes[currentScene.next]) {
      console.error(`❌ صحنه ${currentScene.next} وجود ندارد!`);
      return;
    }

    UI.closePhone();
    UI.hidePuzzle();

    state.sceneId = currentScene.next;
    hideNavControls(false);
    saveProgress();
    renderScene();
    return;
  }

  console.log("📭 در انتهای داستان هستید، صحنه بعدی وجود ندارد");
}

// ================================================================
// ===== FUNCTIONS =====
// ================================================================

function updateEpisodeInfo() {
  const epNumberEl = document.getElementById("episodeNumber");
  const epNameEl = document.getElementById("episodeName");

  if (epNumberEl) {
    epNumberEl.textContent = currentEpisode?.id || "?";
  }

  if (epNameEl) {
    epNameEl.textContent = currentEpisode?.title || "بدون عنوان";
  }
}

function getSceneNumber(sceneId) {
  if (!sceneId) return 0;

  if (!isNaN(parseInt(sceneId, 10))) {
    return parseInt(sceneId, 10);
  }

  const match = sceneId.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  if (currentEpisode && currentEpisode.scenes) {
    const keys = Object.keys(currentEpisode.scenes);
    const index = keys.indexOf(sceneId);
    if (index >= 0) {
      return index + 1;
    }
  }

  return 0;
}

function saveToHistory() {
  const entry = {
    episodeId: state.episodeId,
    sceneId: state.sceneId,
    timestamp: Date.now(),
  };

  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }

  const last = state.history[state.history.length - 1];
  if (
    !last ||
    last.sceneId !== state.sceneId ||
    last.episodeId !== state.episodeId
  ) {
    state.history.push(entry);
    state.historyIndex = state.history.length - 1;
    if (state.history.length > 50) {
      state.history = state.history.slice(-50);
      state.historyIndex = state.history.length - 1;
    }
  }
}

// ================================================================
// ===== نمایش پرتره (بدون فلش) =====
// ================================================================

function setPortrait(src, portraitImg) {
  if (!portraitImg) return;
  if (src && portraitCache[src]) {
    portraitImg.src = src;
    portraitImg.style.opacity = "1";
  } else if (src) {
    // اگر در کش نبود (که نباید شود) اما باز هم نمایش بده
    portraitImg.src = src;
    portraitImg.style.opacity = "1";
  } else {
    portraitImg.src = "";
    portraitImg.style.opacity = "0";
  }
}

// ================================================================
// ===== مدیریت گوشی =====
// ================================================================

function handlePhoneData(phoneData) {
  hideNavControls(true);

  if (phoneData.header && phoneData.messages) {
    if (!state.memory.chatHistory) state.memory.chatHistory = {};
    if (!state.memory.chatHistory[phoneData.header]) {
      state.memory.chatHistory[phoneData.header] = [];
    }
    phoneData.messages.forEach((msg) => {
      const exists = state.memory.chatHistory[phoneData.header].some(
        (m) => m.text === msg.text && m.sent === msg.sent,
      );
      if (!exists) {
        state.memory.chatHistory[phoneData.header].push({
          text: msg.text,
          sent: msg.sent,
          timestamp: Date.now(),
        });
      }
    });
  }

  if (window.DonimehUI) {
    setTimeout(() => {
      window.DonimehUI.openPhone(phoneData.header);
      window.DonimehUI.setPhoneChat(
        phoneData.header,
        phoneData.messages || [],
        (phoneData.choices || []).map((c) => ({
          label: c.text,
          onSelect: () => {
            applyChoice(c);
            window.DonimehUI.closePhone();
            hideNavControls(false);
          },
        })),
        phoneData.input || null,
      );

      if (!phoneData.choices || phoneData.choices.length === 0) {
        const next = phoneData.next || currentScene.next;
        if (next) {
          setTimeout(() => {
            if (window.DonimehUI) window.DonimehUI.closePhone();
            state.sceneId = next;
            hideNavControls(false);
            renderScene();
          }, 4000);
        }
      }
    }, 500);
  }
}

// ================================================================
// ===== RENDER SCENE =====
// ================================================================

function renderScene() {
  console.log(`🎬 renderScene called, state.sceneId: ${state.sceneId}`);

  if (!currentEpisode) {
    console.warn("⚠️ currentEpisode خالی است!");
    return;
  }

  if (!state.sceneId) {
    state.sceneId =
      currentEpisode.startScene || Object.keys(currentEpisode.scenes)[0];
  }

  currentScene = currentEpisode.scenes[state.sceneId];

  if (!currentScene) {
    console.error(`❌ صحنه ${state.sceneId} پیدا نشد!`);
    const firstScene = Object.keys(currentEpisode.scenes)[0];
    if (firstScene) {
      state.sceneId = firstScene;
      currentScene = currentEpisode.scenes[firstScene];
    } else {
      console.error("❌ هیچ صحنه‌ای در اپیزود وجود ندارد!");
      return;
    }
  }

  console.log(`🎬 رندر: ${state.sceneId} (اپیزود ${state.episodeId})`);
  saveProgress();
  updateEpisodeInfo();
  updateProgress();

  // ============================================================
  //  اجرای onEnter (تغییر تم و شخصیت)
  // ============================================================

  if (currentScene.onEnter) {
    console.log("🎯 onEnter پیدا شد:", currentScene.onEnter);

    if (currentScene.onEnter.setCharacter) {
      console.log(`👤 تغییر شخصیت به: ${currentScene.onEnter.setCharacter}`);
      document.body.classList.remove(
        "theme-sina",
        "theme-rahi",
        "theme-mehras",
        "theme-cream-gold",
        "theme-blood-gold",
      );

      const roleNameEl = document.getElementById("currentRoleName");
      const characterNameEl = document.getElementById("characterName");

      const charMap = {
        rahi: {
          class: "theme-rahi",
          name: "رهی",
          theme: "pink-gold",
          msg: "🎭 شما در نقش رهی هستید | تم: صورتی-طلایی",
        },
        mehras: {
          class: "theme-mehras",
          name: "مهراس",
          theme: "blue-gold",
          msg: "🎭 شما در نقش مهراس هستید | تم: آبی-طلایی",
        },
        seyf: {
          class: "theme-cream-gold",
          name: "سیف",
          theme: "cream-gold",
          msg: "🎭 شما در نقش سیف هستید | تم: خامه‌ای-طلایی",
        },
        arya: {
          class: "theme-blood-gold",
          name: "آریا",
          theme: "blood-gold",
          msg: "🎭 شما در نقش آریا هستید | تم: قرمز خونی-طلایی",
        },
        sina: {
          class: "theme-sina",
          name: "سینا",
          theme: "dark-gold",
          msg: "🎭 بازگشت به نقش سینا",
        },
      };

      const char = charMap[currentScene.onEnter.setCharacter];
      if (char) {
        document.body.classList.add(char.class);
        if (roleNameEl) roleNameEl.textContent = char.name;
        if (characterNameEl) characterNameEl.textContent = char.name;

        if (window.DonimehUI && window.DonimehUI.showCharacterSwitch) {
          window.DonimehUI.showCharacterSwitch(
            char.name,
            currentScene.onEnter.setCharacter,
            currentScene.onEnter.showMessage || char.msg,
          );
        }
        state.currentCharacter = currentScene.onEnter.setCharacter;
        state.theme = char.theme;
        try {
          localStorage.setItem("gameTheme", char.theme);
          localStorage.setItem(
            "currentCharacter",
            currentScene.onEnter.setCharacter,
          );
        } catch (e) {}
      }
    }

    if (currentScene.onEnter.showMessage && UI && UI.showSystemMessage) {
      setTimeout(() => {
        UI.showSystemMessage(currentScene.onEnter.showMessage, 3500);
      }, 500);
    }
  }

  // ============================================================
  //  نمایش پرتره — کاملاً sync و بدون فلش
  // ============================================================

  const portraitSrc = currentScene.portrait || null;
  const portraitImg = document.getElementById("portraitImg");

  // مخفی کردن انتخاب‌ها تا وقتی دیالوگ آماده بشه
  const choicesContainer = document.getElementById("choicesContainer");
  if (choicesContainer) choicesContainer.style.display = "none";

  setPortrait(portraitSrc, portraitImg);

  // ============================================================
  //  نمایش دیالوگ (بدون تاخیر)
  // ============================================================

  const speaker = currentScene.speaker || "";
  const text = currentScene.dialogue || "";
  const narrator = currentScene.narrator || "";
  window._lastText = text || narrator;

  const choices = getValidChoices(currentScene, state);
  const phoneData = currentScene.phone;
  const hasChoices = choices.length > 0;

  if (window.DonimehUI) {
    window.DonimehUI.onTypeEnd(() => {
      isTyping = false;

      if (phoneData) {
        hideNavControls(true);
      } else {
        hideNavControls(false);
      }

      if (!phoneData) {
        const mapped = choices.map((c) => ({
          label: c.text,
          onSelect: () => applyChoice(c),
        }));
        window.DonimehUI.showChoices(mapped);
        hideNavControls(hasChoices);
      }
    });

    isTyping = true;
    window.DonimehUI.showDialogue(speaker, text || narrator);
  }

  // ===== گوشی =====
  if (phoneData) {
    handlePhoneData(phoneData);
  } else {
    if (window.DonimehUI) window.DonimehUI.closePhone();
    if (!hasChoices) {
      hideNavControls(false);
    }
  }

  // ===== پازل =====
  if (currentScene.puzzle && !currentScene.puzzleId) {
    hideNavControls(true);
    if (window.DonimehUI) {
      window.DonimehUI.showPuzzle(currentScene.puzzle.html || "");
    }
  } else if (!currentScene.puzzleId) {
    if (window.DonimehUI) window.DonimehUI.hidePuzzle();
  }

  saveToHistory();
  updateNavButtons();
}

// ================================================================
// ===== UPDATE PROGRESS =====
// ================================================================

function updateProgress() {
  if (!episodesData || !episodesData.episodes) {
    console.warn("⚠️ episodesData برای محاسبه پیشرفت موجود نیست");
    return;
  }

  let totalScenes = 0;
  episodesData.episodes.forEach((ep) => {
    if (ep.scenes) {
      totalScenes += Object.keys(ep.scenes).length;
    }
  });

  let doneScenes = 0;
  const currentEpNum = parseInt(state.episodeId, 10) || 1;

  for (const ep of episodesData.episodes) {
    const epNum = parseInt(ep.id, 10) || 1;

    if (epNum < currentEpNum) {
      if (ep.scenes) {
        doneScenes += Object.keys(ep.scenes).length;
      }
    } else if (epNum === currentEpNum) {
      if (ep.scenes) {
        const sceneKeys = Object.keys(ep.scenes);
        const currentIndex = sceneKeys.indexOf(state.sceneId);
        if (currentIndex >= 0) {
          doneScenes += currentIndex + 1;
        }
      }
    }
  }

  const pct =
    totalScenes > 0 ? Math.round((doneScenes / totalScenes) * 100) : 0;
  const pctFa = pct.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

  const pctEl = document.getElementById("progressPercent");
  const fillEl = document.getElementById("progressFill");
  const dotEl = document.getElementById("progressDot");
  const detailEl = document.getElementById("progressDetail");

  if (pctEl) pctEl.textContent = pctFa + "٪";
  if (fillEl) fillEl.style.width = pct + "%";
  if (dotEl) dotEl.style.left = pct + "%";

  if (detailEl) {
    const epFa =
      ["", "یکم", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم"][currentEpNum] ||
      "";
    const sceneNum = getSceneNumber(state.sceneId);
    const totalInEp = currentEpisode?.scenes
      ? Object.keys(currentEpisode.scenes).length
      : 0;
    detailEl.textContent = `فصل ${epFa} — ${sceneNum} از ${totalInEp} صحنه`;
  }

  console.log(
    `📊 پیشرفت کل داستان: ${pct}% (${doneScenes}/${totalScenes} صحنه)`,
  );
}

// ================================================================
// ===== SAVE =====
// ================================================================

function saveProgress() {
  try {
    const episodeNum = parseInt(state.episodeId, 10) || 1;
    const sceneNum = getSceneNumber(state.sceneId);

    localStorage.setItem("donimeh_currentEpisode", episodeNum);
    localStorage.setItem("donimeh_currentScene", sceneNum);
    localStorage.setItem("donimeh_episode", episodeNum);
    localStorage.setItem("donimeh_scene", sceneNum);
    localStorage.setItem("donimeh_has_progress", "true");

    localStorage.setItem(
      "donimeh_chatHistory",
      JSON.stringify(state.memory.chatHistory || {}),
    );

    if (state.memory.ep1FinalChoice) {
      localStorage.setItem("donimeh_ep1_choice", state.memory.ep1FinalChoice);
    }
    if (state.memory.ep2FinalChoice) {
      localStorage.setItem("donimeh_ep2_choice", state.memory.ep2FinalChoice);
    }

    console.log(
      `💾 ذخیره شد: اپیزود ${episodeNum}, صحنه ${sceneNum} (${state.sceneId})`,
    );
  } catch (e) {
    console.warn("⚠️ خطا در ذخیره‌سازی:", e);
  }
}

// ================================================================
// ===== APPLY CHOICE =====
// ================================================================

function applyChoice(choice) {
  console.log(`🔀 انتخاب: ${choice.text}`);

  // ===== فلش طلایی =====
  if (window.DonimehUI && window.DonimehUI.triggerGoldenFlash) {
    window.DonimehUI.triggerGoldenFlash();
  }

  // ===== پیام سیستمی برای انتخاب‌های مهم =====
  if (choice.important) {
    if (window.DonimehUI && window.DonimehUI.showSystemMessage) {
      window.DonimehUI.showSystemMessage("✦ انتخاب شما ثبت شد ✦");
    }
  }

  state.history.push({
    episode: state.episodeId,
    scene: state.sceneId,
    choice: choice.text,
  });

  applyEffects(choice.effects, state);

  if (choice.addNote) {
    if (!state.memory.notes) state.memory.notes = [];
    state.memory.notes.push({ text: choice.addNote.text || choice.addNote });
  }

  if (choice.addItem) {
    if (!state.memory.inventory) state.memory.inventory = [];
    if (!state.memory.inventory.some((it) => it.id === choice.addItem.id)) {
      state.memory.inventory.push({
        id: choice.addItem.id,
        name: choice.addItem.name,
        icon: choice.addItem.icon || "📦",
        description: choice.addItem.description || "",
      });
      saveProgress();
      if (UI.isPhoneVisible?.()) {
        setTimeout(() => UI.renderPhoneItems?.(), 100);
      }
    }
  }

  if (choice.nextEpisode) {
    console.log(`📺 رفتن به اپیزود ${choice.nextEpisode} (از طریق انتخاب)`);
    state.episodeId = choice.nextEpisode;
    loadCurrentEpisode();
    state.sceneId =
      currentEpisode?.startScene ||
      Object.keys(currentEpisode?.scenes || {})[0];
    renderScene();
    return;
  }

  if (choice.next) {
    console.log(`➡️ رفتن به صحنه ${choice.next} (از طریق انتخاب)`);
    state.sceneId = choice.next;
    renderScene();
    return;
  }
}
// ================================================================
// ===== GO TO PREVIOUS/NEXT SCENE =====
// ================================================================

function goToPreviousScene() {
  if (state.historyIndex <= 0) {
    console.log("📭 در ابتدای تاریخچه هستید");
    return;
  }

  UI.closePhone();
  UI.hidePuzzle();

  state.historyIndex--;
  const entry = state.history[state.historyIndex];

  if (entry) {
    state.episodeId = entry.episodeId;
    state.sceneId = entry.sceneId;
    loadCurrentEpisode();
    hideNavControls(false);
    renderScene();
    console.log(`⬅️ برگشت به: ${state.sceneId}`);
  }
}

function goToNextScene() {
  if (state.historyIndex >= state.history.length - 1) {
    console.log("📭 در انتهای تاریخچه هستید");
    return;
  }

  UI.closePhone();
  UI.hidePuzzle();

  state.historyIndex++;
  const entry = state.history[state.historyIndex];

  if (entry) {
    state.episodeId = entry.episodeId;
    state.sceneId = entry.sceneId;
    loadCurrentEpisode();
    hideNavControls(false);
    renderScene();
    console.log(`➡️ رفتن به: ${state.sceneId}`);
  }
}

// ================================================================
// ===== ITEM SYSTEM =====
// ================================================================

function receiveItem(itemId, itemName, itemIcon, itemDescription) {
  const item = {
    id: itemId,
    name: itemName,
    icon: itemIcon || "📦",
    description: itemDescription || "",
  };

  if (!state.memory.inventory) state.memory.inventory = [];
  if (state.memory.inventory.some((it) => it.id === itemId)) {
    if (UI && UI.showSystemMessage) {
      UI.showSystemMessage(`📦 ${itemIcon} ${itemName} — از قبل دارید`);
    }
    return;
  }

  state.memory.inventory.push(item);

  if (UI && UI.showSystemMessage) {
    UI.showSystemMessage(`📦 ${itemIcon} ${itemName} — دریافت شد!`);
  }

  const flash = document.getElementById("golden-flash");
  if (flash) {
    flash.classList.add("flash");
    setTimeout(() => flash.classList.remove("flash"), 400);
  }

  const badge = document.getElementById("bag-badge");
  if (badge) {
    const current = parseInt(badge.textContent) || 0;
    badge.textContent = current + 1;
  }

  saveProgress();
}

window.receiveItem = receiveItem;

// ================================================================
// ===== EXPOSE =====
// ================================================================

window.advanceScene = advanceScene;
window.renderScene = renderScene;
window.applyChoice = applyChoice;
window.saveProgress = saveProgress;
window.goToPreviousScene = goToPreviousScene;
window.goToNextScene = goToNextScene;
window.getState = () => state;
window.getCurrentEpisode = () => currentEpisode;
window.getCurrentScene = () => currentScene;

// ================================================================
// ===== EVENTS =====
// ================================================================

document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    advanceScene();
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    goToPreviousScene();
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    goToNextScene();
  }
});

document.addEventListener("click", (e) => {
  if (
    e.target.closest(".choice-btn") ||
    e.target.closest("#phoneOverlay") ||
    e.target.closest("#backBtn") ||
    e.target.closest("#puzzleOverlay") ||
    e.target.closest("#inventoryDrawer")
  ) {
    return;
  }
  advanceScene();
});

document.getElementById("backBtn")?.addEventListener("click", () => {
  window.location.href = "index.html?landing=true";
});

document
  .getElementById("prevSceneBtn")
  ?.addEventListener("click", goToPreviousScene);
document
  .getElementById("nextSceneBtn")
  ?.addEventListener("click", goToNextScene);

// ================================================================
// ===== START =====
// ================================================================

console.log("🎮 دو نیمه — در حال راه‌اندازی...");
waitForUI();
