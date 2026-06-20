// src/main.js — نسخه کامل و اصلاح‌شده

import { state } from "./engine/gameState.js";
import {
  getScene,
  applyEffects,
  getValidChoices,
} from "./engine/storyEngine.js";

// ================================================================
// ===== EXPOSE STATE GLOBALLY =====
// ================================================================

window.__gameState = state;
window.state = state;

// ================================================================
// ===== INIT MEMORY =====
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
// ===== WAIT FOR DonimehUI =====
// ================================================================

function waitForUI() {
  if (window.DonimehUI) {
    UI = window.DonimehUI;
    console.log("✅ DonimehUI آماده است، بازی شروع میشه...");
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
    console.log("✅ episodes.json لود شد:", episodesData);

    loadCurrentEpisode();

    // ===== دریافت پارامترهای URL =====
    const urlParams = new URLSearchParams(window.location.search);
    const epParam = urlParams.get("ep");
    const restart = urlParams.get("restart") === "true";

    // ===== اگه پارامتر ep وجود داره، اپیزود رو تغییر بده =====
    if (epParam) {
      const epId = parseInt(epParam);
      const found = episodesData.episodes.find((e) => e.id === epId);
      if (found) {
        state.episodeId = epId;
        state.sceneId = found.startScene || Object.keys(found.scenes)[0];
        loadCurrentEpisode();
        console.log(`📺 رفتن به اپیزود ${epId}`);
      }
    }

    // ===== مدیریت restart =====
    if (restart) {
      localStorage.removeItem("donimeh_scene");
      localStorage.removeItem("donimeh_episode");
      localStorage.removeItem("donimeh_ep1_choice");
      localStorage.removeItem("donimeh_ep2_choice");
      state.sceneId =
        currentEpisode?.startScene ||
        Object.keys(currentEpisode?.scenes || {})[0];
      console.log("🔄 ریست انجام شد");
    } else {
      // ===== بازیابی پیشرفت از localStorage =====
      if (!epParam) {
        const se = localStorage.getItem("donimeh_episode");
        const ss = localStorage.getItem("donimeh_scene");

        if (se) {
          const savedEp = parseInt(se);
          const maxEp = episodesData.episodes.length;
          state.episodeId = savedEp <= maxEp && savedEp >= 1 ? savedEp : 1;
          loadCurrentEpisode();
        } else {
          state.episodeId = 1;
          loadCurrentEpisode();
        }

        // sceneId رو ست کن
        if (ss && currentEpisode?.scenes[ss]) {
          state.sceneId = ss;
          console.log(`📂 sceneId بازیابی شد: ${ss}`);
        } else if (currentEpisode) {
          state.sceneId =
            currentEpisode.startScene || Object.keys(currentEpisode.scenes)[0];
          console.log(`📂 sceneId پیش‌فرض: ${state.sceneId}`);
        }
      }
    }

    // ============================================================
    // ===== هدایت‌های بعد از بازیابی =====
    // ============================================================

    // ===== هدایت بر اساس انتخاب اپیزود ۱ =====
    if (state.episodeId === 2) {
      const ep1Choice =
        state.memory.ep1FinalChoice ||
        localStorage.getItem("donimeh_ep1_choice");
      if (ep1Choice) {
        const sceneMap = {
          rahi: "ep2_rahi_house",
          mehras: "ep2_mehras_basement",
          seyf: "ep2_seyf_station",
          alone: "ep2_alone_elgoli",
        };
        if (
          sceneMap[ep1Choice] &&
          currentEpisode?.scenes[sceneMap[ep1Choice]]
        ) {
          state.sceneId = sceneMap[ep1Choice];
          console.log(`🗺️ هدایت به ${ep1Choice}: ${state.sceneId}`);
        }
      }
    }

    // ===== هدایت بر اساس انتخاب اپیزود ۲ (شاخه‌ی آریا) =====
    if (state.episodeId === 3) {
      if (!currentEpisode) loadCurrentEpisode();

      let ep2Choice = state.memory.ep2FinalChoice;
      if (!ep2Choice) {
        ep2Choice = localStorage.getItem("donimeh_ep2_choice");
      }

      if (ep2Choice === "ask_arya") {
        if (currentEpisode?.scenes["ep3_with_arya_meeting"]) {
          state.sceneId = "ep3_with_arya_meeting";
          console.log("🗺️ هدایت به شاخه آریا");
        } else {
          console.warn("⚠️ صحنه ep3_with_arya_meeting پیدا نشد!");
        }
      }
    }

    // ============================================================
    // ===== رندر نهایی =====
    // ============================================================

    console.log(`🎯 sceneId نهایی: ${state.sceneId}`);
    console.log(`📺 اپیزود نهایی: ${state.episodeId}`);

    renderScene();
  } catch (err) {
    console.error("❌ خطا در initGame:", err);
  }
}

