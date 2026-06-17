  // src/game.js — DonimehUI Golden Edition
  window.DonimehUI = (function () {
    const portraitImg = document.getElementById("portraitImg");
    const portraitStage = document.getElementById("portraitStage");
    const speakerLine = document.getElementById("speakerLine");
    const dialogueLine = document.getElementById("dialogueLine");
    const choicesList = document.getElementById("choicesList");
    const continueHint = document.getElementById("continueHint");
    const puzzleOverlay = document.getElementById("puzzleOverlay");
    const puzzleContent = document.getElementById("puzzleContent");

    let typingTimer = null,
      onTypingDone = null,
      currentPortrait = "";
    let ambientAudio = null,
      isAudioOn = false;
    let _isPhoneOpen = false,
      _currentApp = "home";
    let _invOpen = false;

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
      for (let i = 0; i < COUNT; i++)
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
      if (window._lastText && dialogueLine)
        dialogueLine.textContent = window._lastText;
      if (onTypingDone) {
        const cb = onTypingDone;
        onTypingDone = null;
        cb();
      }
    }
    function onTypeEnd(cb) {
      onTypingDone = cb;
    }
    window.checkCodePuzzle = function () {
      const input = document.getElementById("puzzleInput");
      const fb = document.getElementById("puzzleFeedback");
      if (!input) return;
      const val = input.value.trim();
      if (val === "1234" || val === "3412") {
        // ۱۲ خرداد = ۱۲/۰۳
        fb.textContent = "✅ درسته!";
        fb.style.color = "#4CAF50";
        setTimeout(() => {
          if (window._resolvePuzzle) window._resolvePuzzle(true);
        }, 800);
      } else {
        fb.textContent = "❌ اشتباهه. دقت کن: ۱۲ خرداد + پلاک ۳۴";
        input.value = "";
      }
    };
    window.checkLie = function (person) {
      const fb = document.getElementById("lieFeedback");
      if (!fb) return;
      if (person === "mehras") {
        fb.textContent = "✅ درسته! مهراس دروغ می‌گفت";
        fb.style.color = "#4CAF50";
        setTimeout(() => {
          if (window._resolvePuzzle) window._resolvePuzzle(true);
        }, 800);
      } else {
        fb.textContent =
          "❌ نه. دقت کن: زمان‌ها با هم جور درنمیان. یه نفر دیگه‌ست.";
        fb.style.color = "#e05252";
      }
    };
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

    function startAmbient() {
      if (!ambientAudio) {
        ambientAudio = new Audio("audios/audios.mp3");
        ambientAudio.loop = true;
        ambientAudio.volume = 0.3;
      }
      ambientAudio.play();
      isAudioOn = true;
    }
    function stopAmbient() {
      if (ambientAudio) ambientAudio.pause();
      isAudioOn = false;
    }
    function toggleAudio() {
      isAudioOn ? stopAmbient() : startAmbient();
    }

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
        card.innerHTML =
          '<div class="inv-item-icon">' +
          (item.icon || "📦") +
          '</div><p class="inv-item-name">' +
          (item.name || "") +
          "</p>" +
          (item.description
            ? '<p class="inv-item-desc">' + item.description + "</p>"
            : "");
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

    function updatePhoneClock() {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, "0"),
        m = now.getMinutes().toString().padStart(2, "0");
      const t = h + ":" + m;
      const sEl = document.getElementById("statusTime"),
        hEl = document.getElementById("homeTime");
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
      if (dEl)
        dEl.textContent =
          days[now.getDay()] +
          "، " +
          now.getDate() +
          " " +
          months[now.getMonth()];
    }
    function openPhone(header) {
      const p = document.getElementById("phoneOverlay");
      if (!p) return;
      _isPhoneOpen = true;
      p.classList.add("open");
      updatePhoneClock();
      if (header) document.getElementById("chatHeader").textContent = header;
      openApp("home");
    }
    function closePhone() {
      const p = document.getElementById("phoneOverlay");
      if (!p) return;
      _isPhoneOpen = false;
      p.classList.remove("open");
    }
    function isPhoneVisible() {
      return _isPhoneOpen;
    }

    function openApp(name) {
      _currentApp = name;
      document.getElementById("screenHome").classList.add("hidden");
      document.getElementById("screenChat").classList.add("hidden");
      document.getElementById("screenChatConvo").classList.add("hidden");
      document.getElementById("screenItems").classList.add("hidden");
      document.getElementById("screenNotes").classList.add("hidden");
      if (name === "home") {
        document.getElementById("screenHome").classList.remove("hidden");
      } else if (name === "chat") {
        document.getElementById("screenChat").classList.remove("hidden");
        renderContacts();
      } else if (name === "items") {
        document.getElementById("screenItems").classList.remove("hidden");
        setTimeout(() => renderPhoneItems(), 50);
      } else if (name === "notes") {
        document.getElementById("screenNotes").classList.remove("hidden");
        renderPhoneNotes();
      }
    }

    function setPhoneChat(header, messages, choices) {
      document.getElementById("screenChat").classList.add("hidden");
      document.getElementById("screenChatConvo").classList.remove("hidden");
      if (header) document.getElementById("chatHeader").textContent = header;
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
            if (c.onSelect) c.onSelect();
          });
          choicesEl.appendChild(btn);
        });
      }
    }

    function showChatLog(header, messages) {
      if (header) document.getElementById("chatHeader").textContent = header;
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
      document.getElementById("screenChat").classList.add("hidden");
      document.getElementById("screenChatConvo").classList.remove("hidden");
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
        row.innerHTML =
          '<div style="flex:1"><div style="font-weight:500;color:#e8d5b0">' +
          name +
          '</div><div style="font-size:0.7rem;color:rgba(212,168,70,0.5);margin-top:2px">' +
          (lastMsg.length > 30 ? lastMsg.slice(0, 30) + "..." : lastMsg) +
          "</div></div>";
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
        row.innerHTML =
          '<span class="list-bullet" style="color:rgba(212,168,70,0.6);">—</span><span class="list-item-text">' +
          (typeof note === "object" ? note.text || "" : String(note)) +
          "</span>";
        el.appendChild(row);
      });
    }

    initAtmosphere();
    setInterval(updatePhoneClock, 30000);

    document.getElementById("audioBtn")?.addEventListener("click", () => {
      toggleAudio();
      document.getElementById("audioBtn").classList.toggle("on", isAudioOn);
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
      showChatLog,
      renderPhoneItems,
      renderPhoneNotes,
    };
  })();
