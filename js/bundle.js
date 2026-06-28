/**
 * store.js — Module de persistance des données
 * 
 * Gère toute la persistance via localStorage pour l'application
 * de mariage Laetitia & Alexandre.
 * 
 * Expose un objet Store avec des méthodes CRUD pour :
 *  - Invités (guests)
 *  - Covoiturages (carpools)
 *  - Hébergements (accommodations)
 *  - Session invité courant
 *  - Authentification admin
 *  - Statistiques
 */

// ──────────────────────────────────────────────
// Clés de stockage localStorage
// ──────────────────────────────────────────────
const STORAGE_KEYS = {
  GUESTS: 'wedding_guests',
  CARPOOLS: 'wedding_carpools',
  ACCOMMODATIONS: 'wedding_accommodations',
  CURRENT_GUEST: 'wedding_current_guest_id',
  ADMIN_AUTH: 'wedding_admin_auth'
};

// Mot de passe administrateur (mariés)
const ADMIN_PASSWORD = 'laetitia-alexandre-2027';

// ──────────────────────────────────────────────
// Données initiales des hébergements
// ──────────────────────────────────────────────
const DEFAULT_ACCOMMODATIONS = [
  {
    id: 'acc-1',
    name: 'Domaine de la Scie du May',
    lat: 45.4113,
    lng: 4.5889,
    capacity: 'Variable',
    description: 'Hébergement sur le lieu même de la réception. Contactez les mariés pour les disponibilités.',
    bookingUrl: '',
    distance: 'Sur place',
    icon: 'venue'
  },
  {
    id: 'acc-2',
    name: 'La Roche du Pilat',
    lat: 45.418,
    lng: 4.605,
    capacity: '6 personnes',
    description: 'Gîte de 100m² à 920m d\'altitude. 3 chambres, mezzanine, vue panoramique sur le Pilat.',
    bookingUrl: 'https://www.pilat-tourisme.fr',
    distance: '~3 km',
    icon: 'gite'
  },
  {
    id: 'acc-3',
    name: 'L\'Atelier',
    lat: 45.406,
    lng: 4.575,
    capacity: '4 personnes',
    description: 'Gîte indépendant de 50m² dans une ancienne bâtisse en pierre rénovée. Charme et confort.',
    bookingUrl: 'https://www.gites-de-france-loire.com',
    distance: '~5 km',
    icon: 'gite'
  },
  {
    id: 'acc-4',
    name: 'Gîte La Bergerie',
    lat: 45.422,
    lng: 4.570,
    capacity: '14 personnes',
    description: 'Grand gîte au lieu-dit Le Maupas, idéal pour les groupes et familles nombreuses.',
    bookingUrl: 'https://www.pilat-tourisme.fr',
    distance: '~4 km',
    icon: 'gite'
  },
  {
    id: 'acc-5',
    name: 'Gîte de l\'Auberge du Collet',
    lat: 45.430,
    lng: 4.555,
    capacity: '14 personnes',
    description: '7 chambres doubles équipées. Cadre montagnard authentique.',
    bookingUrl: 'https://www.petitfute.com',
    distance: '~6 km',
    icon: 'gite'
  },
  {
    id: 'acc-6',
    name: 'Chez Delphine',
    lat: 45.415,
    lng: 4.595,
    capacity: '~4 personnes',
    description: 'Chambre d\'hôtes dans un cadre paisible. Accueil chaleureux.',
    bookingUrl: 'https://www.escapade-chezdelphine.fr',
    distance: '~3 km',
    icon: 'chambre'
  }
];

// ──────────────────────────────────────────────
// Registre des listeners d'événements
// ──────────────────────────────────────────────
const _listeners = {};