// ================================================================
// ===== LOAD CURRENT EPISODE =====
// ================================================================

function loadCurrentEpisode() {
  if (!episodesData) {
    console.warn("⚠️ episodesData خالی است!");
    return;
  }

  currentEpisode = episodesData.episodes.find(
    (ep) => ep.id === state.episodeId,
  );

  if (!currentEpisode) {
    console.warn(`⚠️ اپیزود ${state.episodeId} پیدا نشد، رفتن به اپیزود 1`);
    currentEpisode = episodesData.episodes[0];
    state.episodeId = 1;
  }

  console.log(`📖 اپیزود ${state.episodeId} لود شد: ${currentEpisode.title}`);
}

// ================================================================
// ===== RENDER SCENE =====
// ================================================================

function renderScene() {
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
    console.warn(`⚠️ صحنه ${state.sceneId} پیدا نشد!`);
    // تلاش برای پیدا کردن اولین صحنه
    const firstScene = Object.keys(currentEpisode.scenes)[0];
    if (firstScene) {
      state.sceneId = firstScene;
      currentScene = currentEpisode.scenes[firstScene];
      console.log(`🔄 رفتن به اولین صحنه: ${firstScene}`);
    } else {
      console.error("❌ هیچ صحنه‌ای در اپیزود وجود ندارد!");
      return;
    }
  }

  console.log(`🎬 رندر صحنه: ${state.sceneId}`);
  saveProgress();

  // ===== پازل =====
  if (
    currentScene.puzzleId &&
    !state.memory.puzzleProgress[currentScene.puzzleId]
  ) {
    if (currentScene.puzzle) {
      UI.showPuzzle(currentScene.puzzle.html || "");
      window._resolvePuzzle = (success) => {
        UI.hidePuzzle();
        if (success) {
          state.memory.puzzleProgress[currentScene.puzzleId] = true;
          if (currentScene.onSolve) {
            state.sceneId = currentScene.onSolve;
          }
        }
        renderScene();
      };
      return;
    }
  }

  // ===== نمایش پرتره =====
  const activeCharImg = currentScene.portrait || null;
  if (activeCharImg) {
    UI.showPortrait(activeCharImg);
  } else {
    UI.showPortrait(null);
  }

  // ===== نمایش دیالوگ =====
  const speaker = currentScene.speaker || currentScene.bubble?.name || "";
  const text = currentScene.dialogue || currentScene.bubble?.text || "";
  const narratorText = currentScene.narrator || "";
  window._lastText = text || narratorText;

  const validChoices = getValidChoices(currentScene, state);
  const phoneData = currentScene.phone;

  // ===== تایپ متن =====
  UI.onTypeEnd(() => {
    isTyping = false;
    if (!phoneData) {
      const mapped = validChoices.map((c) => ({
        label: c.text,
        onSelect: () => applyChoice(c),
      }));
      UI.showChoices(mapped);
    }
  });

  isTyping = true;
  UI.showDialogue(speaker, text || narratorText);

  // ===== گوشی =====
  if (phoneData) {
    if (phoneData.header && phoneData.messages) {
      if (!state.memory.chatHistory) state.memory.chatHistory = {};
      if (!state.memory.chatHistory[phoneData.header])
        state.memory.chatHistory[phoneData.header] = [];
      phoneData.messages.forEach((msg) => {
        const already = state.memory.chatHistory[phoneData.header].some(
          (m) => m.text === msg.text && m.sent === msg.sent,
        );
        if (!already) {
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
          },
        })),
        phoneData.input || null,
      );
      if (!phoneData.choices || phoneData.choices.length === 0) {
        const ns = phoneData.next || currentScene.next;
        if (ns) {
          setTimeout(() => {
            UI.closePhone();
            state.sceneId = ns;
            renderScene();
          }, 4000);
        }
      }
    }, 500);
  } else {
    UI.closePhone();
  }

  // ===== پازل =====
  if (currentScene.puzzle && !currentScene.puzzleId) {
    UI.showPuzzle(currentScene.puzzle.html || "");
  } else if (!currentScene.puzzleId) {
    UI.hidePuzzle();
  }
}

