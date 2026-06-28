/**
 * ============================================================
 * Composant Hero — Page d'accueil du site mariage
 * ============================================================
 * 
 * Gère l'interactivité de la section hero :
 *   - Animations d'entrée (fade-in échelonnés)
 *   - Effet parallaxe subtil au scroll
 *   - Particules dorées flottantes décoratives
 *   - Listeners sur les boutons CTA
 * 
 * Le contenu HTML est déjà présent dans index.html.
 * Ce composant ajoute uniquement l'interactivité.
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
    // Retirer le conteneur de particules
    if (this._elements.particlesContainer) {
      this._elements.particlesContainer.remove();
      this._elements.particlesContainer = null;
    }
    this._particles = [];
  },

  // ─── ANIMATIONS D'ENTRÉE ──────────────────────────────

  /**
   * Applique un fade-in échelonné sur les éléments du hero.
   * Cible les titres, sous-titres, badges de date et CTAs.
   */
  _animateEntrance() {
    const selectors = [
      '.hero-ornament-top',
      '.hero-title, h1',
      '.hero-subtitle, .hero-names',
      '.hero-date, .date-badge',
      '.hero-venue, .venue-info',
      '.hero-cta, .cta-group, .hero-buttons',
      '.hero-ornament-bottom',
      '.scroll-indicator'
    ];

    let delay = 0;
    const baseDelay = 150;

    selectors.forEach((selector) => {
      const elements = this._elements.heroSection.querySelectorAll(selector);
      elements.forEach((el) => {
        // Préparer l'élément pour l'animation
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, 
                               transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

        // Déclencher l'animation au prochain frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        });

        delay += baseDelay;
      });
    });

    // Utiliser aussi l'API Animations si disponible
    if (Animations && Animations.staggerChildren) {
      Animations.staggerChildren(this._elements.heroSection, '.hero-feature, .feature-card', 100);
    }
  },

  // ─── LISTENERS CTA ────────────────────────────────────

  /**
   * Attache les listeners aux boutons d'appel à l'action.
   * Intercepte les clics pour utiliser le Router SPA.
   */
  _attachCTAListeners() {
    const ctaLinks = this._elements.page.querySelectorAll('a[href*="#/"]');

    ctaLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#/')) {
          e.preventDefault();
          // Petit effet de ripple sur le bouton
          this._rippleEffect(link, e);
          // Navigation avec un léger délai pour voir l'animation
          setTimeout(() => {
            Router.navigate(href);
          }, 300);
        }
      });
    });

    // Listener spécifique pour le scroll indicator
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

  /**
   * Crée un effet ripple au clic sur un bouton.
   * @param {HTMLElement} element - L'élément cliqué
   * @param {MouseEvent} event - L'événement de clic
   */
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

    // S'assurer que le parent est positionné
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

  /**
   * Initialise un effet de parallaxe subtil au scroll.
   * Le fond du hero se déplace plus lentement que le contenu.
   */
  _initParallax() {
    const heroContent = this._elements.heroSection.querySelector('.hero-content') 
      || this._elements.heroSection;

    this._scrollHandler = () => {
      const scrollY = window.scrollY;
      const heroHeight = this._elements.heroSection.offsetHeight;

      // Ne traiter que quand la section est visible
      if (scrollY > heroHeight * 1.5) return;

      const parallaxSpeed = 0.3;
      const opacity = Math.max(0, 1 - scrollY / (heroHeight * 0.8));

      // Déplacement parallaxe du contenu
      heroContent.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
      heroContent.style.opacity = opacity;

      // Déplacer les particules avec un autre facteur
      if (this._elements.particlesContainer) {
        this._elements.particlesContainer.style.transform = `translateY(${scrollY * 0.15}px)`;
      }
    };

    window.addEventListener('scroll', this._scrollHandler, { passive: true });
  },

  // ─── PARTICULES DÉCORATIVES ───────────────────────────

  /**
   * Crée un système de particules dorées flottantes.
   * Les particules sont des petits éléments qui flottent doucement.
   */
  _createParticles() {
    // Créer le conteneur de particules
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

    // S'assurer que le hero est positionné relativement
    this._elements.heroSection.style.position = 'relative';
    this._elements.heroSection.appendChild(this._elements.particlesContainer);

    // Nombre de particules adapté à la taille de l'écran
    const particleCount = Math.min(25, Math.floor(window.innerWidth / 60));

    // Types de particules : feuilles, étoiles, points dorés
    const particleTypes = ['leaf', 'star', 'dot', 'sparkle'];

    for (let i = 0; i < particleCount; i++) {
      this._createParticle(particleTypes[i % particleTypes.length]);
    }

    // Démarrer l'animation
    this._animateParticles();

    // Recalculer au resize
    this._resizeHandler = () => {
      // On ne recrée pas les particules, on adapte juste
    };
    window.addEventListener('resize', this._resizeHandler, { passive: true });
  },

  /**
   * Crée une particule individuelle.
   * @param {string} type - Type de particule (leaf, star, dot, sparkle)
   */
  _createParticle(type) {
    const particle = document.createElement('div');
    const heroRect = this._elements.heroSection.getBoundingClientRect();

    // Configuration selon le type
    const configs = {
      leaf: {
        content: '🌿',
        size: Math.random() * 16 + 10,
        opacity: Math.random() * 0.4 + 0.1,
      },
      star: {
        content: '✦',
        size: Math.random() * 12 + 8,
        opacity: Math.random() * 0.5 + 0.2,
      },
      dot: {
        content: '•',
        size: Math.random() * 8 + 4,
        opacity: Math.random() * 0.6 + 0.2,
      },
      sparkle: {
        content: '✧',
        size: Math.random() * 14 + 8,
        opacity: Math.random() * 0.4 + 0.15,
      },
    };

    const config = configs[type] || configs.dot;

    const particleData = {
      element: particle,
      x: Math.random() * 100, // position en %
      y: Math.random() * 100,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -(Math.random() * 0.2 + 0.05), // Monte lentement
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

  /**
   * Boucle d'animation des particules.
   * Utilise requestAnimationFrame pour des animations fluides.
   */
  _animateParticles() {
    const animate = () => {
      this._particles.forEach((p) => {
        // Mouvement
        p.x += p.speedX;
        p.y += p.speedY;

        // Rotation
        p.rotation += p.rotationSpeed;

        // Pulsation d'échelle
        p.scale += p.scaleSpeed * p.scaleDirection;
        if (p.scale > 1.2 || p.scale < 0.8) {
          p.scaleDirection *= -1;
        }

        // Rebouclage quand la particule sort de l'écran
        if (p.y < -5) {
          p.y = 105;
          p.x = Math.random() * 100;
        }
        if (p.x < -5) p.x = 105;
        if (p.x > 105) p.x = -5;

        // Variation subtile de l'opacité
        const opacityVariation = Math.sin(Date.now() * 0.001 + p.x) * 0.15;
        const currentOpacity = Math.max(0, Math.min(1, p.opacityBase + opacityVariation));

        // Appliquer les transformations
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
