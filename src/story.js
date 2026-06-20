(function () {
  "use strict";

  /* =================================================================
     ۱) ساخت دانه‌های برف
  ================================================================= */
  function buildSnow() {
    const field = document.getElementById("snowfield");
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

  /* =================================================================
     ۲) خواندن داستان از localStorage
  ================================================================= */
  const STORAGE_KEY = "twoHalves:storyData";

  function loadStoryData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.blocks) &&
          parsed.blocks.length > 0
        ) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(
        "داستان موجود در localStorage قابل خواندن نبود، نمونه‌ی پیش‌فرض نمایش داده می‌شود.",
        err,
      );
    }
    return getDefaultStory();
  }

  /* داستان نمونه‌ی پیش‌فرض */
  function getDefaultStory() {
    return {
      title: "دو نیمه — داستان کامل",
      subtitle: "روایتی از شبی برفی، و دو روحی که در پی هم می‌گشتند",
      blocks: [
        {
          type: "paragraph",
          text: "برف از ساعتی پیش بند نمی‌آمد. شهر زیر لایه‌ای سفید و ساکت خوابیده بود، انگار کسی پتویی سرد روی تمام چراغ‌ها کشیده باشد. در میان این سکوت، دو سایه از دو جهت مخالف به‌سمت میدان قدیمی حرکت می‌کردند، بی‌آن‌که بدانند مقصدشان یکی است.",
        },
        {
          type: "paragraph",
          text: "صدای قدم‌ها روی برفِ تازه، تنها نشانه‌ی زنده بودنِ شب بود. هر نفس، ابری کوچک در هوای سرد می‌ساخت و محو می‌شد، درست مثل خاطره‌ای که هرچه به آن نزدیک‌تر می‌شوی، کم‌رنگ‌تر می‌شود.",
        },
        {
          type: "choice",
          text: "به‌جای راه اصلی، از کوچه‌ی باریک پشت کلیسای قدیمی عبور کردید؛ مسیری که کمتر کسی شب‌ها از آن می‌گذرد.",
        },
        {
          type: "paragraph",
          text: "کوچه باریک‌تر از آن بود که نور ماه به ته آن برسد. اما در همان تاریکی، چیزی برق زد؛ ردی از قدم‌های کوچک، انگار کسی دقایقی پیش از همان‌جا گذشته بود. سرما عمیق‌تر شد، اما این بار از جنس هیجان بود، نه فقط دما.",
        },
        { type: "divider" },
        { type: "heading", text: "نیمه‌ی گمشده" },
        {
          type: "paragraph",
          text: "گفته بودند هر آدم با نیمه‌ای دیگر زاده می‌شود؛ نه به‌معنای عاشقانه‌اش، بلکه چیزی قدیمی‌تر و عجیب‌تر. دو روح که از یک نقطه جدا شده‌اند و در دو مسیر متفاوت بزرگ شده‌اند، بی‌خبر از وجود هم، تا شبی که برف همه‌چیز را به یاد بیاورد.",
        },
        {
          type: "paragraph",
          text: "در انتهای میدان، زیر تنها چراغی که هنوز روشن بود، یک سایه ایستاده بود. نه ترسناک، نه آشنا؛ فقط منتظر. دست‌هایش را در جیب پالتویش فرو برده بود و نفسش، درست مثل نفس شما، در هوا محو می‌شد.",
        },
        {
          type: "choice",
          text: "وقتی غریبه دستش را به‌سمتتان دراز کرد، بدون تردید دستش را گرفتید.",
        },
        {
          type: "paragraph",
          text: "در همان لحظه‌ی تماس، چیزی در سینه‌تان جا افتاد؛ مثل قطعه‌ای از یک پازل که سال‌ها گم شده بود. برف همچنان می‌بارید، اما انگار دیگر سرد نبود. دو نیمه، بالاخره زیر یک آسمان ایستاده بودند.",
        },
        {
          type: "paragraph",
          text: "هیچ‌کدام حرفی نزدند. حرفی هم لازم نبود. شهر در سکوتش ادامه داد، و میدان قدیمی، برای اولین‌بار پس از سال‌ها، یک داستانِ کامل را در خود نگه داشت.",
        },
      ],
    };
  }

  /* =================================================================
     ۳) ساخت DOM داستان
  ================================================================= */
  function renderStory(data) {
    const titleEl = document.getElementById("storyTitle");
    const subtitleEl = document.getElementById("storySubtitle");
    const contentEl = document.getElementById("storyContent");

    if (data.title) titleEl.textContent = data.title;
    if (data.subtitle) {
      subtitleEl.textContent = data.subtitle;
      subtitleEl.style.display = "block";
    } else {
      subtitleEl.style.display = "none";
    }

    const frag = document.createDocumentFragment();

    data.blocks.forEach(function (block) {
      let el;
      switch (block.type) {
        case "choice":
          el = document.createElement("div");
          el.className = "story-choice";
          el.appendChild(document.createTextNode(block.text || ""));
          break;

        case "heading":
          el = document.createElement("h2");
          el.className = "story-heading";
          el.textContent = block.text || "";
          break;

        case "divider":
          el = document.createElement("div");
          el.className = "story-divider";
          el.textContent = "✦ ✦ ✦";
          break;

        case "paragraph":
        default:
          el = document.createElement("p");
          el.className = "story-paragraph";
          el.textContent = block.text || "";
          break;
      }
      frag.appendChild(el);
    });

    contentEl.appendChild(frag);
  }

  /* =================================================================
     ۴) نمایان‌سازی تدریجی
  ================================================================= */
  function setupRevealAnimation() {
    const items = document.querySelectorAll(
      ".story-paragraph, .story-choice, .story-divider, .story-heading",
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("in-view");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* =================================================================
     ۵) نوار پیشرفت
  ================================================================= */
  function setupProgressBar() {
    const fill = document.getElementById("progressFill");
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
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );

    update();
  }

  /* =================================================================
     ۶) بستن صفحه
  ================================================================= */
  function closeStory() {
    document.body.classList.add("closing");

    setTimeout(function () {
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
        document.body.classList.remove("closing");
        document.body.style.opacity = "0";
      }
    }, 380);
  }

  /* =================================================================
     راه‌اندازی
  ================================================================= */
  document.addEventListener("DOMContentLoaded", function () {
    buildSnow();
    const storyData = loadStoryData();
    renderStory(storyData);
    setupRevealAnimation();
    setupProgressBar();

    document.getElementById("closeBtn").addEventListener("click", closeStory);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeStory();
    });
  });
})();
