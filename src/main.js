// src/main.js

import { state } from "./engine/gameState.js";
import {
  getScene,
  applyEffects,
  getValidChoices,
} from "./engine/storyEngine.js";

window.__gameState = state;
window.state = state;

if (!state.memory) state.memory = {};
if (!state.memory.inventory) state.memory.inventory = [];
if (!state.memory.notes) state.memory.notes = [];
if (!state.memory.chatHistory) state.memory.chatHistory = {};
if (!state.memory.puzzleProgress) state.memory.puzzleProgress = {};

const UI = window.DonimehUI;
let episodesData = null,
  currentEpisode = null,
  currentScene = null,
  isTyping = false;

async function initGame() {
  try {
    const res = await fetch("assets/data/episodes.json");
    episodesData = await res.json();
    loadCurrentEpisode();

    if (!state.memory) state.memory = {};
    if (!state.memory.inventory) state.memory.inventory = [];
    if (!state.memory.notes) state.memory.notes = [];
    if (!state.memory.chatHistory) state.memory.chatHistory = {};
    if (!state.memory.puzzleProgress) state.memory.puzzleProgress = {};

    const savedChatHistory = localStorage.getItem("donimeh_chatHistory");
    if (savedChatHistory) {
      try {
        state.memory.chatHistory = JSON.parse(savedChatHistory);
      } catch (e) {}
    }

    const urlParams = new URLSearchParams(window.location.search);
    const restart = urlParams.get("restart") === "true";
    if (restart) {
      localStorage.removeItem("donimeh_scene");
      localStorage.removeItem("donimeh_episode");
      state.sceneId =
        currentEpisode?.startScene ||
        Object.keys(currentEpisode?.scenes || {})[0];
    } else {
      const se = localStorage.getItem("donimeh_episode");
      const ss = localStorage.getItem("donimeh_scene");
      if (se) state.episodeId = parseInt(se);
      if (ss && currentEpisode?.scenes[ss]) state.sceneId = ss;
      else if (currentEpisode)
        state.sceneId =
          currentEpisode.startScene || Object.keys(currentEpisode.scenes)[0];
    }
    renderScene();
  } catch (err) {
    console.error("❌ خطا:", err);
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

function renderScene() {
  if (!currentEpisode) return;
  currentScene = currentEpisode.scenes[state.sceneId];
  if (!currentScene) return;
  saveProgress();

  // پازل: اگر scene نیاز به unlock داره و unlocked نیست
  if (
    currentScene.puzzleId &&
    !state.memory.puzzleProgress[currentScene.puzzleId]
  ) {
    // نمایش پازل
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

  const activeCharImg = currentScene.portrait || null;
  if (activeCharImg) UI.showPortrait(activeCharImg);

  const speaker = currentScene.speaker || currentScene.bubble?.name || "";
  const text = currentScene.dialogue || currentScene.bubble?.text || "";
  const narratorText = currentScene.narrator || "";
  window._lastText = text || narratorText;

  const validChoices = getValidChoices(currentScene, state);
  const phoneData = currentScene.phone;

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
      );
      if (!phoneData.choices || phoneData.choices.length === 0) {
        const ns = phoneData.next || currentScene.next;
        if (ns)
          setTimeout(() => {
            UI.closePhone();
            state.sceneId = ns;
            renderScene();
          }, 4000);
      }
    }, 500);
  } else {
    UI.closePhone();
  }

  if (currentScene.puzzle && !currentScene.puzzleId)
    UI.showPuzzle(currentScene.puzzle.html || "");
  else if (!currentScene.puzzleId) UI.hidePuzzle();
}

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
      if (UI.isPhoneVisible?.()) setTimeout(() => UI.renderPhoneItems?.(), 100);
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

function saveProgress() {
  localStorage.setItem("donimeh_episode", state.episodeId);
  localStorage.setItem("donimeh_scene", state.sceneId);
  localStorage.setItem("donimeh_has_progress", "true");
  localStorage.setItem(
    "donimeh_chatHistory",
    JSON.stringify(state.memory.chatHistory || {}),
  );
}

document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    advanceScene();
  }
  if (e.key === "i" || e.key === "I" || e.key === "ی") {
    if (
      document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA"
    )
      return;
    UI.toggleInventory(state.memory?.inventory || []);
  }
  if (e.key === "Escape") {
    UI.closePhone();
    UI.closeInventory();
  }
});
document.addEventListener("click", (e) => {
  if (
    e.target.closest(".choice-btn") ||
    e.target.closest("#phoneOverlay") ||
    e.target.closest("#backBtn") ||
    e.target.closest("#puzzleOverlay") ||
    e.target.closest("#inventoryDrawer")
  )
    return;
  advanceScene();
});
document.getElementById("backBtn")?.addEventListener("click", () => {
  window.location.href = "index.html";
});

initGame();
