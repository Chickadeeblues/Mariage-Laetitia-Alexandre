/**
 * store.js — Module de persistance des données
 *
 * Toutes les données sont stockées dans Supabase (cloud).
 * Le localStorage est conservé uniquement pour la session
 * de l'invité courant et l'authentification admin.
 */

// ──────────────────────────────────────────────
// Configuration Supabase
// ──────────────────────────────────────────────
const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation'
};

// ──────────────────────────────────────────────
// Clés localStorage (session uniquement)
// ──────────────────────────────────────────────
const LOCAL = {
  CURRENT_GUEST: 'wedding_current_guest_id',
  ADMIN_AUTH:    'wedding_admin_auth'
};

// ──────────────────────────────────────────────
// Hash SHA-256 du mot de passe administrateur
// ──────────────────────────────────────────────
const ADMIN_PASSWORD_HASH = '2efdd4eeac99f6be0f0e0bea27dbbbbcb91e00c998f783a223afd7d24ad57a52';

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ──────────────────────────────────────────────
// Hébergements par défaut (insérés au 1er init)
// ──────────────────────────────────────────────
const DEFAULT_ACCOMMODATIONS = [
  {
    name: 'Domaine de la Scie du May',
    lat: 45.4113, lng: 4.5889, capacity: 'Variable',
    description: 'Hébergement sur le lieu de réception. Contactez les mariés pour les disponibilités.',
    booking_url: '', distance: 'Sur place', icon: 'venue'
  },
  {
    name: 'La Roche du Pilat',
    lat: 45.418, lng: 4.605, capacity: '6 personnes',
    description: 'Gîte de 100m² avec vue panoramique. ~100€/nuit.',
    booking_url: 'https://www.gites-de-france.com', distance: '~3 km', icon: 'gite'
  },
  {
    name: "Chez Delphine (Chambre d'hôtes)",
    lat: 45.415, lng: 4.595, capacity: '2 à 4 pers.',
    description: "Chambre d'hôtes dans un cadre paisible. ~85€/nuit.",
    booking_url: 'https://www.escapade-chezdelphine.fr', distance: '~3 km', icon: 'chambre'
  },
  {
    name: 'Hôtel Restaurant Éclosion',
    lat: 45.415, lng: 4.575, capacity: 'Variable',
    description: 'Chambres tout confort. À partir de ~120€/nuit.',
    booking_url: 'https://eclosion-restaurant.fr', distance: '~4 km', icon: 'chambre'
  },
  {
    name: 'Camping Le Bessat / Croix de Chaubouret',
    lat: 45.378, lng: 4.515, capacity: 'Tentes & Chalets',
    description: 'Camping nature pour petits budgets. À partir de ~20€/nuit.',
    booking_url: 'https://www.pilat-tourisme.fr', distance: '~12 km', icon: 'gite'
  },
  {
    name: 'Options Airbnb (Parc du Pilat)',
    lat: 45.395, lng: 4.550, capacity: 'Variable',
    description: 'Recherchez des gîtes ou chambres sur Airbnb dans un rayon de 20 km.',
    booking_url: 'https://www.airbnb.fr/s/Doizieux--France', distance: '< 20 km', icon: 'gite'
  }
];

// ──────────────────────────────────────────────
// Système d'événements interne
// ──────────────────────────────────────────────
const _listeners = {};

