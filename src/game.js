// src/game.js
// DonimehUI — Golden Cinematic Edition

window.DonimehUI = (function () {
  const portraitImg = document.getElementById("portraitImg");
  const portraitStage = document.getElementById("portraitStage");
  const speakerLine = document.getElementById("speakerLine");
  const dialogueLine = document.getElementById("dialogueLine");
  const choicesList = document.getElementById("choicesList");
  const continueHint = document.getElementById("continueHint");
  const phoneOverlay = document.getElementById("phoneOverlay");
  const phoneHeader = document.getElementById("phoneHeader");
  const phoneChat = document.getElementById("phoneChat");
  const phoneChoices = document.getElementById("phoneChoices");
  const puzzleOverlay = document.getElementById("puzzleOverlay");
  const puzzleContent = document.getElementById("puzzleContent");

  let typingTimer = null;
  let onTypingDone = null;
  let isPhoneOpen = false;
  let currentPortrait = "";
  let ambientAudio = null;
  let isAudioOn = false;

  // ═══════════════════════════════
  // ATMOSPHERE PARTICLES
  // ═══════════════════════════════
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

  // ═══════════════════════════════
  // PORTRAIT
  // ═══════════════════════════════
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

  // ═══════════════════════════════
  // DIALOGUE
  // ═══════════════════════════════
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
        const cursor = dialogueLine.querySelector(".typing-cursor");
        if (cursor) cursor.remove();
        dialogueLine.textContent += text[i];
        i++;
        const span = document.createElement("span");
        span.className = "typing-cursor";
        dialogueLine.appendChild(span);
        typingTimer = setTimeout(step, 22);
      } else {
        const cursor = dialogueLine.querySelector(".typing-cursor");
        if (cursor) cursor.remove();
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

  function onTypeEnd(callback) {
    onTypingDone = callback;
  }

  // ═══════════════════════════════
  // CHOICES
  // ═══════════════════════════════
  function showChoices(choices) {
    if (!choicesList) return;
    choicesList.innerHTML = "";
    if (continueHint) continueHint.style.display = "none";
    if (!choices || choices.length === 0) {
      if (continueHint) continueHint.style.display = "flex";
      return;
    }
    choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = c.label || c.text || "";
      btn.addEventListener("click", () => {
        choicesList.innerHTML = "";
        if (c.onSelect) c.onSelect();
      });
      choicesList.appendChild(btn);
    });
  }

  function showContinueHint(show) {
    if (continueHint) continueHint.style.display = show ? "flex" : "none";
  }

  // ═══════════════════════════════
  // PHONE
  // ═══════════════════════════════
  function openPhone(header, messages, choices) {
    if (!phoneOverlay) return;
    isPhoneOpen = true;
    phoneOverlay.classList.add("open");
    if (phoneHeader) phoneHeader.textContent = header || "";
    if (phoneChat) {
      phoneChat.innerHTML = "";
      if (messages) {
        messages.forEach((msg, i) => {
          const div = document.createElement("div");
          div.className = `chat-msg ${msg.type || (msg.sent ? "outgoing" : "incoming")}`;
          div.textContent = msg.text;
          div.style.animationDelay = (msg.delay || i * 0.4) + "s";
          phoneChat.appendChild(div);
        });
      }
    }
    if (phoneChoices) {
      phoneChoices.innerHTML = "";
      if (choices && choices.length > 0) {
        choices.forEach((c) => {
          const btn = document.createElement("button");
          btn.className = "phone-choice-btn";
          btn.textContent = c.label || c.text || "";
          btn.addEventListener("click", () => {
            if (c.onSelect) c.onSelect();
          });
          phoneChoices.appendChild(btn);
        });
      }
    }
  }

  function closePhone() {
    isPhoneOpen = false;
    if (phoneOverlay) phoneOverlay.classList.remove("open");
    if (phoneChat) phoneChat.innerHTML = "";
    if (phoneChoices) phoneChoices.innerHTML = "";
  }

  function isPhoneVisible() {
    return isPhoneOpen;
  }

  // ═══════════════════════════════
  // AUDIO
  // ═══════════════════════════════
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
    if (ambientAudio) {
      ambientAudio.pause();
    }
    isAudioOn = false;
  }

  function toggleAudio() {
    if (isAudioOn) stopAmbient();
    else startAmbient();
  }

  // ═══════════════════════════════
  // PUZZLE
  // ═══════════════════════════════
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

  // ═══════════════════════════════
  // INIT
  // ═══════════════════════════════
  initAtmosphere();

  // ═══════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════
  document.getElementById("audioBtn")?.addEventListener("click", () => {
    toggleAudio();
    document.getElementById("audioBtn").classList.toggle("on", isAudioOn);
  });

  // ═══════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════
  return {
    showPortrait,
    showDialogue,
    typeText,
    skipTyping,
    onTypeEnd,
    showChoices,
    showContinueHint,
    openPhone,
    closePhone,
    isPhoneVisible,
    showPuzzle,
    hidePuzzle,
    toggleAudio,
  };
})();
