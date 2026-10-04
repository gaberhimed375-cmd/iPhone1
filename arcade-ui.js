"use strict";

(() => {
  document.documentElement.classList.add("arcade-enhanced");

  const overlaySelector = ".overlay, .shop-overlay";
  const soundSelector = "#sound-button";
  let toastTimer = null;

  function syncOverlay(overlay) {
    const visible = overlay.classList.contains("visible");
    overlay.setAttribute("aria-hidden", visible ? "false" : "true");
    if ("inert" in overlay) {
      overlay.inert = !visible;
    }
  }

  function syncSoundButton(button) {
    const enabled = button.textContent.includes("🔊");
    button.setAttribute("aria-pressed", String(enabled));
  }

  function showToast(message) {
    let toast = document.querySelector(".arcade-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "arcade-toast";
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3200);
  }

  function initializeUi() {
    document.querySelectorAll(overlaySelector).forEach(syncOverlay);
    document.querySelectorAll(soundSelector).forEach(syncSoundButton);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target;
        if (target instanceof Element && target.matches(overlaySelector)) {
          syncOverlay(target);
        }
        if (target instanceof Element && target.matches(soundSelector)) {
          syncSoundButton(target);
        }
      }
    });

    document.querySelectorAll(overlaySelector).forEach((overlay) => {
      observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });
    });
    document.querySelectorAll(soundSelector).forEach((button) => {
      observer.observe(button, { childList: true, characterData: true, subtree: true });
    });

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (link && link.origin === window.location.origin) {
        document.documentElement.classList.add("is-navigating");
      }
    });

    window.addEventListener("pageshow", () => {
      document.documentElement.classList.remove("is-navigating");
      if (typeof window.loadScores === "function") {
        window.loadScores();
      }
    });

    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
      document.documentElement.classList.add("is-standalone");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeUi, { once: true });
  } else {
    initializeUi();
  }

  if ("serviceWorker" in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      showToast("Pocket Arcade updated and ready.");
      window.setTimeout(() => {
        refreshing = false;
      }, 4000);
    });
  }
})();