// ================================================================
// ===== APPLY CHOICE =====
// ================================================================

function applyChoice(choice) {
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

  if (choice.next) {
    state.sceneId = choice.next;
    renderScene();
  } else if (choice.nextEpisode) {
    state.episodeId = choice.nextEpisode;
    loadCurrentEpisode();
    state.sceneId =
      currentEpisode?.startScene ||
      Object.keys(currentEpisode?.scenes || {})[0];
    renderScene();
  }
}
// ================================================================
// ===== داستان کامل — story.html =====
// ================================================================

// تابع تولید داستان از انتخاب‌های کاربر
function generateStoryData() {
  const choiceMap = {
    // اپیزود ۱
    rahi: "با رهی به قرار ونتوس رفتی",
    mehras: "به مهراس اعتماد کردی",
    seyf: "به پلیس رفتی",
    alone: "تنها به ایل‌گلی برگشتی",
    // اپیزود ۲
    go: "به قرار ونتوس رفتی",
    tell_seyf: "به سیف گفتی",
    ask_arya: "از آریا کمک خواستی",
    decline: "به قرار ونتوس نرفتی",
    // اپیزود ۳
    hossein: "به خونه حسین رفتی",
    ventus: "به سراغ ونتوس رفتی",
    walk: "قدم زدی و حسین اومد سراغت",
    // اپیزود ۴
    rahi_go: "رهی به پارک ایل‌گلی رفت",
    rahi_police: "رهی به پلیس زنگ زد",
    rahi_wait: "رهی منتظر ماند",
  };

  const blocks = [];
  const hasProgress = localStorage.getItem("donimeh_has_progress") === "true";

  if (!hasProgress) {
    blocks.push({
      type: "paragraph",
      text: "هنوز بازی را شروع نکرده‌ای. ابتدا یک بازی جدید شروع کن تا داستان بر اساس انتخاب‌هایت ساخته شود.",
    });
    return {
      title: "دو نیمه — داستان کامل",
      subtitle: "هنوز داستانی برای نمایش وجود ندارد",
      blocks: blocks,
    };
  }

  // ===== اپیزود ۱ =====
  blocks.push({ type: "heading", text: "اپیزود ۱: دو نیمه" });
  blocks.push({
    type: "paragraph",
    text: "کلانتری تاریک و سرد بود. لامپ مهتابی سوسو می‌زد. سیف روبه‌روی سینا نشسته بود و از او درباره شب ناپدید شدن ساغر سوال می‌کرد.",
  });
  blocks.push({
    type: "paragraph",
    text: "سینا به گذشته برگشت. آریا به او پیام داده بود که امشب در پارک ایل‌گلی جمع می‌شوند. سینا قبول کرد و به پارک رفت.",
  });

  if (state.memory.ep1FinalChoice) {
    const choiceText =
      choiceMap[state.memory.ep1FinalChoice] || "انتخاب دیگری انجام دادی";
    blocks.push({ type: "choice", text: `تو انتخاب کردی ${choiceText}.` });
  }

  blocks.push({
    type: "paragraph",
    text: "در پارک، سینا با رهی آشنا شد. دختری مرموز با زخمی روی گردن. شب به پایان رسید و ساغر ناپدید شد. سینا و رهی ردپاهایی پیدا کردند و پیام مرموزی دریافت کردند.",
  });
  blocks.push({ type: "divider" });

  // ===== اپیزود ۲ =====
  blocks.push({ type: "heading", text: "اپیزود ۲: نقطه ناپدید شدن" });
  blocks.push({
    type: "paragraph",
    text: "صبح روز بعد، سینا متوجه شد مهراس ۱۴ بار با ساغر تماس داشته. تحقیقات ادامه پیدا کرد و سینا با مهراس روبرو شد. مهراس ادعا کرد ساغر را تهدید می‌کرده‌اند.",
  });

  if (state.memory.ep2FinalChoice) {
    const choiceText =
      choiceMap[state.memory.ep2FinalChoice] || "انتخاب دیگری انجام دادی";
    blocks.push({ type: "choice", text: `تو انتخاب کردی ${choiceText}.` });
  }

  blocks.push({
    type: "paragraph",
    text: "سینا سه نسخه از چت مهراس و ساغر را بررسی کرد. یکی از آنها واقعی بود. لاکر ساغر را پیدا کرد و متوجه شد مهراس درباره زمان دیدن ساغر دروغ گفته.",
  });
  blocks.push({
    type: "paragraph",
    text: "سایمان کیف نگار را پیدا کرد. در پایان، ونتوس به سینا پیام داد که او را به خیابان شریعتی دعوت کرد.",
  });
  blocks.push({ type: "divider" });

  // ===== اپیزود ۳ =====
  blocks.push({ type: "heading", text: "اپیزود ۳: شب بنفشه" });
  blocks.push({
    type: "paragraph",
    text: "سینا به قرار ونتوس رفت. ونتوس به او گفت حسین شفیعی ساغر را دزدیده است. سینا به خشک‌شویی رفت و از ناصر آدرس خونه حسین را گرفت.",
  });
  blocks.push({
    type: "paragraph",
    text: "آریا در کلانتری با بینام آشنا شد. بینام ادعا کرد ماشین سفید را دیده. آریا و سپهر به خونه حسین رفتند و با او روبرو شدند.",
  });

  if (state.memory.ep3FinalChoice) {
    const choiceText =
      choiceMap[state.memory.ep3FinalChoice] || "انتخاب دیگری انجام دادی";
    blocks.push({ type: "choice", text: `تو انتخاب کردی ${choiceText}.` });
  }

  blocks.push({
    type: "paragraph",
    text: "حسین شفیعی آرام و کنترل‌کننده بود. به سپهر گفت: «ساغر تازه برات مهم شده.» و تهدید کرد که اگه بلایی سرش بیاید، ساغر می‌میرد.",
  });
  blocks.push({
    type: "paragraph",
    text: "سینا دو پیام همزمان از حسین و ونتوس دریافت کرد. باید تصمیم می‌گرفت که به کدام یک اعتماد کند.",
  });
  blocks.push({ type: "divider" });

  // ===== اپیزود ۴ =====
  blocks.push({ type: "heading", text: "اپیزود ۴: ردپا در برف" });
  blocks.push({
    type: "paragraph",
    text: "سینا تصمیم خود را گرفت. راهی شد به سمت مقصدی که انتخاب کرده بود.",
  });

  if (state.memory.ep4FinalChoice) {
    const choiceText =
      choiceMap[state.memory.ep4FinalChoice] || "انتخاب دیگری انجام دادی";
    blocks.push({ type: "choice", text: `تو انتخاب کردی ${choiceText}.` });
  }

  blocks.push({
    type: "paragraph",
    text: "تیم‌ها تقسیم شدند. همه به پارک ایل‌گلی رفتند، اما آنجا یک تله بود. چراغ‌ها خاموش شدند و همه گیر افتادند.",
  });
  blocks.push({
    type: "paragraph",
    text: "رهی در خانه با دیانا، کوثر و هانا منتظر بود. فهمید که این یک تله است و تصمیم گرفت کاری کند.",
  });
  blocks.push({ type: "divider" });

  // ===== پایان =====
  blocks.push({ type: "heading", text: "پایان راه" });
  blocks.push({
    type: "paragraph",
    text: "داستان همچنان ادامه دارد... انتخاب‌های تو سرنوشت شخصیت‌ها را تعیین می‌کنند. در اپیزودهای بعدی، خواهی دید که هر تصمیم چه پیامدی دارد.",
  });
  blocks.push({
    type: "paragraph",
    text: "برف همچنان می‌بارد و شهر زیر سکوتی سنگین خوابیده است. اما در میان این سکوت، حقیقتی در حال آشکار شدن است.",
  });

  return {
    title: "دو نیمه — داستان کامل",
    subtitle: "روایت انتخاب‌های تو در شب‌های برفی تبریز",
    blocks: blocks,
  };
}

