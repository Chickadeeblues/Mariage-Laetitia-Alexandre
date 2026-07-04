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

    // 1. Injection des styles CSS (Layout centré unifié, Playfair Display, Vert Sauge)
    this._injectCustomStyles();

    // 2. Restructuration du DOM (Prénoms, Bouton en gras, Émojis droits)
    this._restructureHeroDOM();

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

    // 4. Harmonisation des boutons & Modification "Répondre à l'invitation" en gras
    if (actionsEl) {
      const buttons = actionsEl.querySelectorAll('a');
      buttons.forEach((btn, index) => {
        btn.removeAttribute('style');
        btn.className = `hero-btn-standard hero-btn--sage-${index + 1}`;

        const href = btn.getAttribute('href') || '';
        if (index === 0 || href.includes('rsvp')) {
          btn.textContent = "Répondre à l'invitation";
          btn.classList.add('hero-btn--bold');
        }
      });
    }
  },

  /**
   * Injecte dynamiquement Playfair Display et le layout unifié en 1 colonne.
   */
  _injectCustomStyles() {
    if (document.getElementById('hero-custom-design-styles')) return;

    const style = document.createElement('style');
    style.id = 'hero-custom-design-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap');

      /* 0. Correction garantie pour le logo de l'entête (.nav__logo) : Playfair Display */
      .nav__logo, header .logo, .nav__brand, .navbar__brand, .header__brand, .brand, .nav-logo {
        font-family: 'Playfair Display', serif !important;
        font-weight: 600 !important;
        font-size: 1.6rem !important;
        letter-spacing: 0.02em;
        color: var(--forest, #2D5A3D) !important;
        text-decoration: none !important;
        font-style: normal !important;
      }

      /* 1. Fond blanc cassé lumineux — Conteneur parfaitement centré */
      #page-home {
        background-color: #FDFCF7 !important;
        color: #2C2C2C;
        min-height: calc(100vh - 70px);
        width: 100% !important;
        display: flex !important;
        justify-content: center;
        align-items: center;
        padding: 20px 15px !important;
        box-sizing: border-box !important;
      }

      .hero, .hero-section {
        background-color: transparent !important;
        width: 100% !important;
        max-width: 580px !important; /* Respecte strictement le CSS natif */
        margin: 0 auto !important;
        padding: 10px 0 !important;
        display: flex !important;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      /* 2. Prénoms et Esperluette (Playfair Display) proportionnés */
      .hero__title {
        margin: 5px 0 10px 0 !important;
        text-align: center;
        width: 100%;
      }
      .hero__names {
        display: flex !important;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 0.95;
      }
      .hero-name-stacked {
        font-family: 'Playfair Display', serif !important;
        font-size: clamp(2.4rem, 6vw, 3.6rem) !important;
        font-weight: 500;
        color: #3F4B34; /* Vert sauge profond */
        text-shadow: 0 2px 10px rgba(63, 75, 52, 0.05);
      }
      .hero-ampersand-stacked {
        font-family: 'Playfair Display', serif !important;
        font-size: clamp(1.8rem, 4vw, 2.4rem) !important;
        color: #8A9A76; /* Vert sauge intermédiaire */
        font-style: italic;
        margin: 4px 0;
      }

      /* 3. Layout UNIFIÉ (1 seule colonne centrée PC & Mobile) pour éviter tout conflit */
      .hero__body-split {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 20px !important;
        width: 100% !important;
        max-width: 480px !important;
        margin: 15px auto 0 !important;
        text-align: center !important;
      }

      .hero__details {
        text-align: center !important;
        margin: 0 !important;
        width: 100% !important;
        font-size: 1.05rem;
        line-height: 1.5;
      }

      /* 4. Boutons Vert Sauge : Même format, sur une seule ligne (nowrap) */
      .hero__actions {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 12px !important;
        width: 100% !important;
        max-width: 320px !important;
        margin: 0 auto !important;
      }
      
      .hero-btn-standard {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        width: 100% !important;
        padding: 13px 24px !important;
        font-family: var(--font-body, 'Outfit', sans-serif) !important;
        font-size: 0.95rem !important;
        font-weight: 500 !important;
        text-decoration: none !important;
        white-space: nowrap !important; /* Empêche strictement le retour à la ligne */
        border-radius: 6px !important;
        transition: all 0.25s ease !important;
        box-shadow: 0 4px 12px rgba(63, 75, 52, 0.08) !important;
        cursor: pointer;
        text-align: center;
        box-sizing: border-box;
        letter-spacing: 0.02em;
      }

      /* Bouton "Répondre à l'invitation" en gras */
      .hero-btn--bold {
        font-weight: 700 !important;
        letter-spacing: 0.03em;
      }

      /* Nuances harmonieuses de Vert Sauge */
      .hero-btn--sage-1 {
        background-color: #7A8B69 !important; /* Sauge soutenu */
        color: #FFFFFF !important;
        border: 1.5px solid #7A8B69 !important;
      }
      .hero-btn--sage-2 {
        background-color: #DCE2D5 !important; /* Sauge pastel doux */
        color: #3F4B34 !important;
        border: 1.5px solid #C8D1BE !important;
      }
      .hero-btn--sage-3 {
        background-color: #FFFFFF !important;
        color: #5E6E4E !important;
        border: 1.5px solid #9CAF88 !important; /* Bordure sauge */
      }

      /* Effet au survol délicat */
      .hero-btn-standard:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 16px rgba(63, 75, 52, 0.16) !important;
      }
      .hero-btn--sage-1:hover {
        background-color: #6B7B5A !important;
      }
      .hero-btn--sage-2:hover {
        background-color: #CFD7C6 !important;
      }
      .hero-btn--sage-3:hover {
        background-color: #F4F6F1 !important;
      }
    `;
    document.head.appendChild(style);
  },

  // ─── ANIMATIONS D'ENTRÉE ──────────────────────────────

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