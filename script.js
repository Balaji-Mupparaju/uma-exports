/**
 * UMA Granite Export — Main Script
 * Vanilla JS · No frameworks · ES6+
 *
 * Sections:
 *  1. Utility helpers
 *  2. Navbar — scroll state & active link tracking
 *  3. Mobile hamburger menu
 *  4. Back-to-top button
 *  5. Scroll-reveal animation (IntersectionObserver)
 *  6. Animated stat counters
 *  7. Gallery filter tabs
 *  8. Lightbox (gallery overlay)
 *  9. Contact form validation & submission
 * 10. Initialisation
 */

'use strict';

/* =============================================================================
   1. UTILITY HELPERS
   ============================================================================= */

/**
 * Shorthand querySelector.
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element|null}
 */
const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * Shorthand querySelectorAll → Array.
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element[]}
 */
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/* =============================================================================
   2. NAVBAR — scroll state & active-link highlighting
   ============================================================================= */
const navbar   = $('#navbar');
const navLinks = $$('.nav-link');

/** Apply/remove the `.scrolled` class based on scroll position. */
function updateNavbarState() {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}

/**
 * Mark the nav link whose target section is currently in view.
 * Reads all <section id="..."> elements and compares offsets.
 */
function updateActiveNavLink() {
  // Collect all sections that have an id matching a nav href
  const sections = $$('section[id]');
  let activeSectionId = sections[0]?.id ?? '';

  sections.forEach(section => {
    // Section is "active" when its top edge has scrolled past the 40% viewport mark
    if (window.scrollY + window.innerHeight * 0.40 >= section.offsetTop) {
      activeSectionId = section.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.toggle(
      'active',
      link.getAttribute('href') === `#${activeSectionId}`
    );
  });
}

/* =============================================================================
   3. MOBILE HAMBURGER MENU
   ============================================================================= */
const hamburger   = $('#hamburger');
const navLinksEl  = $('#navLinks');

/** Toggle the mobile nav drawer open/closed. */
function toggleMobileMenu(forceClose = false) {
  const isOpen = navLinksEl.classList.contains('open');
  const open   = forceClose ? false : !isOpen;

  hamburger.classList.toggle('active', open);
  navLinksEl.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  // Prevent body scroll while menu is open
  document.body.style.overflow = open ? 'hidden' : '';
}

hamburger.addEventListener('click', () => toggleMobileMenu());

// Close drawer when any nav link is clicked
navLinksEl.addEventListener('click', e => {
  if (e.target.classList.contains('nav-link')) toggleMobileMenu(true);
});

// Close drawer when clicking outside the nav
document.addEventListener('click', e => {
  if (!navbar.contains(e.target) && navLinksEl.classList.contains('open')) {
    toggleMobileMenu(true);
  }
});

// Close drawer on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinksEl.classList.contains('open')) {
    toggleMobileMenu(true);
  }
});

/* =============================================================================
   4. BACK-TO-TOP BUTTON
   ============================================================================= */
const backToTopBtn = $('#backToTop');

/** Show/hide the back-to-top button. */
function updateBackToTop() {
  backToTopBtn.classList.toggle('visible', window.scrollY > 420);
}

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* =============================================================================
   5. SCROLL-REVEAL ANIMATION (IntersectionObserver)
   ============================================================================= */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // Stagger cards within the same parent grid
      const siblings  = $$('.reveal', entry.target.parentElement);
      const idx       = siblings.indexOf(entry.target);
      const staggerMs = Math.min(idx * 80, 400); // cap stagger at 400 ms

      setTimeout(() => entry.target.classList.add('revealed'), staggerMs);
      revealObserver.unobserve(entry.target); // animate once only
    });
  },
  { threshold: 0.12 }
);

/** Register all `.reveal` elements with the observer. */
function initReveal() {
  $$('.reveal').forEach(el => revealObserver.observe(el));
}

/* =============================================================================
   6. ANIMATED STAT COUNTERS
   ============================================================================= */
let countersTriggered = false;

const statsObserver = new IntersectionObserver(
  (entries) => {
    if (countersTriggered || !entries[0].isIntersecting) return;
    countersTriggered = true;
    animateCounters();
    statsObserver.disconnect();
  },
  { threshold: 0.50 }
);

