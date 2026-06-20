// src/engine/gameState.js

export const state = {
  episodeId: 1,
  sceneId: "station_now",

  // آمار شخصیت‌ها
  stats: {
    trustSina: 50,
    trustRahi: 50,
    trustArya: 70,
    trustMehras: 40,
    trustSeyf: 30,
    trustVentus: 50,
    sanity: 100,
  },

  // suspicion جداگانه
  suspicion: {
    arya: 0,
    rahi: 0,
    mehras: 0,
    ventus: 0,
    hossein: 0,
    sepehr: 0,
  },

  // فلگ‌های حافظه
  memory: {
    // ===== عمومی =====
    metRahi: false,
    sawAryaGlance: false,
    talkedToMehras: false,
    foundSagharsShoe: false,
    receivedVentusMessage: false,
    deletedMessages: false,
    routeLocked: false,

    // ===== انتخاب‌های اپیزود ۱ و ۲ =====
    ep1FinalChoice: null, // 'rahi', 'mehras', 'seyf', 'alone'
    ep2FinalChoice: null, // 'go', 'tell_seyf', 'ask_arya', 'decline'
    ep2Path: null, // 'mehras', 'seyf', 'rahi', 'alone'

    // ===== اپیزود ۳ =====
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
  },

  // تاریخچه انتخاب‌ها
  history: [],

  // شماره اپیزود فعلی
  currentEpisode: 1,
};

// ریست state برای replay
export function resetState() {
  state.sceneId = "start";

  // آمار
  state.stats.trustSina = 50;
  state.stats.trustRahi = 50;
  state.stats.trustArya = 70;
  state.stats.trustMehras = 40;
  state.stats.trustSeyf = 30;
  state.stats.trustVentus = 50;
  state.stats.sanity = 100;

  // شک‌ها
  state.suspicion.arya = 0;
  state.suspicion.rahi = 0;
  state.suspicion.mehras = 0;
  state.suspicion.ventus = 0;
  state.suspicion.hossein = 0;
  state.suspicion.sepehr = 0;

  // حافظه — عمومی
  state.memory.metRahi = false;
  state.memory.sawAryaGlance = false;
  state.memory.talkedToMehras = false;
  state.memory.foundSagharsShoe = false;
  state.memory.receivedVentusMessage = false;
  state.memory.deletedMessages = false;
  state.memory.routeLocked = false;

  // حافظه — انتخاب‌های اپیزود ۱ و ۲
  state.memory.ep1FinalChoice = null;
  state.memory.ep2FinalChoice = null;
  state.memory.ep2Path = null;

  // حافظه — اپیزود ۳
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

  // تاریخچه
  state.history = [];
}
