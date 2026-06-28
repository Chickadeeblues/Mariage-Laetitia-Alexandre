/**
 * app.js — Point d'entrée principal de l'application
 * 
 * Mariage Laetitia & Alexandre — 8 mai 2027
 * Domaine de la Scie du May
 * 
 * Ce module :
 *  1. Initialise le Store (localStorage)
 *  2. Configure et démarre le Router SPA
 *  3. Initialise tous les composants de l'application
 *  4. Active les animations au scroll
 *  5. Gère le menu hamburger mobile
 *  6. Protège la route admin/dashboard
 *  7. Expose Store et Router sur window pour le debug
 */

// ──────────────────────────────────────────────
// Imports des modules
// ──────────────────────────────────────────────
import Store from './store.js';
import Router from './utils/router.js';
import Animations from './utils/animations.js';

// Imports des composants (chargés dynamiquement si disponibles)
// Ces imports échoueront silencieusement si les fichiers n'existent pas encore
let Hero, RSVP, MapComponent, Carpool, GuestProfile, AdminDashboard;

try { Hero = (await import('./components/hero.js')).default; } catch (e) { console.warn('[App] Composant Hero non disponible :', e.message); }
try { RSVP = (await import('./components/rsvp.js')).default; } catch (e) { console.warn('[App] Composant RSVP non disponible :', e.message); }
try { MapComponent = (await import('./components/map.js')).default; } catch (e) { console.warn('[App] Composant Map non disponible :', e.message); }
try { Carpool = (await import('./components/carpool.js')).default; } catch (e) { console.warn('[App] Composant Carpool non disponible :', e.message); }
try { GuestProfile = (await import('./components/guestProfile.js')).default; } catch (e) { console.warn('[App] Composant GuestProfile non disponible :', e.message); }
try { AdminDashboard = (await import('./components/adminDashboard.js')).default; } catch (e) { console.warn('[App] Composant AdminDashboard non disponible :', e.message); }

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

/**
 * Initialise tous les composants de l'application.
 * Chaque composant est initialisé de manière sécurisée :
 * si le composant n'est pas chargé, on ignore silencieusement.
 */
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

/**
 * Configure le bouton hamburger pour basculer l'affichage
 * du menu de navigation sur mobile.
 */
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

    // Accessibilité : indiquer l'état du menu
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    // Empêcher le scroll du body quand le menu est ouvert
    document.body.classList.toggle('menu-open', isOpen);
  });

  // Fermer le menu au clic sur un lien de navigation
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

/**
 * Gère les effets de bord lors d'un changement de route.
 * 
 * En particulier :
 *  - Invalide la taille de la carte Leaflet quand la page carte devient visible
 *  - Protège la route admin/dashboard : redirige si pas admin
 *  - Réinitialise les animations au scroll pour la nouvelle page
 * 
 * @param {CustomEvent} event — Événement 'route-changed' avec { route, pageId }
 */
function handleRouteChange(event) {
  const { route, pageId } = event.detail;

  // ── Protection de la route admin/dashboard ──
  if (route === '#/admin/dashboard' && !Store.isAdmin()) {
    console.warn('[App] Accès admin/dashboard non autorisé. Redirection vers #/admin.');
    // Rediriger avec un léger délai pour éviter les boucles
    setTimeout(() => {
      Router.navigate('#/admin');
    }, 50);
    return;
  }

  // ── Invalider la carte Leaflet quand elle devient visible ──
  if (route === '#/hebergements' && MapComponent && typeof MapComponent.invalidateSize === 'function') {
    // Attendre que la page soit affichée avant d'invalider
    setTimeout(() => {
      MapComponent.invalidateSize();
    }, 200);
  }

  // ── Réinitialiser les animations au scroll pour la nouvelle page ──
  // Nécessaire car les éléments de la nouvelle page n'ont pas été observés
  setTimeout(() => {
    Animations.initScrollAnimations();
  }, 100);

  // ── Rafraîchir le profil invité si nécessaire ──
  if (route === '#/mes-reponses' && GuestProfile && typeof GuestProfile.refresh === 'function') {
    GuestProfile.refresh();
  }

  // ── Rafraîchir le dashboard admin si nécessaire ──
  if (route === '#/admin/dashboard' && AdminDashboard && typeof AdminDashboard.refresh === 'function') {
    AdminDashboard.refresh();
  }
}
