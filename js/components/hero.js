/**
 * ============================================================
 * Composant Hero — Page d'accueil du site mariage
 * ============================================================
 * Gère l'interactivité et la mise en page de la section hero :
 * - Layout UNIFIÉ en 1 colonne centrée (compatible à 100% avec styles.css)
 * - Typographie Playfair Display (Prénoms, esperluette, logo .nav__logo)
 * - Boutons Vert Sauge compacts ("Répondre à l'invitation" en gras)
 * - Émojis étoiles droits (non italique)
 * - Animations d'entrée et particules flottantes
 */

import Animations from '../utils/animations.js';
import Router from '../utils/router.js';

const Hero = {
  /** Références DOM internes */
  _elements: {
    page: null,
    heroSection: null,
    particlesContainer: null,
  },

  /** Identifiants des animations en cours */
  _animationFrameId: null,
  _particles: [],
  _resizeHandler: null,
  _scrollHandler: null,

  /**
   * Initialise le composant Hero.
   */
  init() {
    this._elements.page = document.getElementById('page-home');
    if (!this._elements.page) return;

    this._elements.heroSection = this._elements.page.querySelector('.hero-section') 
      || this._elements.page.querySelector('.hero') 
      || this._elements.page;

    // 3. Lancement des animations et listeners
    this._animateEntrance();
    this._attachCTAListeners();
    this._initParallax();
    this._createParticles();
  },

  /**
   * Nettoie les listeners et animations.
   */
  destroy() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler);
      this._scrollHandler = null;
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._elements.particlesContainer) {
      this._elements.particlesContainer.remove();
      this._elements.particlesContainer = null;
    }
    this._particles = [];
  },

  // ─── RESTRUCTURATION ESTHÉTIQUE DU DOM ────────────────

  _restructureHeroDOM() {
    const hero = this._elements.heroSection;

    // 1. Superposition des prénoms
    const namesEl = hero.querySelector('.hero__names');
    if (namesEl && !namesEl.dataset.restructured) {
      namesEl.innerHTML = `
        <span class="hero-name-stacked">Laetitia</span>
        <span class="hero-ampersand-stacked">&amp;</span>
        <span class="hero-name-stacked">Alexandre</span>
      `;
      namesEl.dataset.restructured = "true";
    }

    // 2. Correction des émojis étoiles pour qu'ils ne soient JAMAIS en italique
    const textContainers = hero.querySelectorAll('.hero__prelude, .hero__details, .hero__date, h1, h2, h3, p');
    textContainers.forEach(container => {
      if (container && !container.dataset.emojisFixed) {
        container.innerHTML = container.innerHTML.replace(
          /(✦|★|✨|✧|✳|✴|•)/g, 
          '<span style="font-style: normal !important; display: inline-block; margin: 0 2px;">$1</span>'
        );
        container.dataset.emojisFixed = "true";
      }
    });

    // 3. Regroupement dans un conteneur UNIFIÉ (1 seule colonne PC et Mobile)
    const detailsEl = hero.querySelector('.hero__details');
    const actionsEl = hero.querySelector('.hero__actions');

    if (detailsEl && actionsEl && !hero.querySelector('.hero__body-split')) {
      actionsEl.removeAttribute('style');
      const innerActionDiv = actionsEl.querySelector('div');
      if (innerActionDiv) innerActionDiv.removeAttribute('style');

      const splitContainer = document.createElement('div');
      splitContainer.className = 'hero__body-split animate-on-scroll';
      
      hero.insertBefore(splitContainer, detailsEl);
      splitContainer.appendChild(detailsEl);
      splitContainer.appendChild(actionsEl);
    }
  },

  // ─── ANIMATIONS D'ENTRÉE ──────────────────────────────

  _animateEntrance() {
    const selectors = [
      '.hero__prelude',
      '.hero__names',
      '.hero__body-split',
      '.hero__details',
	  '.hero__rsvp',
      '.hero__actions',
      '.scroll-indicator'
    ];

    let delay = 0;
    const baseDelay = 120;

    selectors.forEach((selector) => {
      const elements = this._elements.heroSection.querySelectorAll(selector);
      elements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, 
                               transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        });

        delay += baseDelay;
      });
    });

    if (Animations && Animations.staggerChildren) {
      Animations.staggerChildren(this._elements.heroSection, '.hero-feature, .feature-card', 100);
    }
  },

  // ─── LISTENERS CTA ────────────────────────────────────

  _attachCTAListeners() {
    const ctaLinks = this._elements.page.querySelectorAll('a[href*="#/"]');

    ctaLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#/')) {
          e.preventDefault();
          this._rippleEffect(link, e);
          setTimeout(() => {
            Router.navigate(href);
          }, 300);
        }
      });
    });

    const scrollIndicator = this._elements.page.querySelector('.scroll-indicator');
    if (scrollIndicator) {
      scrollIndicator.addEventListener('click', () => {
        const nextSection = this._elements.heroSection.nextElementSibling;
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  },

  _rippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      border-radius: 50%;
      background: rgba(156, 175, 136, 0.3);
      transform: scale(0);
      animation: hero-ripple 0.6s ease-out;
      pointer-events: none;
    `;

    const originalPosition = element.style.position;
    if (!element.style.position || element.style.position === 'static') {
      element.style.position = 'relative';
    }
    element.style.overflow = 'hidden';

    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
      if (originalPosition) element.style.position = originalPosition;
    });
  },

  // ─── EFFET PARALLAXE ──────────────────────────────────

  _initParallax() {
    const heroContent = this._elements.heroSection.querySelector('.hero-content')
      || this._elements.heroSection;

    this._scrollHandler = () => {
      const scrollY = window.scrollY;
      const heroHeight = this._elements.heroSection.offsetHeight;

      if (scrollY > heroHeight) return;

      heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;

      if (this._elements.particlesContainer) {
        this._elements.particlesContainer.style.transform = `translateY(${scrollY * 0.08}px)`;
      }
    };

    window.addEventListener('scroll', this._scrollHandler, { passive: true });
  },

  // ─── PARTICULES DÉCORATIVES ───────────────────────────

  _createParticles() {
    this._elements.particlesContainer = document.createElement('div');
    this._elements.particlesContainer.className = 'hero-particles';
    this._elements.particlesContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 1;
    `;

    this._elements.heroSection.style.position = 'relative';
    this._elements.heroSection.appendChild(this._elements.particlesContainer);

    const particleCount = Math.min(20, Math.floor(window.innerWidth / 70));
    const particleTypes = ['leaf', 'star', 'dot', 'sparkle'];

    for (let i = 0; i < particleCount; i++) {
      this._createParticle(particleTypes[i % particleTypes.length]);
    }

    this._animateParticles();

    this._resizeHandler = () => {};
    window.addEventListener('resize', this._resizeHandler, { passive: true });
  },

  _createParticle(type) {
    const particle = document.createElement('div');
    const configs = {
      leaf: { content: '🌿', size: Math.random() * 14 + 10, opacity: Math.random() * 0.35 + 0.1 },
      star: { content: '✦', size: Math.random() * 10 + 8, opacity: Math.random() * 0.4 + 0.15 },
      dot: { content: '•', size: Math.random() * 6 + 4, opacity: Math.random() * 0.5 + 0.2 },
      sparkle: { content: '✧', size: Math.random() * 12 + 8, opacity: Math.random() * 0.35 + 0.1 },
    };

    const config = configs[type] || configs.dot;

    const particleData = {
      element: particle,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: -(Math.random() * 0.15 + 0.05),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.2,
      scale: 1,
      scaleSpeed: Math.random() * 0.005,
      scaleDirection: 1,
      opacity: config.opacity,
      opacityBase: config.opacity,
      type,
    };

    particle.textContent = config.content;
    particle.style.cssText = `
      position: absolute;
      left: ${particleData.x}%;
      top: ${particleData.y}%;
      font-size: ${config.size}px;
      opacity: ${config.opacity};
      color: #9CAF88;
      pointer-events: none;
      will-change: transform, opacity;
      filter: ${type === 'dot' ? 'blur(0.5px)' : 'none'};
    `;

    this._elements.particlesContainer.appendChild(particle);
    this._particles.push(particleData);
  },

  _animateParticles() {
    const animate = () => {
      this._particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.scale += p.scaleSpeed * p.scaleDirection;
        
        if (p.scale > 1.2 || p.scale < 0.8) {
          p.scaleDirection *= -1;
        }

        if (p.y < -5) {
          p.y = 105;
          p.x = Math.random() * 100;
        }
        if (p.x < -5) p.x = 105;
        if (p.x > 105) p.x = -5;

        const opacityVariation = Math.sin(Date.now() * 0.001 + p.x) * 0.15;
        const currentOpacity = Math.max(0, Math.min(1, p.opacityBase + opacityVariation));

        p.element.style.transform = `rotate(${p.rotation}deg) scale(${p.scale})`;
        p.element.style.left = `${p.x}%`;
        p.element.style.top = `${p.y}%`;
        p.element.style.opacity = currentOpacity;
      });

      this._animationFrameId = requestAnimationFrame(animate);
    };

    this._animationFrameId = requestAnimationFrame(animate);
  },
};

// ─── Style de l'animation ripple injecté dynamiquement ──
(() => {
  if (document.getElementById('hero-ripple-style')) return;
  const style = document.createElement('style');
  style.id = 'hero-ripple-style';
  style.textContent = `
    @keyframes hero-ripple {
      to {
        transform: scale(2.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
})();

export default Hero;