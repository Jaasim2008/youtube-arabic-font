(function () {
  "use strict";

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

  const FONT_OPTIONS = [
    {
      labelEn: "Traditional Arabic",
      labelAr: "Traditional Arabic",
      value: "'Traditional Arabic', 'Arabic Typesetting', serif",
    },
    {
      labelEn: "Simplified Arabic",
      labelAr: "Simplified Arabic",
      value: "'Simplified Arabic', 'Arabic Typesetting', serif",
    },
    { labelEn: "Tahoma", labelAr: "Tahoma", value: "Tahoma, Arial, sans-serif" },
    { labelEn: "Arial", labelAr: "Arial", value: "Arial, Helvetica, sans-serif" },
    {
      labelEn: "Segoe UI",
      labelAr: "Segoe UI",
      value: "'Segoe UI', Tahoma, Arial, sans-serif",
    },
    {
      labelEn: "Droid Arabic Naskh",
      labelAr: "Droid Arabic Naskh",
      value: "'Droid Arabic Naskh', 'Noto Naskh Arabic', serif",
    },
    {
      labelEn: "Droid Arabic Kufi",
      labelAr: "Droid Arabic Kufi",
      value: "'Droid Arabic Kufi', 'Noto Kufi Arabic', sans-serif",
    },
    {
      labelEn: "Noto Naskh Arabic",
      labelAr: "Noto Naskh Arabic",
      value: "'Noto Naskh Arabic', 'Amiri', serif",
    },
    {
      labelEn: "Noto Sans Arabic",
      labelAr: "Noto Sans Arabic",
      value: "'Noto Sans Arabic', 'Segoe UI', sans-serif",
    },
    { labelEn: "Amiri", labelAr: "أميري", value: "'Amiri', 'Noto Naskh Arabic', serif" },
    { labelEn: "Cairo", labelAr: "القاهرة", value: "'Cairo', 'Noto Sans Arabic', sans-serif" },
    { labelEn: "Tajawal", labelAr: "تجوال", value: "'Tajawal', 'Noto Sans Arabic', sans-serif" },
  ];

  const WEIGHT_OPTIONS = [
    { labelEn: "Normal", labelAr: "عادي", value: "normal" },
    { labelEn: "Medium (500)", labelAr: "متوسط (500)", value: "500" },
    { labelEn: "Semi-Bold (600)", labelAr: "شبه عريض (600)", value: "600" },
    { labelEn: "Bold", labelAr: "عريض", value: "bold" },
  ];

  const LINE_HEIGHT_OPTIONS = [
    { labelEn: "1.4", labelAr: "1.4", value: "1.4" },
    { labelEn: "1.6 (default)", labelAr: "1.6 (افتراضي)", value: "1.6" },
    { labelEn: "1.8", labelAr: "1.8", value: "1.8" },
    { labelEn: "2.0", labelAr: "2.0", value: "2.0" },
  ];

  const el = {
    enabled: document.getElementById("enabled"),
    arabicOnly: document.getElementById("arabicOnly"),
    fontFamily: document.getElementById("fontFamily"),
    customFontFamily: document.getElementById("customFontFamily"),
    fontSize: document.getElementById("fontSize"),
    fontSizeValue: document.getElementById("fontSizeValue"),
    fontWeight: document.getElementById("fontWeight"),
    lineHeight: document.getElementById("lineHeight"),
    targetTitles: document.getElementById("targetTitles"),
    targetDescriptions: document.getElementById("targetDescriptions"),
    targetComments: document.getElementById("targetComments"),
    targetCaptions: document.getElementById("targetCaptions"),
    previewMode: document.getElementById("previewMode"),
    previewBefore: document.getElementById("previewBefore"),
    previewAfter: document.getElementById("previewAfter"),
    applyNow: document.getElementById("applyNow"),
    exportSettings: document.getElementById("exportSettings"),
    importSettings: document.getElementById("importSettings"),
    statusText: document.getElementById("statusText"),
    reset: document.getElementById("reset"),
  };

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
      fontFamily: typeof stored.fontFamily === "string" && stored.fontFamily
        ? stored.fontFamily
        : DEFAULTS.fontFamily,
      fontSize: typeof stored.fontSize === "number" && !Number.isNaN(stored.fontSize)
        ? stored.fontSize
        : DEFAULTS.fontSize,
      fontWeight: typeof stored.fontWeight === "string" && stored.fontWeight
        ? stored.fontWeight
        : DEFAULTS.fontWeight,
      lineHeight: typeof stored.lineHeight === "string" && stored.lineHeight
        ? stored.lineHeight
        : DEFAULTS.lineHeight,
      arabicOnly: typeof stored.arabicOnly === "boolean" ? stored.arabicOnly : DEFAULTS.arabicOnly,
      targets: mergeTargets(stored.targets),
      customFontFamily: typeof stored.customFontFamily === "string" ? stored.customFontFamily : "",
      previewMode: stored.previewMode === "beforeAfter" ? "beforeAfter" : "after",
    };
  }

  function getEffectiveFontFamily(settings) {
    return (settings.customFontFamily || "").trim() || settings.fontFamily;
  }

  function fillSelect(select, options, getLabel) {
    select.innerHTML = "";
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = getLabel(opt);
      select.appendChild(o);
    });
  }

  function getCurrentSettings() {
    return {
      enabled: el.enabled.checked,
      arabicOnly: el.arabicOnly.checked,
      fontFamily: el.fontFamily.value,
      customFontFamily: el.customFontFamily.value.trim(),
      fontSize: Number(el.fontSize.value),
      fontWeight: el.fontWeight.value,
      lineHeight: el.lineHeight.value,
      targets: {
        titles: el.targetTitles.checked,
        descriptions: el.targetDescriptions.checked,
        comments: el.targetComments.checked,
        captions: el.targetCaptions.checked,
      },
      previewMode: el.previewMode.value === "beforeAfter" ? "beforeAfter" : "after",
    };
  }

  function applyPreview(settings) {
    const pBefore = el.previewBefore;
    const pAfter = el.previewAfter;
    if (!settings.enabled) {
      pAfter.style.opacity = "0.5";
      pAfter.style.fontFamily = "";
      pAfter.style.fontSize = "";
      pAfter.style.fontWeight = "";
      pAfter.style.lineHeight = "";
      pBefore.style.display = "none";
      return;
    }
    pAfter.style.opacity = "1";
    pAfter.style.fontFamily = getEffectiveFontFamily(settings);
    pAfter.style.fontSize = settings.fontSize + "px";
    pAfter.style.fontWeight = settings.fontWeight;
    pAfter.style.lineHeight = settings.lineHeight;
    pBefore.style.display = settings.previewMode === "beforeAfter" ? "" : "none";
    pAfter.style.marginTop = settings.previewMode === "beforeAfter" ? "8px" : "0";
  }

  function setStatus(text) {
    el.statusText.textContent = text;
  }

  function setUIFromSettings(settings) {
    el.enabled.checked = settings.enabled;
    el.arabicOnly.checked = settings.arabicOnly;
    el.fontFamily.value = settings.fontFamily;
    if (![...el.fontFamily.options].some((o) => o.value === settings.fontFamily)) {
      const o = document.createElement("option");
      o.value = settings.fontFamily;
      o.textContent = settings.fontFamily;
      el.fontFamily.appendChild(o);
      el.fontFamily.value = settings.fontFamily;
    }
    el.customFontFamily.value = settings.customFontFamily || "";
    el.fontSize.value = String(settings.fontSize);
    el.fontSizeValue.textContent = settings.fontSize + "px";
    el.fontWeight.value = settings.fontWeight;
    el.lineHeight.value = settings.lineHeight;
    el.targetTitles.checked = settings.targets.titles;
    el.targetDescriptions.checked = settings.targets.descriptions;
    el.targetComments.checked = settings.targets.comments;
    el.targetCaptions.checked = settings.targets.captions;
    el.previewMode.value = settings.previewMode;
    applyPreview(settings);
  }

  async function saveAndBroadcast(settings) {
    await browser.storage.local.set(settings);
    let appliedCount = 0;
    try {
      const tabs = await browser.tabs.query({ url: "*://*.youtube.com/*" });
      for (const tab of tabs) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: "applySettings",
            settings: settings,
          });
          appliedCount += 1;
        } catch (err) {
          /* tab may not have content script yet */
        }
      }
      setStatus(`Applied to ${appliedCount} tab(s).`);
    } catch (err) {
      setStatus("Could not query YouTube tabs.");
    }
  }

  async function applyNow() {
    let appliedCount = 0;
    try {
      const tabs = await browser.tabs.query({ url: "*://*.youtube.com/*" });
      for (const tab of tabs) {
        try {
          await browser.tabs.sendMessage(tab.id, { type: "applyNow" });
          appliedCount += 1;
        } catch (err) {
          /* ignore tab failures */
        }
      }
      setStatus(`Applied to ${appliedCount} tab(s) now.`);
    } catch (err) {
      setStatus("Apply-now failed.");
    }
  }

  function validateImportedSettings(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    return mergeSettings(raw);
  }

  function exportSettings(settings) {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "youtube-arabic-font-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Settings exported.");
  }

  function wireControls() {
    const onChange = () => {
      const settings = getCurrentSettings();
      el.fontSizeValue.textContent = settings.fontSize + "px";
      applyPreview(settings);
      saveAndBroadcast(settings);
    };

    el.enabled.addEventListener("change", onChange);
    el.arabicOnly.addEventListener("change", onChange);
    el.fontFamily.addEventListener("change", onChange);
    el.customFontFamily.addEventListener("change", onChange);
    el.fontSize.addEventListener("input", onChange);
    el.fontSize.addEventListener("change", onChange);
    el.fontWeight.addEventListener("change", onChange);
    el.lineHeight.addEventListener("change", onChange);
    el.targetTitles.addEventListener("change", onChange);
    el.targetDescriptions.addEventListener("change", onChange);
    el.targetComments.addEventListener("change", onChange);
    el.targetCaptions.addEventListener("change", onChange);
    el.previewMode.addEventListener("change", onChange);

    el.applyNow.addEventListener("click", () => {
      applyNow();
    });
    el.exportSettings.addEventListener("click", () => {
      exportSettings(getCurrentSettings());
    });
    el.importSettings.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const validated = validateImportedSettings(parsed);
        if (!validated) {
          setStatus("Invalid settings file.");
          return;
        }
        setUIFromSettings(validated);
        await saveAndBroadcast(validated);
        setStatus("Settings imported.");
      } catch (err) {
        setStatus("Import failed.");
      } finally {
        event.target.value = "";
      }
    });

    el.reset.addEventListener("click", async () => {
      setUIFromSettings(DEFAULTS);
      await saveAndBroadcast({ ...DEFAULTS });
    });
  }

  function init() {
    fillSelect(el.fontFamily, FONT_OPTIONS, (o) => o.labelEn + " — " + o.labelAr);
    fillSelect(el.fontWeight, WEIGHT_OPTIONS, (o) => o.labelEn + " — " + o.labelAr);
    fillSelect(el.lineHeight, LINE_HEIGHT_OPTIONS, (o) => o.labelEn + " — " + o.labelAr);

    wireControls();

    browser.storage.local.get(STORAGE_KEYS).then((stored) => {
      setUIFromSettings(mergeSettings(stored));
    });
  }

  init();
})();
