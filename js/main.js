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
      let hasPointerCapture = false;
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
        hasPointerCapture = false;
        startX = event.clientX;
        scrollStart = track.scrollLeft;
      });

      track.addEventListener("pointermove", (event) => {
        if (!isDragging) return;
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 10) {
          if (!didDrag) {
            track.setPointerCapture?.(event.pointerId);
            hasPointerCapture = true;
            track.classList.add("is-dragging");
          }
          didDrag = true;
        }
        if (didDrag) event.preventDefault();
        track.scrollLeft = scrollStart - delta;
      });

      const stopDrag = (event) => {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove("is-dragging");
        if (hasPointerCapture) track.releasePointerCapture?.(event.pointerId);
        hasPointerCapture = false;
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

  function setupEstimator() {
    const estimator = $("[data-estimator]");
    if (!estimator) return;
    const service = $("[data-estimate-service]", estimator);
    const urgency = $("[data-estimate-urgency]", estimator);
    const property = $("[data-estimate-property]", estimator);
    const result = $("[data-estimate-result]", estimator);
    const button = $("[data-estimate-button]", estimator);
    if (!service || !urgency || !property || !result) return;

    const ranges = {
      emergency: [280, 950],
      drain: [95, 450],
      leak: [180, 650],
      heater: [220, 2800],
      sewer: [250, 1200],
      fixture: [120, 650]
    };
    const urgencyMultiplier = { standard: 1, soon: 1.18, urgent: 1.35 };
    const propertyMultiplier = { home: 1, condo: 1.08, commercial: 1.22 };
    const format = (value) => `$${Math.round(value / 10) * 10}`;

    const update = () => {
      const base = ranges[service.value] || ranges.emergency;
      const multiplier = (urgencyMultiplier[urgency.value] || 1) * (propertyMultiplier[property.value] || 1);
      result.textContent = `${format(base[0] * multiplier)}-${format(base[1] * multiplier)}`;
    };

    [service, urgency, property].forEach((field) => field.addEventListener("change", update));
    button?.addEventListener("click", update);
    update();
  }

  function setupScenarioSlider() {
    const slider = $("[data-scenario-slider]");
    if (!slider) return;
    const slides = $$("[data-scenario-slide]", slider);
    const dots = $$("[data-scenario-dot]");
    if (!slides.length || !dots.length) return;
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    let isDragging = false;
    let startX = 0;
    let didDrag = false;
    if (activeIndex < 0) activeIndex = 0;

    const setActive = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === activeIndex);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === activeIndex);
      });
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => setActive(index));
    });

    slider.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      isDragging = true;
      didDrag = false;
      startX = event.clientX;
      slider.classList.add("is-dragging");
      slider.setPointerCapture?.(event.pointerId);
    });

    slider.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 10) {
        didDrag = true;
        event.preventDefault();
      }
    });

    const stopSwipe = (event) => {
      if (!isDragging) return;
      const delta = event.clientX - startX;
      isDragging = false;
      slider.classList.remove("is-dragging");
      slider.releasePointerCapture?.(event.pointerId);
      if (Math.abs(delta) < 48) return;
      setActive(activeIndex + (delta < 0 ? 1 : -1));
    };

    slider.addEventListener("pointerup", stopSwipe);
    slider.addEventListener("pointercancel", stopSwipe);
    slider.addEventListener("click", (event) => {
      if (!didDrag) return;
      event.preventDefault();
      event.stopPropagation();
      didDrag = false;
    }, true);
  }

  function setupReviewCarousel() {
    const carousel = $("[data-review-carousel]");
    if (!carousel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const track = $("[data-review-track]", carousel);
    if (!track) return;
    const originals = $$(".review-card", track);
    if (originals.length < 2) return;
    let index = 0;
    let timer = null;

    originals.slice(0, 3).forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });

    const getStep = () => {
      const card = $(".review-card", track);
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap) || 0;
      return card ? card.getBoundingClientRect().width + gap : 0;
    };

    const move = (withTransition = true) => {
      track.style.transition = withTransition ? "transform .55s ease" : "none";
      track.style.transform = `translateX(${-index * getStep()}px)`;
    };

    const next = () => {
      index += 1;
      move(true);
    };

    track.addEventListener("transitionend", () => {
      if (index < originals.length) return;
      index = 0;
      move(false);
      window.requestAnimationFrame(() => {
        track.style.transition = "transform .55s ease";
      });
    });

    const start = () => {
      if (timer) return;
      timer = window.setInterval(next, 3600);
    };
    const stop = () => {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    };

    carousel.addEventListener("pointerenter", stop);
    carousel.addEventListener("pointerleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);
    window.addEventListener("resize", () => move(false));
    start();
  }

  function setupZipForm() {
    const form = $("[data-zip-form]");
    if (!form) return;
    const input = $("[data-zip-input]", form);
    const result = $("[data-zip-result]");
    if (!input || !result) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const zip = input.value.trim();
      if (!/^\d{5}$/.test(zip)) {
        result.textContent = "Please enter a valid 5-digit ZIP code to start the availability check.";
        return;
      }
      result.textContent = `ZIP ${zip}: request availability can be checked with independent providers during the next step.`;
    });
  }

  function setupContactForm() {
    const form = $(".contact-form");
    if (!form) return;
    const button = $("button", form);
    const modal = document.createElement("div");
    modal.className = "form-success-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="form-success-card">
        <button class="form-success-close" type="button" aria-label="Close message">
          <span aria-hidden="true">&times;</span>
        </button>
        <span class="form-success-icon" aria-hidden="true"></span>
        <h2>Thank you. The request details were received.</h2>
        <p>A provider connection specialist can use these details to organize the next step with independent local provider options.</p>
        <button class="btn primary form-success-action" type="button">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    const closeButtons = $$("button", modal);

    const setModalOpen = (state) => {
      modal.classList.toggle("is-visible", state);
      modal.setAttribute("aria-hidden", String(!state));
      document.body.classList.toggle("modal-open", state);
      if (state) $(".form-success-action", modal)?.focus();
    };

    const showSuccess = (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      button?.classList.add("is-sent");
      if (button) button.textContent = "Request Sent";
      setModalOpen(true);
    };

    form.addEventListener("submit", showSuccess);
    closeButtons.forEach((closeButton) => closeButton.addEventListener("click", () => setModalOpen(false)));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) setModalOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-visible")) setModalOpen(false);
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
  setupEstimator();
  setupScenarioSlider();
  setupReviewCarousel();
  setupZipForm();
  setupContactForm();
  setupReveal();
  if (window.lucide) window.lucide.createIcons();
})();