// ──────────────────────────────────────────────
// Utilitaire : appel API Supabase
// ──────────────────────────────────────────────
async function supabase(method, table, { filter = '', body = null } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${filter ? '?' + filter : ''}`;
  const opts = { method, headers: { ...HEADERS } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Supabase] ${method} ${table} — ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ──────────────────────────────────────────────
// Conversion snake_case ↔ camelCase
// (Supabase renvoie snake_case, l'appli utilise camelCase)
// ──────────────────────────────────────────────
function toApp(g) {
  if (!g) return null;
  return {
    id:             g.id,
    firstName:      g.first_name,
    lastName:       g.last_name,
    phone:          g.phone,
    email:          g.email,
    attending:      g.attending,
    companions:     g.companions  || [],
    diet:           g.diet        || [],
    allergyDetails: g.allergy_details,
    brunch:         g.brunch,
    transport:      g.transport   || {},
    createdAt:      g.created_at,
    updatedAt:      g.updated_at
  };
}

function toDb(data) {
  const obj = {};
  if (data.firstName      !== undefined) obj.first_name      = data.firstName;
  if (data.lastName       !== undefined) obj.last_name       = data.lastName;
  if (data.phone          !== undefined) obj.phone           = data.phone;
  if (data.email          !== undefined) obj.email           = data.email;
  if (data.attending      !== undefined) obj.attending       = data.attending;
  if (data.companions     !== undefined) obj.companions      = data.companions;
  if (data.diet           !== undefined) obj.diet            = data.diet;
  if (data.allergyDetails !== undefined) obj.allergy_details = data.allergyDetails;
  if (data.brunch         !== undefined) obj.brunch          = data.brunch;
  if (data.transport      !== undefined) obj.transport       = data.transport;
  obj.updated_at = new Date().toISOString();
  return obj;
}

function carpoolToApp(c) {
  if (!c) return null;
  return {
    id:            c.id,
    guestId:       c.guest_id,
    type:          c.type,
    city:          c.city,
    seatsAvailable: c.seats_available,
    seatsNeeded:   c.seats_needed,
    departureDay:  c.departure_day,
    departureTime: c.departure_time,
    contact:       c.contact,
    createdAt:     c.created_at
  };
}

function accToApp(a) {
  if (!a) return null;
  return {
    id:          a.id,
    name:        a.name,
    lat:         a.lat,
    lng:         a.lng,
    capacity:    a.capacity,
    description: a.description,
    distance:    a.distance,
    bookingUrl:  a.booking_url,
    icon:        a.icon,
    createdAt:   a.created_at
  };
}

// ──────────────────────────────────────────────
// Store principal
// ──────────────────────────────────────────────
const Store = {

  // ════════════════════════════════════════════
  // Événements
  // ════════════════════════════════════════════

  on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
  },

  off(event, callback) {
    if (_listeners[event])
      _listeners[event] = _listeners[event].filter(cb => cb !== callback);
  },

  _emit(event) {
    (_listeners[event] || []).forEach(cb => { try { cb(); } catch(e) { console.error(e); } });
  },

  // ════════════════════════════════════════════
  // Initialisation
  // ════════════════════════════════════════════

  async init() {
    try {
      // Insérer les hébergements par défaut s'il n'y en a pas
      const existing = await supabase('GET', 'accommodations', { filter: 'select=id&limit=1' });
      if (!existing || existing.length === 0) {
        for (const acc of DEFAULT_ACCOMMODATIONS) {
          await supabase('POST', 'accommodations', { body: acc });
        }
        console.log('[Store] Hébergements par défaut insérés.');
      }
      console.log('[Store] Initialisation Supabase terminée.');
    } catch (e) {
      console.error('[Store] Erreur init :', e);
    }
  },

  // ════════════════════════════════════════════
  // Invités
  // ════════════════════════════════════════════

  async getGuests() {
    const rows = await supabase('GET', 'guests', { filter: 'select=*&order=created_at.asc' });
    return rows.map(toApp);
  },

  async getGuest(id) {
    const rows = await supabase('GET', 'guests', { filter: `select=*&id=eq.${id}` });
    return toApp(rows[0] || null);
  },

  async getGuestByPhone(phone) {
    if (!phone) return null;
    const clean = phone.replace(/[\s\-\.]/g, '');
    const rows = await supabase('GET', 'guests', { filter: `select=*` });
    const match = rows.find(g => g.phone && g.phone.replace(/[\s\-\.]/g, '') === clean);
    return toApp(match || null);
  },

  async saveGuest(data) {
    const body = {
      ...toDb(data),
      created_at: new Date().toISOString()
    };
    const rows = await supabase('POST', 'guests', { body });
    const saved = toApp(rows[0]);
    this._emit('guests-changed');
    console.log(`[Store] Invité créé : ${saved.firstName} ${saved.lastName}`);
    return saved;
  },

  async updateGuest(id, data) {
    const body = toDb(data);
    const rows = await supabase('PATCH', 'guests', {
      filter: `id=eq.${id}`,
      body
    });
    const updated = toApp(rows[0]);
    this._emit('guests-changed');
    console.log(`[Store] Invité mis à jour : ${updated.firstName} ${updated.lastName}`);
    return updated;
  },

  async deleteGuest(id) {
    await supabase('DELETE', 'guests', { filter: `id=eq.${id}` });
    if (this._getLocal(LOCAL.CURRENT_GUEST) === id) this.clearCurrentGuest();
    this._emit('guests-changed');
    console.log(`[Store] Invité supprimé : ${id}`);
  },

  // ════════════════════════════════════════════
  // Session invité courant (localStorage)
  // ════════════════════════════════════════════

  getCurrentGuest() {
    const id = this._getLocal(LOCAL.CURRENT_GUEST);
    if (!id) return null;
    // Retourne une promesse — appelants doivent awaiter
    return this.getGuest(id);
  },

  setCurrentGuest(guestId) {
    this._setLocal(LOCAL.CURRENT_GUEST, guestId);
    this._emit('auth-changed');
  },

  clearCurrentGuest() {
    localStorage.removeItem(LOCAL.CURRENT_GUEST);
    this._emit('auth-changed');
  },

  // ════════════════════════════════════════════
  // Covoiturages
  // ════════════════════════════════════════════

  async getCarpools() {
    const rows = await supabase('GET', 'carpools', { filter: 'select=*&order=created_at.asc' });
    return rows.map(carpoolToApp);
  },

  async getCarpoolsByGuestId(guestId) {
    const rows = await supabase('GET', 'carpools', { filter: `select=*&guest_id=eq.${guestId}` });
    return rows.map(carpoolToApp);
  },

  async saveCarpool(data) {
    const body = {
      guest_id:       data.guestId,
      type:           data.type,
      city:           data.city,
      seats_available: data.seatsAvailable || null,
      seats_needed:   data.seatsNeeded || null,
      departure_day:  data.departureDay,
      departure_time: data.departureTime,
      contact:        data.contact
    };
    const rows = await supabase('POST', 'carpools', { body });
    const saved = carpoolToApp(rows[0]);
    this._emit('carpools-changed');
    return saved;
  },

  async deleteCarpool(id) {
    await supabase('DELETE', 'carpools', { filter: `id=eq.${id}` });
    this._emit('carpools-changed');
  },

  // ════════════════════════════════════════════
  // Hébergements
  // ════════════════════════════════════════════

  async getAccommodations() {
    const rows = await supabase('GET', 'accommodations', { filter: 'select=*&order=created_at.asc' });
    return rows.map(accToApp);
  },

  async saveAccommodation(data) {
    const body = {
      name:        data.name,
      lat:         data.lat,
      lng:         data.lng,
      capacity:    data.capacity,
      description: data.description || '',
      distance:    data.distance || '',
      booking_url: data.bookingUrl || '',
      icon:        data.icon || 'gite'
    };
    const rows = await supabase('POST', 'accommodations', { body });
    const saved = accToApp(rows[0]);
    this._emit('accommodations-changed');
    return saved;
  },

  async deleteAccommodation(id) {
    await supabase('DELETE', 'accommodations', { filter: `id=eq.${id}` });
    this._emit('accommodations-changed');
  },

  // ════════════════════════════════════════════
  // Administration
  // ════════════════════════════════════════════

  async adminLogin(password) {
    const hash = await hashPassword(password);
    if (hash === ADMIN_PASSWORD_HASH) {
      this._setLocal(LOCAL.ADMIN_AUTH, { authenticated: true, timestamp: new Date().toISOString() });
      this._emit('auth-changed');
      return true;
    }
    return false;
  },

  adminLogout() {
    localStorage.removeItem(LOCAL.ADMIN_AUTH);
    this._emit('auth-changed');
  },

  isAdmin() {
    const auth = this._getLocal(LOCAL.ADMIN_AUTH);
    return auth !== null && auth.authenticated === true;
  },

  // ════════════════════════════════════════════
  // Statistiques
  // ════════════════════════════════════════════

  async getStats() {
    const [guests, carpools] = await Promise.all([this.getGuests(), this.getCarpools()]);

    const totalGuests = guests.length;
    const totalPeople = guests.reduce((s, g) => s + 1 + (g.companions?.length || 0), 0);

    const confirmed      = guests.filter(g => g.attending === true);
    const confirmedPeople = confirmed.reduce((s, g) => s + 1 + (g.companions?.length || 0), 0);
    const declined       = guests.filter(g => g.attending === false).length;
    const maybe          = guests.filter(g => g.attending === 'maybe').length;
    const pending        = guests.filter(g => g.attending === null || g.attending === undefined).length;

    let vegetarian = 0, vegan = 0, noAlcohol = 0;
    const allergies = [];

    const countDiets = (dietArr, name, allergyDetails) => {
      if (!Array.isArray(dietArr)) return;
      if (dietArr.includes('vegetarian')) vegetarian++;
      if (dietArr.includes('vegan')) vegan++;
      if (dietArr.includes('no-alcohol')) noAlcohol++;
      if (dietArr.includes('allergy') && allergyDetails)
        allergies.push({ name, details: allergyDetails });
    };

    confirmed.forEach(g => {
      countDiets(g.diet, `${g.firstName} ${g.lastName}`, g.allergyDetails);
      (g.companions || []).forEach(c =>
        countDiets(c.diet, c.name || 'Accompagnant', c.allergyDetails)
      );
    });

    const offers   = carpools.filter(c => c.type === 'offer');
    const requests = carpools.filter(c => c.type === 'request');

    return {
      totalGuests, totalPeople,
      confirmed: confirmed.length, confirmedPeople,
      declined, maybe, pending,
      diets: { vegetarian, vegan, noAlcohol, allergies },
      transport: {
        drivers:        offers.length,
        seatsAvailable: offers.reduce((s, c) => s + (c.seatsAvailable || 0), 0),
        needRide:       requests.length,
        seatsNeeded:    requests.reduce((s, c) => s + (c.seatsNeeded || 0), 0)
      }
    };
  },

  // ════════════════════════════════════════════
  // Utilitaires localStorage internes
  // ════════════════════════════════════════════

  _getLocal(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },

  _setLocal(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { console.error(e); }
  }
};

export default Store;