// تابع باز کردن صفحه داستان
function openStoryPage() {
  const hasProgress = localStorage.getItem("donimeh_has_progress") === "true";

  if (!hasProgress) {
    alert(
      "هنوز بازی را شروع نکرده‌ای. ابتدا یک بازی جدید شروع کن تا داستان بر اساس انتخاب‌هایت ساخته شود.",
    );
    return;
  }

  const storyData = generateStoryData();
  localStorage.setItem("twoHalves:storyData", JSON.stringify(storyData));
  window.open("story.html", "_blank");
}

// expose برای استفاده در HTML
window.openStoryPage = openStoryPage;
window.generateStoryData = generateStoryData;
// ================================================================
// ===== ADVANCE SCENE =====
// ================================================================

function advanceScene() {
  if (UI.isPhoneVisible?.()) return;

  if (isTyping) {
    UI.skipTyping();
    isTyping = false;
    return;
  }

  const valid = currentScene ? getValidChoices(currentScene, state) : [];
  if (valid.length > 0) return;

  if (currentScene?.addItem) {
    if (!state.memory.inventory) state.memory.inventory = [];
    if (
      !state.memory.inventory.some((it) => it.id === currentScene.addItem.id)
    ) {
      state.memory.inventory.push({
        id: currentScene.addItem.id,
        name: currentScene.addItem.name,
        icon: currentScene.addItem.icon || "📦",
        description: currentScene.addItem.description || "",
      });
    }
  }

  if (currentScene?.addNote) {
    if (!state.memory.notes) state.memory.notes = [];
    state.memory.notes.push({
      text: currentScene.addNote.text || currentScene.addNote,
    });
  }

  if (currentScene?.next) {
    state.sceneId = currentScene.next;
    renderScene();
  } else if (currentScene?.nextEpisode) {
    state.episodeId = currentScene.nextEpisode;
    loadCurrentEpisode();
    state.sceneId =
      currentEpisode?.startScene ||
      Object.keys(currentEpisode?.scenes || {})[0];
    renderScene();
  }
}

// ================================================================
// ===== SAVE PROGRESS =====
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
// ===== EXPOSE FUNCTIONS FOR DEBUGGING =====
// ================================================================

window.renderScene = renderScene;
window.loadCurrentEpisode = loadCurrentEpisode;
window.applyChoice = applyChoice;
window.advanceScene = advanceScene;
window.saveProgress = saveProgress;
window.currentEpisode = () => currentEpisode;
window.currentScene = () => currentScene;

// ================================================================
// ===== EVENT LISTENERS =====
// ================================================================

document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    advanceScene();
  }
  if (e.key === "i" || e.key === "I" || e.key === "ی") {
    if (
      document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA"
    ) {
      return;
    }
    UI?.toggleInventory(state.memory?.inventory || []);
  }
  if (e.key === "Escape") {
    UI?.closePhone();
    UI?.closeInventory();
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

// ================================================================
// ===== START THE GAME =====
// ================================================================

console.log("🎮 دو نیمه — در حال راه‌اندازی...");
waitForUI();
