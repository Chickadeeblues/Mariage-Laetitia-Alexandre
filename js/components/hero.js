/**
 * ============================================================
 * Composant Hero — Page d'accueil du site mariage
 * ============================================================
 * * Gère l'interactivité et la mise en page avancée de la section hero :
 * - Injection de styles personnalisés (Island Moments, layout, boutons)
 * - Restructuration du DOM pour la disposition des prénoms et du responsive
 * - Animations d'entrée (fade-in échelonnés)
 * - Effet parallaxe subtil au scroll
 * - Particules dorées flottantes décoratives
 * - Listeners sur les boutons CTA
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
   * Appelé quand la page d'accueil devient visible.
   */
  init() {
    this._elements.page = document.getElementById('page-home');
    if (!this._elements.page) return;

    this._elements.heroSection = this._elements.page.querySelector('.hero-section') 
      || this._elements.page.querySelector('.hero') 
      || this._elements.page;

    // 1. Injection des styles CSS esthétiques et de la police Google
    this._injectCustomStyles();

    // 2. Restructuration du DOM (prénoms, boutons harmonisés, layout responsive PC/Mobile)
    this._restructureHeroDOM();

    // 3. Lancement des animations et listeners
    this._animateEntrance();
    this._attachCTAListeners();
    this._initParallax();
    this._createParticles();
  },

  /**
   * Nettoie les listeners et animations.
   * Appelé quand on quitte la page.
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

  /**
   * Modifie la structure HTML pour superposer les prénoms,
   * harmoniser les boutons et permettre le layout côte à côte sur PC.
   */
  _restructureHeroDOM() {
    const hero = this._elements.heroSection;

    // 1. Superposition et formatage des prénoms avec Island Moments
    const namesEl = hero.querySelector('.hero__names');
    if (namesEl && !namesEl.dataset.restructured) {
      namesEl.innerHTML = `
        <span class="hero-name-stacked">Laetitia</span>
        <span class="hero-ampersand-stacked">&amp;</span>
        <span class="hero-name-stacked">Alexandre</span>
      `;
      namesEl.dataset.restructured = "true";
    }

    // 2. Restructuration pour le responsive (Détails à gauche, Boutons à droite sur PC)
    const detailsEl = hero.querySelector('.hero__details');
    const actionsEl = hero.querySelector('.hero__actions');

    if (detailsEl && actionsEl && !hero.querySelector('.hero__body-split')) {
      // Nettoyage des styles inline qui bloquent le responsive
      actionsEl.removeAttribute('style');
      const innerActionDiv = actionsEl.querySelector('div');
      if (innerActionDiv) innerActionDiv.removeAttribute('style');

      // Création du conteneur flexible Split
      const splitContainer = document.createElement('div');
      splitContainer.className = 'hero__body-split animate-on-scroll';
      
      // Insertion dans le DOM
      hero.insertBefore(splitContainer, detailsEl);
      splitContainer.appendChild(detailsEl);
      splitContainer.appendChild(actionsEl);
    }

    // 3. Harmonisation totale des 3 boutons (format et relief identiques)
    if (actionsEl) {
      const buttons = actionsEl.querySelectorAll('a');
      buttons.forEach((btn, index) => {
        btn.removeAttribute('style'); // Enlève les anciens paddings/font-sizes disparates
        btn.className = `hero-btn-standard hero-btn--color-${index + 1}`;
      });
    }
  },

  /**
   * Injecte dynamiquement la police Island Moments et les règles CSS du nouveau design.
   */
  _injectCustomStyles() {
    if (document.getElementById('hero-custom-design-styles')) return;

    const style = document.createElement('style');
    style.id = 'hero-custom-design-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Island+Moments&display=swap');

      /* 1. Code couleur : Blanc cassé moins crème pour le Hero */
      #page-home, .hero {
        background-color: #FDFCF7 !important;
        color: var(--text-dark, #2C2C2C);
      }

      /* 2. Superposition et centrage des prénoms (Island Moments) */
      .hero__title {
        margin: 20px 0 !important;
      }
      .hero__names {
        display: flex !important;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 0.85;
      }
      .hero-name-stacked {
        font-family: 'Island Moments', cursive !important;
        font-size: clamp(4.5rem, 10vw, 7.5rem);
        font-weight: 400;
        color: var(--forest, #2D5A3D);
        text-shadow: 0 2px 10px rgba(45, 90, 61, 0.08);
      }
      .hero-ampersand-stacked {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: clamp(1.8rem, 4vw, 2.8rem);
        color: var(--gold, #C9A84C);
        font-style: italic;
        margin: 5px 0;
      }

      /* 3. Layout Responsive : Emploi de l'espace PC vs Mobile */
      .hero__body-split {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 35px;
        width: 100%;
        max-width: 1000px;
        margin: 30px auto 0;
        padding: 0 15px;
        box-sizing: border-box;
      }

      /* Sur grand écran (≥ 900px) : Détails à gauche, Boutons à droite */
      @media (min-width: 900px) {
        .hero__body-split {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0 40px;
          margin-top: 40px;
        }
        .hero__details {
          text-align: left !important;
          margin: 0 !important;
          flex: 1;
        }
        .hero__actions {
          align-items: flex-end !important;
          flex: 1;
          max-width: 340px !important;
        }
      }

      /* 4. Harmonisation des boutons (Même format, même relief) */
      .hero__actions {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
        width: 100%;
        max-width: 320px;
      }
      .hero-btn-standard {
        display: flex !important;
        align-items: center;
        justify-content: center;
        width: 100% !important;
        padding: 16px 28px !important;
        font-family: var(--font-body, 'Outfit', sans-serif) !important;
        font-size: 1rem !important;
        font-weight: 500 !important;
        text-decoration: none !important;
        border-radius: var(--radius-sm, 8px) !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        box-shadow: 0 6px 16px rgba(45, 90, 61, 0.12) !important;
        cursor: pointer;
        text-align: center;
        box-sizing: border-box;
        letter-spacing: 0.02em;
      }

      /* Couleurs distinctes mais structure et relief strictement identiques */
      .hero-btn--color-1 {
        background-color: var(--forest, #2D5A3D) !important;
        color: var(--white, #FFFFFF) !important;
        border: 2px solid var(--forest, #2D5A3D) !important;
      }
      .hero-btn--color-2 {
        background-color: var(--gold, #C9A84C) !important;
        color: var(--white, #FFFFFF) !important;
        border: 2px solid var(--gold, #C9A84C) !important;
      }
      .hero-btn--color-3 {
        background-color: var(--white, #FFFFFF) !important;
        color: var(--forest, #2D5A3D) !important;
        border: 2px solid var(--sage, #9CAF88) !important;
      }

      /* Effet au survol (Relief accentué) */
      .hero-btn-standard:hover {
        transform: translateY(-3px) !important;
        box-shadow: 0 10px 22px rgba(45, 90, 61, 0.22) !important;
      }
      .hero-btn--color-3:hover {
        background-color: var(--cream, #FAF8F5) !important;
      }
    `;
    document.head.appendChild(style);
  },

  // ─── ANIMATIONS D'ENTRÉE ──────────────────────────────

  /**
   * Applique un fade-in échelonné sur les éléments du hero.
   */
  _animateEntrance() {
    const selectors = [
      '.hero__prelude',
      '.hero__names',
      '.hero__body-split',
      '.hero__details',
      '.hero__actions',
      '.scroll-indicator'
    ];

    let delay = 0;
    const baseDelay = 150;

    selectors.forEach((selector) => {
      const elements = this._elements.heroSection.querySelectorAll(selector);
      elements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, 
                               transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

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
      background: rgba(201, 168, 76, 0.3);
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

      // Translation parallaxe uniquement — PAS de modification d'opacité
      heroContent.style.transform = `translateY(${scrollY * 0.2}px)`;

      if (this._elements.particlesContainer) {
        this._elements.particlesContainer.style.transform = `translateY(${scrollY * 0.1}px)`;
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

    const particleCount = Math.min(25, Math.floor(window.innerWidth / 60));
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
      leaf: { content: '🌿', size: Math.random() * 16 + 10, opacity: Math.random() * 0.4 + 0.1 },
      star: { content: '✦', size: Math.random() * 12 + 8, opacity: Math.random() * 0.5 + 0.2 },
      dot: { content: '•', size: Math.random() * 8 + 4, opacity: Math.random() * 0.6 + 0.2 },
      sparkle: { content: '✧', size: Math.random() * 14 + 8, opacity: Math.random() * 0.4 + 0.15 },
    };

    const config = configs[type] || configs.dot;

    const particleData = {
      element: particle,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -(Math.random() * 0.2 + 0.05),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
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
      color: #C9A84C;
      pointer-events: none;
      will-change: transform, opacity;
      filter: ${type === 'dot' ? 'blur(0.5px)' : 'none'};
      text-shadow: ${type === 'star' || type === 'sparkle' ? '0 0 6px rgba(201, 168, 76, 0.4)' : 'none'};
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