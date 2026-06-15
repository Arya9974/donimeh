// src/engine/gameState.js

export const state = {
  episodeId: 1,
  sceneId: "station_now",

  // آمار شخصیت‌ها
  stats: {
    trustSina: 50, // 0-100
    trustRahi: 50,
    trustArya: 70, // آریا با اعتماد بالا شروع میشه — ماسکش
    trustMehras: 40,
    sanity: 100,
  },

  // suspicion جداگانه — این روی perception بازیکن اثر میذاره
  suspicion: {
    arya: 0, // 0 تا 100 — هرچی بالاتر، بازیکن بیشتر شک می‌کنه
    rahi: 0,
    mehras: 0,
  },

  // فلگ‌های حافظه — برای unlock مسیرهای مخفی
  memory: {
    metRahi: false,
    sawAryaGlance: false, // نگاه مشکوک آریا به ساغر
    talkedToMehras: false,
    foundSagharsShoe: false,
    receivedVentusMessage: false,
    deletedMessages: false, // BAD FLAG
    routeLocked: false,
  },

  // تاریخچه انتخاب‌ها
  history: [],

  // شماره اپیزود فعلی
  currentEpisode: 1,
};

// ریست state برای replay
export function resetState() {
  state.sceneId = "start";
  state.stats.trustSina = 50;
  state.stats.trustRahi = 50;
  state.stats.trustArya = 70;
  state.stats.trustMehras = 40;
  state.stats.trustSeyf = 30;
  state.stats.sanity = 100;
  state.suspicion.arya = 0;
  state.suspicion.rahi = 0;
  state.suspicion.mehras = 0;
  state.memory.metRahi = false;
  state.memory.sawAryaGlance = false;
  state.memory.talkedToMehras = false;
  state.memory.foundSagharsShoe = false;
  state.memory.receivedVentusMessage = false;
  state.memory.deletedMessages = false;
  state.memory.routeLocked = false;
  state.history = [];
}
