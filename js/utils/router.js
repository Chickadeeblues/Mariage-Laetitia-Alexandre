/**
 * router.js — Routeur SPA basé sur le hash
 * 
 * Gère la navigation entre les pages de l'application
 * en utilisant le hash de l'URL (ex: #/rsvp, #/map).
 * 
 * Fonctionnalités :
 *  - Navigation par hash avec fallback sur la page d'accueil
 *  - Mise à jour de l'état actif des liens de navigation
 *  - Fermeture automatique du menu mobile lors de la navigation
 *  - Émission d'événements custom 'route-changed'
 *  - Scroll automatique en haut de page après navigation
 */

const Router = {
  /** @type {Object.<string, string>} Table de correspondance hash → ID de page */
  routes: {},

  /** @type {string|null} Route actuellement affichée */
  currentRoute: null,

  /**
   * Initialise le routeur avec les routes définies
   * @param {Object.<string, string>} routes — Mapping hash → pageId
   *   Ex: { '#/': 'page-home', '#/rsvp': 'page-rsvp' }
   */
  init(routes) {
    this.routes = routes;

    // Écouter les changements de hash
    window.addEventListener('hashchange', () => this.handleRoute());

    // Traiter la route initiale au chargement
    this.handleRoute();

    console.log('[Router] Initialisé avec les routes :', Object.keys(routes).join(', '));
  },

  /**
   * Traite la route courante :
   *  1. Masque toutes les pages
   *  2. Affiche la page correspondant au hash
   *  3. Met à jour la navigation active
   *  4. Ferme le menu mobile si ouvert
   *  5. Émet l'événement 'route-changed'
   */
  handleRoute() {
    const hash = window.location.hash || '#/';
    const pageId = this.routes[hash];

    // ── Masquer toutes les pages ──
    document.querySelectorAll('.page').forEach((p) => {
      p.classList.remove('active');
    });

    // ── Afficher la page correspondante ──
    if (pageId) {
      const page = document.getElementById(pageId);
      if (page) {
        page.classList.add('active');
      }
    } else {
      // Route inconnue → afficher la page d'accueil par défaut
      const home = document.getElementById(this.routes['#/'] || 'page-home');
      if (home) {
        home.classList.add('active');
      }
    }

    // ── Scroll en haut de page ──
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ── Mettre à jour la route courante ──
    this.currentRoute = hash;

    // ── Fermer le menu mobile (si ouvert) ──
    this._closeMobileMenu();

    // ── Émettre l'événement de changement de route ──
    window.dispatchEvent(
      new CustomEvent('route-changed', {
        detail: { route: hash, pageId }
      })
    );

    // ── Mettre à jour l'état actif des liens de navigation ──
    this._updateNavActiveState(hash);

    console.log(`[Router] Navigation vers : ${hash} → ${pageId || 'page-home (défaut)'}`);
  },

  /**
   * Navigue vers une route donnée en changeant le hash
   * @param {string} hash — Hash de destination (ex: '#/rsvp')
   */
  navigate(hash) {
    window.location.hash = hash;
  },

  /**
   * Retourne la route actuellement affichée
   * @returns {string|null} Le hash de la route courante
   */
  getCurrentRoute() {
    return this.currentRoute;
  },

  // ════════════════════════════════════════════
  // Méthodes internes
  // ════════════════════════════════════════════

  /**
   * Met à jour la classe 'active' sur les liens de navigation
   * @param {string} currentHash — Le hash courant
   * @private
   */
  _updateNavActiveState(currentHash) {
    document.querySelectorAll('.nav__link').forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === currentHash);
    });
  },

  /**
   * Ferme le menu mobile en retirant la classe 'open'
   * du conteneur de navigation et du bouton hamburger
   * @private
   */
  _closeMobileMenu() {
    // Fermer le menu de navigation mobile
    const navMenu = document.querySelector('.nav__menu');
    if (navMenu) {
      navMenu.classList.remove('open');
    }

    // Réinitialiser l'état du bouton hamburger
    const hamburger = document.querySelector('.nav__hamburger');
    if (hamburger) {
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    // Retirer le blocage du scroll sur le body
    document.body.classList.remove('menu-open');
  }
};

export default Router;
