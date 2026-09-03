/**
 * Composant Map — Cartographie & liste des hébergements
 * Exploite directement les données structurées de Supabase
 */

import Store from '../store.js';

const DOMAIN = [45.4113, 4.5889]; // Coordonnées du Domaine de la Scie du May

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
  _elements: { mapContainer: null, accommodationsList: null },
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

    this._initMap();
    await this._loadAccommodations();
    Store.on('accommodations-changed', () => this._loadAccommodations());
  },

  destroy() {
    if (this._map) { this._map.remove(); this._map = null; }
  },

  invalidateSize() {
    if (this._map) setTimeout(() => this._map.invalidateSize(), 100);
  },

  _initMap() {
    if (typeof L === 'undefined') return;

    this._map = L.map(this._elements.mapContainer, {
      center: this._domainCoords,
      zoom: this._domainZoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(this._map);

    this._markersLayer = L.layerGroup().addTo(this._map);
    this._addDomainMarker();
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
        </div>`)
      .addTo(this._map);
  },

  async _loadAccommodations() {
    try {
      const result = await Store.getAccommodationsWithAvailability();
      const rawData = Array.isArray(result) ? result : [];

      this._allAccommodations = rawData.map(acc => {
        const calculatedDist = (acc.lat && acc.lng) 
          ? distKm(DOMAIN[0], DOMAIN[1], acc.lat, acc.lng) 
          : 0;

        const distanceKm = acc.distance_km ?? acc.distanceKm ?? calculatedDist;

        return {
          id: acc.id,
          name: acc.name || 'Hébergement sans nom',
          type: acc.type || 'Hébergement',
          address: acc.address || 'Doizieux & environs',
          bookingUrl: acc.booking_url || acc.bookingUrl || null,
          capacity: acc.capacity_number ?? acc.capacityNumber ?? acc.capacity ?? 0,
          distanceKm: distanceKm,
          price: acc.price_per_night ?? acc.pricePerNight ?? acc.price ?? null,
          bedsDetail: acc.beds_detail || acc.bedsDetail || null,
          description: acc.description || '',
          lat: acc.lat,
          lng: acc.lng
        };
      });

      this._allAccommodations.sort((a, b) => a.distanceKm - b.distanceKm);

      this._renderFilterBar();
      this._applyFilters();
    } catch (e) {
      console.error('[Map] Erreur lors du chargement :', e);
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
      if (this._filters.type !== 'all' && acc.type !== this._filters.type) return false;
      if (this._filters.minCapacity > 0 && acc.capacity < this._filters.minCapacity) return false;
      if (this._filters.maxPrice !== Infinity && acc.price !== null && acc.price > this._filters.maxPrice) return false;
      return true;
    });

    if (this._markersLayer) {
      this._markersLayer.clearLayers();
      filtered.forEach(acc => this._addAccommodationMarker(acc));
    }

    this._renderList(filtered);
  },

  _addAccommodationMarker(acc) {
    if (!this._map || !acc.lat || !acc.lng) return;

    const icon = L.divIcon({
      className: '',
      html: `<div class="marker-acc"><span class="marker-icon">🏡</span></div>`,
      iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -40],
    });

    const distText = acc.distanceKm < 0.5 ? 'Sur place' : `${Math.round(acc.distanceKm)} km`;

    let popup = `<div class="map-popup"><h3>${acc.name}</h3>`;
    popup += `<div class="popup-row" style="font-weight:700;color:#9CAF88;font-size:14px;">${acc.type}</div>`;
    popup += `<div class="popup-row">Distance : ${distText} / ${acc.address}</div>`;
    if (acc.capacity > 0) popup += `<div class="popup-row">${acc.capacity} personnes</div>`;
    if (acc.bedsDetail) popup += `<div class="popup-row" style="color:#2D5A3D;font-weight:500;">${acc.bedsDetail}</div>`;
    if (acc.bookingUrl) popup += `<a href="${acc.bookingUrl}" target="_blank" class="popup-link">Voir le lieu →</a>`;
    popup += '</div>';

    const marker = L.marker([acc.lat, acc.lng], { icon });
    marker.bindPopup(popup);
    this._markersLayer.addLayer(marker);
  },

  _renderList(accommodations) {
    if (!this._elements.accommodationsList) return;

    if (!accommodations.length) {
      this._elements.accommodationsList.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <span style="font-size:3rem;display:block;margin-bottom:1rem;">🏡</span>
          <h3 style="color:#5c4e35;">Aucun hébergement trouvé</h3>
          <p style="color:#888;">Essayez de modifier vos filtres.</p>
        </div>`;
      return;
    }

    let html = '<div class="acc-list">';

    accommodations.forEach((acc) => {
      const distValue = acc.distanceKm < 0.5 ? '0 km' : `${Math.round(acc.distanceKm)} km`;
      const distanceDisplay = `Distance : ${distValue} / ${acc.address}`;
      const capacityDisplay = acc.capacity > 0 ? `${acc.capacity} personnes` : 'Capacité non précisée';
      const priceDisplay = acc.price !== null ? `${acc.price} € / nuit` : 'Prix non renseigné';

      html += `
        <div class="acc-card" data-id="${acc.id}" data-lat="${acc.lat}" data-lng="${acc.lng}">
          <div class="acc-card__top">
            <div class="acc-card__header-info">
              <!-- 1. Type plus gros (15px bold, même couleur sauge) -->
              <span class="acc-card__type">${acc.type}</span>
              <h3 class="acc-card__title">${acc.name}</h3>
              <!-- 3. Ancrage sous le nom du lieu -->
              <div class="acc-card__capacity-tag">${capacityDisplay}</div>
            </div>
          </div>

          <div class="acc-card__details">
            <!-- 2. Modèle : Distance : x km / adresse postale -->
            <div class="acc-card__dist">${distanceDisplay}</div>
            <!-- Détail précis des lits et chambres -->
            ${acc.bedsDetail ? `<div class="acc-card__rooms">${acc.bedsDetail}</div>` : ''}
            <div class="acc-card__price">${priceDisplay}</div>
            <!-- Description supplémentaire -->
            ${acc.description ? `<p class="acc-card__desc">${acc.description}</p>` : ''}
          </div>

          <div class="acc-card__footer">
            ${acc.bookingUrl
              ? `<a href="${acc.bookingUrl}" target="_blank" rel="noopener" class="acc-btn-voir">Voir le lieu</a>`
              : `<span class="acc-card__contact-note">Contact via les mariés ou sur place</span>`}
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
      .marker-domain  { width:48px;height:48px;background:linear-gradient(135deg,#C9A84C,#E5C97B);border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(201,168,76,.5);display:flex;align-items:center;justify-content:center; }
      .marker-acc     { width:38px;height:38px;background:linear-gradient(135deg,#2D5A3D,#3D7A4F);border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(45,90,61,.4);display:flex;align-items:center;justify-content:center; }
      .marker-icon    { transform:rotate(45deg);font-size:18px;line-height:1; }

      .map-popup { font-family:'Outfit',sans-serif;min-width:200px; }
      .map-popup h3 { color:#2D5A3D;font-size:1rem;margin:0 0 6px;font-weight:600; }
      .popup-row { font-size:13px;color:#555;margin-bottom:3px; }
      .popup-link { display:inline-block;margin-top:8px;padding:4px 14px;background:#2D5A3D;color:#fff;text-decoration:none;border-radius:20px;font-size:13px; }

      .acc-filter-bar { display:flex;gap:16px;flex-wrap:wrap;background:#FAF8F5;border:1px solid #E8E0D0;border-radius:12px;padding:16px;margin:20px 0 10px; }
      .filter-group { flex:1;min-width:180px;display:flex;flex-direction:column;gap:6px; }
      .filter-group label { font-size:12px;font-weight:600;color:#2D5A3D;text-transform:uppercase;letter-spacing:0.5px; }
      .filter-select { font-family:'Outfit',sans-serif;padding:8px 12px;border:1px solid #C9A84C;border-radius:8px;background:#fff;color:#2C2C2C;font-size:14px;outline:none; }

      .acc-list { display:flex;flex-direction:column;gap:16px;margin-top:16px; }
      .acc-card { background:#fff;border:1.5px solid #E8E0D0;border-radius:12px;padding:18px;cursor:pointer;transition:box-shadow .2s,transform .2s;display:flex;flex-direction:column;gap:12px; }
      .acc-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.08);transform:translateY(-2px); }

      .acc-card__top { display:flex;justify-content:space-between;align-items:flex-start;gap:12px; }
      .acc-card__header-info { display:flex;flex-direction:column;gap:4px;align-items:flex-start; }
      
      /* Type de logement plus gros */
      .acc-card__type { font-size:15px;font-weight:700;color:#9CAF88;text-transform:uppercase;letter-spacing:0.5px; }
      .acc-card__title { margin:2px 0 4px;font-size:1.2rem;font-weight:600;color:#2D5A3D; }
      
      /* Nombre de personnes ancré sous le nom */
      .acc-card__capacity-tag { background:#2D5A3D;color:#fff;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;margin-top:2px; }

      .acc-card__details { display:flex;flex-direction:column;gap:4px; }
      .acc-card__dist { font-size:13px;font-weight:500;color:#444; }
      .acc-card__rooms { font-size:13px;color:#2D5A3D;font-weight:600; }
      .acc-card__price { font-size:14px;font-weight:600;color:#C9A84C;margin-top:2px; }
      .acc-card__desc { font-size:13px;color:#6B6B6B;line-height:1.4;margin:6px 0 0; }

      .acc-card__footer { display:flex;justify-content:flex-end;align-items:center;margin-top:4px; }
      .acc-btn-voir { display:inline-block;padding:8px 18px;background:#2D5A3D;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500; }
      .acc-card__contact-note { font-size:12px;color:#7a6135;font-style:italic; }

      @media(max-width:600px) {
        .acc-filter-bar { flex-direction:column;gap:12px; }
      }
    `;
    document.head.appendChild(s);
  },
};

export default MapComponent;