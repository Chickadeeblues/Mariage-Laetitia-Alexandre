/**
 * store.js — Module de persistance des données
 * 
 * Gère toute la persistance via localStorage pour l'application
 * de mariage Laetitia & Alexandre.
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

// Hash SHA-256 du mot de passe administrateur
const ADMIN_PASSWORD_HASH = '2efdd4eeac99f6be0f0e0bea27dbbbbcb91e00c998f783a223afd7d24ad57a52';

// Fonction de hachage utilisant l'API Web Crypto native
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

  _generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  _getData(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`[Store] Erreur lecture localStorage pour "${key}":`, e);
      return null;
    }
  },

  _setData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[Store] Erreur écriture localStorage pour "${key}":`, e);
    }
  },

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

  on(event, callback) {
    if (!_listeners[event]) {
      _listeners[event] = [];
    }
    _listeners[event].push(callback);
  },

  off(event, callback) {
    if (_listeners[event]) {
      _listeners[event] = _listeners[event].filter((cb) => cb !== callback);
    }
  },

  // ════════════════════════════════════════════
  // Initialisation
  // ════════════════════════════════════════════

  init() {
    if (!this._getData(STORAGE_KEYS.GUESTS)) {
      this._setData(STORAGE_KEYS.GUESTS, []);
    }
    if (!this._getData(STORAGE_KEYS.CARPOOLS)) {
      this._setData(STORAGE_KEYS.CARPOOLS, []);
    }
    if (!this._getData(STORAGE_KEYS.ACCOMMODATIONS)) {
      this._setData(STORAGE_KEYS.ACCOMMODATIONS, DEFAULT_ACCOMMODATIONS);
    }
    console.log('[Store] Initialisation terminée.');
  },

  // ════════════════════════════════════════════
  // Gestion des invités (Guests)
  // ════════════════════════════════════════════

  getGuests() {
    return this._getData(STORAGE_KEYS.GUESTS) || [];
  },

  getGuest(id) {
    const guests = this.getGuests();
    return guests.find((g) => g.id === id);
  },

  getGuestByPhone(phone) {
    if (!phone) return undefined;
    const guests = this.getGuests();
    const cleanPhone = phone.replace(/[\s\-\.]/g, '');
    return guests.find((g) => g.phone && g.phone.replace(/[\s\-\.]/g, '') === cleanPhone);
  },

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
        mode: 'car',          // Correction de l'ancien 'type'
        carpoolRole: 'none',  // Ajout du nouveau rôle
        city: '',
        seatsAvailable: 1,
        seatsNeeded: 1,
        departureDay: '',
        departureTime: '',
        contactPhone: '',     // Alignement avec le nouveau RSVP
        contactEmail: ''      // Alignement avec le nouveau RSVP
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

  updateGuest(id, data) {
    const guests = this.getGuests();
    const index = guests.findIndex((g) => g.id === id);

    if (index === -1) {
      console.warn(`[Store] Invité introuvable pour mise à jour : ${id}`);
      return null;
    }

    guests[index] = {
      ...guests[index],
      ...data,
      id: guests[index].id,
      createdAt: guests[index].createdAt,
      updatedAt: new Date().toISOString()
    };

    this._setData(STORAGE_KEYS.GUESTS, guests);
    this._emit('guests-changed');

    console.log(`[Store] Invité mis à jour : ${guests[index].firstName} ${guests[index].lastName}`);
    return guests[index];
  },

 deleteGuest(id) {
    let guests = this.getGuests();
    const guest = guests.find((g) => g.id === id);

    if (guest) {
      // 1. Supprimer l'invité
      guests = guests.filter((g) => g.id !== id);
      this._setData(STORAGE_KEYS.GUESTS, guests);
      this._emit('guests-changed');
      console.log(`[Store] Invité supprimé : ${guest.firstName} ${guest.lastName}`);

      // 2. CORRECTION : Supprimer ses covoiturages associés
      let carpools = this.getCarpools();
      const filteredCarpools = carpools.filter(c => c.guestId !== id);
      if (carpools.length !== filteredCarpools.length) {
        this._setData(STORAGE_KEYS.CARPOOLS, filteredCarpools);
        this._emit('carpools-changed');
      }

      // 3. Vider la session si besoin
      if (this._getData(STORAGE_KEYS.CURRENT_GUEST) === id) {
        this.clearCurrentGuest();
      }
    }
  },
  // ════════════════════════════════════════════
  // Session invité courant
  // ════════════════════════════════════════════

  getCurrentGuest() {
    const guestId = this._getData(STORAGE_KEYS.CURRENT_GUEST);
    if (!guestId) return null;
    return this.getGuest(guestId) || null;
  },

  setCurrentGuest(guestId) {
    this._setData(STORAGE_KEYS.CURRENT_GUEST, guestId);
    this._emit('auth-changed');
    console.log(`[Store] Invité courant défini : ${guestId}`);
  },

  clearCurrentGuest() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GUEST);
    this._emit('auth-changed');
    console.log('[Store] Session invité effacée.');
  },

  // ════════════════════════════════════════════
  // Gestion des covoiturages (Carpools)
  // ════════════════════════════════════════════

  getCarpools() {
    return this._getData(STORAGE_KEYS.CARPOOLS) || [];
  },

  getCarpoolsByType(type) {
    return this.getCarpools().filter((c) => c.type === type);
  },

  getCarpoolsByGuestId(guestId) {
    return this.getCarpools().filter((c) => c.guestId === guestId);
  },

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

  getAccommodations() {
    return this._getData(STORAGE_KEYS.ACCOMMODATIONS) || [];
  },

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

  async adminLogin(password) {
    const hash = await hashPassword(password);
    if (hash === ADMIN_PASSWORD_HASH) {
      this._setData(STORAGE_KEYS.ADMIN_AUTH, {
        authenticated: true,
        timestamp: new Date().toISOString()
      });
      this._emit('auth-changed');
      console.log('[Store] Connexion admin réussie.');
      return true;
    }
    console.warn('[Store] Échec de connexion admin.');
    return false;
  },

  adminLogout() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    this._emit('auth-changed');
    console.log('[Store] Déconnexion admin.');
  },

  isAdmin() {
    const auth = this._getData(STORAGE_KEYS.ADMIN_AUTH);
    return auth !== null && auth.authenticated === true;
  },

  // ════════════════════════════════════════════
  // Statistiques
  // ════════════════════════════════════════════

  getStats() {
    const guests = this.getGuests();
    const carpools = this.getCarpools();

    const totalGuests = guests.length;

    const totalPeople = guests.reduce((sum, g) => {
      return sum + 1 + (g.companions ? g.companions.length : 0);
    }, 0);

    const confirmedGuests = guests.filter((g) => g.attending === true);
    const confirmed = confirmedGuests.length;

    const confirmedPeople = confirmedGuests.reduce((sum, g) => {
      return sum + 1 + (g.companions ? g.companions.length : 0);
    }, 0);

    const declined = guests.filter((g) => g.attending === false).length;
    const pending = guests.filter((g) => g.attending === null || g.attending === undefined).length;

    let vegetarian = 0;
    let vegan = 0;
    let noAlcohol = 0;
    const allergies = [];

    const countDiets = (dietArray, name, allergyDetails) => {
      if (!dietArray || !Array.isArray(dietArray)) return;
      if (dietArray.includes('vegetarian')) vegetarian++;
      if (dietArray.includes('vegan')) vegan++;
      if (dietArray.includes('no-alcohol')) noAlcohol++;
      if (dietArray.includes('allergy') && allergyDetails) {
        allergies.push({ name, details: allergyDetails });
      }
    };

    confirmedGuests.forEach((guest) => {
      const guestName = `${guest.firstName} ${guest.lastName}`.trim();
      countDiets(guest.diet, guestName, guest.allergyDetails);

      if (guest.companions && Array.isArray(guest.companions)) {
        guest.companions.forEach((companion) => {
          countDiets(companion.diet, companion.name || 'Accompagnant', companion.allergyDetails);
        });
      }
    });

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
      diets: { vegetarian, vegan, noAlcohol, allergies },
      transport: { drivers, seatsAvailable, needRide, seatsNeeded }
    };
  }
};

export default Store;
