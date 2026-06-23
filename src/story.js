// src/story.js — دو نیمه | داستان کامل

(function () {
  "use strict";

  // ================================================================
  //  متغیرها
  // ================================================================

  let episodesData = null;
  let allBlocks = [];
  let userProgress = { episode: 0, scene: 0 };
  let showFullStory = false;
  let currentBlockIndex = 0;

  // ================================================================
  //  خواندن پیشرفت کاربر از localStorage
  // ================================================================

  function getUserProgress() {
    try {
      let ep = parseInt(
        localStorage.getItem("donimeh_currentEpisode") ||
          localStorage.getItem("donimeh_episode") ||
          "0",
        10,
      );

      let sceneRaw =
        localStorage.getItem("donimeh_currentScene") ||
        localStorage.getItem("donimeh_scene") ||
        "0";

      let scene = 0;
      if (typeof sceneRaw === "string") {
        const match = sceneRaw.match(/\d+/);
        if (match) {
          scene = parseInt(match[0], 10);
        }
      } else {
        scene = parseInt(sceneRaw, 10) || 0;
      }

      return { episode: ep, scene: scene };
    } catch (e) {
      console.warn("⚠️ خطا در خواندن پیشرفت:", e);
      return { episode: 0, scene: 0 };
    }
  }

  // ================================================================
  //  پیدا کردن آخرین صحنه‌ای که کاربر بهش رسیده
  // ================================================================

  function findLastReachedBlock(blocks, progress) {
    if (progress.episode === 0 && progress.scene === 0) {
      return 0;
    }

    let lastIndex = 0;
    let foundEpisode = false;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (!block.episode) {
        if (!foundEpisode) {
          lastIndex = i;
        }
        continue;
      }

      const blockEpisode = parseInt(block.episode, 10);

      if (blockEpisode < progress.episode) {
        lastIndex = i;
        foundEpisode = true;
        continue;
      }

      if (blockEpisode === progress.episode) {
        foundEpisode = true;

        if (block.scene) {
          const sceneMatch = String(block.scene).match(/\d+/);
          if (sceneMatch) {
            const blockScene = parseInt(sceneMatch[0], 10);
            if (blockScene <= progress.scene) {
              lastIndex = i;
            } else {
              return lastIndex;
            }
          } else {
            lastIndex = i;
          }
        } else {
          lastIndex = i;
        }
      }

      if (blockEpisode > progress.episode) {
        return lastIndex;
      }
    }

    return lastIndex;
  }

  // ================================================================
  //  بارگذاری episodes.json
  // ================================================================

  async function loadEpisodes() {
    try {
      const res = await fetch("assets/data/episodes.json");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      episodesData = data.episodes || data;
      console.log(`✅ ${episodesData.length} اپیزود لود شد`);
      return true;
    } catch (err) {
      console.error("❌ خطا در بارگذاری episodes.json:", err);
      return false;
    }
  }

  // ================================================================
  //  استخراج همهٔ بلوک‌های داستان
  // ================================================================

  function extractAllBlocks() {
    if (!episodesData || !episodesData.length) {
      console.warn("⚠️ داده‌ای برای استخراج وجود ندارد");
      return [];
    }

    const blocks = [];

    episodesData.forEach((episode, epIndex) => {
      blocks.push({
        type: "heading",
        text: `فصل ${epIndex + 1}: ${episode.title}`,
        episode: episode.id,
      });

      const sceneKeys = Object.keys(episode.scenes);
      sceneKeys.forEach((sceneId) => {
        const scene = episode.scenes[sceneId];

        if (scene.narrator) {
          blocks.push({
            type: "narrator",
            text: scene.narrator,
            episode: episode.id,
            scene: sceneId,
          });
        }

        if (scene.speaker && scene.dialogue) {
          blocks.push({
            type: "dialogue",
            speaker: scene.speaker,
            text: scene.dialogue,
            episode: episode.id,
            scene: sceneId,
          });
        }

        if (scene.choices && scene.choices.length > 0) {
          const choiceTexts = scene.choices.map((c) => c.text);
          blocks.push({
            type: "choices",
            choices: choiceTexts,
            episode: episode.id,
            scene: sceneId,
          });
        }

        if (scene.addNote) {
          const noteText =
            typeof scene.addNote === "string"
              ? scene.addNote
              : scene.addNote.text || "";
          if (noteText) {
            blocks.push({
              type: "note",
              text: noteText,
              episode: episode.id,
              scene: sceneId,
            });
          }
        }
      });

      if (epIndex < episodesData.length - 1) {
        blocks.push({ type: "divider" });
      }
    });

    console.log(`📝 ${blocks.length} بلوک داستانی استخراج شد`);
    return blocks;
  }

  // ================================================================
  //  نمایان کردن همه عناصر (برای حالت Full Story)
  // ================================================================

  function revealAllElements() {
    const items = document.querySelectorAll(
      ".story-paragraph, .story-dialogue, .story-choice, .story-note, .story-heading, .story-divider, .story-continue",
    );

    items.forEach((el) => {
      el.classList.add("in-view");
    });

    console.log(`✅ ${items.length} عنصر نمایان شد`);
  }

  // ================================================================
  //  رندر کردن داستان
  // ================================================================

  function renderStory(blocks, startIndex = 0, fullStory = false) {
    const contentEl = document.getElementById("storyContent");
    if (!contentEl) return;

    contentEl.innerHTML = "";

    const titleEl = document.getElementById("storyTitle");
    if (titleEl) {
      titleEl.textContent = fullStory
        ? "دو نیمه — روایت کامل"
        : "دو نیمه — ادامه داستان";
    }

    const subtitleEl = document.getElementById("storySubtitle");
    if (subtitleEl) {
      if (fullStory) {
        subtitleEl.textContent = `شامل ${episodesData?.length || 0} اپیزود — ${blocks.length} قطعه داستانی`;
      } else {
        const remaining = blocks.length - startIndex;
        subtitleEl.textContent = `از جایی که بودید ادامه دهید — ${remaining} قطعه باقی مانده`;
      }
      subtitleEl.style.display = "block";
    }

    // دکمه "مشاهده کل داستان"
    const showFullBtn = !fullStory && startIndex < blocks.length - 1;

    let existingBtn = document.getElementById("fullStoryBtn");
    if (existingBtn) {
      existingBtn.remove();
    }

    if (showFullBtn) {
      const btnContainer = document.createElement("div");
      btnContainer.className = "full-story-container";

      const btn = document.createElement("button");
      btn.id = "fullStoryBtn";
      btn.className = "full-story-btn";
      btn.textContent = "📖 مشاهده کل داستان";

      btn.addEventListener("click", () => {
        const confirmMsg =
          "⚠️ آیا مطمئنی؟\n\nبا مشاهده کل داستان، تمام رازها و پایان داستان برای شما اسپویل میشه.\nاین کار تجربهٔ اصلی خوندن رو از دست میده.\n\nآیا مطمئنی که میخوای ادامه بدی؟";

        if (confirm(confirmMsg)) {
          showFullStory = true;

          if (subtitleEl) {
            subtitleEl.textContent = `شامل ${episodesData?.length || 0} اپیزود — ${blocks.length} قطعه داستانی`;
          }

          if (btnContainer) btnContainer.remove();

          // رندر مجدد با کل داستان
          renderStory(blocks, 0, true);

          // 🔥 مهم: همه عناصر رو نمایان کن
          setTimeout(revealAllElements, 100);

          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });

      btnContainer.appendChild(btn);

      const headerEl = document.querySelector(".story-header");
      const headerDivider = headerEl?.querySelector(".header-divider");
      if (headerDivider) {
        headerDivider.after(btnContainer);
      } else {
        headerEl?.appendChild(btnContainer);
      }
    }

    // ساخت بلوک‌های قابل مشاهده
    const visibleBlocks = fullStory ? blocks : blocks.slice(0, startIndex + 1);
    const showContinueMsg = !fullStory && startIndex < blocks.length - 1;

    const frag = document.createDocumentFragment();

    visibleBlocks.forEach((block, index) => {
      let el;

      switch (block.type) {
        case "heading":
          el = document.createElement("h2");
          el.className = "story-heading";
          el.textContent = block.text;
          el.setAttribute("data-episode", block.episode || "");
          break;

        case "narrator":
          el = document.createElement("p");
          el.className = "story-paragraph narrator";
          el.textContent = block.text;
          el.setAttribute("data-episode", block.episode || "");
          el.setAttribute("data-scene", block.scene || "");
          break;

        case "dialogue":
          el = document.createElement("div");
          el.className = "story-dialogue";

          const speakerSpan = document.createElement("span");
          speakerSpan.className = "dialogue-speaker";
          speakerSpan.textContent = block.speaker + ":";

          const textSpan = document.createElement("span");
          textSpan.className = "dialogue-text";
          textSpan.textContent = block.text;

          el.appendChild(speakerSpan);
          el.appendChild(textSpan);
          el.setAttribute("data-episode", block.episode || "");
          el.setAttribute("data-scene", block.scene || "");
          break;

        case "choices":
          el = document.createElement("div");
          el.className = "story-choice";

          const choiceLabel = document.createElement("div");
          choiceLabel.className = "choice-label";
          choiceLabel.textContent = "✦ انتخاب شما";

          const choiceList = document.createElement("div");
          choiceList.className = "choice-list";

          block.choices.forEach((choiceText) => {
            const choiceItem = document.createElement("span");
            choiceItem.className = "choice-item";
            choiceItem.textContent = choiceText;
            choiceList.appendChild(choiceItem);
          });

          el.appendChild(choiceLabel);
          el.appendChild(choiceList);
          el.setAttribute("data-episode", block.episode || "");
          el.setAttribute("data-scene", block.scene || "");
          break;

        case "note":
          el = document.createElement("div");
          el.className = "story-note";
          el.textContent = "📌 " + block.text;
          el.setAttribute("data-episode", block.episode || "");
          el.setAttribute("data-scene", block.scene || "");
          break;

        case "divider":
          el = document.createElement("div");
          el.className = "story-divider";
          el.textContent = "✦ ✦ ✦";
          break;

        default:
          el = document.createElement("p");
          el.className = "story-paragraph";
          el.textContent = block.text || "";
      }

      frag.appendChild(el);
    });

    if (showContinueMsg) {
      const continueEl = document.createElement("div");
      continueEl.className = "story-continue";
      continueEl.innerHTML = `
        <div class="continue-divider">
          <span class="continue-line"></span>
          <span class="continue-text">✦ ادامه دارد ✦</span>
          <span class="continue-line"></span>
        </div>
        <p style="text-align:center;color:var(--cream-dim);font-size:0.85rem;margin-top:8px;">
          برای مشاهدهٔ ادامه، دکمهٔ «مشاهده کل داستان» را بزنید.
        </p>
      `;
      frag.appendChild(continueEl);
    }

    contentEl.appendChild(frag);

    // 🔥 بعد از رندر، اگر fullStory باشه همه رو نمایان کن
    if (fullStory) {
      setTimeout(revealAllElements, 150);
    }
  }

  // ================================================================
  //  نمایان‌سازی تدریجی (برای حالت عادی)
  // ================================================================

  function setupRevealAnimation() {
    const items = document.querySelectorAll(
      ".story-paragraph, .story-dialogue, .story-choice, .story-note, .story-heading, .story-divider, .story-continue",
    );

    if (!items.length) {
      console.warn("⚠️ هیچ عنصری برای reveal پیدا نشد");
      return;
    }

    // 🔥 اگه حالت full story فعاله، همه رو یکجا نمایان کن
    if (showFullStory) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
    );

    items.forEach((el) => observer.observe(el));
  }

  // ================================================================
  //  نوار پیشرفت
  // ================================================================

  function setupProgressBar() {
    const fill = document.getElementById("progressFill");
    if (!fill) return;

    let ticking = false;

    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percent =
        docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 100;

      fill.style.width = percent + "%";
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );

    update();
  }

  // ================================================================
  //  بستن صفحه
  // ================================================================

  function closeStory() {
    document.body.classList.add("closing");

    setTimeout(() => {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "twoHalves:closeStory" }, "*");
        }
      } catch (e) {}

      try {
        window.dispatchEvent(new CustomEvent("twoHalves:storyClosed"));
      } catch (e) {}

      if (window.opener) {
        window.close();
        return;
      }

      if (window.parent === window && history.length > 1) {
        history.back();
      } else {
        document.body.style.opacity = "0";
        setTimeout(() => {
          window.location.href = "index.html";
        }, 300);
      }
    }, 380);
  }

  // ================================================================
  //  دکمه بستن
  // ================================================================

  function setupCloseButton() {
    const btn = document.getElementById("closeBtn");
    if (btn) {
      btn.addEventListener("click", closeStory);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeStory();
      });
    }
  }

  // ================================================================
  //  برف
  // ================================================================

  function buildSnow() {
    const field = document.getElementById("snowfield");
    if (!field) return;

    const count = window.innerWidth < 640 ? 30 : 55;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const flake = document.createElement("span");
      flake.className = "snowflake";
      const size = (Math.random() * 3.2 + 1.5).toFixed(1);
      const left = (Math.random() * 100).toFixed(2);
      const duration = (Math.random() * 10 + 10).toFixed(2);
      const delay = (Math.random() * -20).toFixed(2);
      const opacity = (Math.random() * 0.5 + 0.25).toFixed(2);

      flake.style.width = size + "px";
      flake.style.height = size + "px";
      flake.style.left = left + "vw";
      flake.style.opacity = opacity;
      flake.style.animationDuration = duration + "s";
      flake.style.animationDelay = delay + "s";

      frag.appendChild(flake);
    }
    field.appendChild(frag);
  }

  // ================================================================
  //  استایل‌های دکمه و ادامه
  // ================================================================

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .full-story-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.8rem;
        font-family: var(--font-fa, "Vazirmatn", sans-serif);
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--gold);
        background: rgba(201, 168, 76, 0.06);
        border: 1px solid var(--gold-dark);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        letter-spacing: 0.04em;
      }
      .full-story-btn:hover {
        background: rgba(201, 168, 76, 0.12);
        border-color: var(--gold);
        box-shadow: 0 0 20px rgba(201, 168, 76, 0.1);
        transform: translateY(-1px);
      }
      
      .full-story-container {
        text-align: center;
        margin: 16px 0 8px 0;
      }

      .story-continue {
        margin: 40px 0 20px 0;
        opacity: 0;
        transform: translateY(14px);
        transition: opacity 0.9s ease, transform 0.9s ease;
      }
      .story-continue.in-view {
        opacity: 1;
        transform: translateY(0);
      }
      .continue-divider {
        display: flex;
        align-items: center;
        gap: 1rem;
        justify-content: center;
      }
      .continue-line {
        flex: 1;
        max-width: 80px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold-dark), transparent);
      }
      .continue-text {
        color: var(--gold-dark);
        font-size: 0.8rem;
        letter-spacing: 0.15em;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  // ================================================================
  //  اجرا
  // ================================================================

  async function init() {
    console.log("📖 دو نیمه — داستان کامل");
    console.log("🔄 در حال بارگذاری...");

    injectStyles();
    buildSnow();
    setupCloseButton();

    userProgress = getUserProgress();
    console.log(
      `📊 پیشرفت کاربر: اپیزود ${userProgress.episode}, صحنه ${userProgress.scene}`,
    );

    const loaded = await loadEpisodes();
    if (!loaded) {
      document.getElementById("storyContent").innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:#a89070;">
          <div style="font-size:3rem;margin-bottom:16px;">📖</div>
          <p>متاسفانه داستان قابل بارگذاری نیست.</p>
          <p style="font-size:0.9rem;margin-top:8px;">لطفاً صفحه را دوباره بارگذاری کنید.</p>
        </div>
      `;
      return;
    }

    allBlocks = extractAllBlocks();

    if (!allBlocks.length) {
      document.getElementById("storyContent").innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:#a89070;">
          <div style="font-size:3rem;margin-bottom:16px;">📭</div>
          <p>هیچ محتوایی برای نمایش وجود ندارد.</p>
        </div>
      `;
      return;
    }

    const startIndex = findLastReachedBlock(allBlocks, userProgress);
    const finalStartIndex =
      userProgress.episode === 0 && userProgress.scene === 0 ? 0 : startIndex;
    showFullStory = false;

    renderStory(allBlocks, finalStartIndex, false);

    // 🔥 راه‌اندازی observer با تاخیر کم
    setTimeout(setupRevealAnimation, 200);

    setupProgressBar();

    console.log(`✅ داستان با ${allBlocks.length} بلوک آماده است`);
    console.log(`📌 نمایش از بلوک ${finalStartIndex}`);
  }

  // ================================================================
  //  اجرا در DOMContentLoaded
  // ================================================================

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
