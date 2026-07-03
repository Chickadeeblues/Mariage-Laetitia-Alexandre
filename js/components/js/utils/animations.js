/**
 * animations.js — Module d'animations et notifications
 * 
 * Fournit des utilitaires d'animation pour l'application :
 *  - Animations au scroll (IntersectionObserver)
 *  - Fade-in et slide-up avec délai
 *  - Animation en cascade des éléments enfants
 *  - Notifications toast dynamiques
 */

const Animations = {

  // ════════════════════════════════════════════
  // Animations au scroll (IntersectionObserver)
  // ════════════════════════════════════════════

  /**
   * Initialise un IntersectionObserver qui ajoute la classe 'visible'
   * aux éléments portant '.animate-on-scroll' lorsqu'ils entrent dans le viewport.
   * 
   * Les éléments déjà visibles au chargement sont traités immédiatement.
   * L'observation cesse pour chaque élément après sa première apparition.
   */
  initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Ajouter la classe pour déclencher l'animation CSS
            entry.target.classList.add('visible');
            // Ne plus observer cet élément (animation unique)
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // Déclencher quand 15% de l'élément est visible
        threshold: 0.15,
        // Marge négative pour anticiper l'entrée dans le viewport
        rootMargin: '0px 0px -50px 0px'
      }
    );

    elements.forEach((el) => observer.observe(el));

    console.log(`[Animations] IntersectionObserver initialisé pour ${elements.length} éléments.`);
  },

  // ════════════════════════════════════════════
  // Animations individuelles
  // ════════════════════════════════════════════

  /**
   * Anime un élément en fade-in (opacité 0 → 1)
   * @param {HTMLElement} element — L'élément à animer
   * @param {number} [delay=0] — Délai en millisecondes avant le démarrage
   */
  fadeIn(element, delay = 0) {
    if (!element) return;

    // État initial : invisible
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.6s ease-out';

    setTimeout(() => {
      element.style.opacity = '1';
    }, delay);
  },

  /**
   * Anime un élément en slide-up (translation Y + fade-in)
   * @param {HTMLElement} element — L'élément à animer
   * @param {number} [delay=0] — Délai en millisecondes avant le démarrage
   */
  slideUp(element, delay = 0) {
    if (!element) return;

    // État initial : décalé vers le bas et invisible
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  },

  /**
   * Anime les éléments enfants avec un délai croissant (effet cascade)
   * Chaque enfant apparaît légèrement après le précédent.
   * 
   * @param {HTMLElement} parent — Le conteneur parent
   * @param {string} selector — Sélecteur CSS des enfants à animer
   * @param {number} [baseDelay=100] — Délai entre chaque enfant (ms)
   */
  staggerChildren(parent, selector, baseDelay = 100) {
    if (!parent) return;

    const children = parent.querySelectorAll(selector);

    children.forEach((child, index) => {
      // État initial : invisible et décalé
      child.style.opacity = '0';
      child.style.transform = 'translateY(20px)';
      child.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';

      // Animation avec délai progressif
      setTimeout(() => {
        child.style.opacity = '1';
        child.style.transform = 'translateY(0)';
      }, index * baseDelay);
    });
  },

  // ════════════════════════════════════════════
  // Notifications Toast
  // ════════════════════════════════════════════

  /**
   * Affiche une notification toast temporaire
   * 
   * Crée dynamiquement un élément toast, l'ajoute au DOM,
   * puis le retire automatiquement après la durée spécifiée.
   * 
   * @param {string} message — Le message à afficher
   * @param {string} [type='success'] — Type de toast : 'success', 'error', 'warning', 'info'
   * @param {number} [duration=3000] — Durée d'affichage en millisecondes
   */
  showToast(message, type = 'success', duration = 3000) {
    // ── Créer ou récupérer le conteneur de toasts ──
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    // ── Icônes par type ──
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    // ── Créer l'élément toast ──
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <span class="toast__message">${message}</span>
      <button class="toast__close" aria-label="Fermer la notification">&times;</button>
    `;

    // ── Bouton de fermeture manuelle ──
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => {
      this._removeToast(toast);
    });

    // ── Ajouter au conteneur ──
    container.appendChild(toast);

    // ── Déclencher l'animation d'entrée ──
    // requestAnimationFrame garantit que le navigateur a rendu le toast
    // avant de lancer la transition CSS
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
      });
    });

    // ── Retirer automatiquement après la durée ──
    setTimeout(() => {
      this._removeToast(toast);
    }, duration);
  },

  /**
   * Retire un toast du DOM avec animation de sortie
   * @param {HTMLElement} toast — L'élément toast à retirer
   * @private
   */
  _removeToast(toast) {
    if (!toast || !toast.parentNode) return;

    // Animation de sortie
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hiding');

    // Retirer du DOM après la fin de l'animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }

      // Nettoyer le conteneur s'il est vide
      const container = document.getElementById('toast-container');
      if (container && container.children.length === 0) {
        container.remove();
      }
    }, 400); // Correspond à la durée de l'animation CSS de sortie
  }
};

export default Animations;