// ──────────────────────────────────────────────
// Objet Store principal
// ──────────────────────────────────────────────
const Store = {

  // ════════════════════════════════════════════
  // Utilitaires internes
  // ════════════════════════════════════════════

  /**
   * Génère un identifiant unique simple (UUID v4-like)
   * @returns {string} Un identifiant unique
   */
  _generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Lit et parse les données JSON depuis localStorage
   * @param {string} key — Clé localStorage
   * @returns {*} Données parsées ou null
   */
  _getData(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`[Store] Erreur lecture localStorage pour "${key}":`, e);
      return null;
    }
  },

  /**
   * Sérialise et sauvegarde les données dans localStorage
   * @param {string} key — Clé localStorage
   * @param {*} data — Données à sauvegarder
   */
  _setData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[Store] Erreur écriture localStorage pour "${key}":`, e);
    }
  },

  /**
   * Déclenche tous les callbacks enregistrés pour un événement
   * @param {string} event — Nom de l'événement
   */
  _emit(event) {
    if (_listeners[event]) {
      _listeners[event].forEach((callback) => {
        try {
          callback();
        } catch (e) {
          console.error(`[Store] Erreur callback pour événement "${event}":`, e);
        }
      });
    }
  },

  // ════════════════════════════════════════════
  // Système d'événements
  // ════════════════════════════════════════════

  /**
   * Enregistre un callback pour un événement donné
   * @param {string} event — Nom de l'événement ('guests-changed', 'carpools-changed', etc.)
   * @param {Function} callback — Fonction à appeler
   */
  on(event, callback) {
    if (!_listeners[event]) {
      _listeners[event] = [];
    }
    _listeners[event].push(callback);
  },

  /**
   * Supprime un callback pour un événement donné
   * @param {string} event — Nom de l'événement
   * @param {Function} callback — Référence exacte du callback à retirer
   */
  off(event, callback) {
    if (_listeners[event]) {
      _listeners[event] = _listeners[event].filter((cb) => cb !== callback);
    }
  },

  // ════════════════════════════════════════════
  // Initialisation
  // ════════════════════════════════════════════

  /**
   * Initialise les données par défaut dans localStorage
   * si elles ne sont pas déjà présentes.
   * À appeler au démarrage de l'application.
   */
  init() {
    // Initialiser la liste des invités si absente
    if (!this._getData(STORAGE_KEYS.GUESTS)) {
      this._setData(STORAGE_KEYS.GUESTS, []);
    }

    // Initialiser les covoiturages si absents
    if (!this._getData(STORAGE_KEYS.CARPOOLS)) {
      this._setData(STORAGE_KEYS.CARPOOLS, []);
    }

    // Pré-charger les hébergements par défaut si absents
    if (!this._getData(STORAGE_KEYS.ACCOMMODATIONS)) {
      this._setData(STORAGE_KEYS.ACCOMMODATIONS, DEFAULT_ACCOMMODATIONS);
    }

    console.log('[Store] Initialisation terminée.');
  },

  // ════════════════════════════════════════════
  // Gestion des invités (Guests)
  // ════════════════════════════════════════════

  /**
   * Retourne le tableau de tous les invités
   * @returns {Array} Liste des invités
   */
  getGuests() {
    return this._getData(STORAGE_KEYS.GUESTS) || [];
  },

  /**
   * Retourne un invité par son identifiant
   * @param {string} id — Identifiant de l'invité
   * @returns {Object|undefined} L'invité trouvé ou undefined
   */
  getGuest(id) {
    const guests = this.getGuests();
    return guests.find((g) => g.id === id);
  },

  /**
   * Retourne un invité par son adresse email (insensible à la casse)
   * @param {string} email — Adresse email à rechercher
   * @returns {Object|undefined} L'invité trouvé ou undefined
   */
  getGuestByEmail(email) {
    if (!email) return undefined;
    const guests = this.getGuests();
    const emailLower = email.toLowerCase().trim();
    return guests.find((g) => g.email && g.email.toLowerCase().trim() === emailLower);
  },

  /**
   * Crée un nouvel invité avec ID auto-généré et timestamps
   * @param {Object} data — Données de l'invité (sans id ni timestamps)
   * @returns {Object} L'invité nouvellement créé
   */
  saveGuest(data) {
    const guests = this.getGuests();
    const now = new Date().toISOString();

    const newGuest = {
      id: this._generateId(),
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      attending: data.attending !== undefined ? data.attending : null,
      companions: data.companions || [],
      diet: data.diet || [],
      allergyDetails: data.allergyDetails || '',
      transport: data.transport || {
        type: 'none',
        city: '',
        seatsAvailable: 0,
        seatsNeeded: 0,
        departureDay: '',
        departureTime: '',
        contact: ''
      },
      createdAt: now,
      updatedAt: now
    };

    guests.push(newGuest);
    this._setData(STORAGE_KEYS.GUESTS, guests);
    this._emit('guests-changed');

    console.log(`[Store] Invité créé : ${newGuest.firstName} ${newGuest.lastName} (${newGuest.id})`);
    return newGuest;
  },

  /**
   * Met à jour un invité existant par son ID
   * @param {string} id — Identifiant de l'invité
   * @param {Object} data — Données partielles à mettre à jour
   * @returns {Object|null} L'invité mis à jour ou null si introuvable
   */
  updateGuest(id, data) {
    const guests = this.getGuests();
    const index = guests.findIndex((g) => g.id === id);

    if (index === -1) {
      console.warn(`[Store] Invité introuvable pour mise à jour : ${id}`);
      return null;
    }

    // Fusionner les données en préservant l'existant
    guests[index] = {
      ...guests[index],
      ...data,
      id: guests[index].id,               // L'ID ne change jamais
      createdAt: guests[index].createdAt,  // La date de création est immuable
      updatedAt: new Date().toISOString()
    };

    this._setData(STORAGE_KEYS.GUESTS, guests);
    this._emit('guests-changed');

    console.log(`[Store] Invité mis à jour : ${guests[index].firstName} ${guests[index].lastName}`);
    return guests[index];
  },

  /**
   * Supprime un invité par son ID
   * @param {string} id — Identifiant de l'invité à supprimer
   */
  deleteGuest(id) {
    let guests = this.getGuests();
    const guest = guests.find((g) => g.id === id);

    if (guest) {
      guests = guests.filter((g) => g.id !== id);
      this._setData(STORAGE_KEYS.GUESTS, guests);
      this._emit('guests-changed');
      console.log(`[Store] Invité supprimé : ${guest.firstName} ${guest.lastName}`);

      // Si l'invité supprimé est l'invité courant, effacer la session
      if (this._getData(STORAGE_KEYS.CURRENT_GUEST) === id) {
        this.clearCurrentGuest();
      }
    }
  },

  // ════════════════════════════════════════════
  // Session invité courant
  // ════════════════════════════════════════════

  /**
   * Retourne l'invité actuellement connecté, ou null
   * @returns {Object|null} L'invité courant ou null
   */
  getCurrentGuest() {
    const guestId = this._getData(STORAGE_KEYS.CURRENT_GUEST);
    if (!guestId) return null;
    return this.getGuest(guestId) || null;
  },

  /**
   * Stocke l'ID de l'invité courant dans localStorage
   * @param {string} guestId — Identifiant de l'invité
   */
  setCurrentGuest(guestId) {
    this._setData(STORAGE_KEYS.CURRENT_GUEST, guestId);
    this._emit('auth-changed');
    console.log(`[Store] Invité courant défini : ${guestId}`);
  },

  /**
   * Efface la session de l'invité courant
   */
  clearCurrentGuest() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GUEST);
    this._emit('auth-changed');
    console.log('[Store] Session invité effacée.');
  },

  // ════════════════════════════════════════════
  // Gestion des covoiturages (Carpools)
  // ════════════════════════════════════════════

  /**
   * Retourne tous les covoiturages
   * @returns {Array} Liste des covoiturages
   */
  getCarpools() {
    return this._getData(STORAGE_KEYS.CARPOOLS) || [];
  },

  /**
   * Filtre les covoiturages par type ('offer' ou 'request')
   * @param {string} type — 'offer' ou 'request'
   * @returns {Array} Covoiturages filtrés
   */
  getCarpoolsByType(type) {
    return this.getCarpools().filter((c) => c.type === type);
  },

  /**
   * Filtre les covoiturages par invité
   * @param {string} guestId — Identifiant de l'invité
   * @returns {Array} Covoiturages de l'invité
   */
  getCarpoolsByGuestId(guestId) {
    return this.getCarpools().filter((c) => c.guestId === guestId);
  },

  /**
   * Crée un nouveau covoiturage
   * @param {Object} data — Données du covoiturage
   * @returns {Object} Le covoiturage créé
   */
  saveCarpool(data) {
    const carpools = this.getCarpools();
    const now = new Date().toISOString();

    const newCarpool = {
      id: this._generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };

    carpools.push(newCarpool);
    this._setData(STORAGE_KEYS.CARPOOLS, carpools);
    this._emit('carpools-changed');

    console.log(`[Store] Covoiturage créé : ${newCarpool.id} (${newCarpool.type})`);
    return newCarpool;
  },

  /**
   * Met à jour un covoiturage existant
   * @param {string} id — Identifiant du covoiturage
   * @param {Object} data — Données partielles à mettre à jour
   * @returns {Object|null} Le covoiturage mis à jour ou null
   */
  updateCarpool(id, data) {
    const carpools = this.getCarpools();
    const index = carpools.findIndex((c) => c.id === id);

    if (index === -1) {
      console.warn(`[Store] Covoiturage introuvable : ${id}`);
      return null;
    }

    carpools[index] = {
      ...carpools[index],
      ...data,
      id: carpools[index].id,
      createdAt: carpools[index].createdAt,
      updatedAt: new Date().toISOString()
    };

    this._setData(STORAGE_KEYS.CARPOOLS, carpools);
    this._emit('carpools-changed');

    console.log(`[Store] Covoiturage mis à jour : ${id}`);
    return carpools[index];
  },

  /**
   * Supprime un covoiturage par son ID
   * @param {string} id — Identifiant du covoiturage
   */
  deleteCarpool(id) {
    let carpools = this.getCarpools();
    carpools = carpools.filter((c) => c.id !== id);
    this._setData(STORAGE_KEYS.CARPOOLS, carpools);
    this._emit('carpools-changed');
    console.log(`[Store] Covoiturage supprimé : ${id}`);
  },

  // ════════════════════════════════════════════
  // Gestion des hébergements (Accommodations)
  // ════════════════════════════════════════════

  /**
   * Retourne tous les hébergements
   * @returns {Array} Liste des hébergements
   */
  getAccommodations() {
    return this._getData(STORAGE_KEYS.ACCOMMODATIONS) || [];
  },

  /**
   * Crée un nouvel hébergement
   * @param {Object} data — Données de l'hébergement
   * @returns {Object} L'hébergement créé
   */
  saveAccommodation(data) {
    const accommodations = this.getAccommodations();

    const newAccommodation = {
      id: this._generateId(),
      ...data,
      createdAt: new Date().toISOString()
    };

    accommodations.push(newAccommodation);
    this._setData(STORAGE_KEYS.ACCOMMODATIONS, accommodations);
    this._emit('accommodations-changed');

    console.log(`[Store] Hébergement créé : ${newAccommodation.name}`);
    return newAccommodation;
  },

  /**
   * Met à jour un hébergement existant
   * @param {string} id — Identifiant de l'hébergement
   * @param {Object} data — Données partielles à mettre à jour
   * @returns {Object|null} L'hébergement mis à jour ou null
   */
  updateAccommodation(id, data) {
    const accommodations = this.getAccommodations();
    const index = accommodations.findIndex((a) => a.id === id);

    if (index === -1) {
      console.warn(`[Store] Hébergement introuvable : ${id}`);
      return null;
    }

    accommodations[index] = {
      ...accommodations[index],
      ...data,
      id: accommodations[index].id
    };

    this._setData(STORAGE_KEYS.ACCOMMODATIONS, accommodations);
    this._emit('accommodations-changed');

    console.log(`[Store] Hébergement mis à jour : ${accommodations[index].name}`);
    return accommodations[index];
  },

  /**
   * Supprime un hébergement par son ID
   * @param {string} id — Identifiant de l'hébergement
   */
  deleteAccommodation(id) {
    let accommodations = this.getAccommodations();
    accommodations = accommodations.filter((a) => a.id !== id);
    this._setData(STORAGE_KEYS.ACCOMMODATIONS, accommodations);
    this._emit('accommodations-changed');
    console.log(`[Store] Hébergement supprimé : ${id}`);
  },

  // ════════════════════════════════════════════
  // Administration
  // ════════════════════════════════════════════

  /**
   * Vérifie le mot de passe admin et enregistre l'authentification
   * @param {string} password — Mot de passe à vérifier
   * @returns {boolean} true si authentification réussie
   */
  adminLogin(password) {
    if (password === ADMIN_PASSWORD) {
      this._setData(STORAGE_KEYS.ADMIN_AUTH, { authenticated: true, timestamp: new Date().toISOString() });
      this._emit('auth-changed');
      console.log('[Store] Connexion admin réussie.');
      return true;
    }
    console.warn('[Store] Échec de connexion admin.');
    return false;
  },

  /**
   * Déconnecte l'administrateur
   */
  adminLogout() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    this._emit('auth-changed');
    console.log('[Store] Déconnexion admin.');
  },

  /**
   * Vérifie si un administrateur est actuellement connecté
   * @returns {boolean} true si admin connecté
   */
  isAdmin() {
    const auth = this._getData(STORAGE_KEYS.ADMIN_AUTH);
    return auth !== null && auth.authenticated === true;
  },

  // ════════════════════════════════════════════
  // Statistiques
  // ════════════════════════════════════════════

  /**
   * Calcule et retourne les statistiques globales du mariage
   * @returns {Object} Objet contenant toutes les statistiques
   */
  getStats() {
    const guests = this.getGuests();
    const carpools = this.getCarpools();

    // — Compteurs invités —
    const totalGuests = guests.length;

    // Nombre total de personnes (invité + accompagnants)
    const totalPeople = guests.reduce((sum, g) => {
      return sum + 1 + (g.companions ? g.companions.length : 0);
    }, 0);

    // Invités ayant confirmé leur présence
    const confirmedGuests = guests.filter((g) => g.attending === true);
    const confirmed = confirmedGuests.length;

    // Nombre total de personnes confirmées (invité + accompagnants)
    const confirmedPeople = confirmedGuests.reduce((sum, g) => {
      return sum + 1 + (g.companions ? g.companions.length : 0);
    }, 0);

    // Invités ayant décliné
    const declined = guests.filter((g) => g.attending === false).length;

    // Invités en attente de réponse
    const pending = guests.filter((g) => g.attending === null || g.attending === undefined).length;

    // — Régimes alimentaires —
    let vegetarian = 0;
    let vegan = 0;
    let noAlcohol = 0;
    const allergies = [];

    /**
     * Compte les régimes pour une personne (invité ou accompagnant)
     * @param {Array} dietArray — Tableau des régimes
     * @param {string} name — Nom de la personne
     * @param {string} allergyDetails — Détails des allergies
     */
    const countDiets = (dietArray, name, allergyDetails) => {
      if (!dietArray || !Array.isArray(dietArray)) return;

      if (dietArray.includes('vegetarian')) vegetarian++;
      if (dietArray.includes('vegan')) vegan++;
      if (dietArray.includes('no-alcohol')) noAlcohol++;
      if (dietArray.includes('allergy') && allergyDetails) {
        allergies.push({ name, details: allergyDetails });
      }
    };

    // Parcourir tous les invités confirmés et leurs accompagnants
    confirmedGuests.forEach((guest) => {
      const guestName = `${guest.firstName} ${guest.lastName}`.trim();
      countDiets(guest.diet, guestName, guest.allergyDetails);

      if (guest.companions && Array.isArray(guest.companions)) {
        guest.companions.forEach((companion) => {
          countDiets(companion.diet, companion.name || 'Accompagnant', companion.allergyDetails);
        });
      }
    });

    // — Transport / covoiturage —
    const offers = carpools.filter((c) => c.type === 'offer');
    const requests = carpools.filter((c) => c.type === 'request');

    const drivers = offers.length;
    const seatsAvailable = offers.reduce((sum, c) => sum + (parseInt(c.seatsAvailable, 10) || 0), 0);
    const needRide = requests.length;
    const seatsNeeded = requests.reduce((sum, c) => sum + (parseInt(c.seatsNeeded, 10) || 0), 0);

    return {
      totalGuests,
      totalPeople,
      confirmed,
      confirmedPeople,
      declined,
      pending,
      diets: {
        vegetarian,
        vegan,
        noAlcohol,
        allergies
      },
      transport: {
        drivers,
        seatsAvailable,
        needRide,
        seatsNeeded
      }
    };
  }
};

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


const RSVP = {
  container: null,
  currentStep: 1,
  totalSteps: 4,
  guestData: {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    attending: null,
    companions: [],
    diet: [],
    allergyDetails: '',
    transport: {
      type: 'none',
      city: '',
      seatsAvailable: 1,
      seatsNeeded: 1,
      departureDay: '',
      departureTime: '',
      contact: ''
    }
  },

  init() {
    this.container = document.getElementById('rsvp-container');
    if (!this.container) return;

    // Check if we already have a guest in session
    const currentGuest = Store.getCurrentGuest();
    if (currentGuest) {
      this.guestData = { ...currentGuest };
    }

    this.render();
  },

  render() {
    if (!this.container) return;
    this.container.innerHTML = this.getHTML();
    this.attachEvents();
    Animations.fadeIn(this.container);
  },

  getHTML() {
    return `
      <div class="card form-steps-card">
        ${this.renderProgressBar()}
        <form id="rsvp-form">
          ${this.renderStep1()}
          ${this.renderStep2()}
          ${this.renderStep3()}
          ${this.renderStep4()}
        </form>
      </div>
    `;
  },

  renderProgressBar() {
    let html = '<div class="form-steps-indicator">';
    for (let i = 1; i <= this.totalSteps; i++) {
      let classes = 'step-dot';
      if (i === this.currentStep) classes += ' active';
      else if (i < this.currentStep) classes += ' completed';
      html += `<div class="${classes}">${i}</div>`;
      if (i < this.totalSteps) {
        html += `<div class="step-line ${i < this.currentStep ? 'completed' : ''}"></div>`;
      }
    }
    html += '</div>';
    return html;
  },

  renderStep1() {
    const isVisible = this.currentStep === 1;
    return `
      <div class="form-step ${isVisible ? 'active' : 'hidden'}" id="step-1">
        <h3 class="text-center">Vos coordonnées</h3>
        <div class="form-group">
          <label>Prénom *</label>
          <input type="text" id="guest-firstname" value="${this.guestData.firstName}" required>
        </div>
        <div class="form-group">
          <label>Nom *</label>
          <input type="text" id="guest-lastname" value="${this.guestData.lastName}" required>
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="guest-email" value="${this.guestData.email}" required>
        </div>
        <div class="form-group">
          <label>Téléphone</label>
          <input type="tel" id="guest-phone" value="${this.guestData.phone}">
        </div>
        <div class="text-center mt-4">
          <button type="button" class="btn btn--primary next-btn">Suivant</button>
        </div>
      </div>
    `;
  },

  renderStep2() {
    const isVisible = this.currentStep === 2;
    return `
      <div class="form-step ${isVisible ? 'active' : 'hidden'}" id="step-2">
        <h3 class="text-center">Serez-vous présent(e) ?</h3>
        <div class="form-group text-center">
          <button type="button" class="btn ${this.guestData.attending === true ? 'btn--primary' : 'btn--secondary'} attendance-btn" data-val="true">Oui, avec joie</button>
          <button type="button" class="btn ${this.guestData.attending === false ? 'btn--primary' : 'btn--secondary'} attendance-btn" data-val="false">Non, malheureusement</button>
        </div>
        
        <div id="companions-section" class="${this.guestData.attending === true ? '' : 'hidden'}">
          <div class="form-group mt-4">
            <label>Nombre d'accompagnants</label>
            <select id="guest-companions-count">
              ${[0,1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}" ${this.guestData.companions.length === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div id="companions-list">
            ${this.guestData.companions.map((comp, idx) => `
              <div class="form-group">
                <label>Nom de l'accompagnant ${idx + 1}</label>
                <input type="text" class="companion-name" data-index="${idx}" value="${comp.name}" required>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-actions mt-4 text-center">
          <button type="button" class="btn btn--secondary prev-btn">Précédent</button>
          <button type="button" class="btn btn--primary next-btn">${this.guestData.attending === false ? 'Confirmer' : 'Suivant'}</button>
        </div>
      </div>
    `;
  },

  renderStep3() {
    const isVisible = this.currentStep === 3;
    const diets = ['vegetarian', 'vegan', 'no-alcohol', 'allergy'];
    const dietLabels = { 'vegetarian': 'Végétarien', 'vegan': 'Végan', 'no-alcohol': 'Sans alcool', 'allergy': 'Allergie' };

    const renderDietCheckboxes = (personType, index, currentDiet, currentAllergyDetails) => {
      let html = `<div class="diet-section"><h4 class="mt-2">${personType}</h4><div class="diet-checkboxes">`;
      diets.forEach(d => {
        const isChecked = currentDiet && currentDiet.includes(d);
        html += `
          <label class="checkbox-label">
            <input type="checkbox" class="diet-cb" data-person="${index}" value="${d}" ${isChecked ? 'checked' : ''}>
            ${dietLabels[d]}
          </label>
        `;
      });
      html += `</div>`;
      const hasAllergy = currentDiet && currentDiet.includes('allergy');
      html += `
        <div class="form-group allergy-details ${hasAllergy ? '' : 'hidden'}" id="allergy-details-${index}">
          <label>Précisez l'allergie</label>
          <input type="text" class="allergy-input" data-person="${index}" value="${currentAllergyDetails || ''}">
        </div>
      </div>`;
      return html;
    };

    let html = `
      <div class="form-step ${isVisible ? 'active' : 'hidden'}" id="step-3">
        <h3 class="text-center">Régimes alimentaires</h3>
        ${renderDietCheckboxes('Pour vous', 'main', this.guestData.diet, this.guestData.allergyDetails)}
    `;

    this.guestData.companions.forEach((comp, idx) => {
      html += renderDietCheckboxes(`Pour ${comp.name || 'Accompagnant ' + (idx+1)}`, idx, comp.diet, comp.allergyDetails);
    });

    html += `
        <div class="form-actions mt-4 text-center">
          <button type="button" class="btn btn--secondary prev-btn">Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant</button>
        </div>
      </div>
    `;
    return html;
  },

  renderStep4() {
    const isVisible = this.currentStep === 4;
    const t = this.guestData.transport;
    return `
      <div class="form-step ${isVisible ? 'active' : 'hidden'}" id="step-4">
        <h3 class="text-center">Transport & Covoiturage</h3>
        <div class="form-group">
          <label class="radio-label">
            <input type="radio" name="transport-type" value="driver" ${t.type === 'driver' ? 'checked' : ''}>
            Je viens en voiture et peux proposer des places
          </label>
          <label class="radio-label">
            <input type="radio" name="transport-type" value="passenger" ${t.type === 'passenger' ? 'checked' : ''}>
            J'ai besoin d'un covoiturage
          </label>
          <label class="radio-label">
            <input type="radio" name="transport-type" value="none" ${t.type === 'none' ? 'checked' : ''}>
            Je m'organise autrement / Pas besoin
          </label>
        </div>

        <div id="transport-driver-section" class="${t.type === 'driver' ? '' : 'hidden'}">
          <div class="form-group">
            <label>Ville de départ</label>
            <input type="text" id="t-driver-city" value="${t.city}">
          </div>
          <div class="form-group">
            <label>Places disponibles</label>
            <select id="t-driver-seats">
              ${[1,2,3,4,5,6,7].map(n => `<option value="${n}" ${t.seatsAvailable == n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Jour de départ</label>
            <select id="t-driver-day">
              <option value="7 mai - Veille" ${t.departureDay === '7 mai - Veille' ? 'selected' : ''}>7 mai - Veille</option>
              <option value="8 mai - Jour J" ${t.departureDay === '8 mai - Jour J' ? 'selected' : ''}>8 mai - Jour J</option>
            </select>
          </div>
          <div class="form-group">
            <label>Heure de départ approx.</label>
            <input type="time" id="t-driver-time" value="${t.departureTime}">
          </div>
          <div class="form-group">
            <label>Contact pour covoiturage (Tél/Email)</label>
            <input type="text" id="t-driver-contact" value="${t.contact || this.guestData.phone || this.guestData.email}">
          </div>
        </div>

        <div id="transport-passenger-section" class="${t.type === 'passenger' ? '' : 'hidden'}">
           <div class="form-group">
            <label>Ville de départ souhaitée</label>
            <input type="text" id="t-pass-city" value="${t.city}">
          </div>
          <div class="form-group">
            <label>Places nécessaires</label>
            <select id="t-pass-seats">
              ${[1,2,3,4,5].map(n => `<option value="${n}" ${t.seatsNeeded == n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Jour souhaité</label>
            <select id="t-pass-day">
              <option value="7 mai - Veille" ${t.departureDay === '7 mai - Veille' ? 'selected' : ''}>7 mai - Veille</option>
              <option value="8 mai - Jour J" ${t.departureDay === '8 mai - Jour J' ? 'selected' : ''}>8 mai - Jour J</option>
            </select>
          </div>
          <div class="form-group">
            <label>Contact (Tél/Email)</label>
            <input type="text" id="t-pass-contact" value="${t.contact || this.guestData.phone || this.guestData.email}">
          </div>
        </div>

        <div class="form-actions mt-4 text-center">
          <button type="button" class="btn btn--secondary prev-btn">Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Confirmer mon inscription</button>
        </div>
      </div>
    `;
  },

  attachEvents() {
    // Navigation Next/Prev
    const nextBtns = this.container.querySelectorAll('.next-btn');
    nextBtns.forEach(btn => btn.addEventListener('click', () => this.handleNext()));

    const prevBtns = this.container.querySelectorAll('.prev-btn');
    prevBtns.forEach(btn => btn.addEventListener('click', () => this.handlePrev()));

    // Attendance buttons
    const attendanceBtns = this.container.querySelectorAll('.attendance-btn');
    attendanceBtns.forEach(btn => btn.addEventListener('click', (e) => {
      this.guestData.attending = e.target.dataset.val === 'true';
      this.render(); // re-render to update classes and visibility
    }));

    // Companions count
    const compSelect = this.container.querySelector('#guest-companions-count');
    if (compSelect) {
      compSelect.addEventListener('change', (e) => {
        const count = parseInt(e.target.value, 10);
        // keep existing, add new or remove
        while (this.guestData.companions.length < count) {
          this.guestData.companions.push({ name: '', diet: [], allergyDetails: '' });
        }
        if (this.guestData.companions.length > count) {
          this.guestData.companions = this.guestData.companions.slice(0, count);
        }
        this.render();
      });
    }

    // Diet checkboxes
    const dietCbs = this.container.querySelectorAll('.diet-cb');
    dietCbs.forEach(cb => cb.addEventListener('change', (e) => {
      const person = e.target.dataset.person;
      const val = e.target.value;
      const checked = e.target.checked;
      
      let dietArr;
      if (person === 'main') {
        if (!this.guestData.diet) this.guestData.diet = [];
        dietArr = this.guestData.diet;
      } else {
        const idx = parseInt(person, 10);
        if (!this.guestData.companions[idx].diet) this.guestData.companions[idx].diet = [];
        dietArr = this.guestData.companions[idx].diet;
      }

      if (checked && !dietArr.includes(val)) dietArr.push(val);
      if (!checked && dietArr.includes(val)) dietArr.splice(dietArr.indexOf(val), 1);

      // Show/hide allergy details
      if (val === 'allergy') {
        const detailsContainer = this.container.querySelector('#allergy-details-' + person);
        if (detailsContainer) {
          if (checked) detailsContainer.classList.remove('hidden');
          else detailsContainer.classList.add('hidden');
        }
      }
    }));

    // Transport radios
    const transportRadios = this.container.querySelectorAll('input[name="transport-type"]');
    transportRadios.forEach(radio => radio.addEventListener('change', (e) => {
      this.guestData.transport.type = e.target.value;
      const driverSec = this.container.querySelector('#transport-driver-section');
      const passSec = this.container.querySelector('#transport-passenger-section');
      if(driverSec) driverSec.classList.toggle('hidden', e.target.value !== 'driver');
      if(passSec) passSec.classList.toggle('hidden', e.target.value !== 'passenger');
    }));
  },

  saveCurrentStepData() {
    if (this.currentStep === 1) {
      this.guestData.firstName = document.getElementById('guest-firstname').value.trim();
      this.guestData.lastName = document.getElementById('guest-lastname').value.trim();
      this.guestData.email = document.getElementById('guest-email').value.trim();
      this.guestData.phone = document.getElementById('guest-phone').value.trim();
    } else if (this.currentStep === 2) {
      const companionInputs = this.container.querySelectorAll('.companion-name');
      companionInputs.forEach(input => {
        const idx = parseInt(input.dataset.index, 10);
        if (this.guestData.companions[idx]) {
          this.guestData.companions[idx].name = input.value.trim();
        }
      });
    } else if (this.currentStep === 3) {
      const allergyInputs = this.container.querySelectorAll('.allergy-input');
      allergyInputs.forEach(input => {
        const person = input.dataset.person;
        if (person === 'main') {
          this.guestData.allergyDetails = input.value.trim();
        } else {
          const idx = parseInt(person, 10);
          if (this.guestData.companions[idx]) {
            this.guestData.companions[idx].allergyDetails = input.value.trim();
          }
        }
      });
    } else if (this.currentStep === 4) {
      const t = this.guestData.transport;
      if (t.type === 'driver') {
        t.city = document.getElementById('t-driver-city').value.trim();
        t.seatsAvailable = parseInt(document.getElementById('t-driver-seats').value, 10);
        t.departureDay = document.getElementById('t-driver-day').value;
        t.departureTime = document.getElementById('t-driver-time').value;
        t.contact = document.getElementById('t-driver-contact').value.trim();
      } else if (t.type === 'passenger') {
        t.city = document.getElementById('t-pass-city').value.trim();
        t.seatsNeeded = parseInt(document.getElementById('t-pass-seats').value, 10);
        t.departureDay = document.getElementById('t-pass-day').value;
        t.contact = document.getElementById('t-pass-contact').value.trim();
      }
    }
  },

  validateStep() {
    if (this.currentStep === 1) {
      if (!this.guestData.firstName || !this.guestData.lastName || !this.guestData.email) {
        Animations.showToast("Veuillez remplir les champs obligatoires (*)", "error");
        return false;
      }
    }
    if (this.currentStep === 2) {
      if (this.guestData.attending === null) {
        Animations.showToast("Veuillez indiquer votre présence", "error");
        return false;
      }
      if (this.guestData.attending === true) {
        let allNamed = true;
        this.guestData.companions.forEach(c => { if (!c.name) allNamed = false; });
        if (!allNamed) {
          Animations.showToast("Veuillez indiquer le nom de vos accompagnants", "error");
          return false;
        }
      }
    }
    return true;
  },

  handleNext() {
    this.saveCurrentStepData();
    if (!this.validateStep()) return;

    if (this.currentStep === 2 && this.guestData.attending === false) {
      this.submitForm();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      // Check if email already exists on step 1 to pre-fill
      if (this.currentStep === 1) {
         const existing = Store.getGuestByEmail(this.guestData.email);
         if (existing && existing.id !== this.guestData.id) {
           this.guestData = { ...existing };
           Animations.showToast("Nous avons retrouvé votre profil !", "success");
         }
      }

      this.currentStep++;
      this.render();
    } else {
      this.submitForm();
    }
  },

  handlePrev() {
    this.saveCurrentStepData();
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
    }
  },

  submitForm() {
    let savedGuest;
    if (this.guestData.id) {
      savedGuest = Store.updateGuest(this.guestData.id, this.guestData);
    } else {
      savedGuest = Store.saveGuest(this.guestData);
    }

    Store.setCurrentGuest(savedGuest.id);
    
    // Save carpool if applicable
    const t = savedGuest.transport;
    if (t && (t.type === 'driver' || t.type === 'passenger')) {
      const carpoolData = {
        guestId: savedGuest.id,
        type: t.type === 'driver' ? 'offer' : 'request',
        city: t.city,
        seats: t.type === 'driver' ? t.seatsAvailable : t.seatsNeeded,
        departureDay: t.departureDay,
        departureTime: t.departureTime,
        contact: t.contact
      };
      Store.saveCarpool(carpoolData);
    }

    Animations.showToast("Merci pour votre réponse !", "success");
    
    // Reset state for potential next use
    this.currentStep = 1;
    
    Router.navigate('#/mes-reponses');
  }
};

/**
 * ============================================================
 * Composant Map — Carte Leaflet & liste des hébergements
 * ============================================================
 *
 * Fonctionnalités :
 *   - Carte Leaflet centrée sur le Domaine de la Scie du May
 *   - Marqueurs personnalisés (DivIcon) pour le domaine et les gîtes
 *   - Popups interactifs avec infos hébergement
 *   - Liste de cartes sous la carte
 *   - Écoute 'accommodations-changed' pour rafraîchir
 */


const MapComponent = {
  /** Référence à la carte Leaflet */
  _map: null,

  /** Groupe de marqueurs */
  _markersLayer: null,

  /** Références DOM */
  _elements: {
    mapContainer: null,
    accommodationsList: null,
  },

  /** Coordonnées du Domaine */
  _domainCoords: [45.4113, 4.5889],
  _domainZoom: 13,

  /** Listener Store pour le cleanup */
  _storeUnsubscribe: null,

  /**
   * Initialise le composant carte.
   */
  init() {
    this._elements.mapContainer = document.getElementById('map-container');
    this._elements.accommodationsList = document.getElementById('accommodations-list');

    if (!this._elements.mapContainer) return;

    // Initialiser la carte Leaflet
    this._initMap();

    // Charger les hébergements
    this._loadAccommodations();

    // Écouter les changements
    this._storeUnsubscribe = Store.on('accommodations-changed', () => {
      this._loadAccommodations();
    });
  },

  /**
   * Nettoie les ressources.
   */
  destroy() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
    if (this._storeUnsubscribe) {
      this._storeUnsubscribe();
      this._storeUnsubscribe = null;
    }
  },

  /**
   * Rafraîchit la carte (invalidateSize).
   * À appeler quand la section contenant la carte devient visible.
   */
  refresh() {
    if (this._map) {
      setTimeout(() => {
        this._map.invalidateSize();
      }, 100);
    }
  },

  // ─── INITIALISATION CARTE ─────────────────────────────

  /**
   * Crée et configure la carte Leaflet.
   */
  _initMap() {
    // Vérifier que Leaflet est chargé
    if (typeof L === 'undefined') {
      console.warn('[MapComponent] Leaflet (L) non disponible. Carte non initialisée.');
      this._elements.mapContainer.innerHTML = `
        <div class="map-fallback" style="
          display: flex; align-items: center; justify-content: center;
          height: 400px; background: #FAF8F5; border-radius: 16px;
          color: #2D5A3D; font-family: inherit; text-align: center; padding: 2rem;
        ">
          <div>
            <span style="font-size: 3rem;">🗺️</span>
            <p style="margin-top: 1rem; font-size: 1.1rem;">
              La carte est en cours de chargement…
            </p>
            <p style="font-size: 0.9rem; opacity: 0.7;">
              Domaine de la Scie du May — Doizieux, 42740
            </p>
          </div>
        </div>
      `;
      return;
    }

    // Créer la carte
    this._map = L.map(this._elements.mapContainer, {
      center: this._domainCoords,
      zoom: this._domainZoom,
      scrollWheelZoom: false, // Éviter les zooms accidentels
      zoomControl: true,
    });

    // Tuiles OpenStreetMap avec style sobre
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(this._map);

    // Activer le scroll zoom après un clic sur la carte
    this._map.on('click', () => {
      this._map.scrollWheelZoom.enable();
    });

    // Couche pour les marqueurs
    this._markersLayer = L.layerGroup().addTo(this._map);

    // Marqueur du domaine (toujours présent)
    this._addDomainMarker();

    // Injecter les styles pour les marqueurs custom
    this._injectMarkerStyles();
  },

  /**
   * Injecte les styles CSS pour les marqueurs personnalisés.
   */
  _injectMarkerStyles() {
    if (document.getElementById('map-marker-styles')) return;

    const style = document.createElement('style');
    style.id = 'map-marker-styles';
    style.textContent = `
      /* Marqueur du domaine */
      .marker-domain {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #C9A84C, #E5C97B);
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(201, 168, 76, 0.5);
        transition: transform 0.3s ease;
      }
      .marker-domain:hover {
        transform: rotate(-45deg) scale(1.15);
      }
      .marker-domain-icon {
        transform: rotate(45deg);
        font-size: 22px;
        line-height: 1;
      }

      /* Marqueurs hébergements */
      .marker-accommodation {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #2D5A3D, #3D7A4F);
        border: 2px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 10px rgba(45, 90, 61, 0.4);
        transition: transform 0.3s ease;
      }
      .marker-accommodation:hover {
        transform: rotate(-45deg) scale(1.15);
      }
      .marker-accommodation-icon {
        transform: rotate(45deg);
        font-size: 18px;
        line-height: 1;
      }

      /* Popups personnalisés */
      .map-popup {
        font-family: 'Inter', 'Outfit', sans-serif;
        min-width: 220px;
      }
      .map-popup h3 {
        color: #2D5A3D;
        font-size: 1.05rem;
        margin: 0 0 0.5rem;
        font-weight: 600;
      }
      .map-popup .popup-detail {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-bottom: 0.3rem;
        font-size: 0.88rem;
        color: #555;
      }
      .map-popup .popup-detail .popup-icon {
        flex-shrink: 0;
        width: 18px;
        text-align: center;
      }
      .map-popup .popup-description {
        font-size: 0.85rem;
        color: #666;
        margin: 0.6rem 0;
        line-height: 1.4;
      }
      .map-popup .popup-book-link {
        display: inline-block;
        margin-top: 0.5rem;
        padding: 0.4rem 1rem;
        background: linear-gradient(135deg, #C9A84C, #E5C97B);
        color: #fff;
        text-decoration: none;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .map-popup .popup-book-link:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(201, 168, 76, 0.4);
      }
    `;
    document.head.appendChild(style);
  },

  // ─── MARQUEURS ────────────────────────────────────────

  /**
   * Ajoute le marqueur spécial du Domaine de la Scie du May.
   */
  _addDomainMarker() {
    if (!this._map) return;

    const domainIcon = L.divIcon({
      className: 'marker-domain-wrapper',
      html: `
        <div class="marker-domain">
          <span class="marker-domain-icon">🏰</span>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });

    const marker = L.marker(this._domainCoords, { icon: domainIcon });
    marker.bindPopup(`
      <div class="map-popup">
        <h3>🏰 Domaine de la Scie du May</h3>
        <div class="popup-detail">
          <span class="popup-icon">📍</span>
          <span>Doizieux, 42740</span>
        </div>
        <div class="popup-detail">
          <span class="popup-icon">💒</span>
          <span>Lieu de la cérémonie & réception</span>
        </div>
        <p class="popup-description">
          Un domaine enchanteur niché au cœur du Pilat, 
          cadre idéal pour célébrer notre union.
        </p>
      </div>
    `);

    marker.addTo(this._map);
  },

  /**
   * Détermine l'icône émoji selon le type d'hébergement.
   * @param {Object} accommodation - Données de l'hébergement
   * @returns {string} Émoji approprié
   */
  _getAccommodationEmoji(accommodation) {
    const name = (accommodation.name || '').toLowerCase();
    if (name.includes('gîte') || name.includes('gite')) return '🏡';
    if (name.includes('chambre')) return '🛏️';
    if (name.includes('hôtel') || name.includes('hotel')) return '🏨';
    if (name.includes('camping')) return '⛺';
    return '🏡';
  },

  /**
   * Ajoute un marqueur d'hébergement sur la carte.
   * @param {Object} accommodation - Données de l'hébergement
   */
  _addAccommodationMarker(accommodation) {
    if (!this._map || !accommodation.lat || !accommodation.lng) return;

    const emoji = this._getAccommodationEmoji(accommodation);

    const icon = L.divIcon({
      className: 'marker-accommodation-wrapper',
      html: `
        <div class="marker-accommodation">
          <span class="marker-accommodation-icon">${emoji}</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

    const marker = L.marker([accommodation.lat, accommodation.lng], { icon });

    // Construire le contenu du popup
    let popupContent = `<div class="map-popup">`;
    popupContent += `<h3>${emoji} ${accommodation.name || 'Hébergement'}</h3>`;

    if (accommodation.capacity) {
      popupContent += `
        <div class="popup-detail">
          <span class="popup-icon">👥</span>
          <span>Capacité : ${accommodation.capacity} personnes</span>
        </div>`;
    }

    if (accommodation.distance) {
      popupContent += `
        <div class="popup-detail">
          <span class="popup-icon">📏</span>
          <span>À ${accommodation.distance} du domaine</span>
        </div>`;
    }

    if (accommodation.description) {
      popupContent += `<p class="popup-description">${accommodation.description}</p>`;
    }

    if (accommodation.bookingUrl) {
      popupContent += `
        <a href="${accommodation.bookingUrl}" target="_blank" rel="noopener" class="popup-book-link">
          Réserver →
        </a>`;
    }

    popupContent += `</div>`;
    marker.bindPopup(popupContent);

    this._markersLayer.addLayer(marker);
  },

  // ─── CHARGEMENT DES HÉBERGEMENTS ──────────────────────

  /**
   * Charge les hébergements depuis le Store et met à jour
   * les marqueurs et la liste.
   */
  _loadAccommodations() {
    const accommodations = Store.getAccommodations() || [];

    // Nettoyer les marqueurs existants (sauf le domaine)
    if (this._markersLayer) {
      this._markersLayer.clearLayers();
    }

    // Ajouter les marqueurs
    accommodations.forEach((acc) => this._addAccommodationMarker(acc));

    // Rendre la liste
    this._renderAccommodationsList(accommodations);
  },

  /**
   * Rend la grille de cartes d'hébergements sous la carte.
   * @param {Array} accommodations - Liste des hébergements
   */
  _renderAccommodationsList(accommodations) {
    if (!this._elements.accommodationsList) return;

    if (!accommodations.length) {
      this._elements.accommodationsList.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 3rem 1rem;">
          <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">🏡</span>
          <h3 style="color: #2D5A3D; margin-bottom: 0.5rem;">
            Hébergements à venir
          </h3>
          <p style="color: #888; font-size: 0.95rem;">
            Les suggestions d'hébergements seront bientôt disponibles.
          </p>
        </div>
      `;
      return;
    }

    let html = '<div class="accommodations-grid">';

    accommodations.forEach((acc, index) => {
      const emoji = this._getAccommodationEmoji(acc);

      html += `
        <div class="card accommodation-card" data-accommodation-id="${acc.id}" style="animation-delay: ${index * 100}ms">
          <div class="accommodation-card-header">
            <span class="accommodation-emoji">${emoji}</span>
            <h3 class="accommodation-name">${acc.name || 'Hébergement'}</h3>
          </div>
          <div class="accommodation-card-body">
            ${acc.capacity ? `
              <div class="accommodation-detail">
                <span class="detail-icon">👥</span>
                <span>Capacité : ${acc.capacity} personnes</span>
              </div>
            ` : ''}
            ${acc.distance ? `
              <div class="accommodation-detail">
                <span class="detail-icon">📏</span>
                <span>À ${acc.distance} du domaine</span>
              </div>
            ` : ''}
            ${acc.description ? `
              <p class="accommodation-description">${acc.description}</p>
            ` : ''}
          </div>
          ${acc.bookingUrl ? `
            <div class="accommodation-card-footer">
              <a href="${acc.bookingUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
                Réserver →
              </a>
            </div>
          ` : ''}
        </div>
      `;
    });

    html += '</div>';
    this._elements.accommodationsList.innerHTML = html;

    // Injecter les styles de la grille si nécessaire
    this._injectListStyles();

    // Animer l'apparition des cartes
    if (Animations && Animations.staggerChildren) {
      Animations.staggerChildren(this._elements.accommodationsList, '.accommodation-card', 80);
    }

    // Interaction carte ↔ liste : clic sur une carte centre la carte
    this._elements.accommodationsList.querySelectorAll('.accommodation-card').forEach((card) => {
      card.addEventListener('click', () => {
        const accId = card.dataset.accommodationId;
        const acc = accommodations.find((a) => a.id === accId);
        if (acc && acc.lat && acc.lng && this._map) {
          this._map.flyTo([acc.lat, acc.lng], 15, { duration: 0.8 });
        }
      });
    });
  },

  /**
   * Injecte les styles CSS pour la liste d'hébergements.
   */
  _injectListStyles() {
    if (document.getElementById('map-list-styles')) return;

    const style = document.createElement('style');
    style.id = 'map-list-styles';
    style.textContent = `
      .accommodations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 1rem 0;
      }
      .accommodation-card {
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        opacity: 0;
        animation: card-fade-in 0.5s ease forwards;
      }
      .accommodation-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(45, 90, 61, 0.15);
      }
      .accommodation-card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .accommodation-emoji {
        font-size: 2rem;
        line-height: 1;
      }
      .accommodation-name {
        color: #2D5A3D;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }
      .accommodation-detail {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.4rem;
        font-size: 0.9rem;
        color: #555;
      }
      .detail-icon {
        flex-shrink: 0;
        width: 20px;
        text-align: center;
      }
      .accommodation-description {
        font-size: 0.88rem;
        color: #666;
        line-height: 1.5;
        margin: 0.75rem 0;
      }
      .accommodation-card-footer {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(156, 175, 136, 0.2);
      }
      @keyframes card-fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 640px) {
        .accommodations-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  },
};

/**
 * ============================================================
 * Composant Carpool — Gestion du covoiturage
 * ============================================================
 *
 * Fonctionnalités :
 *   - Affichage en deux colonnes : offres de places / demandes
 *   - Cartes détaillées par trajet (ville, places, jour/heure, contact)
 *   - Filtre de recherche par ville
 *   - Bouton de redirection vers le formulaire RSVP
 *   - Écoute 'guests-changed' pour rafraîchir
 *
 * Les données proviennent de guest.transport (pas de collection carpools séparée).
 */


const Carpool = {
  /** Références DOM */
  _elements: {
    container: null,
  },

  /** Filtre courant */
  _cityFilter: '',

  /** Listeners Store */
  _unsubscribers: [],

  /**
   * Initialise le composant covoiturage.
   */
  init() {
    this._elements.container = document.getElementById('carpool-container');
    if (!this._elements.container) return;

    // Rendu initial
    this._render();

    // Écouter les changements
    const unsub1 = Store.on('guests-changed', () => this._render());
    const unsub2 = Store.on('carpools-changed', () => this._render());

    this._unsubscribers = [unsub1, unsub2];
  },

  /**
   * Nettoie les listeners.
   */
  destroy() {
    this._unsubscribers.forEach((unsub) => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  },

  // ─── EXTRACTION DES DONNÉES ───────────────────────────

  /**
   * Récupère les conducteurs depuis le Store.
   * @returns {Array} Liste des conducteurs avec leurs infos transport
   */
  _getDrivers() {
    const guests = Store.getGuests() || [];
    return guests
      .filter((g) => g.transport && g.transport.type === 'driver')
      .map((g) => ({
        id: g.id,
        name: `${g.firstName} ${g.lastName}`,
        city: g.transport.city || 'Non précisé',
        seatsAvailable: g.transport.seatsAvailable || 0,
        departureDay: g.transport.departureDay || '',
        departureTime: g.transport.departureTime || '',
        contact: g.transport.contact || g.phone || '',
      }));
  },

  /**
   * Récupère les passagers depuis le Store.
   * @returns {Array} Liste des passagers avec leurs infos transport
   */
  _getPassengers() {
    const guests = Store.getGuests() || [];
    return guests
      .filter((g) => g.transport && g.transport.type === 'passenger')
      .map((g) => ({
        id: g.id,
        name: `${g.firstName} ${g.lastName}`,
        city: g.transport.city || 'Non précisé',
        seatsNeeded: g.transport.seatsNeeded || 1,
        departureDay: g.transport.departureDay || '',
        contact: g.transport.contact || g.phone || '',
      }));
  },

  /**
   * Filtre les résultats par ville.
   * @param {Array} list - Liste à filtrer
   * @returns {Array} Liste filtrée
   */
  _filterByCity(list) {
    if (!this._cityFilter) return list;
    const filter = this._cityFilter.toLowerCase().trim();
    return list.filter((item) => 
      (item.city || '').toLowerCase().includes(filter)
    );
  },

  // ─── RENDU ────────────────────────────────────────────

  /**
   * Rend le composant complet.
   */
  _render() {
    if (!this._elements.container) return;

    const allDrivers = this._getDrivers();
    const allPassengers = this._getPassengers();
    const drivers = this._filterByCity(allDrivers);
    const passengers = this._filterByCity(allPassengers);

    const totalSeatsAvailable = allDrivers.reduce((sum, d) => sum + d.seatsAvailable, 0);
    const totalSeatsNeeded = allPassengers.reduce((sum, p) => sum + p.seatsNeeded, 0);

    this._elements.container.innerHTML = `
      <!-- En-tête covoiturage -->
      <div class="carpool-header">
        <div class="carpool-stats">
          <div class="carpool-stat">
            <span class="carpool-stat-number">${allDrivers.length}</span>
            <span class="carpool-stat-label">conducteur${allDrivers.length > 1 ? 's' : ''}</span>
          </div>
          <div class="carpool-stat">
            <span class="carpool-stat-number">${totalSeatsAvailable}</span>
            <span class="carpool-stat-label">place${totalSeatsAvailable > 1 ? 's' : ''} disponible${totalSeatsAvailable > 1 ? 's' : ''}</span>
          </div>
          <div class="carpool-stat-divider"></div>
          <div class="carpool-stat">
            <span class="carpool-stat-number">${allPassengers.length}</span>
            <span class="carpool-stat-label">cherche${allPassengers.length > 1 ? 'nt' : ''} un trajet</span>
          </div>
          <div class="carpool-stat">
            <span class="carpool-stat-number">${totalSeatsNeeded}</span>
            <span class="carpool-stat-label">place${totalSeatsNeeded > 1 ? 's' : ''} demandée${totalSeatsNeeded > 1 ? 's' : ''}</span>
          </div>
        </div>

        <!-- Filtre par ville -->
        <div class="carpool-filter">
          <div class="form-group" style="margin-bottom: 0;">
            <div class="input-with-icon">
              <span class="input-icon">🔍</span>
              <input 
                type="text" 
                id="carpool-city-filter" 
                class="form-control"
                placeholder="Filtrer par ville de départ…" 
                value="${this._cityFilter}"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu en deux colonnes -->
      <div class="carpool-columns">
        <!-- Colonne conducteurs -->
        <div class="carpool-column">
          <h3 class="carpool-column-title">
            <span class="column-icon">🚗</span>
            Places disponibles
            <span class="column-count">${drivers.length}</span>
          </h3>
          <div class="carpool-cards" id="carpool-drivers-list">
            ${drivers.length ? drivers.map((d) => this._renderDriverCard(d)).join('') : `
              <div class="carpool-empty">
                <span class="empty-icon">🚗</span>
                <p>Aucun conducteur pour le moment</p>
              </div>
            `}
          </div>
        </div>

        <!-- Colonne passagers -->
        <div class="carpool-column">
          <h3 class="carpool-column-title">
            <span class="column-icon">🙋</span>
            Recherche de covoiturage
            <span class="column-count">${passengers.length}</span>
          </h3>
          <div class="carpool-cards" id="carpool-passengers-list">
            ${passengers.length ? passengers.map((p) => this._renderPassengerCard(p)).join('') : `
              <div class="carpool-empty">
                <span class="empty-icon">🙋</span>
                <p>Aucune demande pour le moment</p>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Bouton CTA -->
      <div class="carpool-cta">
        <button class="btn btn-primary" id="carpool-cta-btn">
          Proposer ou chercher un covoiturage
        </button>
      </div>
    `;

    // Attacher les listeners
    this._attachListeners();

    // Injecter les styles
    this._injectStyles();

    // Animer les cartes
    if (Animations && Animations.staggerChildren) {
      Animations.staggerChildren(this._elements.container, '.carpool-card', 60);
    }
  },

  /**
   * Rend la carte d'un conducteur.
   * @param {Object} driver - Données du conducteur
   * @returns {string} HTML de la carte
   */
  _renderDriverCard(driver) {
    return `
      <div class="card carpool-card carpool-card--driver">
        <div class="carpool-card-header">
          <span class="carpool-card-avatar">🚗</span>
          <div>
            <h4 class="carpool-card-name">${driver.name}</h4>
            <span class="carpool-card-city">📍 ${driver.city}</span>
          </div>
        </div>
        <div class="carpool-card-details">
          <div class="carpool-detail">
            <span class="detail-label">Places disponibles</span>
            <span class="detail-value carpool-seats">${driver.seatsAvailable}</span>
          </div>
          ${driver.departureDay ? `
            <div class="carpool-detail">
              <span class="detail-label">Jour de départ</span>
              <span class="detail-value">${driver.departureDay}</span>
            </div>
          ` : ''}
          ${driver.departureTime ? `
            <div class="carpool-detail">
              <span class="detail-label">Heure</span>
              <span class="detail-value">${driver.departureTime}</span>
            </div>
          ` : ''}
        </div>
        ${driver.contact ? `
          <div class="carpool-card-footer">
            <a href="tel:${driver.contact}" class="carpool-contact-link">
              📱 ${driver.contact}
            </a>
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Rend la carte d'un passager.
   * @param {Object} passenger - Données du passager
   * @returns {string} HTML de la carte
   */
  _renderPassengerCard(passenger) {
    return `
      <div class="card carpool-card carpool-card--passenger">
        <div class="carpool-card-header">
          <span class="carpool-card-avatar">🙋</span>
          <div>
            <h4 class="carpool-card-name">${passenger.name}</h4>
            <span class="carpool-card-city">📍 ${passenger.city}</span>
          </div>
        </div>
        <div class="carpool-card-details">
          <div class="carpool-detail">
            <span class="detail-label">Places nécessaires</span>
            <span class="detail-value carpool-seats">${passenger.seatsNeeded}</span>
          </div>
          ${passenger.departureDay ? `
            <div class="carpool-detail">
              <span class="detail-label">Jour souhaité</span>
              <span class="detail-value">${passenger.departureDay}</span>
            </div>
          ` : ''}
        </div>
        ${passenger.contact ? `
          <div class="carpool-card-footer">
            <a href="tel:${passenger.contact}" class="carpool-contact-link">
              📱 ${passenger.contact}
            </a>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ─── LISTENERS ────────────────────────────────────────

  /**
   * Attache les event listeners après le rendu.
   */
  _attachListeners() {
    // Filtre par ville
    const filterInput = document.getElementById('carpool-city-filter');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        this._cityFilter = e.target.value;
        this._render();
        // Remettre le focus sur le champ
        const newInput = document.getElementById('carpool-city-filter');
        if (newInput) {
          newInput.focus();
          newInput.selectionStart = newInput.selectionEnd = newInput.value.length;
        }
      });
    }

    // Bouton CTA
    const ctaBtn = document.getElementById('carpool-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        Router.navigate('#/rsvp');
      });
    }
  },

  // ─── STYLES ───────────────────────────────────────────

  /**
   * Injecte les styles CSS du composant.
   */
  _injectStyles() {
    if (document.getElementById('carpool-styles')) return;

    const style = document.createElement('style');
    style.id = 'carpool-styles';
    style.textContent = `
      .carpool-header {
        margin-bottom: 2rem;
      }
      .carpool-stats {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, rgba(45, 90, 61, 0.05), rgba(156, 175, 136, 0.1));
        border-radius: 16px;
      }
      .carpool-stat {
        text-align: center;
      }
      .carpool-stat-number {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: #2D5A3D;
        line-height: 1;
      }
      .carpool-stat-label {
        font-size: 0.8rem;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .carpool-stat-divider {
        width: 1px;
        height: 40px;
        background: rgba(156, 175, 136, 0.3);
      }
      .carpool-filter {
        max-width: 400px;
        margin: 0 auto;
      }
      .input-with-icon {
        position: relative;
      }
      .input-with-icon .input-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 1rem;
      }
      .input-with-icon .form-control {
        padding-left: 2.8rem;
      }

      .carpool-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      .carpool-column-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #2D5A3D;
        font-size: 1.15rem;
        font-weight: 600;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid rgba(156, 175, 136, 0.3);
      }
      .column-icon {
        font-size: 1.3rem;
      }
      .column-count {
        margin-left: auto;
        background: #2D5A3D;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
      }

      .carpool-cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .carpool-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .carpool-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      }
      .carpool-card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .carpool-card-avatar {
        font-size: 1.8rem;
        line-height: 1;
      }
      .carpool-card-name {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #2D5A3D;
      }
      .carpool-card-city {
        font-size: 0.85rem;
        color: #888;
      }
      .carpool-card-details {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .carpool-detail {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .detail-label {
        font-size: 0.75rem;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .detail-value {
        font-size: 0.95rem;
        font-weight: 500;
        color: #333;
      }
      .carpool-seats {
        font-size: 1.2rem;
        font-weight: 700;
        color: #C9A84C;
      }
      .carpool-card-footer {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(156, 175, 136, 0.15);
      }
      .carpool-contact-link {
        color: #2D5A3D;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        transition: color 0.2s;
      }
      .carpool-contact-link:hover {
        color: #C9A84C;
      }

      .carpool-empty {
        text-align: center;
        padding: 2rem 1rem;
        color: #aaa;
      }
      .carpool-empty .empty-icon {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }

      .carpool-cta {
        text-align: center;
        padding: 1.5rem 0;
      }

      @media (max-width: 768px) {
        .carpool-columns {
          grid-template-columns: 1fr;
        }
        .carpool-stats {
          gap: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  },
};


const GuestProfile = {
  container: null,

  init() {
    this.container = document.getElementById('guest-profile-container');
    if (!this.container) return;
    
    this.render();
    
    // Auto refresh when auth or guests change
    Store.on('auth-changed', () => this.render());
    Store.on('guests-changed', () => {
       // Only render if we are currently looking at a guest profile
       if (Store.getCurrentGuest()) this.render();
    });
  },

  render() {
    if (!this.container) return;
    const guest = Store.getCurrentGuest();
    
    if (!guest) {
      this.container.innerHTML = this.renderLoginForm();
      this.attachLoginEvents();
    } else {
      this.container.innerHTML = this.renderProfile(guest);
      this.attachProfileEvents();
      
      // Animate children
      const cards = this.container.querySelectorAll('.card');
      cards.forEach((c, idx) => {
        c.style.opacity = '0';
        setTimeout(() => Animations.fadeIn(c), idx * 100);
      });
    }
  },

  renderLoginForm() {
    return `
      <div class="card form-steps-card">
        <h3 class="text-center">Retrouvez vos réponses</h3>
        <p class="text-center text-muted mb-4">Entrez l'adresse email utilisée lors de votre inscription pour retrouver vos réponses.</p>
        <div class="form-group">
          <label>Adresse Email</label>
          <input type="email" id="login-email" required>
        </div>
        <div class="text-center mt-4">
          <button type="button" class="btn btn--primary" id="login-btn">Rechercher</button>
        </div>
      </div>
    `;
  },

  renderProfile(guest) {
    // Helper pour badges de régime
    const getDietBadges = (dietArr, allergyDetails) => {
      if (!dietArr || dietArr.length === 0) return '<span class="text-muted">Aucun régime particulier</span>';
      let html = '';
      if (dietArr.includes('vegetarian')) html += '<span class="badge badge--vegetarian">Végétarien</span> ';
      if (dietArr.includes('vegan')) html += '<span class="badge badge--vegan">Végan</span> ';
      if (dietArr.includes('no-alcohol')) html += '<span class="badge badge--no-alcohol">Sans alcool</span> ';
      if (dietArr.includes('allergy')) html += `<span class="badge badge--allergy">Allergie : ${allergyDetails}</span> `;
      return html;
    };

    return `
      <div class="profile-header text-center mb-4">
        <h2>Bonjour ${guest.firstName},</h2>
        <p class="text-muted">Voici le récapitulatif de vos réponses.</p>
      </div>

      <div class="admin-grid">
        <div class="card mb-4">
          <h3>Présence</h3>
          <p>
            ${guest.attending === true 
              ? '<span class="badge badge--confirmed text-white px-2 py-1 radius-sm">Confirmée ✅</span>' 
              : '<span class="badge badge--declined text-white px-2 py-1 radius-sm">Déclinée ❌</span>'}
          </p>
          ${guest.attending ? `
            <p class="mt-2"><strong>Accompagnants :</strong> ${guest.companions.length > 0 ? guest.companions.map(c => c.name).join(', ') : 'Aucun'}</p>
          ` : ''}
        </div>

        <div class="card mb-4">
          <h3>Coordonnées</h3>
          <p><strong>Nom :</strong> ${guest.firstName} ${guest.lastName}</p>
          <p><strong>Email :</strong> ${guest.email}</p>
          <p><strong>Tél :</strong> ${guest.phone || '-'}</p>
        </div>
      </div>

      ${guest.attending ? `
      <div class="card mb-4">
        <h3>Régimes alimentaires</h3>
        <div class="mb-3">
          <strong>Pour vous :</strong><br>
          ${getDietBadges(guest.diet, guest.allergyDetails)}
        </div>
        ${guest.companions.map((c) => `
          <div class="mb-3">
            <strong>Pour ${c.name} :</strong><br>
            ${getDietBadges(c.diet, c.allergyDetails)}
          </div>
        `).join('')}
      </div>

      <div class="card mb-4">
        <h3>Transport & Covoiturage</h3>
        ${guest.transport.type === 'none' ? '<p>Vous vous organisez par vos propres moyens.</p>' : ''}
        ${guest.transport.type === 'driver' ? `
          <p><span class="badge badge--vegetarian">Conducteur</span> <strong>Départ de :</strong> ${guest.transport.city}</p>
          <p><strong>Places proposées :</strong> ${guest.transport.seatsAvailable}</p>
          <p><strong>Jour :</strong> ${guest.transport.departureDay}</p>
          <p><strong>Heure :</strong> ${guest.transport.departureTime || 'Non précisée'}</p>
          <p><strong>Contact :</strong> ${guest.transport.contact}</p>
        ` : ''}
        ${guest.transport.type === 'passenger' ? `
          <p><span class="badge badge--pending">Recherche place(s)</span> <strong>Au départ de :</strong> ${guest.transport.city}</p>
          <p><strong>Places nécessaires :</strong> ${guest.transport.seatsNeeded}</p>
          <p><strong>Jour :</strong> ${guest.transport.departureDay}</p>
          <p><strong>Contact :</strong> ${guest.transport.contact}</p>
        ` : ''}
      </div>
      ` : ''}

      <div class="text-center mt-4 form-actions">
        <button type="button" class="btn btn--secondary" id="logout-btn">Se déconnecter</button>
        <button type="button" class="btn btn--primary" id="edit-btn">Modifier mes réponses</button>
      </div>
    `;
  },

  attachLoginEvents() {
    const loginBtn = this.container.querySelector('#login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const email = this.container.querySelector('#login-email').value.trim();
        if (!email) {
          Animations.showToast('Veuillez entrer une adresse email.', 'error');
          return;
        }
        
        const guest = Store.getGuestByEmail(email);
        if (guest) {
          Store.setCurrentGuest(guest.id);
          Animations.showToast('Profil trouvé avec succès !', 'success');
        } else {
           Animations.showToast('Aucune réponse trouvée avec cet email.', 'error');
        }
      });
    }
  },

  attachProfileEvents() {
    const logoutBtn = this.container.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Store.clearCurrentGuest();
        Animations.showToast('Déconnexion réussie.', 'success');
      });
    }

    const editBtn = this.container.querySelector('#edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        Router.navigate('#/rsvp');
      });
    }
  }
};


const AdminDashboard = {
  loginBtn: null,
  logoutBtn: null,

  init() {
    // Événements login
    this.loginBtn = document.getElementById('admin-login-btn');
    if (this.loginBtn) {
      this.loginBtn.addEventListener('click', () => {
        const password = document.getElementById('admin-password').value;
        const errDiv = document.getElementById('admin-error');
        if (Store.adminLogin(password)) {
          if(errDiv) errDiv.style.display = 'none';
          document.getElementById('admin-password').value = '';
          Animations.showToast("Connexion réussie", "success");
          Router.navigate('#/admin/dashboard');
        } else {
          if(errDiv) {
            errDiv.textContent = "Mot de passe incorrect";
            errDiv.style.display = 'block';
            errDiv.style.color = 'red';
            errDiv.style.marginTop = '10px';
          }
          Animations.showToast("Mot de passe incorrect", "error");
        }
      });
    }

    // Événements logout
    this.logoutBtn = document.getElementById('admin-logout-btn');
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        Store.adminLogout();
        Animations.showToast("Déconnexion", "success");
        Router.navigate('#/admin');
      });
    }

    // Auto-refresh quand les données changent (si on est sur le dashboard)
    const refreshIfActive = () => {
      if (Router.getCurrentRoute() === '#/admin/dashboard' && Store.isAdmin()) {
        this.renderDashboard();
      }
    };

    Store.on('guests-changed', refreshIfActive);
    Store.on('carpools-changed', refreshIfActive);
    Store.on('accommodations-changed', refreshIfActive);
    
    // Si on navigue sur le dashboard, rendre les données
    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/admin/dashboard') {
        if (!Store.isAdmin()) {
          Router.navigate('#/admin');
          return;
        }
        this.renderDashboard();
      }
    });
  },

  renderDashboard() {
    this.renderStats();
    this.renderDiets();
    this.renderGuestsList();
    this.renderCarpools();
    this.renderAccommodations();
  },

  renderStats() {
    const stats = Store.getStats();
    
    const setStat = (id, number, label) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="stat-card__number">${number}</div><div class="stat-card__label">${label}</div>`;
    };

    setStat('stat-total', stats.totalGuests, `Foyers invités (${stats.totalPeople} pers.)`);
    setStat('stat-confirmed', stats.confirmed, `Confirmés (${stats.confirmedPeople} pers.)`);
    setStat('stat-declined', stats.declined, 'Déclinés');
    setStat('stat-pending', stats.pending, 'En attente');
  },

  renderDiets() {
    const stats = Store.getStats();
    const container = document.getElementById('admin-diets');
    if (!container) return;

    let html = `
      <div class="admin-grid mb-4">
        <div class="card">
          <h4>Végétariens</h4>
          <div class="stat-card__number" style="color: var(--sage)">${stats.diets.vegetarian}</div>
        </div>
        <div class="card">
          <h4>Végans</h4>
          <div class="stat-card__number" style="color: var(--forest)">${stats.diets.vegan}</div>
        </div>
        <div class="card">
          <h4>Sans alcool</h4>
          <div class="stat-card__number" style="color: #6a9bd8">${stats.diets.noAlcohol}</div>
        </div>
      </div>
    `;

    if (stats.diets.allergies.length > 0) {
      html += `
        <div class="card">
          <h4>Allergies déclarées</h4>
          <ul style="margin-top: 10px; padding-left: 20px;">
            ${stats.diets.allergies.map(a => `<li><strong>${a.name} :</strong> ${a.details}</li>`).join('')}
          </ul>
        </div>
      `;
    } else {
      html += `<div class="card"><p class="text-muted">Aucune allergie déclarée pour le moment.</p></div>`;
    }

    container.innerHTML = html;
  },

  renderGuestsList() {
    const container = document.getElementById('admin-guests-list');
    if (!container) return;
    const guests = Store.getGuests();

    if (guests.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-4">Aucune réponse pour le moment.</p>';
      return;
    }

    let html = `
      <div class="table-responsive">
        <table class="admin-table" style="width:100%; border-collapse: collapse; margin-top:20px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--gold); text-align: left;">
              <th style="padding: 10px;">Nom</th>
              <th style="padding: 10px;">Présence</th>
              <th style="padding: 10px;">Accomp.</th>
              <th style="padding: 10px;">Contact</th>
              <th style="padding: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    guests.forEach((g, idx) => {
      const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
      let presence = '<span class="badge badge--pending">En attente</span>';
      if (g.attending === true) presence = '<span class="badge badge--confirmed">Oui</span>';
      if (g.attending === false) presence = '<span class="badge badge--declined">Non</span>';

      html += `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #eee;">
          <td style="padding: 10px;"><strong>${g.firstName} ${g.lastName}</strong></td>
          <td style="padding: 10px;">${presence}</td>
          <td style="padding: 10px;">${g.companions.length}</td>
          <td style="padding: 10px;">${g.email}<br><small>${g.phone || ''}</small></td>
          <td style="padding: 10px;">
            <button class="btn btn--outline delete-guest-btn" data-id="${g.id}" style="padding: 4px 8px; font-size: 12px; color: red; border-color: red;">Supprimer</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;

    // Attach delete events
    container.querySelectorAll('.delete-guest-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cet invité et toutes ses données associées (covoiturage) ?")) {
          Store.deleteGuest(e.target.dataset.id);
          Animations.showToast("Invité supprimé", "success");
        }
      });
    });
  },

  renderCarpools() {
    const container = document.getElementById('admin-carpools');
    if (!container) return;
    const stats = Store.getStats();
    
    let html = `
      <div class="admin-grid mb-4">
        <div class="card" style="border-left: 4px solid var(--sage);">
          <h4>Conducteurs</h4>
          <p class="text-muted mt-2">${stats.transport.drivers} voitures proposent un total de <strong>${stats.transport.seatsAvailable} places</strong>.</p>
        </div>
        <div class="card" style="border-left: 4px solid var(--gold);">
          <h4>Recherche de places</h4>
          <p class="text-muted mt-2">${stats.transport.needRide} personnes ont besoin d'un total de <strong>${stats.transport.seatsNeeded} places</strong>.</p>
        </div>
      </div>
      <p class="text-center mt-2"><a href="#/covoiturage" class="btn btn--secondary">Gérer les covoiturages sur la page publique</a></p>
    `;
    
    container.innerHTML = html;
  },

  renderAccommodations() {
    const container = document.getElementById('admin-accommodations');
    if (!container) return;
    const accommodations = Store.getAccommodations();

    let html = `
      <div class="mb-4">
        <button class="btn btn--primary" id="add-acc-btn">+ Ajouter un hébergement</button>
      </div>
      <div class="carpool-list" style="margin-top: 20px;">
    `;

    accommodations.forEach(acc => {
      html += `
        <div class="card mb-3">
          <h4>${acc.name}</h4>
          <p class="text-muted"><small>📍 ${acc.lat}, ${acc.lng} | 🛏️ Capacité : ${acc.capacity}</small></p>
          <div class="mt-3">
            <button class="btn btn--outline delete-acc-btn" data-id="${acc.id}" style="padding: 4px 8px; font-size: 12px; color: red; border-color: red;">Supprimer</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    const addBtn = container.querySelector('#add-acc-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const name = prompt("Nom de l'hébergement :");
        if (!name) return;
        const lat = prompt("Latitude (ex: 45.42) :");
        const lng = prompt("Longitude (ex: 4.59) :");
        const capacity = prompt("Capacité (ex: 4 personnes) :");
        
        Store.saveAccommodation({
          name, lat: parseFloat(lat) || 45.411, lng: parseFloat(lng) || 4.588, capacity, 
          description: "", distance: "", bookingUrl: ""
        });
        Animations.showToast("Hébergement ajouté", "success");
      });
    }

    container.querySelectorAll('.delete-acc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm("Supprimer cet hébergement ?")) {
          Store.deleteAccommodation(e.target.dataset.id);
          Animations.showToast("Hébergement supprimé", "success");
        }
      });
    });
  }
};

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
