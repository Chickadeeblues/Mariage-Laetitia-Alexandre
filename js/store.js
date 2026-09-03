/**
 * store.js — Module de persistance des données
 * Supabase (cloud) + localStorage pour session/auth uniquement.
 */

const SUPABASE_URL = 'https://upaxcudmifqwiglodywf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYXhjdWRtaWZxd2lnbG9keXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0MzQsImV4cCI6MjA5ODQ4NjQzNH0.cBIYvtf0gPy1y1DT9_HtkOkTTZqta1g3x1XZjDi2oxs';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation'
};

const LOCAL = {
  CURRENT_GUEST: 'wedding_current_guest_id',
  ADMIN_AUTH:    'wedding_admin_auth'
};

const ADMIN_PASSWORD_HASH = '2efdd4eeac99f6be0f0e0bea27dbbbbcb91e00c998f783a223afd7d24ad57a52';

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_ACCOMMODATIONS = [
  {
    name: 'Domaine de la Scie du May',
    lat: 45.4113, lng: 4.5889, capacity: '20 personnes', capacity_number: 20,
    description: 'Hébergement sur le lieu de réception. 20 personnes max, 20€/pers/nuit. Réservation uniquement via les mariés.',
    booking_url: '', distance: 'Sur place', icon: 'venue'
  },
  {
    name: "Chez Delphine (Chambre d'hôtes)",
    lat: 45.415, lng: 4.595, capacity: '2 à 4 pers.', capacity_number: 4,
    description: "Chambre d'hôtes dans un cadre paisible. ~85€/nuit.",
    booking_url: 'https://www.escapade-chezdelphine.fr', distance: '~3 km', icon: 'chambre'
  },
  {
    name: 'La Roche du Pilat',
    lat: 45.418, lng: 4.605, capacity: '6 personnes', capacity_number: 6,
    description: 'Gîte de 100m² avec vue panoramique. ~100€/nuit.',
    booking_url: 'https://www.gites-de-france.com', distance: '~3 km', icon: 'gite'
  },
  {
    name: 'Hôtel Restaurant Éclosion',
    lat: 45.5021, lng: 4.5912, capacity: '24 personnes (12 chambres)', capacity_number: 24,
    description: '12 chambres doubles dans un château. À partir de 110€/nuit. Tél : 04 77 61 99 09.',
    booking_url: 'https://www.hotelrestauranteclosion.fr/hotel', distance: '~4 km', icon: 'chambre'
  },
  {
    name: "Camping Bel'Époque du Pilat",
    lat: 45.4187, lng: 4.6642, capacity: 'Emplacements + mobil-homes', capacity_number: 0,
    description: '55 emplacements, mobil-homes disponibles. Vue panoramique sur la vallée du Rhône et les Alpes. À partir de 350€/semaine.',
    booking_url: 'https://www.pilat-tourisme.fr/planifier/dormir/campings-et-aires-de-service', distance: '~15 km', icon: 'gite'
  },
  {
    name: 'Camping de la Lône',
    lat: 45.4156, lng: 4.7634, capacity: 'Emplacements + mobil-homes', capacity_number: 0,
    description: 'Camping calme en bord de Rhône, piscine (mi-juin à mi-sept). Tentes et mobil-homes.',
    booking_url: 'https://www.pilat-tourisme.fr/planifier/dormir/campings-et-aires-de-service', distance: '~20 km', icon: 'gite'
  },
  {
    name: 'Huttopia Pays de Condrieu',
    lat: 45.4756, lng: 4.7823, capacity: 'Hébergements prêts-à-camper', capacity_number: 0,
    description: 'Site naturel exceptionnel. Hébergements prêts-à-camper premium. À partir de 945€/semaine.',
    booking_url: 'https://www.pilat-tourisme.fr/planifier/dormir/campings-et-aires-de-service', distance: '~22 km', icon: 'gite'
  }
];

const _listeners = {};

