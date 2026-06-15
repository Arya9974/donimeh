// src/main.js
// Donimeh Engine — نسخه نهایی

import { state } from "./engine/gameState.js";
import {
  getScene,
  applyEffects,
  getValidChoices,
} from "./engine/storyEngine.js";

const UI = window.DonimehUI;

let episodesData = null;
let currentEpisode = null;
let currentScene = null;
let isTyping = false;

// ═══════════════════════════════
// INIT
// ═══════════════════════════════

async function initGame() {
  try {
    const res = await fetch("assets/data/episodes.json");
    episodesData = await res.json();
    loadCurrentEpisode();

    const urlParams = new URLSearchParams(window.location.search);
    const restart = urlParams.get("restart") === "true";

    if (restart) {
      localStorage.removeItem("donimeh_scene");
      localStorage.removeItem("donimeh_episode");
      state.sceneId =
        currentEpisode?.startScene ||
        Object.keys(currentEpisode?.scenes || {})[0];
    } else {
      const savedEpisode = localStorage.getItem("donimeh_episode");
      const savedScene = localStorage.getItem("donimeh_scene");
      if (savedEpisode) state.episodeId = parseInt(savedEpisode);
      if (savedScene && currentEpisode?.scenes[savedScene]) {
        state.sceneId = savedScene;
      } else if (currentEpisode) {
        state.sceneId =
          currentEpisode.startScene || Object.keys(currentEpisode.scenes)[0];
      }
    }

    renderScene();
  } catch (err) {
    console.error("❌ خطا در init:", err);
  }
}

function loadCurrentEpisode() {
  if (!episodesData) return;
  currentEpisode = episodesData.episodes.find(
    (ep) => ep.id === state.episodeId,
  );
  if (!currentEpisode) {
    currentEpisode = episodesData.episodes[0];
    state.episodeId = 1;
  }
}

// ═══════════════════════════════
// RENDER SCENE
// ═══════════════════════════════

function renderScene() {
  if (!currentEpisode) return;

  currentScene = currentEpisode.scenes[state.sceneId];
  if (!currentScene) {
    console.error("❌ صحنه پیدا نشد:", state.sceneId);
    return;
  }

  saveProgress();

  // ── 1. Portrait ──
  let activeCharImg = null;
  if (currentScene.portrait) {
    activeCharImg = currentScene.portrait;
  } else {
    const allChars = [
      ...(currentScene.leftGroup || []),
      ...(currentScene.rightGroup || []),
    ];
    const activeChar = allChars.find((c) => c.active);
    if (activeChar?.img) activeCharImg = activeChar.img;
  }
  if (activeCharImg) UI.showPortrait(activeCharImg);

  // ── 2. Dialogue data ──
  const speaker = currentScene.speaker || currentScene.bubble?.name || "";
  const text = currentScene.dialogue || currentScene.bubble?.text || "";
  const narratorText = currentScene.narrator || "";
  window._lastText = text || narratorText;

  // ── 3. آماده‌سازی choices و phone ──
  const validChoices = getValidChoices(currentScene, state);
  const phoneData = currentScene.phone;

  // تنظیم callback برای پایان typing
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

  // شروع typing
  isTyping = true;
  UI.showDialogue(speaker, text || narratorText);

  // ── 4. Phone ──
  if (phoneData) {
    setTimeout(() => {
      UI.openPhone(
        phoneData.header,
        (phoneData.messages || []).map((m, i) => ({
          ...m,
          type: m.sent ? "outgoing" : "incoming",
          delay: m.delay || i * 0.5,
        })),
        (phoneData.choices || []).map((c) => ({
          label: c.text,
          onSelect: () => {
            applyChoice(c);
            UI.closePhone();
          },
        })),
      );

      // Auto-advance اگر phone انتخاب نداره
      if (!phoneData.choices || phoneData.choices.length === 0) {
        const nextScene = phoneData.next || currentScene.next;
        if (nextScene) {
          setTimeout(() => {
            UI.closePhone();
            state.sceneId = nextScene;
            renderScene();
          }, 2500);
        }
      }
    }, 500);
  } else {
    UI.closePhone();
  }

  // ── 5. Puzzle ──
  if (currentScene.puzzle) {
    UI.showPuzzle(currentScene.puzzle.html || "");
  } else {
    UI.hidePuzzle();
  }
}

// ═══════════════════════════════
// APPLY CHOICE
// ═══════════════════════════════

function applyChoice(choice) {
  state.history.push({
    episode: state.episodeId,
    scene: state.sceneId,
    choice: choice.text,
  });

  applyEffects(choice.effects, state);

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

// ═══════════════════════════════
// ADVANCE
// ═══════════════════════════════

function advanceScene() {
  if (UI.isPhoneVisible?.()) return;
  if (isTyping) {
    UI.skipTyping();
    isTyping = false;
    return;
  }

  const valid = currentScene ? getValidChoices(currentScene, state) : [];
  if (valid.length > 0) return;

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
// ═══════════════════════════════
// HELPERS
// ═══════════════════════════════

function saveProgress() {
  localStorage.setItem("donimeh_episode", state.episodeId);
  localStorage.setItem("donimeh_scene", state.sceneId);
  localStorage.setItem("donimeh_has_progress", "true");
}

// ═══════════════════════════════
// EVENTS
// ═══════════════════════════════

document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    advanceScene();
  }
});

document.addEventListener("click", (e) => {
  if (
    e.target.closest(".choice-btn") ||
    e.target.closest(".phone-choice-btn") ||
    e.target.closest("#phoneOverlay") ||
    e.target.closest("#backBtn") ||
    e.target.closest("#puzzleOverlay")
  )
    return;
  advanceScene();
});

document.getElementById("backBtn")?.addEventListener("click", () => {
  window.location.href = "index.html";
});

// ═══════════════════════════════
// START
// ═══════════════════════════════

initGame();
