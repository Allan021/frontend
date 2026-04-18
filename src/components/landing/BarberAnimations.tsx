import { useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * BarberAnimations — Handles ALL anime.js driven animations:
 * - Scroll reveals with staggered timelines
 * - Hero banner entrance
 * - Floating hair particles
 * - Navbar scroll effect
 * - Service card stagger
 * - Section heading razor reveals
 * - Parallax-like depth effects on mobile
 */
export default function BarberAnimations() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      setTimeout(() => {
        initHeroAnimations();
        initScrollReveals();
        initNavbarScroll();
        initParticles();
        initServiceCards();
        initParallaxDepth();
      }, 100);
    });
  }, []);

  return null; // Purely side-effect component
}

/* ═══════════════════════════════════════
   HERO ANIMATIONS
   ═══════════════════════════════════════ */
function initHeroAnimations() {
  const tl = anime.timeline({ easing: 'easeOutExpo' });

  // Navbar entrance
  tl.add({
    targets: '.navbar-glass',
    translateY: [-60, 0],
    opacity: [0, 1],
    duration: 800,
  }, 0);

  // Banner reveal — desktop
  const heroBanner = document.querySelector('.hero-banner-container');
  if (heroBanner) {
    tl.add({
      targets: '.hero-banner-container',
      scale: [1.1, 1],
      opacity: [0, 1],
      duration: 1200,
    }, 200);

    tl.add({
      targets: '.hero-banner-overlay',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
    }, 800);
  }

  // Banner reveal — mobile
  const mobileBanner = document.querySelector('.mobile-hero');
  if (mobileBanner) {
    tl.add({
      targets: '.mobile-hero-image',
      scale: [0.8, 1],
      rotate: [-5, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutBack',
    }, 300);

    tl.add({
      targets: '.mobile-hero-text > *',
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 600,
      delay: anime.stagger(120),
    }, 700);
  }

  // Stats cards stagger  
  tl.add({
    targets: '.stat-card',
    translateY: [50, 0],
    scale: [0.85, 1],
    opacity: [0, 1],
    duration: 700,
    delay: anime.stagger(150),
    easing: 'easeOutBack',
  }, 1200);

  // Scroll indicator
  tl.add({
    targets: '.scroll-indicator',
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
  }, 1800);

  // Barber pole line entrance
  tl.add({
    targets: '.barber-pole-line',
    scaleX: [0, 1],
    duration: 800,
    easing: 'easeOutQuint',
  }, 0);
}

/* ═══════════════════════════════════════
   SCROLL REVEAL SYSTEM
   ═══════════════════════════════════════ */
function initScrollReveals() {
  const sections = document.querySelectorAll('.reveal-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const section = entry.target as HTMLElement;
        const type = section.dataset.reveal || 'up';
        animateSection(section, type);
        observer.unobserve(section);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
  });

  sections.forEach(section => observer.observe(section));
}

function animateSection(section: HTMLElement, type: string) {
  // Heading reveal
  const heading = section.querySelector('.section-heading');
  if (heading) {
    anime({
      targets: heading,
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutExpo',
    });
  }

  // Badge reveal
  const badge = section.querySelector('.section-badge');
  if (badge) {
    anime({
      targets: badge,
      scale: [0, 1],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutBack',
      delay: 100,
    });
  }

  // Separator razor slash
  const sep = section.querySelector('.section-separator');
  if (sep) {
    anime({
      targets: sep,
      scaleX: [0, 1],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutQuint',
      delay: 200,
    });
  }

  // Content items stagger
  const items = section.querySelectorAll('.reveal-item');
  if (items.length) {
    const baseProps: any = {
      targets: items,
      opacity: [0, 1],
      duration: 700,
      delay: anime.stagger(100, { start: 300 }),
      easing: 'easeOutQuint',
    };

    switch (type) {
      case 'up':
        baseProps.translateY = [60, 0];
        baseProps.scale = [0.9, 1];
        break;
      case 'left':
        baseProps.translateX = [-80, 0];
        baseProps.rotate = [-3, 0];
        break;
      case 'right':
        baseProps.translateX = [80, 0];
        baseProps.rotate = [3, 0];
        break;
      case 'scale':
        baseProps.scale = [0.5, 1];
        baseProps.rotate = [anime.stagger([-5, 5]), 0];
        break;
      case 'flip':
        baseProps.rotateY = [90, 0];
        baseProps.scale = [0.8, 1];
        break;
    }

    anime(baseProps);
  }

  // Gallery image parallax reveal
  const galleryImg = section.querySelector('.gallery-image');
  if (galleryImg) {
    anime({
      targets: galleryImg,
      scale: [1.15, 1],
      opacity: [0, 1],
      duration: 1200,
      easing: 'easeOutExpo',
      delay: 200,
    });
  }

  // Info cards slide in
  const infoCards = section.querySelectorAll('.info-card');
  if (infoCards.length) {
    anime({
      targets: infoCards,
      translateX: [60, 0],
      opacity: [0, 1],
      duration: 800,
      delay: anime.stagger(150, { start: 400 }),
      easing: 'easeOutQuint',
    });
  }
}

/* ═══════════════════════════════════════
   NAVBAR SCROLL EFFECT
   ═══════════════════════════════════════ */
function initNavbarScroll() {
  const nav = document.querySelector('.navbar-glass');
  if (!nav) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 80) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ═══════════════════════════════════════
   FLOATING HAIR PARTICLES
   ═══════════════════════════════════════ */
function initParticles() {
  // Only on desktop for performance
  if (window.innerWidth < 768) return;

  const container = document.querySelector('.hero-section');
  if (!container) return;

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.className = 'hair-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 8 + 's';
    particle.style.animationDuration = (6 + Math.random() * 6) + 's';
    particle.style.width = (1 + Math.random() * 2) + 'px';
    particle.style.height = (4 + Math.random() * 8) + 'px';
    particle.style.opacity = (0.1 + Math.random() * 0.2).toString();
    container.appendChild(particle);
  }
}

/* ═══════════════════════════════════════
   SERVICE CARDS HOVER ANIMATION
   ═══════════════════════════════════════ */
function initServiceCards() {
  // Observe the services grid and animate cards when they appear
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  const observer = new MutationObserver(() => {
    const cards = grid.querySelectorAll('.service-card');
    if (cards.length > 0) {
      // Intersection observer for the grid
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            anime({
              targets: grid.querySelectorAll('.service-card'),
              translateY: [80, 0],
              scale: [0.8, 1],
              opacity: [0, 1],
              rotate: [anime.stagger([-3, 3]), 0],
              duration: 800,
              delay: anime.stagger(120),
              easing: 'easeOutBack',
            });
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      io.observe(grid);
      observer.disconnect();
    }
  });

  observer.observe(grid, { childList: true });
}

/* ═══════════════════════════════════════
   MOBILE PARALLAX/DEPTH EFFECT
   ═══════════════════════════════════════ */
function initParallaxDepth() {
  if (window.innerWidth > 768) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        // Subtle navbar opacity on scroll
        const hero = document.querySelector('.hero-section') as HTMLElement;
        if (hero) {
          const heroHeight = hero.offsetHeight;
          const progress = Math.min(scrollY / heroHeight, 1);
          // Subtle scale on the hero background
          const bg = hero.querySelector('.hero-bg') as HTMLElement;
          if (bg) {
            bg.style.transform = `scale(${1 + progress * 0.05})`;
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}
