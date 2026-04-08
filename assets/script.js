/* =============================================================================
   All Rounder Care — site behaviour
   ============================================================================= */

/* -----------------------------------------------------------------------------
   loadIncludes — fetch header/footer, then nav
   ----------------------------------------------------------------------------- */

function loadIncludes() {
  const headerPh = document.getElementById("header-placeholder");
  const footerPh = document.getElementById("footer-placeholder");
  if (!headerPh || !footerPh) return;

  const headerFetch = fetch("includes/header.html").then((r) => r.text());
  const footerFetch = fetch("includes/footer.html").then((r) => r.text());

  Promise.all([headerFetch, footerFetch])
    .then(([headerHtml, footerHtml]) => {
      headerPh.innerHTML = headerHtml;
      footerPh.innerHTML = footerHtml;
      initNav();
      setActiveNavLink();
    })
    .catch(() => {
      /* Static file open without server — placeholders stay empty */
    });
}

/* -----------------------------------------------------------------------------
   initNav — hamburger, scroll shrink, drawer close
   ----------------------------------------------------------------------------- */

function initNav() {
  const header = document.querySelector(".header");
  const toggle = document.querySelector(".nav-toggle");
  const drawer = document.querySelector(".nav-drawer");
  const overlay = document.querySelector(".nav-drawer-overlay");

  function closeDrawer() {
    if (!toggle || !drawer || !overlay) return;
    toggle.setAttribute("aria-expanded", "false");
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  }

  function openDrawer() {
    if (!toggle || !drawer || !overlay) return;
    toggle.setAttribute("aria-expanded", "true");
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.classList.add("nav-open");
  }

  if (toggle && drawer && overlay) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (open) closeDrawer();
      else openDrawer();
    });
    overlay.addEventListener("click", closeDrawer);
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeDrawer);
    });
  }

  if (!header) return;

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        header.classList.toggle("header--scrolled", window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* -----------------------------------------------------------------------------
   setActiveNavLink — pathname vs href
   ----------------------------------------------------------------------------- */

function setActiveNavLink() {
  let page = window.location.pathname.split("/").pop() || "";
  if (!page || page === "") page = "index.html";
  if (!page.endsWith(".html")) page = `${page}.html`;

  document.querySelectorAll(".nav-desktop__links a, .nav-drawer__links a").forEach((link) => {
    link.classList.remove("is-active");
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("tel:")) return;
    const linkFile = href.split("/").pop();
    if (linkFile === page) link.classList.add("is-active");
  });
}

/* -----------------------------------------------------------------------------
   initSmoothScroll — # anchors with 90px offset
   ----------------------------------------------------------------------------- */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

/* -----------------------------------------------------------------------------
   initScrollAnimations
   ----------------------------------------------------------------------------- */

function initScrollAnimations() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));

  document.querySelectorAll(".animate-stagger").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 80}ms`;
      observer.observe(child);
    });
  });
}

/* -----------------------------------------------------------------------------
   initCounters
   ----------------------------------------------------------------------------- */

function initCounters() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".stat-number").forEach((el) => {
      el.textContent = el.dataset.target + (el.dataset.suffix || "");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const el = entry.target;
        const target = Number.parseFloat(el.dataset.target) || 0;
        const suffix = el.dataset.suffix || "";
        const decimals = parseInt(el.dataset.decimals, 10) || 0;
        const duration = 1800;
        const start = performance.now();

        function update(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent =
            (target * eased).toFixed(decimals) + (progress === 1 ? suffix : "");
          if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll(".stat-number").forEach((el) => observer.observe(el));
}

/* -----------------------------------------------------------------------------
   initCallBar — 2s delay, session dismiss
   ----------------------------------------------------------------------------- */

function initCallBar() {
  const bar = document.querySelector(".call-bar");
  const dismiss = document.querySelector(".call-bar__dismiss");
  if (!bar) return;

  const storageKey = "allroundercare_callbar_dismissed";

  if (sessionStorage.getItem(storageKey) === "1") return;

  window.setTimeout(() => {
    if (sessionStorage.getItem(storageKey) === "1") return;
    bar.classList.add("is-visible");
  }, 2000);

  if (dismiss) {
    dismiss.addEventListener("click", () => {
      sessionStorage.setItem(storageKey, "1");
      bar.classList.remove("is-visible");
    });
  }
}

/* -----------------------------------------------------------------------------
   initContactForm
   ----------------------------------------------------------------------------- */

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const successEl = form.querySelector(".form-success");
  const phoneEl = document.querySelector("[data-contact-phone-display]");

  const displayPhone = phoneEl ? phoneEl.textContent.trim() : "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    form.querySelectorAll(".form-error").forEach((err) => {
      err.classList.remove("is-visible");
      err.textContent = "";
    });
    if (successEl) successEl.classList.remove("is-visible");

    const name = form.querySelector('[name="name"]');
    const email = form.querySelector('[name="email"]');
    const phone = form.querySelector('[name="phone"]');
    const service = form.querySelector('[name="service"]');
    const message = form.querySelector('[name="message"]');

    let valid = true;

    function showFieldError(field, msg) {
      const wrap = field.closest("div") || field.parentElement;
      let err = wrap.querySelector(".form-error");
      if (!err) {
        err = document.createElement("div");
        err.className = "form-error";
        field.after(err);
      }
      err.textContent = msg;
      err.classList.add("is-visible");
      valid = false;
    }

    if (!name || !name.value.trim()) showFieldError(name, "Please enter your name.");
    if (!email || !email.value.trim()) showFieldError(email, "Please enter your email.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showFieldError(email, "Please enter a valid email address.");
    }
    if (!phone || !phone.value.trim()) showFieldError(phone, "Please enter your phone number.");
    if (!service || !service.value.trim()) showFieldError(service, "Please select a service.");
    if (!message || !message.value.trim()) showFieldError(message, "Please tell us how we can help.");

    if (!valid) return;

    if (successEl) {
      successEl.textContent =
        "Thanks — we'll be in touch soon! For urgent jobs call " +
        displayPhone +
        " directly.";
      successEl.classList.add("is-visible");
    }
    form.reset();
  });
}

/* -----------------------------------------------------------------------------
   initFaq — smooth height on details
   ----------------------------------------------------------------------------- */

function initFaq() {
  document.querySelectorAll(".faq__item").forEach((details) => {
    const answer = details.querySelector(".faq__answer");
    if (!answer) return;

    details.addEventListener("toggle", () => {
      if (details.open) {
        answer.style.height = "0px";
        const full = answer.scrollHeight;
        answer.style.height = "0px";
        answer.offsetHeight;
        answer.style.transition = "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
        answer.style.height = `${full}px`;
        answer.addEventListener(
          "transitionend",
          function te() {
            answer.removeEventListener("transitionend", te);
            if (details.open) answer.style.height = "auto";
          },
          { once: true }
        );
      } else {
        const h = answer.scrollHeight;
        answer.style.height = `${h}px`;
        answer.offsetHeight;
        answer.style.transition = "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        answer.style.height = "0px";
      }
    });
  });
}

/* -----------------------------------------------------------------------------
   DOMContentLoaded
   ----------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  loadIncludes();
  initSmoothScroll();
  initScrollAnimations();
  initCounters();
  initCallBar();
  initContactForm();
  initFaq();
});
