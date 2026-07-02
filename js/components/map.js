/**
 * Composant Map — Carte Leaflet & liste des hébergements
 */

import Store from '../store.js';
import Animations from '../utils/animations.js';

const MapComponent = {
  _map: null,
  _markersLayer: null,
  _elements: {
    mapContainer: null,
    accommodationsList: null,
  },
  _domainCoords: [45.4113, 4.5889],
  _domainZoom: 13,

  async init() {
    this._elements.mapContainer = document.getElementById('map-container');
    this._elements.accommodationsList = document.getElementById('accommodations-list');
    if (!this._elements.mapContainer) return;
    this._initMap();
    await this._loadAccommodations();
    Store.on('accommodations-changed', () => this._loadAccommodations());
  },

  destroy() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  },

  invalidateSize() {
    if (this._map) {
      setTimeout(() => this._map.invalidateSize(), 100);
    }
  },

  _initMap() {
    if (typeof L === 'undefined') {
      this._elements.mapContainer.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:400px;background:#FAF8F5;border-radius:16px;text-align:center;padding:2rem;">
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
    this._injectMarkerStyles();
  },

  _injectMarkerStyles() {
    if (document.getElementById('map-marker-styles')) return;
    const style = document.createElement('style');
    style.id = 'map-marker-styles';
    style.textContent = `
      .marker-domain { display:flex;align-items:center;justify-content:center;width:48px;height:48px;background:linear-gradient(135deg,#C9A84C,#E5C97B);border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(201,168,76,0.5); }
      .marker-domain-icon { transform:rotate(45deg);font-size:22px;line-height:1; }
      .marker-accommodation { display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:linear-gradient(135deg,#2D5A3D,#3D7A4F);border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(45,90,61,0.4); }
      .marker-accommodation-icon { transform:rotate(45deg);font-size:18px;line-height:1; }
      .map-popup { font-family:'Outfit',sans-serif;min-width:220px; }
      .map-popup h3 { color:#2D5A3D;font-size:1.05rem;margin:0 0 0.5rem;font-weight:600; }
      .popup-detail { display:flex;align-items:center;gap:0.4rem;margin-bottom:0.3rem;font-size:0.88rem;color:#555; }
      .popup-description { font-size:0.85rem;color:#666;margin:0.6rem 0;line-height:1.4; }
      .popup-book-link { display:inline-block;margin-top:0.5rem;padding:0.4rem 1rem;background:linear-gradient(135deg,#C9A84C,#E5C97B);color:#fff;text-decoration:none;border-radius:20px;font-size:0.85rem;font-weight:500; }
    `;
    document.head.appendChild(style);
  },

  _addDomainMarker() {
    if (!this._map) return;
    const icon = L.divIcon({
      className: 'marker-domain-wrapper',
      html: '<div class="marker-domain"><span class="marker-domain-icon">🏰</span></div>',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });
    L.marker(this._domainCoords, { icon })
      .bindPopup(`
        <div class="map-popup">
          <h3>🏰 Domaine de la Scie du May</h3>
          <div class="popup-detail"><span>📍</span><span>Doizieux, 42740</span></div>
          <div class="popup-detail"><span>💒</span><span>Lieu de la cérémonie & réception</span></div>
          <p class="popup-description">Un domaine enchanteur niché au cœur du Pilat.</p>
        </div>`)
      .addTo(this._map);
  },

  _getAccommodationEmoji(accommodation) {
    const name = (accommodation.name || '').toLowerCase();
    if (name.includes('gîte') || name.includes('gite')) return '🏡';
    if (name.includes('chambre')) return '🛏️';
    if (name.includes('hôtel') || name.includes('hotel')) return '🏨';
    if (name.includes('camping')) return '⛺';
    return '🏡';
  },

  _addAccommodationMarker(accommodation) {
    if (!this._map || !accommodation.lat || !accommodation.lng) return;
    const emoji = this._getAccommodationEmoji(accommodation);
    const icon = L.divIcon({
      className: 'marker-accommodation-wrapper',
      html: `<div class="marker-accommodation"><span class="marker-accommodation-icon">${emoji}</span></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
    const marker = L.marker([accommodation.lat, accommodation.lng], { icon });
    let popup = `<div class="map-popup"><h3>${emoji} ${accommodation.name || 'Hébergement'}</h3>`;
    if (accommodation.capacity) popup += `<div class="popup-detail"><span>👥</span><span>Capacité : ${accommodation.capacity}</span></div>`;
    if (accommodation.distance) popup += `<div class="popup-detail"><span>📏</span><span>À ${accommodation.distance} du domaine</span></div>`;
    if (accommodation.description) popup += `<p class="popup-description">${accommodation.description}</p>`;
    if (accommodation.bookingUrl) popup += `<a href="${accommodation.bookingUrl}" target="_blank" rel="noopener" class="popup-book-link">Réserver →</a>`;
    popup += '</div>';
    marker.bindPopup(popup);
    this._markersLayer.addLayer(marker);
  },

  async _loadAccommodations() {
    try {
      const result = await Store.getAccommodations();
      const accommodations = Array.isArray(result) ? result : [];
      if (this._markersLayer) this._markersLayer.clearLayers();
      accommodations.forEach((acc) => this._addAccommodationMarker(acc));
      this._renderAccommodationsList(accommodations);
    } catch (e) {
      console.error('[Map] Erreur chargement hébergements :', e);
    }
  },

  _renderAccommodationsList(accommodations) {
    if (!this._elements.accommodationsList) return;
    if (!accommodations.length) {
      this._elements.accommodationsList.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <span style="font-size:3rem;display:block;margin-bottom:1rem;">🏡</span>
          <h3 style="color:#2D5A3D;">Hébergements à venir</h3>
          <p style="color:#888;">Les suggestions seront bientôt disponibles.</p>
        </div>`;
      return;
    }

    let html = '<div class="accommodations-grid">';
    accommodations.forEach((acc, index) => {
      const emoji = this._getAccommodationEmoji(acc);
      html += `
        <div class="card accommodation-card" data-accommodation-id="${acc.id}" style="animation-delay:${index * 100}ms">
          <div class="accommodation-card-header">
            <span class="accommodation-emoji">${emoji}</span>
            <h3 class="accommodation-name">${acc.name || 'Hébergement'}</h3>
          </div>
          <div class="accommodation-card-body">
            ${acc.capacity ? `<div class="accommodation-detail"><span>👥</span><span>Capacité : ${acc.capacity}</span></div>` : ''}
            ${acc.distance ? `<div class="accommodation-detail"><span>📏</span><span>À ${acc.distance} du domaine</span></div>` : ''}
            ${acc.description ? `<p class="accommodation-description">${acc.description}</p>` : ''}
          </div>
          ${acc.bookingUrl ? `<div class="accommodation-card-footer"><a href="${acc.bookingUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Réserver →</a></div>` : ''}
        </div>`;
    });
    html += '</div>';
    this._elements.accommodationsList.innerHTML = html;
    this._injectListStyles();

    this._elements.accommodationsList.querySelectorAll('.accommodation-card').forEach((card) => {
      card.addEventListener('click', () => {
        const acc = accommodations.find((a) => a.id === card.dataset.accommodationId);
        if (acc && acc.lat && acc.lng && this._map) {
          this._map.flyTo([acc.lat, acc.lng], 15, { duration: 0.8 });
        }
      });
    });
  },

  _injectListStyles() {
    if (document.getElementById('map-list-styles')) return;
    const style = document.createElement('style');
    style.id = 'map-list-styles';
    style.textContent = `
      .accommodations-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;padding:1rem 0; }
      .accommodation-card { cursor:pointer;transition:transform 0.3s,box-shadow 0.3s; }
      .accommodation-card:hover { transform:translateY(-4px);box-shadow:0 8px 24px rgba(45,90,61,0.15); }
      .accommodation-card-header { display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem; }
      .accommodation-emoji { font-size:2rem;line-height:1; }
      .accommodation-name { color:#2D5A3D;font-size:1.1rem;font-weight:600;margin:0; }
      .accommodation-detail { display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;font-size:0.9rem;color:#555; }
      .accommodation-description { font-size:0.88rem;color:#666;line-height:1.5;margin:0.75rem 0; }
      .accommodation-card-footer { margin-top:1rem;padding-top:0.75rem;border-top:1px solid rgba(156,175,136,0.2); }
      @media (max-width:640px) { .accommodations-grid { grid-template-columns:1fr; } }
    `;
    document.head.appendChild(style);
  },
};

export default MapComponent;