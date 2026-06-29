/**
 * app.js — Point d'entrée principal de l'application
 * * Mariage Laetitia & Alexandre — 8 mai 2027
 * Domaine de la Scie du May
 */

// ──────────────────────────────────────────────
// Imports des modules
// ──────────────────────────────────────────────
import Store from './store.js';
import Router from './utils/router.js';
import Animations from './utils/animations.js';

import Hero from './components/hero.js';
import RSVP from './components/rsvp.js';
import MapComponent from './components/map.js';
import Carpool from './components/carpool.js';
import GuestProfile from './components/guestProfile.js';
import AdminDashboard from './components/adminDashboard.js'; // S'assurer que le nom sur le disque est identique

// ──────────────────────────────────────────────
// Définition des routes de l'application
// ──────────────────────────────────────────────
const ROUTES = {
  '#/': 'page-home',
  '#/rsvp': 'page-rsvp',
  '#/hebergements': 'page-hebergements',
  '#/covoiturage': 'page-covoiturage',
  '#/mes-reponses': 'page-mes-reponses',
  '#/admin': 'page-admin',
  '#/admin/dashboard': 'page-admin-dashboard'
};

// ──────────────────────────────────────────────
// Initialisation au chargement du DOM
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  💍 Mariage Laetitia & Alexandre         ║');
  console.log('║  📅 8 mai 2027                           ║');
  console.log('║  📍 Domaine de la Scie du May            ║');
  console.log('╚══════════════════════════════════════════╝');

  // ── 1. Initialiser le Store ──
  Store.init();

  // ── 2. Initialiser le Router avec les routes ──
  Router.init(ROUTES);

  // ── 3. Initialiser tous les composants disponibles ──
  initComponents();

  // ── 4. Activer les animations au scroll ──
  Animations.initScrollAnimations();

  // ── 5. Configurer le menu hamburger mobile ──
  initMobileMenu();

  // ── 6. Écouter les changements de route ──
  window.addEventListener('route-changed', handleRouteChange);

  // ── 7. Exposer pour le debug ──
  window.Store = Store;
  window.Router = Router;
  window.Animations = Animations;

  console.log('[App] Application initialisée avec succès.');
});

// ──────────────────────────────────────────────
// Initialisation des composants
// ──────────────────────────────────────────────

function initComponents() {
  const components = [
    { name: 'Hero', module: Hero },
    { name: 'RSVP', module: RSVP },
    { name: 'MapComponent', module: MapComponent },
    { name: 'Carpool', module: Carpool },
    { name: 'GuestProfile', module: GuestProfile },
    { name: 'AdminDashboard', module: AdminDashboard }
  ];

  components.forEach(({ name, module }) => {
    if (module && typeof module.init === 'function') {
      try {
        module.init();
        console.log(`[App] Composant ${name} initialisé.`);
      } catch (e) {
        console.error(`[App] Erreur lors de l'initialisation de ${name} :`, e);
      }
    }
  });
}

// ──────────────────────────────────────────────
// Menu hamburger mobile
// ──────────────────────────────────────────────

function initMobileMenu() {
  const hamburger = document.querySelector('.nav__hamburger');
  const navMenu = document.querySelector('.nav__links');

  if (!hamburger || !navMenu) {
    console.warn('[App] Éléments du menu mobile introuvables.');
    return;
  }

  hamburger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.classList.toggle('menu-open', isOpen);
  });

  navMenu.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });
  });
}

// ──────────────────────────────────────────────
// Gestion des changements de route
// ──────────────────────────────────────────────

function handleRouteChange(event) {
  const { route, pageId } = event.detail;

  // ── Protection de la route admin/dashboard ──
  if (route === '#/admin/dashboard' && !Store.isAdmin()) {
    console.warn('[App] Accès admin/dashboard non autorisé. Redirection vers #/admin.');
    setTimeout(() => {
      Router.navigate('#/admin');
    }, 50);
    return;
  }

  // ── Invalider la carte Leaflet quand elle devient visible ──
  if (route === '#/hebergements' && MapComponent && typeof MapComponent.invalidateSize === 'function') {
    setTimeout(() => {
      MapComponent.invalidateSize();
    }, 200);
  }

  // ── Réinitialiser les animations au scroll ──
  setTimeout(() => {
    Animations.initScrollAnimations();
  }, 100);

  // ── Rafraîchir le profil invité si nécessaire ──
  if (route === '#/mes-reponses' && GuestProfile && typeof GuestProfile.refresh === 'function') {
    GuestProfile.refresh();
  }

  // ── RECOUPEMENT : Rafraîchir le dashboard avec la bonne méthode ──
  if (route === '#/admin/dashboard' && AdminDashboard) {
    if (typeof AdminDashboard.renderDashboard === 'function') {
      AdminDashboard.renderDashboard();
    } else if (typeof AdminDashboard.refresh === 'function') {
      AdminDashboard.refresh();
    }
  }
}