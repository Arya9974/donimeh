// src/engine/storyEngine.js

import { state } from "./gameState.js";

let episodeData = null;

export async function loadEpisode(episodeId = 1) {
  const res = await fetch(`/assets/data/episodes.json`);
  const data = await res.json();
  episodeData = data.episodes.find((ep) => ep.id === episodeId);
  return episodeData;
}

export function getScene(sceneId) {
  if (!episodeData) return null;
  return episodeData.scenes[sceneId] || null;
}

export function checkCondition(condition, state) {
  if (!condition) return true;

  if (condition.stats) {
    for (const [key, value] of Object.entries(condition.stats)) {
      if ((state.stats[key] || 0) < value) return false;
    }
  }

  if (condition.suspicion) {
    for (const [key, value] of Object.entries(condition.suspicion)) {
      if ((state.suspicion[key] || 0) < value) return false;
    }
  }

  if (condition.memory) {
    for (const [key, value] of Object.entries(condition.memory)) {
      if (state.memory[key] !== value) return false;
    }
  }

  if (condition.hasItem) {
    const inventory = state.memory?.inventory || [];
    if (!inventory.some((item) => item.id === condition.hasItem)) return false;
  }

  if (condition.lacksItem) {
    const inventory = state.memory?.inventory || [];
    if (inventory.some((item) => item.id === condition.lacksItem)) return false;
  }

  if (condition.hasNote) {
    const notes = state.memory?.notes || [];
    if (
      !notes.some((note) => note.text && note.text.includes(condition.hasNote))
    )
      return false;
  }

  return true;
}

export function applyEffects(effects, state) {
  if (!effects) return;

  if (effects.stats) {
    for (const [key, value] of Object.entries(effects.stats)) {
      state.stats[key] = Math.max(
        0,
        Math.min(100, (state.stats[key] || 0) + value),
      );
    }
  }

  if (effects.suspicion) {
    for (const [key, value] of Object.entries(effects.suspicion)) {
      state.suspicion[key] = Math.max(
        0,
        Math.min(100, (state.suspicion[key] || 0) + value),
      );
    }
  }

  if (effects.memory) {
    for (const [key, value] of Object.entries(effects.memory)) {
      state.memory[key] = value;
    }
  }

  if (effects.removeItem) {
    if (state.memory?.inventory) {
      state.memory.inventory = state.memory.inventory.filter(
        (item) => item.id !== effects.removeItem,
      );
    }
  }

  if (effects.addItem) {
    if (!state.memory.inventory) state.memory.inventory = [];
    if (!state.memory.inventory.some((it) => it.id === effects.addItem.id)) {
      state.memory.inventory.push({ ...effects.addItem });
    }
  }

  if (effects.addNote) {
    if (!state.memory.notes) state.memory.notes = [];
    state.memory.notes.push({ text: effects.addNote, timestamp: Date.now() });
  }
}

export function getValidChoices(scene, state) {
  if (!scene.choices) return [];
  return scene.choices.filter((c) => checkCondition(c.require, state));
}
