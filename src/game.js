// src/game.js — DonimehUI Golden Edition (Fully Debugged)
window.DonimehUI = (function () {
  // ===== DOM Elements =====
  const portraitImg = document.getElementById("portraitImg");
  const portraitStage = document.getElementById("portraitStage");
  const speakerLine = document.getElementById("speakerLine");
  const dialogueLine = document.getElementById("dialogueLine");
  const choicesList = document.getElementById("choicesList");
  const continueHint = document.getElementById("continueHint");
  const puzzleOverlay = document.getElementById("puzzleOverlay");
  const puzzleContent = document.getElementById("puzzleContent");

  // ===== Variables =====
  let typingTimer = null,
    onTypingDone = null,
    currentPortrait = "";
  let ambientAudio = null,
    isAudioOn = false;
  let _isPhoneOpen = false,
    _currentApp = "home",
    _currentChatType = "chat";
  let _invOpen = false;
  let _phoneCallback = null;

  // ================================================================
  // ===== PUZZLE FUNCTIONS (Globally Available) =====
  // ================================================================

  // ----- پازل اپیزود ۲: دروغ‌سنج -----
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

  // ----- پازل اپیزود ۲: رمز لاکر -----
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

  // ----- پازل اپیزود ۳: عدد ۷۸۲۱ -----
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

  // ----- پازل اپیزود ۳: پیام به حسین -----
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

  // ----- پازل اپیزود ۳: تصمیم نهایی -----
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

  // ----- پازل اپیزود ۴: پین گوشی حسین -----
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

  // ----- پازل اپیزود ۵: نقشه خونه‌ی حسین -----
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

  // ----- پازل اپیزود ۵: قفل پنجره -----
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

  // ----- پازل اپیزود ۵: ورودی مخفی -----
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

  function showChoices(choices) {
    const choicesPanel = document.getElementById("choicesPanel");
    if (!choicesList || !choicesPanel) return;
    choicesList.innerHTML = "";
    if (continueHint) continueHint.style.display = "none";

    if (!choices || !choices.length) {
      choicesPanel.style.display = "none";
      if (continueHint) continueHint.style.display = "flex";
      return;
    }

    choicesPanel.style.display = "block";
    choices.forEach((c) => {
      const b = document.createElement("button");
      b.className = "choice-btn";
      b.textContent = c.label || c.text || "";
      b.addEventListener("click", () => {
        choicesList.innerHTML = "";
        choicesPanel.style.display = "none";
        if (c.onSelect) c.onSelect();
      });
      choicesList.appendChild(b);
    });
  }

  function showContinueHint(show) {
    if (continueHint) continueHint.style.display = show ? "flex" : "none";
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
    ambientAudio.play().catch(() => {});
    isAudioOn = true;
  }

  function stopAmbient() {
    if (ambientAudio) {
      ambientAudio.pause();
    }
    isAudioOn = false;
  }

  function toggleAudio() {
    isAudioOn ? stopAmbient() : startAmbient();
  }

  // ================================================================
  // ===== PUZZLE OVERLAY =====
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
    const grid = document.getElementById("inventoryGrid"),
      empty = document.getElementById("inventoryEmpty");
    if (!grid) return;
    grid.innerHTML = "";
    if (!items || !items.length) {
      empty.classList.add("inv-visible");
      return;
    }
    empty.classList.remove("inv-visible");
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "inv-item-card";
      card.innerHTML = `
        <div class="inv-item-icon">${item.icon || "📦"}</div>
        <p class="inv-item-name">${item.name || ""}</p>
        ${item.description ? `<p class="inv-item-desc">${item.description}</p>` : ""}
      `;
      grid.appendChild(card);
    });
  }

  function openInventory(items) {
    const d = document.getElementById("inventoryDrawer");
    if (!d) return;
    _renderInventory(items);
    d.classList.add("inv-drawer-open");
    d.classList.remove("inv-drawer-closed");
    _invOpen = true;
  }

  function closeInventory() {
    const d = document.getElementById("inventoryDrawer");
    if (!d) return;
    d.classList.remove("inv-drawer-open");
    d.classList.add("inv-drawer-closed");
    _invOpen = false;
  }

  function toggleInventory(items) {
    if (!items) items = window.__gameState?.memory?.inventory || [];
    _invOpen ? closeInventory() : openInventory(items);
  }

  // ================================================================
  // ===== PHONE - CORE =====
  // ================================================================

  function updatePhoneClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
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
    const p = document.getElementById("phoneOverlay");
    if (!p) return;
    _isPhoneOpen = true;
    _phoneCallback = callback || null;
    p.classList.add("open");
    updatePhoneClock();
    if (header) document.getElementById("chatHeader").textContent = header;
    openApp("home");
  }

  function closePhone() {
    const p = document.getElementById("phoneOverlay");
    if (!p) return;
    _isPhoneOpen = false;
    _currentChatType = "chat";
    p.classList.remove("open");
    if (_phoneCallback) {
      const cb = _phoneCallback;
      _phoneCallback = null;
      cb();
    }
  }

  function isPhoneVisible() {
    return _isPhoneOpen;
  }

  function openApp(name) {
    _currentApp = name;
    const screens = [
      "screenHome",
      "screenChat",
      "screenChatConvo",
      "screenItems",
      "screenNotes",
      "screenCall",
      "screenContact",
    ];
    screens.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });

    if (name === "home") {
      const el = document.getElementById("screenHome");
      if (el) el.classList.remove("hidden");
    } else if (name === "chat") {
      const el = document.getElementById("screenChat");
      if (el) el.classList.remove("hidden");
      renderContacts();
    } else if (name === "items") {
      const el = document.getElementById("screenItems");
      if (el) el.classList.remove("hidden");
      setTimeout(() => renderPhoneItems(), 50);
    } else if (name === "notes") {
      const el = document.getElementById("screenNotes");
      if (el) el.classList.remove("hidden");
      renderPhoneNotes();
    } else if (name === "call") {
      const el = document.getElementById("screenCall");
      if (el) el.classList.remove("hidden");
    } else if (name === "contact") {
      const el = document.getElementById("screenContact");
      if (el) el.classList.remove("hidden");
    }
  }

  // ================================================================
  // ===== PHONE - CHAT TYPES =====
  // ================================================================

  function setPhoneChat(header, messages, choices, inputConfig) {
    const chatScreen = document.getElementById("screenChat");
    const convoScreen = document.getElementById("screenChatConvo");
    const callScreen = document.getElementById("screenCall");
    const contactScreen = document.getElementById("screenContact");
    const chatHeader = document.getElementById("chatHeader");

    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.remove("hidden");
    if (callScreen) callScreen.classList.add("hidden");
    if (contactScreen) contactScreen.classList.add("hidden");
    if (chatHeader && header) chatHeader.textContent = header;

    _currentChatType = "chat";

    const chatEl = document.getElementById("phoneChat");
    if (chatEl && messages) {
      chatEl.innerHTML = "";
      messages.forEach((msg, i) => {
        const div = document.createElement("div");
        div.className = "chat-msg " + (msg.sent ? "outgoing" : "incoming");
        div.textContent = msg.text;
        div.style.animationDelay = (msg.delay || i * 0.4) + "s";
        const time = document.createElement("div");
        time.className = "chat-msg-time";
        const now = new Date();
        time.textContent =
          now.getHours().toString().padStart(2, "0") +
          ":" +
          now.getMinutes().toString().padStart(2, "0");
        div.appendChild(time);
        chatEl.appendChild(div);
      });
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    const choicesEl = document.getElementById("phoneChoices");
    if (choicesEl && choices) {
      choicesEl.innerHTML = "";
      choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.className = "phone-choice-btn";
        btn.textContent = c.label || c.text || "";
        btn.addEventListener("click", () => {
          choicesEl.innerHTML = "";
          if (c.onSelect) c.onSelect();
        });
        choicesEl.appendChild(btn);
      });
    }

    const inputContainer = document.getElementById("phoneInputContainer");
    const inputField = document.getElementById("phoneInputField");
    const inputSend = document.getElementById("phoneInputSend");

    if (inputConfig && inputConfig.responses) {
      if (inputContainer) inputContainer.style.display = "flex";
      if (inputField) {
        inputField.placeholder = inputConfig.placeholder || "پیام بفرست...";
        inputField.value = "";
        inputField.focus();
      }

      const handleInput = () => {
        if (!inputField) return;
        const val = inputField.value.trim();
        if (!val) return;
        const matched = inputConfig.responses.find(
          (r) => r.text === val || r.match === val,
        );
        if (matched) {
          inputField.value = "";
          const chatEl = document.getElementById("phoneChat");
          if (chatEl) {
            const div = document.createElement("div");
            div.className = "chat-msg outgoing";
            div.textContent = val;
            chatEl.appendChild(div);
            chatEl.scrollTop = chatEl.scrollHeight;
          }
          if (matched.next) {
            if (matched.effects && window.applyEffectsDirect) {
              window.applyEffectsDirect(matched.effects);
            }
            setTimeout(() => {
              if (window._phoneChoiceCallback) {
                window._phoneChoiceCallback(matched);
              }
            }, 300);
          }
        } else {
          const chatEl = document.getElementById("phoneChat");
          if (chatEl) {
            const div = document.createElement("div");
            div.className = "chat-msg outgoing";
            div.textContent = val;
            chatEl.appendChild(div);
            chatEl.scrollTop = chatEl.scrollHeight;
          }
          setTimeout(() => {
            const chatEl = document.getElementById("phoneChat");
            if (chatEl) {
              const div = document.createElement("div");
              div.className = "chat-msg incoming";
              div.textContent =
                "متوجه نشدم. لطفاً یکی از گزینه‌ها رو انتخاب کن.";
              chatEl.appendChild(div);
              chatEl.scrollTop = chatEl.scrollHeight;
            }
          }, 600);
        }
      };

      if (inputSend) inputSend.onclick = handleInput;
      if (inputField) {
        inputField.onkeydown = (e) => {
          if (e.key === "Enter") handleInput();
        };
      }
    } else {
      if (inputContainer) inputContainer.style.display = "none";
    }
  }

  function setPhoneGroupChat(header, messages, choices) {
    const chatScreen = document.getElementById("screenChat");
    const convoScreen = document.getElementById("screenChatConvo");
    const callScreen = document.getElementById("screenCall");
    const contactScreen = document.getElementById("screenContact");
    const chatHeader = document.getElementById("chatHeader");

    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.remove("hidden");
    if (callScreen) callScreen.classList.add("hidden");
    if (contactScreen) contactScreen.classList.add("hidden");
    if (chatHeader && header) chatHeader.textContent = header;

    _currentChatType = "group";

    const chatEl = document.getElementById("phoneChat");
    if (chatEl && messages) {
      chatEl.innerHTML = "";
      messages.forEach((msg, i) => {
        const div = document.createElement("div");
        div.className =
          "chat-msg " + (msg.sent ? "outgoing" : "incoming") + " group-msg";
        if (msg.sender && !msg.sent) {
          const sender = document.createElement("div");
          sender.className = "chat-sender";
          sender.textContent = msg.sender;
          div.appendChild(sender);
        }
        const text = document.createElement("span");
        text.textContent = msg.text;
        div.appendChild(text);
        div.style.animationDelay = (msg.delay || i * 0.4) + "s";
        chatEl.appendChild(div);
      });
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    const choicesEl = document.getElementById("phoneChoices");
    if (choicesEl && choices) {
      choicesEl.innerHTML = "";
      choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.className = "phone-choice-btn";
        btn.textContent = c.label || c.text || "";
        btn.addEventListener("click", () => {
          choicesEl.innerHTML = "";
          if (c.onSelect) c.onSelect();
        });
        choicesEl.appendChild(btn);
      });
    }
    const inputContainer = document.getElementById("phoneInputContainer");
    if (inputContainer) inputContainer.style.display = "none";
  }

  function setPhoneCall(header, duration, dialogue, onEnd) {
    const chatScreen = document.getElementById("screenChat");
    const convoScreen = document.getElementById("screenChatConvo");
    const callScreen = document.getElementById("screenCall");
    const contactScreen = document.getElementById("screenContact");
    const callHeader = document.getElementById("callHeader");

    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.add("hidden");
    if (callScreen) callScreen.classList.remove("hidden");
    if (contactScreen) contactScreen.classList.add("hidden");
    if (callHeader && header) callHeader.textContent = header;

    _currentChatType = "call";

    const callStatus = document.getElementById("callStatus");
    const callTimer = document.getElementById("callTimer");
    const callDialogue = document.getElementById("callDialogue");
    const callEndBtn = document.getElementById("callEndBtn");

    let seconds = 0;
    let dialogueIndex = 0;

    if (callStatus) callStatus.textContent = "در حال تماس...";
    if (callTimer) callTimer.textContent = "00:00";

    const timer = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      if (callTimer) callTimer.textContent = m + ":" + s;
    }, 1000);

    if (dialogue && dialogue.length) {
      const showDialogue = () => {
        if (dialogueIndex < dialogue.length) {
          const d = dialogue[dialogueIndex];
          if (callStatus)
            callStatus.textContent = d.speaker + " در حال صحبت...";
          if (callDialogue) callDialogue.textContent = d.text;
          dialogueIndex++;
          setTimeout(showDialogue, d.duration || 3000);
        } else {
          if (callStatus) callStatus.textContent = "مکالمه تمام شد";
          setTimeout(() => {
            if (onEnd) onEnd();
          }, 1000);
        }
      };
      setTimeout(showDialogue, 1000);
    } else {
      setTimeout(
        () => {
          if (callStatus) callStatus.textContent = "مکالمه تمام شد";
          setTimeout(() => {
            if (onEnd) onEnd();
          }, 1000);
        },
        (duration || 5) * 1000,
      );
    }

    if (callEndBtn) {
      callEndBtn.onclick = () => {
        clearInterval(timer);
        if (callStatus) callStatus.textContent = "تماس قطع شد";
        if (callDialogue) callDialogue.textContent = "";
        setTimeout(() => {
          if (onEnd) onEnd();
        }, 500);
      };
    }
  }

  function setPhoneContact(header, info, actions) {
    const chatScreen = document.getElementById("screenChat");
    const convoScreen = document.getElementById("screenChatConvo");
    const callScreen = document.getElementById("screenCall");
    const contactScreen = document.getElementById("screenContact");
    const contactHeader = document.getElementById("contactHeader");

    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.add("hidden");
    if (callScreen) callScreen.classList.add("hidden");
    if (contactScreen) contactScreen.classList.remove("hidden");
    if (contactHeader && header) contactHeader.textContent = header;

    _currentChatType = "contact";

    const avatar = document.getElementById("contactAvatar");
    const name = document.getElementById("contactName");
    const status = document.getElementById("contactStatus");
    const details = document.getElementById("contactDetails");
    const actionsEl = document.getElementById("contactActions");

    if (avatar && info.avatar) avatar.src = info.avatar;
    if (name) name.textContent = info.name || header;
    if (status) status.textContent = info.status || "آخرین بازدید: اخیراً";
    if (details) {
      details.innerHTML = "";
      if (info.details) {
        info.details.forEach((d) => {
          const p = document.createElement("p");
          p.textContent = d;
          details.appendChild(p);
        });
      }
    }
    if (actionsEl) {
      actionsEl.innerHTML = "";
      if (actions) {
        actions.forEach((a) => {
          const btn = document.createElement("button");
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
    const chatHeader = document.getElementById("chatHeader");
    if (chatHeader && header) chatHeader.textContent = header;

    const chatEl = document.getElementById("phoneChat");
    if (chatEl && messages) {
      chatEl.innerHTML = "";
      messages.forEach((msg) => {
        const div = document.createElement("div");
        div.className = "chat-msg " + (msg.sent ? "outgoing" : "incoming");
        div.textContent = msg.text;
        chatEl.appendChild(div);
      });
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    const choicesEl = document.getElementById("phoneChoices");
    if (choicesEl) choicesEl.innerHTML = "";

    const inputContainer = document.getElementById("phoneInputContainer");
    if (inputContainer) inputContainer.style.display = "none";

    const chatScreen = document.getElementById("screenChat");
    const convoScreen = document.getElementById("screenChatConvo");
    if (chatScreen) chatScreen.classList.add("hidden");
    if (convoScreen) convoScreen.classList.remove("hidden");
  }

  function getMessagesFor(name) {
    const history = window.__gameState?.memory?.chatHistory;
    return (history && history[name]) || [];
  }

  function renderContacts() {
    const el = document.getElementById("contactsList");
    if (!el) return;
    const history = window.__gameState?.memory?.chatHistory || {};
    const contactNames = Object.keys(history);
    el.innerHTML = "";
    if (contactNames.length === 0) {
      el.innerHTML =
        '<div class="empty-state"><div class="empty-emoji">💬</div>هنوز چتی ثبت نشده</div>';
      return;
    }
    contactNames.forEach((name) => {
      const messages = history[name];
      const lastMsg =
        messages.length > 0 ? messages[messages.length - 1].text : "";
      const row = document.createElement("div");
      row.className = "list-item";
      row.style.cursor = "pointer";
      row.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:500;color:#e8d5b0">${name}</div>
          <div style="font-size:0.7rem;color:rgba(212,168,70,0.5);margin-top:2px">${lastMsg.length > 30 ? lastMsg.slice(0, 30) + "..." : lastMsg}</div>
        </div>
      `;
      row.addEventListener("click", () => {
        showChatLog(name, messages);
      });
      el.appendChild(row);
    });
  }

  function renderPhoneItems() {
    const el = document.getElementById("itemsList");
    if (!el) return;
    let items = [];
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
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;width:100%;padding:4px 0;">
          <span style="font-size:1.5rem;width:36px;text-align:center;">${item.icon || "📦"}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:500;color:#e8d5b0;font-size:0.95rem;">${item.name || "آیتم"}</div>
            ${item.description ? `<div style="font-size:0.8rem;color:#a89070;margin-top:2px;line-height:1.3;">${item.description}</div>` : ""}
          </div>
        </div>
      `;
      el.appendChild(row);
    });
  }

  function renderPhoneNotes() {
    const el = document.getElementById("notesList");
    if (!el) return;
    const notes = window.__gameState?.memory?.notes || [];
    el.innerHTML = "";
    if (!notes.length) {
      el.innerHTML =
        '<div class="empty-state"><div class="empty-emoji">📋</div>یادداشتی ثبت نشده</div>';
      return;
    }
    notes.forEach((note) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `
        <span class="list-bullet" style="color:rgba(212,168,70,0.6);">—</span>
        <span class="list-item-text">${typeof note === "object" ? note.text || "" : String(note)}</span>
      `;
      el.appendChild(row);
    });
  }

  // ================================================================
  // ===== PHONE - CALLBACKS =====
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

  // ----- Event Listeners -----
  document.getElementById("audioBtn")?.addEventListener("click", () => {
    toggleAudio();
    document.getElementById("audioBtn")?.classList.toggle("on", isAudioOn);
  });

  document.getElementById("phoneOpenBtn")?.addEventListener("click", () => {
    openPhone("گوشی");
  });

  document.getElementById("invBtn")?.addEventListener("click", () => {
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
  // ===== EXPOSE PUBLIC API =====
  // ================================================================

  return {
    showPortrait,
    showDialogue,
    typeText,
    skipTyping,
    onTypeEnd,
    showChoices,
    showContinueHint,
    startAmbient,
    stopAmbient,
    toggleAudio,
    showPuzzle,
    hidePuzzle,
    openInventory,
    closeInventory,
    toggleInventory,
    openPhone,
    closePhone,
    isPhoneVisible,
    openApp,
    setPhoneChat,
    setPhoneGroupChat,
    setPhoneCall,
    setPhoneContact,
    showChatLog,
    renderPhoneItems,
    renderPhoneNotes,
    setPhoneChoiceCallback,
    setApplyEffectsDirect,
  };
})();
