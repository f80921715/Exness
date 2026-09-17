/**
 * iOS-Native Page Transitions & Spring Animations
 * Uses GSAP with custom spring easing to replicate UIKit feel
 */

(function () {
  'use strict';

  // ─── Spring easing (mirrors iOS UISpringTimingParameters) ──────────────────
  // damping=0.78, response=0.38 → slightly bouncy, snappy
  const IOS_SPRING = 'cubic-bezier(0.34, 1.12, 0.64, 1)';
  const IOS_EASE_OUT = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  // ─── Page enter animation (runs once on load) ──────────────────────────────
  function pageEnter() {
    if (typeof gsap === 'undefined') return;

    const landingHero = document.querySelector('[data-landing-hero]');
    const main = document.querySelector('main');

    // Stagger cards/sections on enter
    const cards = document.querySelectorAll(
      'main > div, main > section, main > form, main > article'
    );

    if (landingHero) {
      const heroCopy = landingHero.querySelector('.lg\\:col-span-5');
      const heroCards = landingHero.querySelector('.lg\\:col-span-4');
      const heroItems = heroCopy ? heroCopy.children : [];

      gsap.from(landingHero, {
        opacity: 0,
        duration: 0.5,
        ease: IOS_EASE_OUT,
        clearProps: 'opacity',
      });
      gsap.from(heroItems, {
        y: 24,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        delay: 0.12,
        ease: IOS_SPRING,
        clearProps: 'all',
      });
      if (heroCards) {
        gsap.from(heroCards.querySelectorAll('.grid > div'), {
          y: 28,
          scale: 0.96,
          opacity: 0,
          duration: 0.55,
          stagger: 0.1,
          delay: 0.28,
          ease: IOS_SPRING,
          clearProps: 'all',
        });
      }
      return;
    }

    // Main content spring in with stagger
    if (cards.length) {
      gsap.from(cards, {
        y: 32,
        opacity: 0,
        duration: 0.5,
        stagger: 0.065,
        ease: IOS_SPRING,
        clearProps: 'all',
        delay: 0.08,
      });
    } else if (main) {
      gsap.from(main, {
        y: 28,
        opacity: 0,
        duration: 0.45,
        ease: IOS_SPRING,
        clearProps: 'all',
        delay: 0.05,
      });
    }
  }

  // ─── Navigate away with iOS push/slide transition ─────────────────────────
  function navigateTo(href, direction) {
    window.location.href = href;
  }

  // ─── Intercept internal dashboard nav links ───────────────────────────────
  function setupNavInterception() {
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

      // Only intercept same-origin dashboard links
      const isDashboard = href.includes('.html') || href === '/' || href === '';
      if (!isDashboard) return;

      // Skip if modifier key held
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();

      // Detect direction: going to index = back, otherwise forward
      const isBack = href === 'index.html' || href === '../index.html' ||
        link.closest('nav[aria-label="Mobile dashboard navigation"]') === null && link.classList.contains('back-link');

      navigateTo(href, isBack ? 'back' : 'forward');
    });
  }

  // ─── iOS spring bounce on interactive tap ─────────────────────────────────
  function setupTapFeedback() {
    if (typeof gsap === 'undefined') return;

    const targets = '[data-ios-tap], .ios-tap, button:not([disabled]), .cursor-pointer';

    document.addEventListener('pointerdown', function (e) {
      const el = e.target.closest(
        'button:not([disabled]):not(.theme-btn), .ios-tap, [data-ios-tap]'
      );
      if (!el) return;
      gsap.to(el, { scale: 0.96, duration: 0.1, ease: 'power2.out', overwrite: true });
    });

    document.addEventListener('pointerup', function (e) {
      const el = e.target.closest(
        'button:not([disabled]):not(.theme-btn), .ios-tap, [data-ios-tap]'
      );
      if (!el) return;
      gsap.to(el, { scale: 1, duration: 0.4, ease: IOS_SPRING, overwrite: true });
    });

    document.addEventListener('pointercancel', function (e) {
      const el = e.target.closest(
        'button:not([disabled]):not(.theme-btn), .ios-tap, [data-ios-tap]'
      );
      if (!el) return;
      gsap.to(el, { scale: 1, duration: 0.3, ease: IOS_SPRING, overwrite: true });
    });
  }

  // ─── Scroll-reveal: items fade+spring in as they enter viewport ───────────
  function setupScrollReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const revealEls = document.querySelectorAll('.reveal, [data-reveal]');
    revealEls.forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        y: 24,
        opacity: 0,
        duration: 0.5,
        ease: IOS_SPRING,
      });
    });
  }

  // ─── Bottom nav active indicator spring ───────────────────────────────────
  function animateNavIndicator() {
    const nav = document.querySelector('nav[aria-label="Mobile dashboard navigation"]');
    if (!nav || typeof gsap === 'undefined') return;

    const activeLink = nav.querySelector('a.text-primary-500');
    if (!activeLink) return;

    gsap.from(activeLink, {
      scale: 0.8,
      duration: 0.5,
      ease: IOS_SPRING,
      delay: 0.3,
      clearProps: 'all',
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    // Ensure body starts visible
    document.body.style.opacity = '1';
    document.body.style.transform = 'none';

    pageEnter();
    setupNavInterception();
    setupTapFeedback();
    setupScrollReveal();
    animateNavIndicator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Restore body on back/forward navigation
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      gsap && gsap.set(document.body, { x: 0, opacity: 1 });
    }
  });
})();
