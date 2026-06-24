// src/game.js — DonimehUI — نسخه کاملاً سازگار با ساختار جدید
window.DonimehUI = (function () {
  "use strict";

  // ================================================================
  // ===== DOM ELEMENTS (با fallback) =====
  // ================================================================

  const portraitImg = document.getElementById("portraitImg");
  const portraitStage =
    document.getElementById("portraitStage") ||
    document.getElementById("portraitFrame");
  const speakerLine = document.getElementById("speakerLine");
  const dialogueLine = document.getElementById("dialogueLine");
  const choicesContainer = document.getElementById("choicesContainer");
  const continueHint = document.getElementById("continueHint");
  const puzzleOverlay = document.getElementById("puzzleOverlay");
  const puzzleContent = document.getElementById("puzzleContent");

  // ================================================================
  // ===== VARIABLES =====
  // ================================================================

  let typingTimer = null;
  let onTypingDone = null;
  let currentPortrait = "";
  let ambientAudio = null;
  let isAudioOn = false;
  let _isPhoneOpen = false;
  let _currentApp = "home";
  let _currentChatType = "chat";
  let _invOpen = false;
  let _phoneCallback = null;
  let _phoneStructureReady = false;

  // ================================================================
  // ===== BUILD PHONE STRUCTURE IF MISSING =====
  // ================================================================

  function ensurePhoneStructure() {
    if (_phoneStructureReady) return;
    const overlay = document.getElementById("phoneOverlay");
    if (!overlay) return;

    // اگر گوشی ساختار داخلی نداره، می‌سازیمش
    if (!overlay.querySelector(".phone-device")) {
      overlay.innerHTML = `
        <div class="phone-device">
          <div class="phone-status-bar">
            <span class="status-time" id="statusTime">۱۲:۳۰</span>
            <div class="status-icons"><span>▲</span><span>●●●</span><span>▮▮▮</span></div>
          </div>
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <!-- صفحه خانه -->
            <div class="app-screen screen-home" id="screenHome">
              <button class="phone-close-btn" onclick="window.DonimehUI.closePhone()">✕</button>
              <div style="height:36px"></div>
              <div class="home-time" id="homeTime">۱۲:۳۰</div>
              <div class="home-date" id="homeDate">سه‌شنبه، ۲۶ خرداد</div>
              <div class="home-apps">
                <div class="app-icon" onclick="window.DonimehUI.openApp('chat')">
                  <div class="app-icon-emoji">💬</div>
                  <div class="app-icon-info"><span class="app-icon-name">Chat</span><span class="app-icon-sub">پیام‌ها</span></div>
                </div>
                <div class="app-icon" onclick="window.DonimehUI.openApp('items')">
                  <div class="app-icon-emoji">🎒</div>
                  <div class="app-icon-info"><span class="app-icon-name">Items</span><span class="app-icon-sub">اشیاء</span></div>
                </div>
                <div class="app-icon" onclick="window.DonimehUI.openApp('notes')">
                  <div class="app-icon-emoji">📋</div>
                  <div class="app-icon-info"><span class="app-icon-name">Notes</span><span class="app-icon-sub">یادداشت‌ها</span></div>
                </div>
              </div>
            </div>
            <!-- صفحه چت -->
            <div class="app-screen screen-chat hidden" id="screenChat">
              <div class="app-header">
                <button class="back-btn-phone" onclick="window.DonimehUI.openApp('home')">←</button>
                <div class="app-header-title">Chat</div>
              </div>
              <div class="list-screen" id="contactsList"></div>
            </div>
            <!-- صفحه مکالمه -->
            <div class="app-screen screen-chat-convo hidden" id="screenChatConvo">
              <div class="app-header">
                <button class="back-btn-phone" onclick="window.DonimehUI.openApp('chat')">←</button>
                <div class="app-header-title" id="chatHeader">Chat</div>
                <div class="app-header-dot"></div>
              </div>
              <div class="chat-messages" id="phoneChat"></div>
              <div class="chat-choices" id="phoneChoices"></div>
              <div class="chat-input-container" id="phoneInputContainer">
                <input type="text" class="chat-input-field" id="phoneInputField" placeholder="پیام بفرست..." />
                <button class="chat-input-send" id="phoneInputSend">➤</button>
              </div>
            </div>
            <!-- صفحه آیتم‌ها -->
            <div class="app-screen screen-items hidden" id="screenItems">
              <div class="app-header">
                <button class="back-btn-phone" onclick="window.DonimehUI.openApp('home')">←</button>
                <div class="app-header-title">🎒 Items</div>
              </div>
              <div class="list-screen" id="itemsList"></div>
            </div>
            <!-- صفحه یادداشت‌ها -->
            <div class="app-screen screen-notes hidden" id="screenNotes">
              <div class="app-header">
                <button class="back-btn-phone" onclick="window.DonimehUI.openApp('home')">←</button>
                <div class="app-header-title">📋 Notes</div>
              </div>
              <div class="list-screen" id="notesList"></div>
            </div>
            <!-- صفحه تماس -->
            <div class="app-screen screen-call hidden" id="screenCall">
              <div class="app-header">
                <button class="back-btn-phone" onclick="window.DonimehUI.closePhone()">←</button>
                <div class="app-header-title" id="callHeader">تماس</div>
              </div>
              <div class="call-container">
                <div class="call-avatar">📞</div>
                <div class="call-status" id="callStatus">در حال تماس...</div>
                <div class="call-timer" id="callTimer">۰۰:۰۰</div>
                <div class="call-dialogue" id="callDialogue"></div>
                <button class="call-end-btn" id="callEndBtn">قطع تماس</button>
              </div>
            </div>
            <!-- صفحه مخاطب -->
            <div class="app-screen screen-contact hidden" id="screenContact">
              <div class="app-header">
                <button class="back-btn-phone" onclick="window.DonimehUI.openApp('home')">←</button>
                <div class="app-header-title" id="contactHeader">مخاطب</div>
              </div>
              <div class="contact-container">
                <img class="contact-avatar" id="contactAvatar" src="" alt="" />
                <div class="contact-name" id="contactName"></div>
                <div class="contact-status" id="contactStatus"></div>
                <div class="contact-details" id="contactDetails"></div>
                <div class="contact-actions" id="contactActions"></div>
              </div>
            </div>
          </div>
          <div class="phone-home-btn"></div>
        </div>
      `;
      _phoneStructureReady = true;
    } else {
      _phoneStructureReady = true;
    }
  }

  // ================================================================
  // ===== PUZZLE FUNCTIONS =====
  // ================================================================

  window.checkLie = function (person) {
    const fb = document.getElementById("lieFeedback");
    if (!fb) {
      console.warn("⚠️ lieFeedback پیدا نشد!");
      return;
    }
    if (person === "mehras") {
      fb.textContent = "✅ درسته! مهراس دروغ می‌گفت";
      fb.style.color = "#4CAF50";
      setTimeout(() => {
        if (window._resolvePuzzle) window._resolvePuzzle(true);
      }, 800);
    } else {
      fb.textContent = "❌ نه. دقت کن: زمان‌ها با هم جور درنمیان.";
      fb.style.color = "#e05252";
    }
  };

  window.checkCodePuzzle = function () {
    const input = document.getElementById("puzzleInput");
    const fb = document.getElementById("puzzleFeedback");
    if (!input || !fb) {
      console.warn("⚠️ puzzleInput یا puzzleFeedback پیدا نشد!");
      return;
    }
    const val = input.value.trim();
    if (val === "1203" || val === "0312") {
      fb.textContent = "✅ درسته!";
      fb.style.color = "#4CAF50";
      setTimeout(() => {
        if (window._resolvePuzzle) window._resolvePuzzle(true);
      }, 800);
    } else {
      fb.textContent = "❌ اشتباهه. دقت کن: ۱۲ خرداد + پلاک ۳۴";
      input.value = "";
      input.focus();
    }
  };

  window.check7821 = function (person) {
    const fb = document.getElementById("puzzleFeedback_7821");
    if (!fb) {
      console.warn("⚠️ puzzleFeedback_7821 پیدا نشد!");
      return;
    }
    if (person === "arya") {
      fb.textContent = "✅ درسته! عدد ۷۸۲۱ رو ساغر به آریا گفته بود.";
      fb.style.color = "#4CAF50";
      setTimeout(() => {
        if (window._resolvePuzzle) window._resolvePuzzle(true);
      }, 800);
    } else {
      fb.textContent =
        "❌ نه. یادت باشه ساغر این عدد رو توی چت به کی گفته بود.";
      fb.style.color = "#e05252";
    }
  };

  window.checkHosseinMessage = function (selectedText) {
    const fb = document.getElementById("puzzleFeedback_hossein");
    if (!fb) {
      console.warn("⚠️ puzzleFeedback_hossein پیدا نشد!");
      return;
    }
    if (selectedText === "ساغر رو کجا بردی؟") {
      fb.textContent = "✅ درسته! این پیام باعث شد حسین جواب بده.";
      fb.style.color = "#4CAF50";
      setTimeout(() => {
        if (window._resolvePuzzle) window._resolvePuzzle(true);
      }, 800);
    } else {
      fb.textContent = "❌ نه. باید چیزی بگی که فقط حسین می‌دونه جوابش رو بده.";
      fb.style.color = "#e05252";
    }
  };

  window.checkFinalDecision = function (decision) {
    const fb = document.getElementById("puzzleFeedback_final");
    if (!fb) {
      console.warn("⚠️ puzzleFeedback_final پیدا نشد!");
      return;
    }
    const messages = {
      "برم پایین و روبرو بشم":
        "✅ تصمیم شجاعانه! این تو رو به حقیقت نزدیک‌تر می‌کنه.",
      "به ونتوس پیام بدم":
        "🟡 انتخاب امن. ونتوس میاد، ولی حسین ممکنه فرار کنه.",
      "به سایمان زنگ بزنم": "🟢 انتخاب منطقی. سایمان میاد و کمک می‌کنه.",
      "پلیس رو خبر کنم": "🔵 انتخاب قانونی. ولی حسین تا پلیس برسه فرار می‌کنه.",
    };
    fb.textContent =
      messages[decision] || "✅ انتخاب انجام شد. داستان ادامه پیدا می‌کنه...";
    fb.style.color = "#d4a846";
    setTimeout(() => {
      if (window._resolvePuzzle) window._resolvePuzzle(true);
    }, 800);
  };

  window.checkPhonePin = function (pin) {
    const fb = document.getElementById("puzzleFeedback_pin");
    if (!fb) {
      console.warn("⚠️ puzzleFeedback_pin پیدا نشد!");
      return;
    }
    if (pin === "7821") {
      fb.textContent = "✅ درسته! گوشی حسین باز شد.";
      fb.style.color = "#4CAF50";
      setTimeout(() => {
        if (window._resolvePuzzle) window._resolvePuzzle(true);
      }, 800);
    } else {
      fb.textContent = "❌ اشتباهه. دقت کن: عدد ۷۸۲۱ رو از کارت ویزیت داری.";
      fb.style.color = "#e05252";
    }
  };

  window.checkMapAnswer = function (answer) {
    const fb = document.getElementById("puzzleFeedback_map");
    if (!fb) {
      console.warn("⚠️ puzzleFeedback_map پیدا نشد!");
      return;
    }
    if (answer === "C") {
      fb.textContent = "✅ درسته! نقطه C مسیر درست به اتاق مخفی رو نشون میده.";
      fb.style.color = "#4CAF50";
      setTimeout(() => {
        if (window._resolvePuzzle) window._resolvePuzzle(true);
      }, 800);
    } else {
      fb.textContent =
        "❌ اشتباهه. دقت کن: نقطه‌ای که با خط چین به زیرزمین متصل شده.";
      fb.style.color = "#e05252";
    }
  };

  window.checkLockAnswer = function (answer) {
    const fb = document.getElementById("puzzleFeedback_lock");
    if (!fb) {
      console.warn("⚠️ puzzleFeedback_lock پیدا نشد!");
      return;
    }
    if (answer === "1378") {
      fb.textContent = "✅ درسته! قفل باز شد.";
      fb.style.color = "#4CAF50";
      setTimeout(() => {
        if (window._resolvePuzzle) window._resolvePuzzle(true);
      }, 800);
    } else {
      fb.textContent = "❌ اشتباهه. حسین حدوداً ۲۵ ساله هست.";
      fb.style.color = "#e05252";
    }
  };

  window.checkEntranceAnswer = function (answer) {
    const fb = document.getElementById("puzzleFeedback_entrance");
    if (!fb) {
      console.warn("⚠️ puzzleFeedback_entrance پیدا نشد!");
      return;
    }
    if (answer === "درخت کاج بزرگ") {
      fb.textContent = "✅ درسته! ورودی مخفی پشت درخت کاج بزرگه.";
      fb.style.color = "#4CAF50";
      setTimeout(() => {
        if (window._resolvePuzzle) window._resolvePuzzle(true);
      }, 800);
    } else {
      fb.textContent = "❌ اشتباهه. بینام گفت پشت درخت‌ها.";
      fb.style.color = "#e05252";
    }
  };

  // ================================================================
  // ===== ATMOSPHERE =====
  // ================================================================

  function initAtmosphere() {
    const canvas = document.getElementById("atmosphereCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W,
      H,
      particles = [];
    const COUNT = 70;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.3 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.1 + Math.random() * 0.3),
        alpha: 0.2 + Math.random() * 0.4,
        life: Math.random() * 300,
        maxLife: 300 + Math.random() * 400,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life >= p.maxLife || p.y < -10) {
          p.x = Math.random() * W;
          p.y = H + 10;
          p.life = 0;
          p.maxLife = 300 + Math.random() * 400;
        }
        const fade =
          p.life < 40
            ? p.life / 40
            : p.life > p.maxLife - 40
              ? (p.maxLife - p.life) / 40
              : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,168,70,${p.alpha * fade})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ================================================================
  // ===== PORTRAIT =====
  // ================================================================

  function showPortrait(src) {
    if (!portraitImg || !portraitStage) return;
    if (!src) {
      portraitStage.classList.add("fading");
      setTimeout(() => {
        portraitImg.src = "";
        portraitStage.classList.remove("fading");
      }, 500);
      currentPortrait = "";
      return;
    }
    if (currentPortrait === src) return;
    currentPortrait = src;
    portraitStage.classList.add("fading");
    setTimeout(() => {
      portraitImg.src = src;
      portraitStage.classList.remove("fading");
    }, 400);
  }

  // ================================================================
  // ===== DIALOGUE =====
  // ================================================================

  function showDialogue(speaker, text) {
    if (!speakerLine || !dialogueLine) return;
    speakerLine.textContent = speaker || "";
    dialogueLine.innerHTML = '<span class="typing-cursor"></span>';
    clearTimeout(typingTimer);
    typeText(text || "");
  }

  function typeText(text) {
    if (!dialogueLine) return;
    clearTimeout(typingTimer);
    let i = 0;
    dialogueLine.innerHTML = '<span class="typing-cursor"></span>';

    function step() {
      if (i < text.length) {
        const c = dialogueLine.querySelector(".typing-cursor");
        if (c) c.remove();
        dialogueLine.textContent += text[i];
        i++;
        const s = document.createElement("span");
        s.className = "typing-cursor";
        dialogueLine.appendChild(s);
        typingTimer = setTimeout(step, 22);
      } else {
        const c = dialogueLine.querySelector(".typing-cursor");
        if (c) c.remove();
        if (onTypingDone) {
          const cb = onTypingDone;
          onTypingDone = null;
          cb();
        }
      }
    }
    step();
  }

  function skipTyping() {
    clearTimeout(typingTimer);
    if (window._lastText && dialogueLine) {
      dialogueLine.textContent = window._lastText;
    }
    if (onTypingDone) {
      const cb = onTypingDone;
      onTypingDone = null;
      cb();
    }
  }

  function onTypeEnd(cb) {
    onTypingDone = cb;
  }

  // ================================================================
  // ===== CHOICES =====
  // ================================================================

  // ===== CHOICES =====
  function showChoices(choices) {
    const container = choicesContainer;
    if (!container) {
      console.warn("⚠️ choicesContainer پیدا نشد!");
      return;
    }

    const hint = container.querySelector("#continueHint") || continueHint;

    container.innerHTML = "";
    if (hint) hint.style.display = "none";

    if (!choices || !choices.length) {
      container.style.display = "none";
      if (hint) hint.style.display = "flex";
      return;
    }

    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";

    choices.forEach((c, index) => {
      const b = document.createElement("button");
      b.className = "choice-btn";
      b.setAttribute("data-index", index);
      b.dataset.selected = "false";

      const numSpan = document.createElement("span");
      numSpan.className = "choice-number";
      numSpan.textContent = index + 1 + ".";

      const textSpan = document.createElement("span");
      textSpan.className = "choice-text";
      textSpan.textContent = c.label || c.text || "";

      const ripple = document.createElement("span");
      ripple.className = "choice-ripple";

      // ===== چک مارک برای انتخاب‌شده =====
      const checkMark = document.createElement("span");
      checkMark.className = "choice-check";
      checkMark.textContent = "✓";
      checkMark.style.cssText = `
      display: none;
      margin-right: auto;
      color: var(--gold, #c9a84c);
      font-size: 1.2rem;
      font-weight: bold;
    `;

      b.appendChild(numSpan);
      b.appendChild(textSpan);
      b.appendChild(checkMark);
      b.appendChild(ripple);

      b.addEventListener("click", function (e) {
        // ===== جلوگیری از کلیک دوباره =====
        if (this.dataset.selected === "true") return;

        const rect = this.getBoundingClientRect();
        ripple.style.setProperty(
          "--rx",
          ((e.clientX - rect.left) / rect.width) * 100 + "%",
        );
        ripple.style.setProperty(
          "--ry",
          ((e.clientY - rect.top) / rect.height) * 100 + "%",
        );
        ripple.style.opacity = "1";
        setTimeout(() => (ripple.style.opacity = "0"), 400);

        // ===== ۱. هایلایت کردن انتخاب (طلایی) =====
        this.style.borderColor = "var(--gold, #c9a84c)";
        this.style.boxShadow = "0 0 20px rgba(201, 168, 76, 0.3)";
        this.style.background =
          "linear-gradient(90deg, rgba(201, 168, 76, 0.15), rgba(201, 168, 76, 0.05))";

        // ===== ۲. نمایش چک مارک =====
        if (checkMark) checkMark.style.display = "inline-block";

        // ===== ۳. غیرفعال کردن همه انتخاب‌ها =====
        const allBtns = container.querySelectorAll(".choice-btn");
        allBtns.forEach((btn) => {
          if (btn !== this) {
            btn.style.opacity = "0.4";
            btn.style.pointerEvents = "none";
            btn.style.cursor = "default";
          }
        });
        this.dataset.selected = "true";

        // ===== ۴. فلش طلایی برای تأیید انتخاب =====
        triggerGoldenFlash();

        // ===== ۵. پیام سیستمی (اگه انتخاب مهم باشه) =====
        if (c.important) {
          showSystemMessage("✦ انتخاب شما ثبت شد ✦");
        }

        // ===== ۶. اجرای onSelect =====
        setTimeout(() => {
          container.innerHTML = "";
          container.style.display = "none";
          if (c.onSelect) c.onSelect();
        }, 400);
      });

      container.appendChild(b);
    });
  }
  function showContinueHint(show) {
    const hint = document.getElementById("continueHint");
    if (hint) hint.style.display = show ? "flex" : "none";
  }
  // ===== فلش طلایی =====
  function triggerGoldenFlash() {
    const flash = document.getElementById("golden-flash");
    if (!flash) {
      // اگه فلش وجود نداره، بسازش
      createGoldenFlash();
      return;
    }
    flash.classList.remove("flash");
    // force reflow
    void flash.offsetWidth;
    flash.classList.add("flash");
    setTimeout(() => {
      flash.classList.remove("flash");
    }, 500);
  }

  function createGoldenFlash() {
    const flash = document.createElement("div");
    flash.id = "golden-flash";
    flash.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.15s ease;
    background: radial-gradient(
      ellipse at center,
      rgba(201, 168, 76, 0.25) 0%,
      transparent 70%
    );
  `;
    document.body.appendChild(flash);

    // استایل flash رو اضافه کن
    const style = document.createElement("style");
    style.textContent = `
    #golden-flash.flash {
      opacity: 1;
      animation: goldenFlash 0.6s ease forwards;
    }
    @keyframes goldenFlash {
      0% { opacity: 0; transform: scale(0.95); }
      30% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.05); }
    }
  `;
    document.head.appendChild(style);

    // اجرا
    setTimeout(() => {
      const f = document.getElementById("golden-flash");
      if (f) {
        f.classList.add("flash");
        setTimeout(() => f.classList.remove("flash"), 500);
      }
    }, 50);
  }
  // ===== پیام سیستمی =====
function showSystemMessage(msg, duration = 2500) {
  // حذف پیام قبلی
  const oldMsg = document.querySelector(".system-toast");
  if (oldMsg) oldMsg.remove();

  const toast = document.createElement("div");
  toast.className = "system-toast";
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9998;
    background: rgba(9, 8, 6, 0.92);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(201, 168, 76, 0.3);
    border-radius: 8px;
    padding: 12px 28px;
    color: var(--gold-light, #e8c97a);
    font-family: var(--font-body, "Vazirmatn", sans-serif);
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(201, 168, 76, 0.1);
    opacity: 0;
    transition: opacity 0.4s ease, transform 0.4s ease;
    transform: translateX(-50%) translateY(20px);
    text-align: center;
    max-width: 90%;
  `;

  // استایل برای موبایل
  if (window.innerWidth < 640) {
    toast.style.bottom = "100px";
    toast.style.padding = "10px 18px";
    toast.style.fontSize = "0.8rem";
  }

  document.body.appendChild(toast);

  // ظاهر شدن
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  }, 50);

  // محو شدن
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-10px)";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 500);
  }, duration);
}
  // ================================================================
  // ===== AUDIO =====
  // ================================================================

  function startAmbient() {
    if (!ambientAudio) {
      ambientAudio = new Audio("audios/audios.mp3");
      ambientAudio.loop = true;
      ambientAudio.volume = 0.3;
    }
    ambientAudio.play().catch(function () {});
    isAudioOn = true;
  }

  function stopAmbient() {
    if (ambientAudio) ambientAudio.pause();
    isAudioOn = false;
  }

  function toggleAudio() {
    isAudioOn ? stopAmbient() : startAmbient();
  }

  // ================================================================
  // ===== PUZZLE =====
  // ================================================================

  function showPuzzle(html) {
    if (!puzzleOverlay || !puzzleContent) return;
    puzzleContent.innerHTML = html;
    puzzleOverlay.classList.add("active");
  }

  function hidePuzzle() {
    if (!puzzleOverlay) return;
    puzzleOverlay.classList.remove("active");
    if (puzzleContent) puzzleContent.innerHTML = "";
  }

  // ================================================================
  // ===== INVENTORY =====
  // ================================================================

  function _renderInventory(items) {
    const grid = document.getElementById("inventoryGrid");
    const empty = document.getElementById("inventoryEmpty");
    if (!grid) return;

    grid.innerHTML = "";
    if (!items || !items.length) {
      if (empty) empty.classList.add("inv-visible");
      return;
    }
    if (empty) empty.classList.remove("inv-visible");

    items.forEach(function (item) {
      const card = document.createElement("div");
      card.className = "inv-item-card";
      card.innerHTML = `
        <div class="inv-item-icon">${item.icon || "📦"}</div>
        <p class="inv-item-name">${item.name || ""}</p>
        ${item.description ? '<p class="inv-item-desc">' + item.description + "</p>" : ""}
      `;
      grid.appendChild(card);
    });
  }

  function openInventory(items) {
    const d = document.getElementById("inventoryDrawer");
    if (!d) return;
    _renderInventory(items);
    d.removeAttribute("hidden");
    d.style.transform = "translateY(0)";
    _invOpen = true;
  }

  function closeInventory() {
    const d = document.getElementById("inventoryDrawer");
    if (!d) return;
    d.style.transform = "translateY(100%)";
    setTimeout(function () {
      d.setAttribute("hidden", "hidden");
    }, 400);
    _invOpen = false;
  }

  function toggleInventory(items) {
    if (!items) items = window.__gameState?.memory?.inventory || [];
    _invOpen ? closeInventory() : openInventory(items);
  }

  // ================================================================
  // ===== PHONE =====
  // ================================================================

  function updatePhoneClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const t = h + ":" + m;
    const sEl = document.getElementById("statusTime");
    const hEl = document.getElementById("homeTime");
    if (sEl) sEl.textContent = t;
    if (hEl) hEl.textContent = t;

    const days = [
      "یکشنبه",
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنجشنبه",
      "جمعه",
      "شنبه",
    ];
    const months = [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ];
    const dEl = document.getElementById("homeDate");
    if (dEl) {
      dEl.textContent =
        days[now.getDay()] +
        "، " +
        now.getDate() +
        " " +
        months[now.getMonth()];
    }
  }

  function openPhone(header, callback) {
    ensurePhoneStructure();
    const p = document.getElementById("phoneOverlay");
    if (!p) return;
    _isPhoneOpen = true;
    _phoneCallback = callback || null;
    p.removeAttribute("hidden");
    p.style.display = "flex";
    p.style.opacity = "0";
    p.style.transform = "scale(0.95)";

    setTimeout(function () {
      p.style.opacity = "1";
      p.style.transform = "scale(1)";
    }, 10);

    updatePhoneClock();
    if (header) {
      const h = document.getElementById("chatHeader");
      if (h) h.textContent = header;
    }
    openApp("home");
  }

  function closePhone() {
    const p = document.getElementById("phoneOverlay");
    if (!p) return;
    _isPhoneOpen = false;
    _currentChatType = "chat";
    p.style.opacity = "0";
    p.style.transform = "scale(0.95)";
    setTimeout(function () {
      p.setAttribute("hidden", "hidden");
      p.style.display = "none";
    }, 300);
    if (_phoneCallback) {
      var cb = _phoneCallback;
      _phoneCallback = null;
      cb();
    }
  }

  function isPhoneVisible() {
    return _isPhoneOpen;
  }

  function openApp(name) {
    _currentApp = name;
    var screens = [
      "screenHome",
      "screenChat",
      "screenChatConvo",
      "screenItems",
      "screenNotes",
      "screenCall",
      "screenContact",
    ];
    screens.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });

    if (name === "home") {
      var elHome = document.getElementById("screenHome");
      if (elHome) elHome.classList.remove("hidden");
    } else if (name === "chat") {
      var elChat = document.getElementById("screenChat");
      if (elChat) elChat.classList.remove("hidden");
      renderContacts();
    } else if (name === "items") {
      var elItems = document.getElementById("screenItems");
      if (elItems) elItems.classList.remove("hidden");
      setTimeout(renderPhoneItems, 50);
    } else if (name === "notes") {
      var elNotes = document.getElementById("screenNotes");
      if (elNotes) elNotes.classList.remove("hidden");
      renderPhoneNotes();
    } else if (name === "call") {
      var elCall = document.getElementById("screenCall");
      if (elCall) elCall.classList.remove("hidden");
    } else if (name === "contact") {
      var elContact = document.getElementById("screenContact");
      if (elContact) elContact.classList.remove("hidden");
    }
  }

  // ================================================================
  // ===== PHONE - CHAT =====
  // ================================================================

  function setPhoneChat(header, messages, choices, inputConfig) {
    ensurePhoneStructure();
    var chatScreen = document.getElementById("screenChat");
    var convoScreen = document.getElementById("screenChatConvo");
    var callScreen = document.getElementById("screenCall");
    var contactScreen = document.getElementById("screenContact");
    var chatHeader = document.getElementById("chatHeader");

    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.remove("hidden");
    if (callScreen) callScreen.classList.add("hidden");
    if (contactScreen) contactScreen.classList.add("hidden");
    if (chatHeader && header) chatHeader.textContent = header;

    _currentChatType = "chat";

    var chatEl = document.getElementById("phoneChat");
    if (chatEl && messages) {
      chatEl.innerHTML = "";
      messages.forEach(function (msg, i) {
        var div = document.createElement("div");
        div.className = "chat-msg " + (msg.sent ? "outgoing" : "incoming");
        div.textContent = msg.text;
        div.style.animationDelay = (msg.delay || i * 0.4) + "s";
        var time = document.createElement("div");
        time.className = "chat-msg-time";
        var now = new Date();
        time.textContent =
          String(now.getHours()).padStart(2, "0") +
          ":" +
          String(now.getMinutes()).padStart(2, "0");
        div.appendChild(time);
        chatEl.appendChild(div);
      });
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    var choicesEl = document.getElementById("phoneChoices");
    if (choicesEl && choices) {
      choicesEl.innerHTML = "";
      choices.forEach(function (c) {
        var btn = document.createElement("button");
        btn.className = "phone-choice-btn";
        btn.textContent = c.label || c.text || "";
        btn.addEventListener("click", function () {
          choicesEl.innerHTML = "";
          if (c.onSelect) c.onSelect();
        });
        choicesEl.appendChild(btn);
      });
    }

    var inputContainer = document.getElementById("phoneInputContainer");
    var inputField = document.getElementById("phoneInputField");
    var inputSend = document.getElementById("phoneInputSend");

    if (inputConfig && inputConfig.responses) {
      if (inputContainer) inputContainer.style.display = "flex";
      if (inputField) {
        inputField.placeholder = inputConfig.placeholder || "پیام بفرست...";
        inputField.value = "";
        inputField.focus();
      }

      var handleInput = function () {
        if (!inputField) return;
        var val = inputField.value.trim();
        if (!val) return;
        var matched = inputConfig.responses.find(function (r) {
          return r.text === val || r.match === val;
        });
        if (matched) {
          inputField.value = "";
          var chatEl2 = document.getElementById("phoneChat");
          if (chatEl2) {
            var div2 = document.createElement("div");
            div2.className = "chat-msg outgoing";
            div2.textContent = val;
            chatEl2.appendChild(div2);
            chatEl2.scrollTop = chatEl2.scrollHeight;
          }
          if (matched.next) {
            if (matched.effects && window.applyEffectsDirect) {
              window.applyEffectsDirect(matched.effects);
            }
            setTimeout(function () {
              if (window._phoneChoiceCallback) {
                window._phoneChoiceCallback(matched);
              }
            }, 300);
          }
        } else {
          var chatEl3 = document.getElementById("phoneChat");
          if (chatEl3) {
            var div3 = document.createElement("div");
            div3.className = "chat-msg outgoing";
            div3.textContent = val;
            chatEl3.appendChild(div3);
            chatEl3.scrollTop = chatEl3.scrollHeight;
          }
          setTimeout(function () {
            var chatEl4 = document.getElementById("phoneChat");
            if (chatEl4) {
              var div4 = document.createElement("div");
              div4.className = "chat-msg incoming";
              div4.textContent =
                "متوجه نشدم. لطفاً یکی از گزینه‌ها رو انتخاب کن.";
              chatEl4.appendChild(div4);
              chatEl4.scrollTop = chatEl4.scrollHeight;
            }
          }, 600);
        }
      };

      if (inputSend) inputSend.onclick = handleInput;
      if (inputField) {
        inputField.onkeydown = function (e) {
          if (e.key === "Enter") handleInput();
        };
      }
    } else {
      if (inputContainer) inputContainer.style.display = "none";
    }
  }

  function setPhoneGroupChat(header, messages, choices) {
    ensurePhoneStructure();
    var chatScreen = document.getElementById("screenChat");
    var convoScreen = document.getElementById("screenChatConvo");
    var callScreen = document.getElementById("screenCall");
    var contactScreen = document.getElementById("screenContact");
    var chatHeader = document.getElementById("chatHeader");

    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.remove("hidden");
    if (callScreen) callScreen.classList.add("hidden");
    if (contactScreen) contactScreen.classList.add("hidden");
    if (chatHeader && header) chatHeader.textContent = header;

    _currentChatType = "group";

    var chatEl = document.getElementById("phoneChat");
    if (chatEl && messages) {
      chatEl.innerHTML = "";
      messages.forEach(function (msg, i) {
        var div = document.createElement("div");
        div.className =
          "chat-msg " + (msg.sent ? "outgoing" : "incoming") + " group-msg";
        if (msg.sender && !msg.sent) {
          var sender = document.createElement("div");
          sender.className = "chat-sender";
          sender.textContent = msg.sender;
          div.appendChild(sender);
        }
        var text = document.createElement("span");
        text.textContent = msg.text;
        div.appendChild(text);
        div.style.animationDelay = (msg.delay || i * 0.4) + "s";
        chatEl.appendChild(div);
      });
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    var choicesEl = document.getElementById("phoneChoices");
    if (choicesEl && choices) {
      choicesEl.innerHTML = "";
      choices.forEach(function (c) {
        var btn = document.createElement("button");
        btn.className = "phone-choice-btn";
        btn.textContent = c.label || c.text || "";
        btn.addEventListener("click", function () {
          choicesEl.innerHTML = "";
          if (c.onSelect) c.onSelect();
        });
        choicesEl.appendChild(btn);
      });
    }
    var inputContainer = document.getElementById("phoneInputContainer");
    if (inputContainer) inputContainer.style.display = "none";
  }

  function setPhoneCall(header, duration, dialogue, onEnd) {
    ensurePhoneStructure();
    var chatScreen = document.getElementById("screenChat");
    var convoScreen = document.getElementById("screenChatConvo");
    var callScreen = document.getElementById("screenCall");
    var contactScreen = document.getElementById("screenContact");
    var callHeader = document.getElementById("callHeader");

    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.add("hidden");
    if (callScreen) callScreen.classList.remove("hidden");
    if (contactScreen) contactScreen.classList.add("hidden");
    if (callHeader && header) callHeader.textContent = header;

    _currentChatType = "call";

    var callStatus = document.getElementById("callStatus");
    var callTimer = document.getElementById("callTimer");
    var callDialogue = document.getElementById("callDialogue");
    var callEndBtn = document.getElementById("callEndBtn");

    var seconds = 0;
    var dialogueIndex = 0;

    if (callStatus) callStatus.textContent = "در حال تماس...";
    if (callTimer) callTimer.textContent = "00:00";

    var timer = setInterval(function () {
      seconds++;
      var m = String(Math.floor(seconds / 60)).padStart(2, "0");
      var s = String(seconds % 60).padStart(2, "0");
      if (callTimer) callTimer.textContent = m + ":" + s;
    }, 1000);

    if (dialogue && dialogue.length) {
      var showDialogueFn = function () {
        if (dialogueIndex < dialogue.length) {
          var d = dialogue[dialogueIndex];
          if (callStatus)
            callStatus.textContent = d.speaker + " در حال صحبت...";
          if (callDialogue) callDialogue.textContent = d.text;
          dialogueIndex++;
          setTimeout(showDialogueFn, d.duration || 3000);
        } else {
          if (callStatus) callStatus.textContent = "مکالمه تمام شد";
          setTimeout(function () {
            if (onEnd) onEnd();
          }, 1000);
        }
      };
      setTimeout(showDialogueFn, 1000);
    } else {
      setTimeout(
        function () {
          if (callStatus) callStatus.textContent = "مکالمه تمام شد";
          setTimeout(function () {
            if (onEnd) onEnd();
          }, 1000);
        },
        (duration || 5) * 1000,
      );
    }

    if (callEndBtn) {
      callEndBtn.onclick = function () {
        clearInterval(timer);
        if (callStatus) callStatus.textContent = "تماس قطع شد";
        if (callDialogue) callDialogue.textContent = "";
        setTimeout(function () {
          if (onEnd) onEnd();
        }, 500);
      };
    }
  }

  function setPhoneContact(header, info, actions) {
    ensurePhoneStructure();
    var chatScreen = document.getElementById("screenChat");
    var convoScreen = document.getElementById("screenChatConvo");
    var callScreen = document.getElementById("screenCall");
    var contactScreen = document.getElementById("screenContact");
    var contactHeader = document.getElementById("contactHeader");

    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.add("hidden");
    if (callScreen) callScreen.classList.add("hidden");
    if (contactScreen) contactScreen.classList.remove("hidden");
    if (contactHeader && header) contactHeader.textContent = header;

    _currentChatType = "contact";

    var avatar = document.getElementById("contactAvatar");
    var name = document.getElementById("contactName");
    var status = document.getElementById("contactStatus");
    var details = document.getElementById("contactDetails");
    var actionsEl = document.getElementById("contactActions");

    if (avatar && info.avatar) avatar.src = info.avatar;
    if (name) name.textContent = info.name || header;
    if (status) status.textContent = info.status || "آخرین بازدید: اخیراً";
    if (details) {
      details.innerHTML = "";
      if (info.details) {
        info.details.forEach(function (d) {
          var p = document.createElement("p");
          p.textContent = d;
          details.appendChild(p);
        });
      }
    }
    if (actionsEl) {
      actionsEl.innerHTML = "";
      if (actions) {
        actions.forEach(function (a) {
          var btn = document.createElement("button");
          btn.className = "phone-choice-btn";
          btn.textContent = a.label;
          btn.onclick = a.onClick;
          actionsEl.appendChild(btn);
        });
      }
    }
  }

  // ================================================================
  // ===== PHONE - HELPERS =====
  // ================================================================

  function showChatLog(header, messages) {
    ensurePhoneStructure();
    var chatHeader = document.getElementById("chatHeader");
    if (chatHeader && header) chatHeader.textContent = header;

    var chatEl = document.getElementById("phoneChat");
    if (chatEl && messages) {
      chatEl.innerHTML = "";
      messages.forEach(function (msg) {
        var div = document.createElement("div");
        div.className = "chat-msg " + (msg.sent ? "outgoing" : "incoming");
        div.textContent = msg.text;
        chatEl.appendChild(div);
      });
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    var choicesEl = document.getElementById("phoneChoices");
    if (choicesEl) choicesEl.innerHTML = "";

    var inputContainer = document.getElementById("phoneInputContainer");
    if (inputContainer) inputContainer.style.display = "none";

    var chatScreen = document.getElementById("screenChat");
    var convoScreen = document.getElementById("screenChatConvo");
    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.remove("hidden");
  }

  function getMessagesFor(name) {
    var history = window.__gameState?.memory?.chatHistory;
    return (history && history[name]) || [];
  }

  function renderContacts() {
    var el = document.getElementById("contactsList");
    if (!el) return;
    var history = window.__gameState?.memory?.chatHistory || {};
    var contactNames = Object.keys(history);
    el.innerHTML = "";
    if (contactNames.length === 0) {
      el.innerHTML =
        '<div class="empty-state"><div class="empty-emoji">💬</div>هنوز چتی ثبت نشده</div>';
      return;
    }
    contactNames.forEach(function (name) {
      var messages = history[name];
      var lastMsg =
        messages.length > 0 ? messages[messages.length - 1].text : "";
      var row = document.createElement("div");
      row.className = "list-item";
      row.style.cursor = "pointer";
      row.innerHTML =
        '<div style="flex:1"><div style="font-weight:500;color:#e8d5b0">' +
        name +
        '</div><div style="font-size:0.7rem;color:rgba(212,168,70,0.5);margin-top:2px">' +
        (lastMsg.length > 30 ? lastMsg.slice(0, 30) + "..." : lastMsg) +
        "</div></div>";
      row.addEventListener("click", function () {
        showChatLog(name, messages);
      });
      el.appendChild(row);
    });
  }

  function renderPhoneItems() {
    var el = document.getElementById("itemsList");
    if (!el) return;
    var items = [];
    if (window.__gameState?.memory?.inventory)
      items = window.__gameState.memory.inventory;
    else if (window.state?.memory?.inventory)
      items = window.state.memory.inventory;
    el.innerHTML = "";
    if (!items || items.length === 0) {
      el.innerHTML =
        '<div class="empty-state"><div class="empty-emoji">🎒</div><div style="color:#a89070;font-size:0.9rem;">موجودی خالی است</div></div>';
      return;
    }
    items.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;width:100%;padding:4px 0;"><span style="font-size:1.5rem;width:36px;text-align:center;">' +
        (item.icon || "📦") +
        '</span><div style="flex:1;min-width:0;"><div style="font-weight:500;color:#e8d5b0;font-size:0.95rem;">' +
        (item.name || "آیتم") +
        "</div>" +
        (item.description
          ? '<div style="font-size:0.8rem;color:#a89070;margin-top:2px;line-height:1.3;">' +
            item.description +
            "</div>"
          : "") +
        "</div></div>";
      el.appendChild(row);
    });
  }

  function renderPhoneNotes() {
    var el = document.getElementById("notesList");
    if (!el) return;
    var notes = window.__gameState?.memory?.notes || [];
    el.innerHTML = "";
    if (!notes.length) {
      el.innerHTML =
        '<div class="empty-state"><div class="empty-emoji">📋</div>یادداشتی ثبت نشده</div>';
      return;
    }
    notes.forEach(function (note) {
      var row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML =
        '<span class="list-bullet" style="color:rgba(212,168,70,0.6);">—</span><span class="list-item-text">' +
        (typeof note === "object" ? note.text || "" : String(note)) +
        "</span>";
      el.appendChild(row);
    });
  }

  // ================================================================
  // ===== ITEM SYSTEM =====
  // ================================================================

  function showSystemMessage(msg) {
    var container = document.getElementById("systemMessages");
    if (!container) return;
    var el = document.createElement("div");
    el.className = "sys-msg";
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 3100);
  }

  function showItemReceived(itemName, itemIcon, description) {
    showSystemMessage(
      "📦 " +
        itemIcon +
        " " +
        itemName +
        " — دریافت شد!" +
        (description ? " (" + description + ")" : ""),
    );
    var flash = document.getElementById("golden-flash");
    if (flash) {
      flash.classList.add("flash");
      setTimeout(function () {
        flash.classList.remove("flash");
      }, 400);
    }
    var badge = document.getElementById("bagBadge");
    if (badge) {
      var current = parseInt(badge.textContent) || 0;
      badge.textContent = current + 1;
      badge.removeAttribute("hidden");
    }
  }

  function addItemToInventory(item) {
    if (!window.__gameState) return;
    if (!window.__gameState.memory) window.__gameState.memory = {};
    if (!window.__gameState.memory.inventory)
      window.__gameState.memory.inventory = [];
    if (
      window.__gameState.memory.inventory.some(function (it) {
        return it.id === item.id;
      })
    ) {
      showSystemMessage(
        "📦 " + item.icon + " " + item.name + " — از قبل دارید",
      );
      return;
    }
    window.__gameState.memory.inventory.push({
      id: item.id,
      name: item.name,
      icon: item.icon || "📦",
      description: item.description || "",
    });
    showItemReceived(item.name, item.icon, item.description);
    if (window.saveProgress) window.saveProgress();
  }
  // ================================================================
  // ===== جدید: تابع نمایش تغییر شخصیت =====
  // ================================================================

  function showCharacterSwitch(character, theme, message) {
    const overlay = document.getElementById("themeTransition");
    const msgEl = document.getElementById("character-switch-message");

    if (!overlay || !msgEl) {
      console.warn("⚠️ themeTransition یا character-switch-message پیدا نشد!");
      return;
    }

    msgEl.textContent = message || `🎭 شما در نقش ${character} هستید`;

    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
    }, 2000);
  }
  // ================================================================
  // ===== CALLBACKS =====
  // ================================================================

  function setPhoneChoiceCallback(cb) {
    window._phoneChoiceCallback = cb;
  }

  function setApplyEffectsDirect(fn) {
    window.applyEffectsDirect = fn;
  }

  // ================================================================
  // ===== INIT =====
  // ================================================================

  initAtmosphere();
  setInterval(updatePhoneClock, 30000);

  // ===== Event Listeners =====
  document.getElementById("audioBtn")?.addEventListener("click", function () {
    toggleAudio();
    document.getElementById("audioBtn")?.classList.toggle("on", isAudioOn);
  });

  document
    .getElementById("phoneOpenBtn")
    ?.addEventListener("click", function () {
      openPhone("گوشی");
    });

  document.getElementById("invBtn")?.addEventListener("click", function () {
    toggleInventory(window.__gameState?.memory?.inventory || []);
  });

  document
    .getElementById("inventoryBackdrop")
    ?.addEventListener("click", closeInventory);
  document
    .getElementById("inventoryClose")
    ?.addEventListener("click", closeInventory);
  document
    .querySelector(".phone-home-btn")
    ?.addEventListener("click", closePhone);
  document.getElementById("callEndBtn")?.addEventListener("click", closePhone);

  // ================================================================
  // ===== EXPOSE =====
  // ================================================================

  return {
    showPortrait: showPortrait,
    showDialogue: showDialogue,
    typeText: typeText,
    skipTyping: skipTyping,
    onTypeEnd: onTypeEnd,
    showChoices: showChoices,
    showContinueHint: showContinueHint,
    startAmbient: startAmbient,
    stopAmbient: stopAmbient,
    toggleAudio: toggleAudio,
    showPuzzle: showPuzzle,
    hidePuzzle: hidePuzzle,
    openInventory: openInventory,
    closeInventory: closeInventory,
    toggleInventory: toggleInventory,
    openPhone: openPhone,
    closePhone: closePhone,
    isPhoneVisible: isPhoneVisible,
    openApp: openApp,
    setPhoneChat: setPhoneChat,
    setPhoneGroupChat: setPhoneGroupChat,
    setPhoneCall: setPhoneCall,
    setPhoneContact: setPhoneContact,
    showChatLog: showChatLog,
    renderPhoneItems: renderPhoneItems,
    renderPhoneNotes: renderPhoneNotes,
    setPhoneChoiceCallback: setPhoneChoiceCallback,
    setApplyEffectsDirect: setApplyEffectsDirect,
    addItemToInventory: addItemToInventory,
    showSystemMessage: showSystemMessage,
    showCharacterSwitch: showCharacterSwitch,
  };
})();

console.log("✅ DonimehUI لود شد (نسخه سازگار)");
