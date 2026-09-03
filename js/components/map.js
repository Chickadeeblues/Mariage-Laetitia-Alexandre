/**
 * Composant Map — Carte Leaflet & liste des hébergements réorganisée
 * Avec filtres par type, capacité et prix
 */

import Store from '../store.js';
import Animations from '../utils/animations.js';

// Coordonnées du domaine
const DOMAIN = [45.4113, 4.5889];

// Distance GPS entre deux points (km)
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const MapComponent = {
  _map: null,
  _markersLayer: null,
  _elements: { mapContainer: null, accommodationsList: null, filtersContainer: null },
  _domainCoords: DOMAIN,
  _domainZoom: 12,
  _allAccommodations: [],
  _filters: {
    type: 'all',
    minCapacity: 0,
    maxPrice: Infinity,
  },

  async init() {
    this._elements.mapContainer = document.getElementById('map-container');
    this._elements.accommodationsList = document.getElementById('accommodations-list');
    if (!this._elements.mapContainer) return;
    
    // Check publication
    let isPublished = true;
    try {
      const StoreModule = await import('../store.js');
      isPublished = await StoreModule.default.getSettings('publication').then(s => s['hebergements']);
    } catch (e) {}

    if (!isPublished) {
      this._elements.mapContainer.style.display = 'none';
      if (this._elements.accommodationsList) {
        this._elements.accommodationsList.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem;">
             <span style="font-size:3rem;display:block;margin-bottom:16px;">⏳</span>
             <h3 style="color:#2D5A3D; font-family: var(--font-display);">${window.I18n.t('publication.comingSoon')}</h3>
          </div>
        `;
      }
      return;
    }

    this._initMap();
    await this._loadAccommodations();
    Store.on('accommodations-changed', () => this._loadAccommodations());
    Store.on('guests-changed', () => this._loadAccommodations());
  },

  destroy() {
    if (this._map) { this._map.remove(); this._map = null; }
  },

  invalidateSize() {
    if (this._map) setTimeout(() => this._map.invalidateSize(), 100);
  },

  _initMap() {
    if (typeof L === 'undefined') {
      this._elements.mapContainer.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:400px;
          background:#FAF8F5;border-radius:16px;text-align:center;padding:2rem;">
          <div>
            <span style="font-size:3rem;">🗺️</span>
            <p style="margin-top:1rem;">La carte est en cours de chargement…</p>
            <p style="font-size:0.9rem;opacity:0.7;">Domaine de la Scie du May — Doizieux, 42740</p>
          </div>
        </div>`;
      return;
    }

    this._map = L.map(this._elements.mapContainer, {
      center: this._domainCoords,
      zoom: this._domainZoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(this._map);

    this._map.on('click', () => this._map.scrollWheelZoom.enable());
    this._markersLayer = L.layerGroup().addTo(this._map);
    this._addDomainMarker();
    this._addStationMarker();
    this._injectStyles();
  },

  _addDomainMarker() {
    if (!this._map) return;
    const icon = L.divIcon({
      className: '',
      html: `<div class="marker-domain"><span class="marker-icon">🏰</span></div>`,
      iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -50],
    });
    L.marker(this._domainCoords, { icon })
      .bindPopup(`
        <div class="map-popup">
          <h3>🏰 Domaine de la Scie du May</h3>
          <div class="popup-row">📍 Doizieux, 42740</div>
          <div class="popup-row">💒 Lieu de la cérémonie & réception</div>
        </div>`)
      .addTo(this._map);
  },

  _addStationMarker() {
    if (!this._map) return;
    const icon = L.divIcon({
      className: '',
      html: `<div class="marker-station"><span class="marker-icon">🚆</span></div>`,
      iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -42],
    });
    L.marker([45.3767, 4.7970], { icon })
      .bindPopup(`
        <div class="map-popup">
          <h3>🚆 Gare TER Le Péage-de-Roussillon</h3>
          <div class="popup-row">Ligne Lyon ↔ Valence</div>
          <div class="popup-row" style="font-size:12px;color:#888;">~30 min du domaine en voiture</div>
        </div>`)
      .addTo(this._map);
  },

  _getType(acc) {
    if (acc.type) return acc.type;
    const icon = (acc.icon || '').toLowerCase();
    const name = (acc.name || '').toLowerCase();
    const desc = (acc.description || '').toLowerCase();

    if (icon === 'chambre' || name.includes('chambre') || name.includes('delphine') || desc.includes('chambre d\'hôte')) {
      return "Chambre d'hôtes";
    }
    if (icon === 'gite' || name.includes('gîte') || name.includes('gite') || name.includes('roche du pilat')) {
      return 'Gîte';
    }
    if (icon === 'hotel' || name.includes('hôtel') || name.includes('hotel') || name.includes('éclosion')) {
      return 'Hôtel';
    }
    if (name.includes('airbnb') || name.includes('rbnb')) {
      return 'RBnB';
    }
    if (icon === 'camping' || name.includes('camping') || name.includes('huttopia') || name.includes('lône') || name.includes('époque')) {
      return 'Camping';
    }
    if (name.includes('domaine') || name.includes('scie')) {
      return 'Sur place';
    }
    return 'Hébergement';
  },

  _getPrice(acc) {
    if (acc.pricePerNight !== undefined) return acc.pricePerNight;
    if (acc.price !== undefined) return acc.price;
    const text = `${acc.description || ''} ${acc.capacity || ''}`;
    const match = text.match(/(\d+)\s*€/);
    if (match) return parseInt(match[1], 10);
    if (acc.name && acc.name.includes('Domaine')) return 20;
    return null;
  },

  _getRoomsAndBeds(acc) {
    const text = `${acc.description || ''} ${acc.capacity || ''}`;
    const roomsMatch = text.match(/(\d+)\s*chambre/i);
    const bedsMatch = text.match(/(\d+)\s*lit/i);
    return {
      rooms: acc.rooms || (roomsMatch ? parseInt(roomsMatch[1], 10) : null),
      beds: acc.beds || (bedsMatch ? parseInt(bedsMatch[1], 10) : null),
    };
  },

  _addAccommodationMarker(acc) {
    if (!this._map || !acc.lat || !acc.lng) return;

    const isDomain = Math.abs(acc.lat - DOMAIN[0]) < 0.001 && Math.abs(acc.lng - DOMAIN[1]) < 0.001;
    if (isDomain) return;

    const type = this._getType(acc);
    const icon = L.divIcon({
      className: '',
      html: `<div class="marker-acc"><span class="marker-icon">🏡</span></div>`,
      iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -40],
    });

    let popup = `<div class="map-popup"><h3>${acc.name}</h3>`;
    popup += `<div class="popup-row" style="font-weight:600;color:#2D5A3D;">${type}</div>`;
    if (acc.distance) popup += `<div class="popup-row">À ${acc.distance} de La Scie du May</div>`;
    if (acc.capacityNumber > 0) {
      popup += `<div class="popup-row">Capacité : ${acc.capacityNumber} personnes</div>`;
    }
    if (acc.description) popup += `<p style="font-size:12px;color:#666;margin:6px 0;">${acc.description}</p>`;
    if (acc.bookingUrl) popup += `<a href="${acc.bookingUrl}" target="_blank" class="popup-link">Voir le lieu →</a>`;
    popup += '</div>';

    const marker = L.marker([acc.lat, acc.lng], { icon });
    marker.bindPopup(popup);
    this._markersLayer.addLayer(marker);
  },

  async _loadAccommodations() {
    try {
      const result = await Store.getAccommodationsWithAvailability();
      const accommodations = Array.isArray(result) ? result : [];

      accommodations.forEach(acc => {
        const dist = distKm(DOMAIN[0], DOMAIN[1], acc.lat || 0, acc.lng || 0);
        acc._distKm = dist;
        acc._type = this._getType(acc);
        acc._price = this._getPrice(acc);
        acc._capacity = acc.capacityNumber || 0;
      });

      // Tri par distance GPS
      accommodations.sort((a, b) => a._distKm - b._distKm);
      this._allAccommodations = accommodations;

      this._renderFilterBar();
      this._applyFilters();
    } catch (e) {
      console.error('[Map] Erreur chargement hébergements :', e);
    }
  },

  _renderFilterBar() {
    if (!this._elements.accommodationsList) return;

    let filterBar = document.getElementById('acc-filter-bar');
    if (!filterBar) {
      filterBar = document.createElement('div');
      filterBar.id = 'acc-filter-bar';
      filterBar.className = 'acc-filter-bar';
      this._elements.accommodationsList.parentNode.insertBefore(filterBar, this._elements.accommodationsList);
    }

    filterBar.innerHTML = `
      <div class="filter-group">
        <label for="filter-type">Type de logement</label>
        <select id="filter-type" class="filter-select">
          <option value="all">Tous les types</option>
          <option value="Chambre d'hôtes">Chambre d'hôtes</option>
          <option value="Gîte">Gîte</option>
          <option value="Hôtel">Hôtel</option>
          <option value="RBnB">RBnB</option>
          <option value="Camping">Camping</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-capacity">Nombre de places min.</label>
        <select id="filter-capacity" class="filter-select">
          <option value="0">Toutes capacités</option>
          <option value="2">2+ personnes</option>
          <option value="4">4+ personnes</option>
          <option value="6">6+ personnes</option>
          <option value="10">10+ personnes</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-price">Prix max / nuit</label>
        <select id="filter-price" class="filter-select">
          <option value="Infinity">Tous les prix</option>
          <option value="30">Jusqu'à 30 €</option>
          <option value="60">Jusqu'à 60 €</option>
          <option value="100">Jusqu'à 100 €</option>
          <option value="150">Jusqu'à 150 €</option>
        </select>
      </div>
    `;

    document.getElementById('filter-type').value = this._filters.type;
    document.getElementById('filter-capacity').value = this._filters.minCapacity;
    document.getElementById('filter-price').value = this._filters.maxPrice;

    document.getElementById('filter-type').addEventListener('change', (e) => {
      this._filters.type = e.target.value;
      this._applyFilters();
    });
    document.getElementById('filter-capacity').addEventListener('change', (e) => {
      this._filters.minCapacity = parseInt(e.target.value, 10) || 0;
      this._applyFilters();
    });
    document.getElementById('filter-price').addEventListener('change', (e) => {
      const val = e.target.value;
      this._filters.maxPrice = val === 'Infinity' ? Infinity : parseInt(val, 10);
      this._applyFilters();
    });
  },

  _applyFilters() {
    const filtered = this._allAccommodations.filter(acc => {
      // Filtre Type
      if (this._filters.type !== 'all' && acc._type !== this._filters.type) {
        return false;
      }
      // Filtre Capacité
      if (this._filters.minCapacity > 0 && acc._capacity > 0 && acc._capacity < this._filters.minCapacity) {
        return false;
      }
      // Filtre Prix
      if (this._filters.maxPrice !== Infinity) {
        if (acc._price !== null && acc._price > this._filters.maxPrice) {
          return false;
        }
      }
      return true;
    });

    if (this._markersLayer) {
      this._markersLayer.clearLayers();
      filtered.forEach(acc => this._addAccommodationMarker(acc));
    }

    this._renderList(filtered);
  },

  _renderList(accommodations) {
    if (!this._elements.accommodationsList) return;

    if (!accommodations.length) {
      this._elements.accommodationsList.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <span style="font-size:3rem;display:block;margin-bottom:1rem;">🏡</span>
          <h3 style="color:#5c4e35;">Aucun hébergement trouvé</h3>
          <p style="color:#888;">Essayez de modifier vos filtres de recherche.</p>
        </div>`;
      return;
    }

    let html = '<div class="acc-list">';

    accommodations.forEach((acc, idx) => {
      const distLabel = acc._distKm < 0.5 ? 'Sur place' : `À ${Math.round(acc._distKm)} km de La Scie du May`;
      const capacityDisplay = acc._capacity > 0 ? `${acc._capacity} personnes` : 'Capacité non précisée';
      const roomsBeds = this._getRoomsAndBeds(acc);

      let roomBedsText = [];
      if (roomsBeds.rooms) roomBedsText.push(`${roomsBeds.rooms} chambre${roomsBeds.rooms > 1 ? 's' : ''}`);
      if (roomsBeds.beds) roomBedsText.push(`${roomsBeds.beds} lit${roomsBeds.beds > 1 ? 's' : ''}`);
      const roomBedsDisplay = roomBedsText.join(' · ');

      const priceDisplay = acc._price !== null ? `${acc._price} € / nuit` : 'Prix non renseigné';

      html += `
        <div class="acc-card" data-id="${acc.id}" data-lat="${acc.lat}" data-lng="${acc.lng}" style="animation-delay:${idx * 60}ms">
          <div class="acc-card__top">
            <div class="acc-card__header-info">
              <span class="acc-card__type">${acc._type}</span>
              <h3 class="acc-card__title">${acc.name}</h3>
            </div>
            <div class="acc-card__capacity-tag">${capacityDisplay}</div>
          </div>

          <div class="acc-card__details">
            <div class="acc-card__dist">${distLabel}</div>
            ${roomBedsDisplay ? `<div class="acc-card__rooms">${roomBedsDisplay}</div>` : ''}
            <div class="acc-card__price">${priceDisplay}</div>
            ${acc.description ? `<p class="acc-card__desc">${acc.description}</p>` : ''}
          </div>

          <div class="acc-card__footer">
            ${acc.bookingUrl
              ? `<a href="${acc.bookingUrl}" target="_blank" rel="noopener" class="acc-btn-voir">Voir le lieu</a>`
              : acc.name.includes('Domaine')
              ? `<span class="acc-card__contact-note">Réservation via les mariés</span>`
              : ''}
          </div>
        </div>`;
    });

    html += '</div>';
    this._elements.accommodationsList.innerHTML = html;

    this._elements.accommodationsList.querySelectorAll('.acc-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.classList.contains('acc-btn-voir')) return;
        const lat = parseFloat(card.dataset.lat);
        const lng = parseFloat(card.dataset.lng);
        if (lat && lng && this._map) this._map.flyTo([lat, lng], 15, { duration: 0.8 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  },

  _injectStyles() {
    if (document.getElementById('map-styles')) return;
    const s = document.createElement('style');
    s.id = 'map-styles';
    s.textContent = `
      /* Marqueurs */
      .marker-domain  { width:48px;height:48px;background:linear-gradient(135deg,#C9A84C,#E5C97B);border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(201,168,76,.5);display:flex;align-items:center;justify-content:center; }
      .marker-station { width:38px;height:38px;background:linear-gradient(135deg,#2874a6,#5dade2);border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(40,116,166,.4);display:flex;align-items:center;justify-content:center; }
      .marker-acc     { width:38px;height:38px;background:linear-gradient(135deg,#2D5A3D,#3D7A4F);border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(45,90,61,.4);display:flex;align-items:center;justify-content:center; }
      .marker-icon    { transform:rotate(45deg);font-size:18px;line-height:1; }

      /* Popup */
      .map-popup { font-family:'Outfit',sans-serif;min-width:200px; }
      .map-popup h3 { color:#2D5A3D;font-size:1rem;margin:0 0 6px;font-weight:600; }
      .popup-row { font-size:13px;color:#555;margin-bottom:3px; }
      .popup-link { display:inline-block;margin-top:8px;padding:4px 14px;background:#2D5A3D;color:#fff;text-decoration:none;border-radius:20px;font-size:13px; }

      /* Barre de filtres */
      .acc-filter-bar { display:flex;gap:16px;flex-wrap:wrap;background:#FAF8F5;border:1px solid #E8E0D0;border-radius:12px;padding:16px;margin:20px 0 10px; }
      .filter-group { flex:1;min-width:180px;display:flex;flex-direction:column;gap:6px; }
      .filter-group label { font-size:12px;font-weight:600;color:#2D5A3D;text-transform:uppercase;letter-spacing:0.5px; }
      .filter-select { font-family:'Outfit',sans-serif;padding:8px 12px;border:1px solid #C9A84C;border-radius:8px;background:#fff;color:#2C2C2C;font-size:14px;outline:none; }

      /* Liste hébergements */
      .acc-list { display:flex;flex-direction:column;gap:16px;margin-top:16px; }
      .acc-card { background:#fff;border:1.5px solid #E8E0D0;border-radius:12px;padding:18px;cursor:pointer;transition:box-shadow .2s,transform .2s;display:flex;flex-direction:column;gap:12px;position:relative; }
      .acc-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.08);transform:translateY(-2px); }

      /* Structure Carte */
      .acc-card__top { display:flex;justify-content:space-between;align-items:flex-start;gap:12px; }
      .acc-card__header-info { display:flex;flex-direction:column;gap:2px; }
      .acc-card__type { font-size:12px;font-weight:600;color:#9CAF88;text-transform:uppercase;letter-spacing:0.5px; }
      .acc-card__title { margin:0;font-size:1.1rem;font-weight:600;color:#2D5A3D;font-family:var(--font-body); }
      
      /* Badge capacité mis en avant */
      .acc-card__capacity-tag { background:#2D5A3D;color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(45,90,61,0.2); }

      /* Détails */
      .acc-card__details { display:flex;flex-direction:column;gap:4px; }
      .acc-card__dist { font-size:13px;font-weight:500;color:#555; }
      .acc-card__rooms { font-size:13px;color:#666; }
      .acc-card__price { font-size:14px;font-weight:600;color:#C9A84C;margin-top:2px; }
      .acc-card__desc { font-size:13px;color:#6B6B6B;line-height:1.4;margin:6px 0 0; }

      /* Footer & Bouton */
      .acc-card__footer { display:flex;justify-content:flex-end;align-items:center;margin-top:4px; }
      .acc-btn-voir { display:inline-block;padding:8px 18px;background:#2D5A3D;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;transition:background .2s; }
      .acc-btn-voir:hover { background:#1e3d29; }
      .acc-card__contact-note { font-size:12px;color:#7a6135;font-style:italic; }

      @media(max-width:600px) {
        .acc-filter-bar { flex-direction:column;gap:12px; }
        .acc-card__top { flex-direction:column;align-items:flex-start;gap:6px; }
        .acc-card__capacity-tag { align-self:flex-start; }
      }
    `;
    document.head.appendChild(s);
  },
};

export default MapComponent;