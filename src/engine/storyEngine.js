// src/engine/storyEngine.js

let episodeData = null;

// لود JSON اپیزود
export async function loadEpisode(episodeId = 1) {
  const res = await fetch(`/assets/data/episode${episodeId}.json`);
  episodeData = await res.json();
  return episodeData;
}

// گرفتن صحنه فعلی
export function getScene(sceneId) {
  if (!episodeData) return null;
  return episodeData.scenes[sceneId] || null;
}

// چک کردن شرط (require)
export function checkCondition(condition, state) {
  if (!condition) return true;

  // چک stats
  if (condition.stats) {
    for (const [key, value] of Object.entries(condition.stats)) {
      if (state.stats[key] < value) return false;
    }
  }

  // چک suspicion
  if (condition.suspicion) {
    for (const [key, value] of Object.entries(condition.suspicion)) {
      if (state.suspicion[key] < value) return false;
    }
  }

  // چک memory flags
  if (condition.memory) {
    for (const [key, value] of Object.entries(condition.memory)) {
      if (state.memory[key] !== value) return false;
    }
  }

  return true;
}

// اعمال افکت‌های انتخاب
export function applyEffects(effects, state) {
  if (!effects) return;

  if (effects.stats) {
    for (const [key, value] of Object.entries(effects.stats)) {
      state.stats[key] = Math.max(0, Math.min(100, state.stats[key] + value));
    }
  }

  if (effects.suspicion) {
    for (const [key, value] of Object.entries(effects.suspicion)) {
      state.suspicion[key] = Math.max(0, Math.min(100, state.suspicion[key] + value));
    }
  }

  if (effects.memory) {
    for (const [key, value] of Object.entries(effects.memory)) {
      state.memory[key] = value;
    }
  }
}

// گرفتن انتخاب‌های معتبر (با توجه به state فعلی)
export function getValidChoices(scene, state) {
  if (!scene.choices) return [];
  return scene.choices.filter(c => checkCondition(c.require, state));
}