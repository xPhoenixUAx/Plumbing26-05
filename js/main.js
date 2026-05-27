(function () {
  const config = window.SITE_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function hydrateConfig() {
    const map = {
      "company-name": config.companyName,
      "company-id": config.companyId,
      "company-address": [config.addressLine1, config.addressLine2, config.serviceArea].filter(Boolean).join(" - "),
      "footer-text-primary": config.footerTextPrimary,
      "footer-text-secondary": config.footerTextSecondary,
      "disclaimer-short": config.disclaimerShort,
      "disclaimer-full": config.disclaimerFull,
      "business-hours": config.businessHours
    };

    Object.entries(map).forEach(([key, value]) => {
      $$(`[data-${key}]`).forEach((el) => {
        el.textContent = value || "";
      });
    });

    $$("[data-phone-link]").forEach((el) => {
      el.setAttribute("href", `tel:${config.phone || ""}`);
      el.setAttribute("aria-label", `${config.phoneButtonLabel || "Call"} ${config.phoneDisplay || ""}`);
    });
    $$("[data-phone-text]").forEach((el) => {
      el.textContent = config.phoneDisplay || "";
    });
    $$("[data-email-link]").forEach((el) => {
      el.setAttribute("href", `mailto:${config.email || ""}`);
    });
    $$("[data-email-text]").forEach((el) => {
      el.textContent = config.email || "";
    });
    $$("[data-whatsapp-link]").forEach((el) => {
      const number = (config.whatsapp || config.phone || "").replace(/[^+\d]/g, "");
      el.setAttribute("href", `https://wa.me/${number.replace("+", "")}`);
    });
    $$("[data-whatsapp-text]").forEach((el) => {
      el.textContent = config.whatsappDisplay || "WhatsApp";
    });
    $$("[data-current-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  function setupHeader() {
    const header = $(".site-header");
    if (!header) return;
    const stickyCall = $("[data-sticky-call]");
    const update = () => {
      header.classList.toggle("is-solid", window.scrollY > 20);
      if (stickyCall) stickyCall.classList.toggle("is-visible", window.scrollY > 180);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function setupMenu() {
    const open = $("[data-menu-open]");
    const close = $("[data-menu-close]");
    const menu = $("[data-mobile-menu]");
    if (!open || !close || !menu) return;

    const setOpen = (state) => {
      document.body.classList.toggle("menu-open", state);
      menu.classList.toggle("is-open", state);
      menu.setAttribute("aria-hidden", String(!state));
      open.setAttribute("aria-expanded", String(state));
      if (state) close.focus();
    };

    open.addEventListener("click", () => setOpen(true));
    close.addEventListener("click", () => setOpen(false));
    $$("a", menu).forEach((link) => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function setupFaq() {
    $$("[data-faq-item]").forEach((item) => {
      const button = $("button", item);
      const panel = $("[data-faq-panel]", item);
      if (!button || !panel) return;
      button.addEventListener("click", () => {
        const isOpen = item.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
        panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : "0px";
      });
    });
  }

  function setupCarousels() {
    $$("[data-carousel]").forEach((carousel) => {
      const track = $("[data-carousel-track]", carousel);
      const prev = $("[data-carousel-prev]", carousel);
      const next = $("[data-carousel-next]", carousel);
      if (!track) return;
      let isDragging = false;
      let didDrag = false;
      let startX = 0;
      let scrollStart = 0;

      const getStep = () => {
        const card = $(".service-slide", track);
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap) || 24;
        return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      };

      prev?.addEventListener("click", () => {
        track.scrollBy({ left: -getStep(), behavior: "smooth" });
      });
      next?.addEventListener("click", () => {
        track.scrollBy({ left: getStep(), behavior: "smooth" });
      });

      track.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        isDragging = true;
        didDrag = false;
        startX = event.clientX;
        scrollStart = track.scrollLeft;
        track.classList.add("is-dragging");
        track.setPointerCapture?.(event.pointerId);
      });

      track.addEventListener("pointermove", (event) => {
        if (!isDragging) return;
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 6) didDrag = true;
        if (didDrag) event.preventDefault();
        track.scrollLeft = scrollStart - delta;
      });

      const stopDrag = (event) => {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove("is-dragging");
        track.releasePointerCapture?.(event.pointerId);
      };

      track.addEventListener("pointerup", stopDrag);
      track.addEventListener("pointercancel", stopDrag);
      track.addEventListener("mouseleave", stopDrag);
      track.addEventListener("click", (event) => {
        if (!didDrag) return;
        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
      }, true);
    });
  }

  function setupReveal() {
    const items = $$("[data-reveal]");
    if (!items.length || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  hydrateConfig();
  setupHeader();
  setupMenu();
  setupFaq();
  setupCarousels();
  setupReveal();
  if (window.lucide) window.lucide.createIcons();
})();
