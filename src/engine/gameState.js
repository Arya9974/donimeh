// src/engine/gameState.js

export const state = {
  episodeId: 1,
  sceneId: "station_intro",

  theme: "dark-gold",
  currentCharacter: "sina",
  currentCharacterData: null,

  stats: {
    trustSina: 50,
    trustRahi: 50,
    trustArya: 70,
    trustMehras: 40,
    trustSeyf: 30,
    trustVentus: 50,
    sanity: 100,
  },

  suspicion: {
    arya: 0,
    rahi: 0,
    mehras: 0,
    ventus: 0,
    hossein: 0,
    sepehr: 0,
  },

  memory: {
    metRahi: false,
    sawAryaGlance: false,
    talkedToMehras: false,
    foundSagharsShoe: false,
    receivedVentusMessage: false,
    deletedMessages: false,
    routeLocked: false,
    ep1FinalChoice: null,
    ep2FinalChoice: null,
    ep2Path: null,
    metVentus: false,
    ventusTrust: 0,
    ep3Path: null,
    dryCleanerPartner: null,
    hosseinResponse: null,
    believedSepehr: false,
    wentToHosseinHouse: false,
    toldVentusAboutSepehr: false,
    foundHosseinCard: false,
    aryaWhiteCar: false,
    sepehrWarning: false,
    finalDecision: null,
    hasStorageKey: false,
    rahiGoesAloneSinaBehind: false,
    rahiGoesWithSepehr: false,
    rahiCallsPoliceFirst: false,
    rahiHelpsSina: false,
    rahiWatchesFromAfar: false,
    rahiTellsSinaToWait: false,
    rahiStopsSina: false,
    ep5AryaPath: null,
  },

  history: [],
  currentEpisode: 1,
  historyIndex: -1,
  maxHistory: 300,
};

// ================================================================
// ===== سیستم کاراکترها =====
// ================================================================

export const CHARACTERS = {
  sina: {
    id: "sina",
    name: "سینا",
    theme: "dark-gold",
    color: "#c9a227",
    portrait: "assets/images/sina defualt.png",
  },
  rahi: {
    id: "rahi",
    name: "رهی",
    theme: "pink-gold",
    color: "#d4608a",
    portrait: "assets/images/rehi sad.jpg",
  },
  mehras: {
    id: "mehras",
    name: "مهراس",
    theme: "blue-gold",
    color: "#4a7a9c",
    portrait: "assets/images/mehras sad.png",
  },
  sayman: {
    id: "sayman",
    name: "سایمان",
    theme: "dark-gold",
    color: "#5a8a9c",
    portrait: "assets/images/sayman1 defualt.png",
  },
  seyf: {
    id: "seyf",
    name: "سیف",
    theme: "cream-gold",
    color: "#b89a7a",
    portrait: "assets/images/seyf defualt.png",
  },
  arya: {
    id: "arya",
    name: "آریا",
    theme: "blood-gold",
    color: "#8b1a1a",
    portrait: "assets/images/arya sad.jpg",
  },
};

// ================================================================
// ===== توابع تغییر تم =====
// ================================================================

export function setTheme(theme) {
  state.theme = theme;
  applyThemeToDOM(theme);
}

export function applyThemeToDOM(theme) {
  const body = document.body;
  body.classList.remove(
    "theme-dark-gold",
    "theme-pink-gold",
    "theme-blue-gold",
  );
  body.classList.add(`theme-${theme}`);

  try {
    localStorage.setItem("gameTheme", theme);
  } catch (e) {}

  const root = document.documentElement;

  if (theme === "pink-gold") {
    root.style.setProperty("--bg-primary", "#1a0a0f");
    root.style.setProperty("--bg-secondary", "#2a141e");
    root.style.setProperty("--text-primary", "#f0a0b0");
    root.style.setProperty("--text-secondary", "#f5d0d8");
    root.style.setProperty("--border-color", "#f0a0b0");
    root.style.setProperty("--shadow-color", "rgba(240, 160, 176, 0.3)");
    root.style.setProperty("--gradient-start", "#1a0a0f");
    root.style.setProperty("--gradient-end", "#2a141e");
  } else if (theme === "blue-gold") {
    root.style.setProperty("--bg-primary", "#0a0f1a");
    root.style.setProperty("--bg-secondary", "#0a121e");
    root.style.setProperty("--text-primary", "#c8dce8");
    root.style.setProperty("--text-secondary", "#7aa8c4");
    root.style.setProperty("--border-color", "#4a7a9c");
    root.style.setProperty("--shadow-color", "rgba(74, 122, 156, 0.3)");
    root.style.setProperty("--gradient-start", "#0a0f1a");
    root.style.setProperty("--gradient-end", "#060a12");
  } else {
    root.style.setProperty("--bg-primary", "#0a0a0a");
    root.style.setProperty("--bg-secondary", "#1a1a1a");
    root.style.setProperty("--text-primary", "#d4a846");
    root.style.setProperty("--text-secondary", "#e8d5a3");
    root.style.setProperty("--border-color", "#d4a846");
    root.style.setProperty("--shadow-color", "rgba(212, 168, 70, 0.3)");
    root.style.setProperty("--gradient-start", "#0a0a0a");
    root.style.setProperty("--gradient-end", "#1a1a1a");
  }
}

// ================================================================
// ===== تابع تغییر شخصیت (برای سازگاری با storyEngine.js) =====
// ================================================================