async function supabase(method, table, { filter = '', body = null } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${filter ? '?' + filter : ''}`;
  const opts = { method, headers: { ...HEADERS }, cache: 'no-store'};
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Supabase] ${method} ${table} — ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

function toApp(g) {
  if (!g) return null;
  return {
    id:                g.id,
    firstName:         g.first_name,
    lastName:          g.last_name,
    phone:             g.phone,
    email:             g.email,
    attending:         g.attending,
    companions:        g.companions        || [],
    diet:              g.diet              || [],
    allergyDetails:    g.allergy_details,
    brunch:            g.brunch,
    dessert:           g.dessert           || null,
    transport:         g.transport         || {},
    accommodationId:   g.accommodation_id,
    accommodationName: g.accommodation_name,
    tag:               g.tag,
    createdAt:         g.created_at,
    updatedAt:         g.updated_at
  };
}

function toDb(data) {
  const obj = {};
  if (data.firstName         !== undefined) obj.first_name         = data.firstName;
  if (data.lastName          !== undefined) obj.last_name          = data.lastName;
  if (data.phone             !== undefined) obj.phone              = data.phone;
  if (data.email             !== undefined) obj.email              = data.email;
  if (data.attending         !== undefined) obj.attending          = data.attending;
  if (data.companions        !== undefined) obj.companions         = data.companions;
  if (data.diet              !== undefined) obj.diet               = data.diet;
  if (data.allergyDetails    !== undefined) obj.allergy_details    = data.allergyDetails;
  if (data.brunch            !== undefined) obj.brunch             = data.brunch;
  if (data.dessert           !== undefined) obj.dessert            = data.dessert;
  if (data.transport         !== undefined) obj.transport          = data.transport;
  if (data.accommodationId   !== undefined) obj.accommodation_id   = data.accommodationId;
  if (data.accommodationName !== undefined) obj.accommodation_name = data.accommodationName;
  if (data.tag               !== undefined) obj.tag                = data.tag;
  obj.updated_at = new Date().toISOString();
  return obj;
}

function carpoolToApp(c) {
  if (!c) return null;
  return {
    id:             c.id,
    guestId:        c.guest_id,
    type:           c.type,
    city:           c.city,
    seatsAvailable: c.seats_available,
    seatsNeeded:    c.seats_needed,
    departureDay:   c.departure_day,
    departureTime:  c.departure_time,
    contact:        c.contact,
    createdAt:      c.created_at
  };
}

function accToApp(dbAcc) {
  if (!dbAcc) return null;
  
  return {
    id: dbAcc.id,
    name: dbAcc.name || '',
    type: dbAcc.type || 'Gîte',
    address: dbAcc.address || '',
    distanceKm: dbAcc.distance_km ?? dbAcc.distanceKm ?? null,
    pricePerNight: dbAcc.price_per_night ?? dbAcc.pricePerNight ?? dbAcc.price ?? null,
    bedsDetail: dbAcc.beds_detail || dbAcc.bedsDetail || '',
    capacityNumber: dbAcc.capacity_number ?? dbAcc.capacityNumber ?? dbAcc.capacity ?? 0,
    bookingUrl: dbAcc.booking_url ?? dbAcc.bookingUrl || '',
    description: dbAcc.description || '',
    lat: dbAcc.lat,
    lng: dbAcc.lng,
    icon: dbAcc.icon || ''
  };
}

function animToApp(a) {
  if (!a) return null;
  return {
    id:             a.id,
    guestId:        a.guest_id,
    firstName:      a.first_name,
    type:           a.type,
    details:        a.details,
    timing:         a.timing,
    equipment:      a.equipment || [],
    equipmentOther: a.equipment_other,
    createdAt:      a.created_at
  };
}

function animToDb(data) {
  return {
    guest_id:        data.guestId        || null,
    first_name:      data.firstName,
    type:            data.type,
    details:         data.details        || '',
    timing:          data.timing,
    equipment:       data.equipment      || [],
    equipment_other: data.equipmentOther || ''
  };
}

const Store = {

  on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
    // Retourne une fonction de désinscription
    return () => {
      if (_listeners[event]) {
        _listeners[event] = _listeners[event].filter(cb => cb !== callback);
      }
    };
  },

  off(event, callback) {
    if (_listeners[event])
      _listeners[event] = _listeners[event].filter(cb => cb !== callback);
  },

  _emit(event) {
    (_listeners[event] || []).forEach(cb => { try { cb(); } catch(e) { console.error(e); } });
  },

  async init() {
    try {
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

  // ── Paramètres globaux (Publication) ────────────────

  async getSettings(key) {
    try {
      const rows = await supabase('GET', 'wedding_settings', { filter: `select=value&key=eq.${key}` });
      if (rows && rows.length > 0) {
        return rows[0].value;
      }
    } catch (e) {
      console.warn('[Store] Impossible de charger les paramètres, fallback par défaut.', e);
    }
    // Valeurs par défaut si échec
    return { messe: true, animations: true, contacts: true, liste: true, covoiturage: true, hebergements: true };
  },

  async updateSettings(key, value) {
    try {
      // Puisque la ligne est insérée par défaut, un PATCH suffit
      await supabase('PATCH', 'wedding_settings', { filter: `key=eq.${key}`, body: { value } });
      this._emit('settings-changed');
      return true;
    } catch (e) {
      console.error('[Store] Erreur updateSettings :', e);
      return false;
    }
  },

  // ── Invités ──────────────────────────────────────────

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
    const rows = await supabase('GET', 'guests', { filter: 'select=*' });
    const match = rows.find(g => g.phone && g.phone.replace(/[\s\-\.]/g, '') === clean);
    return toApp(match || null);
  },

  async saveGuest(data) {
    const body = { ...toDb(data), created_at: new Date().toISOString() };
    const rows = await supabase('POST', 'guests', { body });
    const saved = toApp(rows[0]);
    this._emit('guests-changed');
    return saved;
  },

  async updateGuest(id, data) {
    const rows = await supabase('PATCH', 'guests', { filter: `id=eq.${id}`, body: toDb(data) });
    const updated = toApp(rows[0]);
    this._emit('guests-changed');
    return updated;
  },

  async deleteGuest(id) {
    await supabase('DELETE', 'guests', { filter: `id=eq.${id}` });
    if (this._getLocal(LOCAL.CURRENT_GUEST) === id) this.clearCurrentGuest();
    this._emit('guests-changed');
  },

  // ── Session invité ───────────────────────────────────

  getCurrentGuest() {
    const id = this._getLocal(LOCAL.CURRENT_GUEST);
    if (!id) return null;
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

  // ── Covoiturages ─────────────────────────────────────

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
      guest_id:        data.guestId,
      type:            data.type,
      city:            data.city,
      seats_available: data.seatsAvailable || null,
      seats_needed:    data.seatsNeeded    || null,
      departure_day:   data.departureDay,
      departure_time:  data.departureTime,
      contact:         data.contact
    };
    const rows = await supabase('POST', 'carpools', { body });
    this._emit('carpools-changed');
    return carpoolToApp(rows[0]);
  },

  async deleteCarpool(id) {
    await supabase('DELETE', 'carpools', { filter: `id=eq.${id}` });
    this._emit('carpools-changed');
  },

  // ── Hébergements ─────────────────────────────────────

  async getAccommodations() {
    const rows = await supabase('GET', 'accommodations', { filter: 'select=*&order=created_at.asc' });
    return rows.map(accToApp);
  },

  /**
   * Calcule les places restantes pour chaque hébergement
   * en soustrayant les invités qui y ont réservé.
   */
  async getAccommodationsWithAvailability() {
    const [accommodations, guests] = await Promise.all([
      this.getAccommodations(),
      this.getGuests()
    ]);

    return accommodations.map(acc => {
      if (acc.capacityNumber === 0) return { ...acc, spotsLeft: null, bookedBy: [] };

      const bookedGuests = guests.filter(g => g.accommodationId === acc.id);
      const spotsUsed = bookedGuests.reduce((sum, g) => {
        return sum + 1 + (g.companions ? g.companions.length : 0);
      }, 0);

      return {
        ...acc,
        spotsLeft: Math.max(0, acc.capacityNumber - spotsUsed),
        bookedBy: bookedGuests.map(g => `${g.firstName} ${g.lastName}`)
      };
    });
  },

  async saveAccommodation(data) {
    const body = {
      name:            data.name,
      lat:             data.lat,
      lng:             data.lng,
      capacity:        data.capacity,
      capacity_number: data.capacityNumber || 0,
      description:     data.description || '',
      distance:        data.distance    || '',
      booking_url:     data.bookingUrl  || '',
      icon:            data.icon        || 'gite'
    };
    const rows = await supabase('POST', 'accommodations', { body });
    this._emit('accommodations-changed');
    return accToApp(rows[0]);
  },

  async deleteAccommodation(id) {
    await supabase('DELETE', 'accommodations', { filter: `id=eq.${id}` });
    this._emit('accommodations-changed');
  },

  // ── Admin ─────────────────────────────────────────────

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

  // Discours et animations ──────────────────────────────────────

  async getAnimations() {
    try {
      const rows = await supabase('GET', 'animations', { filter: 'select=*&order=created_at.asc' });
      return rows.map(animToApp);
    } catch (e) {
      console.error('[Store] Erreur getAnimations :', e);
      return [];
    }
  },

  async getAnimationsByGuestId(guestId) {
    try {
      const rows = await supabase('GET', 'animations', { filter: `select=*&guest_id=eq.${guestId}&order=created_at.asc` });
      return rows.map(animToApp);
    } catch (e) {
      console.error('[Store] Erreur getAnimationsByGuestId :', e);
      return [];
    }
  },

  async saveAnimation(data) {
    const body = { ...animToDb(data), created_at: new Date().toISOString() };
    const rows = await supabase('POST', 'animations', { body });
    const saved = animToApp(rows[0]);
    this._emit('animations-changed');
    return saved;
  },

  async updateAnimation(id, data) {
    const rows = await supabase('PATCH', 'animations', { filter: `id=eq.${id}`, body: animToDb(data) });
    if (!rows || rows.length === 0) {
      throw new Error("La modification n'a pas été appliquée (0 ligne modifiée — vérifiez la policy RLS 'update' sur la table animations).");
    }
    const updated = animToApp(rows[0]);
    this._emit('animations-changed');
    return updated;
  },

  async deleteAnimation(id) {
    const rows = await supabase('DELETE', 'animations', { filter: `id=eq.${id}` });
    if (!rows || rows.length === 0) {
      throw new Error("La suppression n'a pas été appliquée (0 ligne supprimée — vérifiez la policy RLS 'delete' sur la table animations).");
    }
    this._emit('animations-changed');
  },
  
  // ── Statistiques ──────────────────────────────────────

  async getStats() {
    const [guests, carpools] = await Promise.all([this.getGuests(), this.getCarpools()]);

    const totalGuests   = guests.length;
    const totalPeople   = guests.reduce((s, g) => s + 1 + (g.companions?.length || 0), 0);
    const confirmed     = guests.filter(g => g.attending === true);
    const confirmedPeople = confirmed.reduce((s, g) => s + 1 + (g.companions?.length || 0), 0);
    const declined      = guests.filter(g => g.attending === false).length;
    const maybe         = guests.filter(g => g.attending === 'maybe').length;
    const pending       = guests.filter(g => g.attending === null || g.attending === undefined).length;

    let vegetarian = 0, vegan = 0, noAlcohol = 0;
    const allergies = [];

    const countDiets = (dietArr, name, allergyDetails) => {
      if (!Array.isArray(dietArr)) return;
      if (dietArr.includes('vegetarian')) vegetarian++;
      if (dietArr.includes('vegan'))      vegan++;
      if (dietArr.includes('no-alcohol')) noAlcohol++;
      if (dietArr.includes('allergy') && allergyDetails)
        allergies.push({ name, details: allergyDetails });
    };

    [...confirmed, ...guests.filter(g => g.attending === 'maybe')].forEach(g => {
  const suffix = g.attending === 'maybe' ? ' (peut-être)' : '';
  countDiets(g.diet, `${g.firstName} ${g.lastName}${suffix}`, g.allergyDetails);
  (g.companions || []).forEach(c => countDiets(c.diet, (`${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Accompagnant') + suffix, c.allergyDetails));
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
        seatsNeeded:    requests.reduce((s, c) => s + (c.seatsNeeded   || 0), 0)
      }
    };
  },

  // ── localStorage interne ──────────────────────────────

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