/** Animate each `.stat-number` from 0 to its `data-target` value. */
function animateCounters() {
  const DURATION = 2000; // ms

  $$('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const start  = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      // Ease-out cubic for a satisfying deceleration
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(tick);
  });
}

/** Observe the stats bar to trigger counters when it enters the viewport. */
function initCounters() {
  const statsBar = $('.stats-bar');
  if (statsBar) statsObserver.observe(statsBar);
}

/* =============================================================================
   7. GALLERY FILTER TABS
   ============================================================================= */
const filterBtns   = $$('.filter-btn');
const galleryItems = $$('.gallery-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button state
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    galleryItems.forEach(item => {
      const matches = filter === 'all' || item.dataset.category === filter;

      if (matches) {
        item.classList.remove('hidden');
        // Re-trigger reveal if the item was hidden before
        item.classList.remove('revealed');
        requestAnimationFrame(() => item.classList.add('revealed'));
      } else {
        item.classList.add('hidden');
      }
    });
  });
});

/* =============================================================================
   8. LIGHTBOX (gallery overlay)
   ============================================================================= */
const lightbox   = $('#lightbox');
const lbImg      = $('#lbImg');
const lbCaption  = $('#lbCaption');
const lbClose    = $('#lbClose');
const lbPrev     = $('#lbPrev');
const lbNext     = $('#lbNext');

let lbImages     = [];  // Array of { src, alt, caption }
let lbIndex      = 0;

/**
 * Build image list from currently visible gallery items.
 * Called each time the lightbox opens so filtered views stay consistent.
 */
function buildLightboxImages() {
  lbImages = $$('.gallery-item:not(.hidden)').map(item => {
    const img     = item.querySelector('img');
    const caption = item.querySelector('.gallery-hover span')?.textContent?.trim() ?? '';
    return { src: img.src, alt: img.alt || '', caption };
  });
}

/** Open lightbox showing the image at the given index. */
function openLightbox(index) {
  buildLightboxImages();
  if (!lbImages.length) return;

  lbIndex = ((index % lbImages.length) + lbImages.length) % lbImages.length;
  showLightboxImage(lbIndex, false);
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

/** Close the lightbox. */
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  // Clear src to stop any ongoing network request
  lbImg.src = '';
}

/**
 * Display an image at position `index`.
 * @param {number} index
 * @param {boolean} animate — cross-fade on navigate
 */
function showLightboxImage(index, animate = true) {
  const { src, alt, caption } = lbImages[index];

  if (animate) {
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src          = src;
      lbImg.alt          = alt;
      lbCaption.textContent = caption;
      lbImg.style.opacity = '1';
    }, 180);
  } else {
    lbImg.src             = src;
    lbImg.alt             = alt;
    lbCaption.textContent = caption;
    lbImg.style.opacity   = '1';
  }
}

/** Navigate lightbox left (−1) or right (+1). */
function navigateLightbox(dir) {
  lbIndex = ((lbIndex + dir) % lbImages.length + lbImages.length) % lbImages.length;
  showLightboxImage(lbIndex, true);
}

// Attach click to every gallery item
galleryItems.forEach((item, idx) => {
  item.addEventListener('click', () => openLightbox(idx));
});

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click',  () => navigateLightbox(-1));
lbNext.addEventListener('click',  () => navigateLightbox(1));

// Close on backdrop click
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// Keyboard navigation for lightbox
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   navigateLightbox(-1);
  if (e.key === 'ArrowRight')  navigateLightbox(1);
});

// Touch swipe support for mobile lightbox
(function attachLightboxSwipe() {
  let startX = 0;
  lightbox.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) navigateLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

/* =============================================================================
   9. CONTACT FORM VALIDATION & SUBMISSION
   ============================================================================= */
const contactForm  = $('#contactForm');
const formSuccess  = $('#formSuccess');
const submitBtn    = $('#submitBtn');

/**
 * Validate a required text/select field.
 * @returns {boolean}
 */
function validateRequired(field, errorEl, msg) {
  const empty = !field.value.trim();
  field.classList.toggle('error', empty);
  errorEl.textContent = empty ? msg : '';
  return !empty;
}

/**
 * Validate an email field with a regex check.
 * @returns {boolean}
 */
function validateEmail(field, errorEl) {
  const val     = field.value.trim();
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!val) {
    field.classList.add('error');
    errorEl.textContent = 'Email address is required.';
    return false;
  }
  if (!emailRx.test(val)) {
    field.classList.add('error');
    errorEl.textContent = 'Please enter a valid email address.';
    return false;
  }
  field.classList.remove('error');
  errorEl.textContent = '';
  return true;
}