export function setCharacter(character) {
  state.currentCharacter = character;

  const themeMap = {
    sina: "dark-gold",
    rahi: "pink-gold",
    mehras: "blue-gold",
    arya: "blood-gold",
    sayman: "dark-gold",
    seyf: "cream-gold",
  };

  const theme = themeMap[character] || "dark-gold";
  setTheme(theme);

  // به‌روزرسانی المان‌های UI
  const charData = CHARACTERS[character];
  if (charData) {
    state.currentCharacterData = charData;

    const roleNameEl = document.getElementById("currentRoleName");
    if (roleNameEl) roleNameEl.textContent = charData.name;

    const characterNameEl = document.getElementById("characterName");
    if (characterNameEl) characterNameEl.textContent = charData.name;

    const portraitImg = document.getElementById("portraitImg");
    if (portraitImg && charData.portrait) {
      portraitImg.src = charData.portrait;
    }
  }

  try {
    localStorage.setItem("currentCharacter", character);
  } catch (e) {}

  console.log(`👤 تغییر شخصیت به: ${character} | تم: ${theme}`);
}

// ================================================================
// ===== تابع تغییر کاراکتر (برای استفاده مستقیم) =====
// ================================================================

export function switchCharacter(characterId, options = {}) {
  const character = CHARACTERS[characterId];
  if (!character) {
    console.warn(`⚠️ کاراکتر ${characterId} پیدا نشد!`);
    return;
  }

  state.currentCharacter = characterId;
  state.currentCharacterData = character;

  const theme = options.theme || character.theme || "dark-gold";
  applyThemeToDOM(theme);
  state.theme = theme;

  const roleNameEl = document.getElementById("currentRoleName");
  if (roleNameEl) roleNameEl.textContent = character.name;

  const characterNameEl = document.getElementById("characterName");
  if (characterNameEl) characterNameEl.textContent = character.name;

  const portraitImg = document.getElementById("portraitImg");
  if (portraitImg && character.portrait) {
    portraitImg.src = character.portrait;
  }

  try {
    localStorage.setItem("currentCharacter", characterId);
    localStorage.setItem("gameTheme", theme);
  } catch (e) {}

  console.log(
    `👤 تغییر به کاراکتر: ${character.name} (${characterId}) | تم: ${theme}`,
  );
}

// ================================================================
// ===== بارگذاری تم از localStorage =====
// ================================================================

export function loadTheme() {
  try {
    const saved = localStorage.getItem("gameTheme");
    if (saved) {
      state.theme = saved;
      applyThemeToDOM(saved);
    }
    const savedChar = localStorage.getItem("currentCharacter");
    if (savedChar && CHARACTERS[savedChar]) {
      state.currentCharacter = savedChar;
      state.currentCharacterData = CHARACTERS[savedChar];
    }
  } catch (e) {}
}

// ================================================================
// ===== دریافت کاراکتر فعلی =====
// ================================================================

export function getCurrentCharacter() {
  return state.currentCharacterData || CHARACTERS.sina;
}

// ================================================================
// ===== ریست state =====
// ================================================================

export function resetState() {
  state.sceneId = "start";

  state.stats.trustSina = 50;
  state.stats.trustRahi = 50;
  state.stats.trustArya = 70;
  state.stats.trustMehras = 40;
  state.stats.trustSeyf = 30;
  state.stats.trustVentus = 50;
  state.stats.sanity = 100;

  state.suspicion.arya = 0;
  state.suspicion.rahi = 0;
  state.suspicion.mehras = 0;
  state.suspicion.ventus = 0;
  state.suspicion.hossein = 0;
  state.suspicion.sepehr = 0;

  state.memory.metRahi = false;
  state.memory.sawAryaGlance = false;
  state.memory.talkedToMehras = false;
  state.memory.foundSagharsShoe = false;
  state.memory.receivedVentusMessage = false;
  state.memory.deletedMessages = false;
  state.memory.routeLocked = false;

  state.memory.ep1FinalChoice = null;
  state.memory.ep2FinalChoice = null;
  state.memory.ep2Path = null;

  state.memory.metVentus = false;
  state.memory.ventusTrust = 0;
  state.memory.ep3Path = null;
  state.memory.dryCleanerPartner = null;
  state.memory.hosseinResponse = null;
  state.memory.believedSepehr = false;
  state.memory.wentToHosseinHouse = false;
  state.memory.toldVentusAboutSepehr = false;
  state.memory.foundHosseinCard = false;
  state.memory.aryaWhiteCar = false;
  state.memory.sepehrWarning = false;
  state.memory.finalDecision = null;
  state.memory.hasStorageKey = false;

  state.memory.rahiGoesAloneSinaBehind = false;
  state.memory.rahiGoesWithSepehr = false;
  state.memory.rahiCallsPoliceFirst = false;
  state.memory.rahiHelpsSina = false;
  state.memory.rahiWatchesFromAfar = false;
  state.memory.rahiTellsSinaToWait = false;
  state.memory.rahiStopsSina = false;

  state.memory.ep5AryaPath = null;

  state.history = [];

  state.theme = "dark-gold";
  state.currentCharacter = "sina";
  state.currentCharacterData = CHARACTERS.sina;
  applyThemeToDOM("dark-gold");

  try {
    localStorage.setItem("currentCharacter", "sina");
    localStorage.setItem("gameTheme", "dark-gold");
  } catch (e) {}
}
