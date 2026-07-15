/**
 * app.js — Point d'entrée principal de l'application
 * Mariage Laetitia & Alexandre — 8 mai 2027
 * Domaine de la Scie du May
 */

// ──────────────────────────────────────────────
// Imports des modules
// ──────────────────────────────────────────────
import Store from './store.js';
import Router from './utils/router.js';
import Animations from './utils/animations.js';
import I18n from './utils/i18n.js';

import Hero from './components/hero.js';
import RSVP from './components/rsvp.js';
import MapComponent from './components/map.js';
import Carpool from './components/carpool.js';
import GuestProfile from './components/guestProfile.js';
import InfoHub    from './components/infoHub.js';
import HowToGet   from './components/howToGet.js';
import InfoPages  from './components/infoPages.js';
import FAQ from './components/faq.js';
import AdminDashboard from './components/adminDashboard.js';

// ──────────────────────────────────────────────
// Définition des routes de l'application
// ──────────────────────────────────────────────
const ROUTES = {
  '#/': 'page-home',
  '#/rsvp': 'page-rsvp',
  '#/infos':            'page-infos',
  '#/infos/messe':      'page-infos-messe',
  '#/infos/animations': 'page-infos-animations',
  '#/infos/contacts':   'page-infos-contacts',
  '#/comment-venir':    'page-comment-venir',
  '#/liste':            'page-liste',
  '#/hebergements':     'page-hebergements',
  '#/covoiturage':      'page-covoiturage',
  '#/mes-reponses':     'page-mes-reponses',
  '#/admin':            'page-admin',
  '#/faq':              'page-faq',
  '#/admin/dashboard':  'page-admin-dashboard'
};

// ──────────────────────────────────────────────
// Initialisation au chargement du DOM
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  💍 Mariage Laetitia & Alexandre         ║');
  console.log('║  📅 8 mai 2027                           ║');
  console.log('║  📍 Domaine de la Scie du May            ║');
  console.log('╚══════════════════════════════════════════╝');
  await Store.init();
  
  // Rendre i18n global pour les boutons onClick et l'initialiser
  window.I18n = I18n;
  I18n.init();

  Router.init(ROUTES);
  await initComponents();
  
  Animations.initScrollAnimations();
  initMobileMenu();
  initDropdowns();
  window.addEventListener('route-changed', handleRouteChange);
});

async function initComponents() {
  const components = [
    { name: 'Hero',           module: Hero },
    { name: 'RSVP',           module: RSVP },
    { name: 'MapComponent',   module: MapComponent },
    { name: 'Carpool',        module: Carpool },
    { name: 'GuestProfile',   module: GuestProfile },
	{ name: 'InfoHub',   module: InfoHub },
	{ name: 'HowToGet',  module: HowToGet },
	{ name: 'InfoPages', module: InfoPages },
	{ name: 'FAQ', module: FAQ },
    { name: 'AdminDashboard', module: AdminDashboard }
  ];
  for (const { name, module } of components) {
    if (module && typeof module.init === 'function') {
      try {
        await module.init();
        console.log(`[App] Composant ${name} initialisé.`);
      } catch (e) {
        console.error(`[App] Erreur lors de l'initialisation de ${name} :`, e);
      }
    }
  }
}

function initMobileMenu() {
  const hamburger = document.querySelector('.nav__hamburger');
  const navMenu = document.querySelector('.nav__links');
  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  });
}
  
function initDropdowns() {
  const dropdowns = document.querySelectorAll('.nav__dropdown');
  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav__link--dropdown');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dropdown.classList.toggle('open');
      }
    });
  });
}

// ──────────────────────────────────────────────
// Gestion des changements de route
// ──────────────────────────────────────────────
async function handleRouteChange(event) {
  const { route } = event.detail;

  // ── Protection de la route admin/dashboard ──
  if (route === '#/admin/dashboard' && !Store.isAdmin()) {
    console.warn('[App] Accès non autorisé. Redirection vers #/admin.');
    setTimeout(() => Router.navigate('#/admin'), 50);
    return;
  }

  // ── Invalider la carte Leaflet quand elle devient visible ──
  if (route === '#/hebergements' && MapComponent && typeof MapComponent.invalidateSize === 'function') {
    setTimeout(() => MapComponent.invalidateSize(), 200);
  }

  // ── Réinitialiser les animations au scroll ──
  setTimeout(() => Animations.initScrollAnimations(), 100);

  // ── Rafraîchir le profil invité ──
  if (route === '#/mes-reponses' && GuestProfile && typeof GuestProfile.refresh === 'function') {
    await GuestProfile.refresh();
  }

  // ── Rafraîchir le dashboard admin ──
  if (route === '#/admin/dashboard' && AdminDashboard && typeof AdminDashboard.renderDashboard === 'function') {
    await AdminDashboard.renderDashboard();
  }
}