/**
 * Validate the message field (minimum character length).
 * @returns {boolean}
 */
function validateMessage(field, errorEl) {
  const tooShort = field.value.trim().length < 10;
  field.classList.toggle('error', tooShort);
  errorEl.textContent = tooShort
    ? 'Please provide more detail (at least 10 characters).'
    : '';
  return !tooShort;
}

// — Real-time blur validation —
$('#name').addEventListener('blur', function () {
  validateRequired(this, $('#nameError'), 'Full name is required.');
});
$('#email').addEventListener('blur', function () {
  validateEmail(this, $('#emailError'));
});
$('#interest').addEventListener('change', function () {
  validateRequired(this, $('#interestError'), 'Please select a product type.');
});
$('#message').addEventListener('blur', function () {
  validateMessage(this, $('#messageError'));
});

// — Form submit —
contactForm.addEventListener('submit', e => {
  e.preventDefault();

  const nameOk     = validateRequired($('#name'),     $('#nameError'),     'Full name is required.');
  const emailOk    = validateEmail(   $('#email'),     $('#emailError'));
  const interestOk = validateRequired($('#interest'),  $('#interestError'), 'Please select a product type.');
  const messageOk  = validateMessage( $('#message'),   $('#messageError'));

  if (!(nameOk && emailOk && interestOk && messageOk)) {
    // Scroll smoothly to the first error field
    const firstError = contactForm.querySelector('.error');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Collect form values
  const nameVal     = $('#name').value.trim();
  const companyVal  = $('#company').value.trim();
  const emailVal    = $('#email').value.trim();
  const phoneVal    = $('#phone').value.trim();
  const interestVal = $('#interest').options[$('#interest').selectedIndex].text;
  const messageVal  = $('#message').value.trim();
  const newsletter  = $('#newsletter').checked ? 'Yes' : 'No';

  // ── Web3Forms silent submission ────────────────────────────────────────────
  // Sign up free at https://web3forms.com → enter umagranites001@gmail.com
  // → paste the access key you receive into the variable below.
  const WEB3FORMS_KEY = '3baa9de5-8366-4a64-89b9-1cf1a7d7be2f';

  const payload = {
    access_key:  WEB3FORMS_KEY,
    subject:     `New Quote Request from ${nameVal} – UMA Granite Export`,
    from_name:   'UMA Granite Export Website',
    name:        nameVal,
    email:       emailVal,
    company:     companyVal  || '—',
    phone:       phoneVal    || '—',
    interest:    interestVal,
    message:     messageVal,
    newsletter:  newsletter,
  };

  // Show sending state immediately
  submitBtn.disabled  = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Sending…';

  fetch('https://api.web3forms.com/submit', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify(payload),
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      contactForm.reset();
      formSuccess.classList.add('show');
      setTimeout(() => formSuccess.classList.remove('show'), 9000);
    } else {
      // Web3Forms returned an error (e.g. invalid key)
      alert('Submission failed: ' + (data.message || 'Unknown error. Please email us directly.'));
    }
  })
  .catch(() => {
    alert('Network error. Please email us at umagranites001@gmail.com or call +91 92464 19578.');
  })
  .finally(() => {
    submitBtn.disabled  = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i> Send Request';
  });
});

/* =============================================================================
   10. SCROLL EVENT HANDLER (throttled via rAF)
   ============================================================================= */
let rafPending = false;

function onScroll() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    updateNavbarState();
    updateBackToTop();
    updateActiveNavLink();
    rafPending = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });

/* =============================================================================
   11. INITIALISE
   ============================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Set initial CSS transition on lightbox image for smooth nav
  lbImg.style.transition = 'opacity 0.18s ease';

  // Boot all modules
  updateNavbarState();
  updateActiveNavLink();
  updateBackToTop();
  initReveal();
  initCounters();
});
