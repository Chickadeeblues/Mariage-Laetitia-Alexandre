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
const ADMIN_PASSWORD = 'ChatRenard';

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
    description: 'Hébergement sur le lieu de réception. Contactez les mariés pour les disponibilités. Tarif sur demande.',
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
    description: 'Gîte de 100m² avec vue panoramique. ~100€/nuit.',
    bookingUrl: 'https://www.gites-de-france.com',
    distance: '~3 km',
    icon: 'gite'
  },
  {
    id: 'acc-3',
    name: 'Chez Delphine (Chambre d\'hôtes)',
    lat: 45.415,
    lng: 4.595,
    capacity: '2 à 4 pers.',
    description: 'Chambre d\'hôtes dans un cadre paisible. ~85€/nuit.',
    bookingUrl: 'https://www.escapade-chezdelphine.fr',
    distance: '~3 km',
    icon: 'chambre'
  },
  {
    id: 'acc-4',
    name: 'Hôtel Restaurant Éclosion',
    lat: 45.415,
    lng: 4.575,
    capacity: 'Variable',
    description: 'Chambres tout confort. À partir de ~120€/nuit.',
    bookingUrl: 'https://eclosion-restaurant.fr',
    distance: '~4 km',
    icon: 'chambre'
  },
  {
    id: 'acc-5',
    name: 'Camping Le Bessat / Croix de Chaubouret',
    lat: 45.378,
    lng: 4.515,
    capacity: 'Tentes & Chalets',
    description: 'Camping nature pour petits budgets. À partir de ~20€/nuit.',
    bookingUrl: 'https://www.pilat-tourisme.fr',
    distance: '~12 km',
    icon: 'gite'
  },
  {
    id: 'acc-6',
    name: 'Options Airbnb (Parc du Pilat)',
    lat: 45.395,
    lng: 4.550,
    capacity: 'Variable',
    description: 'Recherchez des gîtes ou chambres sur Airbnb dans un rayon de 20 km. Tarifs variables.',
    bookingUrl: 'https://www.airbnb.fr/s/Doizieux--France',
    distance: '< 20 km',
    icon: 'gite'
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
   * Retourne un invité par numéro de téléphone
   * @returns {Object|undefined} L'invité trouvé ou undefined
   */
  getGuestByPhone(phone) {
    if (!phone) return undefined;
    const guests = this.getGuests();
    const cleanPhone = phone.replace(/[\s\-\.]/g, '');
    return guests.find((g) => g.phone && g.phone.replace(/[\s\-\.]/g, '') === cleanPhone);
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

export default Store;
