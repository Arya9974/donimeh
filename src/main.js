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

    // تصحیح ساختار
    if (!episodesData.episodes && Array.isArray(episodesData)) {
      episodesData = { episodes: episodesData };
    }

    // ===== چک کردن restart =====
    const urlParams = new URLSearchParams(window.location.search);
    const restart = urlParams.get("restart") === "true";
    const epParam = urlParams.get("ep");

    // ===== مدیریت restart =====
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
      renderScene();
      console.log("✅ بازی از اول شروع شد");
      return;
    }

    // ===== مدیریت پارامتر ep =====
    if (epParam) {
      const epId = parseInt(epParam);
      const found = episodesData.episodes.find((e) => e.id === epId);
      if (found) {
        state.episodeId = epId;
        state.sceneId = found.startScene || Object.keys(found.scenes)[0];
        loadCurrentEpisode();
        console.log(`📺 رفتن به اپیزود ${epId}`);
        renderScene();
        return;
      }
    }

    // ===== بارگذاری معمولی از localStorage =====
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
    renderScene();
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
// ===== ADVANCE SCENE (مهم!) =====
// ================================================================

function advanceScene() {
  console.log("🔍 advanceScene called");
  console.log("📍 state.episodeId:", state.episodeId);
  console.log("📍 state.sceneId:", state.sceneId);
  console.log("📍 currentScene:", currentScene);
  console.log("📍 currentScene?.next:", currentScene?.next);
  console.log("📍 currentScene?.nextEpisode:", currentScene?.nextEpisode);

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

  // ===== STEP 1: چک کردن nextEpisode (اولویت اول) =====
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

    // ریست کردن history برای اپیزود جدید
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

  // ===== STEP 2: چک کردن next =====
  if (currentScene?.next) {
    console.log(`➡️ رفتن به صحنه بعدی: ${currentScene.next}`);

    // اعتبارسنجی: آیا صحنه بعدی وجود داره؟
    if (!currentEpisode.scenes[currentScene.next]) {
      console.error(`❌ صحنه ${currentScene.next} وجود ندارد!`);
      console.log(`📌 صحنه‌های موجود:`, Object.keys(currentEpisode.scenes));
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
// ===== RENDER SCENE =====
// ================================================================

// ===== RENDER SCENE =====
function renderScene() {
  console.log(`🎬 renderScene called, state.sceneId: ${state.sceneId}`);

  if (!currentEpisode) {
    console.warn("⚠️ currentEpisode خالی است!");
    return;
  }

  if (!state.sceneId) {
    console.warn("⚠️ state.sceneId خالی است!");
    state.sceneId =
      currentEpisode.startScene || Object.keys(currentEpisode.scenes)[0];
  }

  currentScene = currentEpisode.scenes[state.sceneId];

  if (!currentScene) {
    console.error(`❌ صحنه ${state.sceneId} پیدا نشد!`);
    const firstScene = Object.keys(currentEpisode.scenes)[0];
    if (firstScene) {
      console.log(`🔄 رفتن به اولین صحنه: ${firstScene}`);
      state.sceneId = firstScene;
      currentScene = currentEpisode.scenes[firstScene];
    } else {
      console.error("❌ هیچ صحنه‌ای در اپیزود وجود ندارد!");
      return;
    }
  }

  console.log(`🎬 رندر: ${state.sceneId} (اپیزود ${state.episodeId})`);
  saveProgress();
  // ===== به‌روزرسانی اطلاعات اپیزود در هدر =====
  updateEpisodeInfo();

  // ============================================================
  // ===== به‌روزرسانی نوار پیشرفت =====
  // ============================================================
  updateProgress();

  // ============================================================
  // ===== اجرای onEnter =====
  // ============================================================
  if (currentScene.onEnter) {
    console.log("🎯 onEnter پیدا شد:", currentScene.onEnter);

    if (currentScene.onEnter.setCharacter) {
      console.log(`👤 تغییر شخصیت به: ${currentScene.onEnter.setCharacter}`);

      // حذف کلاس‌های تم قبلی
      document.body.classList.remove(
        "theme-sina",
        "theme-rahi",
        "theme-mehras",
        "theme-cream-gold",
        "theme-blood-gold",
      );

      // ===== تعریف یکبار متغیرها =====
      const roleNameEl = document.getElementById("currentRoleName");
      const characterNameEl = document.getElementById("characterName");

      if (currentScene.onEnter.setCharacter === "rahi") {
        document.body.classList.add("theme-rahi");

        if (roleNameEl) roleNameEl.textContent = "رهی";
        if (characterNameEl) characterNameEl.textContent = "رهی";

        if (window.DonimehUI && window.DonimehUI.showCharacterSwitch) {
          window.DonimehUI.showCharacterSwitch(
            "رهی",
            "rahi",
            currentScene.onEnter.showMessage ||
              "🎭 شما در نقش رهی هستید | تم: صورتی-طلایی",
          );
        }
        state.currentCharacter = "rahi";
        state.theme = "pink-gold";
        try {
          localStorage.setItem("gameTheme", "pink-gold");
          localStorage.setItem("currentCharacter", "rahi");
        } catch (e) {}
      } else if (currentScene.onEnter.setCharacter === "mehras") {
        document.body.classList.add("theme-mehras");

        if (roleNameEl) roleNameEl.textContent = "مهراس";
        if (characterNameEl) characterNameEl.textContent = "مهراس";

        if (window.DonimehUI && window.DonimehUI.showCharacterSwitch) {
          window.DonimehUI.showCharacterSwitch(
            "مهراس",
            "mehras",
            currentScene.onEnter.showMessage ||
              "🎭 شما در نقش مهراس هستید | تم: آبی-طلایی",
          );
        }
        state.currentCharacter = "mehras";
        state.theme = "blue-gold";
        try {
          localStorage.setItem("gameTheme", "blue-gold");
          localStorage.setItem("currentCharacter", "mehras");
        } catch (e) {}
      } else if (currentScene.onEnter.setCharacter === "seyf") {
        document.body.classList.add("theme-cream-gold");

        if (roleNameEl) roleNameEl.textContent = "سیف";
        if (characterNameEl) characterNameEl.textContent = "سیف";

        if (window.DonimehUI && window.DonimehUI.showCharacterSwitch) {
          window.DonimehUI.showCharacterSwitch(
            "سیف",
            "seyf",
            currentScene.onEnter.showMessage ||
              "🎭 شما در نقش سیف هستید | تم: خامه‌ای-طلایی",
          );
        }
        state.currentCharacter = "seyf";
        state.theme = "cream-gold";
        try {
          localStorage.setItem("gameTheme", "cream-gold");
          localStorage.setItem("currentCharacter", "seyf");
        } catch (e) {}
      } else if (currentScene.onEnter.setCharacter === "arya") {
        document.body.classList.add("theme-blood-gold");

        if (roleNameEl) roleNameEl.textContent = "آریا";
        if (characterNameEl) characterNameEl.textContent = "آریا";

        if (window.DonimehUI && window.DonimehUI.showCharacterSwitch) {
          window.DonimehUI.showCharacterSwitch(
            "آریا",
            "arya",
            currentScene.onEnter.showMessage ||
              "🎭 شما در نقش آریا هستید | تم: قرمز خونی-طلایی",
          );
        }
        state.currentCharacter = "arya";
        state.theme = "blood-gold";
        try {
          localStorage.setItem("gameTheme", "blood-gold");
          localStorage.setItem("currentCharacter", "arya");
        } catch (e) {}
      } else if (currentScene.onEnter.setCharacter === "sina") {
        document.body.classList.add("theme-sina");

        if (roleNameEl) roleNameEl.textContent = "سینا";
        if (characterNameEl) characterNameEl.textContent = "سینا";

        if (window.DonimehUI && window.DonimehUI.showCharacterSwitch) {
          window.DonimehUI.showCharacterSwitch(
            "سینا",
            "sina",
            currentScene.onEnter.showMessage || "🎭 بازگشت به نقش سینا",
          );
        }
        state.currentCharacter = "sina";
        state.theme = "dark-gold";
        try {
          localStorage.setItem("gameTheme", "dark-gold");
          localStorage.setItem("currentCharacter", "sina");
        } catch (e) {}
      }
    }

    if (currentScene.onEnter.showMessage && UI && UI.showSystemMessage) {
      setTimeout(() => {
        UI.showSystemMessage(currentScene.onEnter.showMessage, 3500);
      }, 500);
    }
  }
  // ===== ذخیره در history =====
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

  updateNavButtons();
  // ===== به‌روزرسانی اطلاعات اپیزود در هدر =====
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
  // ===== پازل قفل‌شده =====
  if (
    currentScene.puzzleId &&
    !state.memory.puzzleProgress[currentScene.puzzleId]
  ) {
    if (currentScene.puzzle) {
      hideNavControls(true);
      UI.showPuzzle(currentScene.puzzle.html || "");
      window._resolvePuzzle = (success) => {
        UI.hidePuzzle();
        if (success) {
          state.memory.puzzleProgress[currentScene.puzzleId] = true;
          if (currentScene.onSolve) {
            state.sceneId = currentScene.onSolve;
          }
        }
        hideNavControls(false);
        renderScene();
      };
      return;
    }
  }

  // ===== پرتره =====
  if (currentScene.portrait) {
    UI.showPortrait(currentScene.portrait);
  } else {
    UI.showPortrait(null);
  }

  // ===== دیالوگ =====
  const speaker = currentScene.speaker || "";
  const text = currentScene.dialogue || "";
  const narrator = currentScene.narrator || "";
  window._lastText = text || narrator;

  const choices = getValidChoices(currentScene, state);
  const phoneData = currentScene.phone;
  const hasChoices = choices.length > 0;

  // ===== تایپ متن =====
  UI.onTypeEnd(() => {
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
      UI.showChoices(mapped);
      hideNavControls(hasChoices);
    }
  });

  isTyping = true;
  UI.showDialogue(speaker, text || narrator);

  // ===== گوشی =====
  if (phoneData) {
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

    setTimeout(() => {
      UI.openPhone(phoneData.header);
      UI.setPhoneChat(
        phoneData.header,
        phoneData.messages || [],
        (phoneData.choices || []).map((c) => ({
          label: c.text,
          onSelect: () => {
            applyChoice(c);
            UI.closePhone();
            hideNavControls(false);
          },
        })),
        phoneData.input || null,
      );

      if (!phoneData.choices || phoneData.choices.length === 0) {
        const next = phoneData.next || currentScene.next;
        if (next) {
          setTimeout(() => {
            UI.closePhone();
            state.sceneId = next;
            hideNavControls(false);
            renderScene();
          }, 4000);
        }
      }
    }, 500);
  } else {
    UI.closePhone();
    if (!hasChoices) {
      hideNavControls(false);
    }
  }

  // ===== پازل غیرقفل =====
  if (currentScene.puzzle && !currentScene.puzzleId) {
    hideNavControls(true);
    UI.showPuzzle(currentScene.puzzle.html || "");
  } else if (!currentScene.puzzleId) {
    UI.hidePuzzle();
  }
}

// ================================================================
// ===== UPDATE PROGRESS =====
// ================================================================

function updateProgress() {
  // پیدا کردن کل صحنه‌های اپیزود فعلی
  const sceneKeys = Object.keys(currentEpisode.scenes);
  const totalScenes = sceneKeys.length;

  // پیدا کردن ایندکس صحنه فعلی
  const currentIndex = sceneKeys.indexOf(state.sceneId);
  const progress =
    currentIndex >= 0 ? Math.round((currentIndex / totalScenes) * 100) : 0;

  // === به‌روزرسانی عدد درصد ===
  const pctEl = document.getElementById("progressPercent");
  if (pctEl) {
    const pctFa = progress.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
    pctEl.textContent = pctFa + "٪";
  }

  // === به‌روزرسانی نوار پیشرفت ===
  const fillEl = document.getElementById("progressFill");
  if (fillEl) {
    fillEl.style.width = progress + "%";
  }

  // === به‌روزرسانی نقطه طلایی ===
  const dotEl = document.getElementById("progressDot");
  if (dotEl) {
    dotEl.style.left = progress + "%";
  }

  console.log(
    `📊 پیشرفت: ${progress}% (صحنه ${currentIndex + 1}/${totalScenes})`,
  );
}
// ================================================================
// ===== دکمه برگشت به لندینگ =====
// ================================================================

document.getElementById("backToLanding")?.addEventListener("click", () => {
  window.location.href = "index.html";
});

// ================================================================
// ===== دکمه‌های ناوبری =====
// ================================================================

// این کدها قبلاً توی main.js هستن، ولی مطمئن شو که وجود دارن:
// document.getElementById("prevSceneBtn")?.addEventListener("click", goToPreviousScene);
// document.getElementById("nextSceneBtn")?.addEventListener("click", goToNextScene);

// تابع updateNavButtons هم باید توی main.js باشه که وضعیت دکمه‌ها رو به‌روز کنه.
// ================================================================
// ===== ITEM SYSTEM =====
// ================================================================

// تابع برای دریافت آیتم (از هر جای بازی قابل صدا زدن)
function receiveItem(itemId, itemName, itemIcon, itemDescription) {
  const item = {
    id: itemId,
    name: itemName,
    icon: itemIcon || "📦",
    description: itemDescription || "",
  };

  // اضافه به inventory
  if (!state.memory.inventory) state.memory.inventory = [];
  if (state.memory.inventory.some((it) => it.id === itemId)) {
    if (UI && UI.showSystemMessage) {
      UI.showSystemMessage(`📦 ${itemIcon} ${itemName} — از قبل دارید`);
    }
    return;
  }

  state.memory.inventory.push(item);

  // نمایش پیام
  if (UI && UI.showSystemMessage) {
    UI.showSystemMessage(`📦 ${itemIcon} ${itemName} — دریافت شد!`);
  }

  // فلش طلایی
  const flash = document.getElementById("golden-flash");
  if (flash) {
    flash.classList.add("flash");
    setTimeout(() => flash.classList.remove("flash"), 400);
  }

  // به‌روزرسانی badge
  const badge = document.getElementById("bag-badge");
  if (badge) {
    const current = parseInt(badge.textContent) || 0;
    badge.textContent = current + 1;
  }

  saveProgress();
}

// اکسپوز کردن تابع
window.receiveItem = receiveItem;
// ================================================================
// ===== APPLY CHOICE =====
// ================================================================

function applyChoice(choice) {
  console.log(`🔀 انتخاب: ${choice.text}`);

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

  // ===== اول: چک کردن nextEpisode =====
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

  // ===== دوم: چک کردن next =====
  if (choice.next) {
    console.log(`➡️ رفتن به صحنه ${choice.next} (از طریق انتخاب)`);
    state.sceneId = choice.next;
    renderScene();
    return;
  }
}

// ================================================================
// ===== GO TO PREVIOUS/NEXT SCENE (برای دکمه‌های ناوبری) =====
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
// ===== SAVE =====
// ================================================================

function saveProgress() {
  try {
    localStorage.setItem("donimeh_episode", state.episodeId);
    localStorage.setItem("donimeh_scene", state.sceneId);
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
  } catch (e) {
    console.warn("⚠️ خطا در ذخیره‌سازی:", e);
  }
}

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

// اتصال دکمه‌های ناوبری
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
