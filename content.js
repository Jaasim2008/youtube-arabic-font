(function () {
  "use strict";

  const STYLE_ID = "youtube-arabic-font-fixer-styles";
  const CLASS_TARGET = "yaf-target";
  const CLASS_ARABIC = "yaf-arabic";
  const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

  const STORAGE_KEYS = [
    "enabled",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "arabicOnly",
    "targets",
    "customFontFamily",
    "previewMode",
  ];

  const DEFAULTS = {
    enabled: true,
    fontFamily: "'Traditional Arabic', 'Arabic Typesetting', serif",
    fontSize: 16,
    fontWeight: "normal",
    lineHeight: "1.6",
    arabicOnly: false,
    targets: {
      titles: true,
      descriptions: true,
      comments: true,
      captions: true,
    },
    customFontFamily: "",
    previewMode: "after",
  };

  const TARGET_SELECTORS = {
    titles: [
      "#video-title",
      "h1.title",
      "ytd-video-renderer #video-title",
      "ytd-playlist-video-renderer #video-title",
      "ytd-compact-video-renderer #video-title",
      "ytd-playlist-panel-video-renderer #video-title",
      "#channel-name",
      "yt-formatted-string.ytd-channel-name",
    ],
    descriptions: [
      "#description",
      "ytd-watch-metadata #description-inline-expander",
      "yt-formatted-string",
    ],
    comments: [
      "#content-text",
      "ytd-comment-thread-renderer #content-text",
    ],
    captions: [".ytp-caption-segment"],
  };

  let cachedSettings = null;
  let lastCss = "";
  let taggedElements = new Set();
  let refreshScheduled = false;
  let lastUrl = location.href;

  function mergeTargets(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    return {
      titles: typeof src.titles === "boolean" ? src.titles : DEFAULTS.targets.titles,
      descriptions: typeof src.descriptions === "boolean" ? src.descriptions : DEFAULTS.targets.descriptions,
      comments: typeof src.comments === "boolean" ? src.comments : DEFAULTS.targets.comments,
      captions: typeof src.captions === "boolean" ? src.captions : DEFAULTS.targets.captions,
    };
  }

  function mergeSettings(stored) {
    return {
      enabled: typeof stored.enabled === "boolean" ? stored.enabled : DEFAULTS.enabled,
      fontFamily: typeof stored.fontFamily === "string" && stored.fontFamily ? stored.fontFamily : DEFAULTS.fontFamily,
      fontSize: typeof stored.fontSize === "number" && !Number.isNaN(stored.fontSize) ? stored.fontSize : DEFAULTS.fontSize,
      fontWeight: typeof stored.fontWeight === "string" && stored.fontWeight ? stored.fontWeight : DEFAULTS.fontWeight,
      lineHeight: typeof stored.lineHeight === "string" && stored.lineHeight ? stored.lineHeight : DEFAULTS.lineHeight,
      arabicOnly: typeof stored.arabicOnly === "boolean" ? stored.arabicOnly : DEFAULTS.arabicOnly,
      targets: mergeTargets(stored.targets),
      customFontFamily:
        typeof stored.customFontFamily === "string" ? stored.customFontFamily.trim() : DEFAULTS.customFontFamily,
      previewMode: stored.previewMode === "beforeAfter" ? "beforeAfter" : DEFAULTS.previewMode,
    };
  }

  function getEffectiveFontFamily(settings) {
    return settings.customFontFamily || settings.fontFamily;
  }

  function clearTaggedElements() {
    taggedElements.forEach((el) => {
      if (el && el.classList) {
        el.classList.remove(CLASS_TARGET, CLASS_ARABIC);
      }
    });
    taggedElements.clear();
  }

  function getTargetSelectorList(settings) {
    const selectors = [];
    Object.keys(TARGET_SELECTORS).forEach((key) => {
      if (settings.targets[key]) {
        selectors.push.apply(selectors, TARGET_SELECTORS[key]);
      }
    });
    return selectors;
  }

  function tagMatchingElements(settings) {
    clearTaggedElements();
    if (!settings.enabled) {
      return;
    }
    const selectors = getTargetSelectorList(settings);
    if (!selectors.length) {
      return;
    }
    const nodeSet = new Set();
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (node && node.nodeType === Node.ELEMENT_NODE) {
          nodeSet.add(node);
        }
      });
    });

    nodeSet.forEach((el) => {
      el.classList.add(CLASS_TARGET);
      if (settings.arabicOnly) {
        if (ARABIC_RE.test(el.textContent || "")) {
          el.classList.add(CLASS_ARABIC);
        }
      } else {
        el.classList.add(CLASS_ARABIC);
      }
      taggedElements.add(el);
    });
  }

  function buildCss(settings) {
    if (!settings.enabled) {
      return "";
    }
    const selectors = settings.arabicOnly ? `.${CLASS_TARGET}.${CLASS_ARABIC}` : `.${CLASS_TARGET}`;
    const ff = getEffectiveFontFamily(settings);
    return (
      `${selectors},\n${selectors} * {\n` +
      `  font-family: ${ff} !important;\n` +
      `  font-size: ${settings.fontSize}px !important;\n` +
      `  font-weight: ${settings.fontWeight} !important;\n` +
      `  line-height: ${settings.lineHeight} !important;\n` +
      "}\n"
    );
  }

  function ensureStyle(cssText) {
    const existing = document.getElementById(STYLE_ID);
    if (!cssText) {
      if (existing) {
        existing.remove();
      }
      lastCss = "";
      return;
    }
    if (existing && cssText === lastCss) {
      return;
    }
    if (existing) {
      existing.textContent = cssText;
    } else {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = cssText;
      document.documentElement.appendChild(style);
    }
    lastCss = cssText;
  }

  function applyStyles(settings) {
    cachedSettings = settings;
    tagMatchingElements(settings);
    ensureStyle(buildCss(settings));
  }

  async function loadFromStorageAndApply() {
    const stored = await browser.storage.local.get(STORAGE_KEYS);
    applyStyles(mergeSettings(stored));
  }

  function scheduleRefresh() {
    if (refreshScheduled) {
      return;
    }
    refreshScheduled = true;
    requestAnimationFrame(() => {
      refreshScheduled = false;
      if (cachedSettings) {
        applyStyles(cachedSettings);
      } else {
        loadFromStorageAndApply();
      }
    });
  }

  function handlePossibleNavigation() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        scheduleRefresh();
      }, 450);
    }
  }

  loadFromStorageAndApply();

  browser.runtime.onMessage.addListener((message) => {
    if (!message || typeof message !== "object") {
      return undefined;
    }
    if (message.type === "applySettings") {
      if (message.settings) {
        applyStyles(mergeSettings(message.settings));
      } else {
        loadFromStorageAndApply();
      }
      return Promise.resolve({ ok: true });
    }
    if (message.type === "applyNow") {
      scheduleRefresh();
      return Promise.resolve({ ok: true });
    }
    return undefined;
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    const hit = STORAGE_KEYS.some((k) => Object.prototype.hasOwnProperty.call(changes, k));
    if (hit) {
      loadFromStorageAndApply();
    }
  });

  new MutationObserver(() => {
    handlePossibleNavigation();
    scheduleRefresh();
  }).observe(document, { subtree: true, childList: true });

  document.addEventListener("yt-navigate-finish", () => {
    setTimeout(() => {
      scheduleRefresh();
    }, 200);
  });
})();
