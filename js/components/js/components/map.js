/**
 * Composant Map — Carte Leaflet & liste des hébergements
 * Avec disponibilités en temps réel et gare TER
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
  _elements: { mapContainer: null, accommodationsList: null },
  _domainCoords: DOMAIN,
  _domainZoom: 12,

  async init() {
    this._elements.mapContainer      = document.getElementById('map-container');
    this._elements.accommodationsList = document.getElementById('accommodations-list');
    if (!this._elements.mapContainer) return;
    this._initMap();
    await this._loadAccommodations();
    Store.on('accommodations-changed', () => this._loadAccommodations());
    Store.on('guests-changed',         () => this._loadAccommodations());
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

  _getEmoji(acc) {
    const n = (acc.name || '').toLowerCase();
    if (n.includes('domaine') || n.includes('scie')) return '🏰';
    if (n.includes('hôtel') || n.includes('hotel') || n.includes('éclosion')) return '🏨';
    if (n.includes('chambre') || n.includes('delphine')) return '🛏️';
    if (n.includes('camping') || n.includes('huttopia') || n.includes('lône') || n.includes('époque')) return '⛺';
    return '🏡';
  },

  _addAccommodationMarker(acc) {
    if (!this._map || !acc.lat || !acc.lng) return;

    // Ne pas superposer le marqueur hébergement sur le domaine
    const isDomain = Math.abs(acc.lat - DOMAIN[0]) < 0.001 && Math.abs(acc.lng - DOMAIN[1]) < 0.001;
    if (isDomain) return;

    const emoji = this._getEmoji(acc);
    const icon = L.divIcon({
      className: '',
      html: `<div class="marker-acc"><span class="marker-icon">${emoji}</span></div>`,
      iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -40],
    });

    let popup = `<div class="map-popup"><h3>${emoji} ${acc.name}</h3>`;
    if (acc.distance)       popup += `<div class="popup-row">📏 À ${acc.distance} du domaine</div>`;
    if (acc.capacityNumber > 0 && acc.spotsLeft !== undefined) {
      const color = acc.spotsLeft === 0 ? '#c0392b' : acc.spotsLeft <= 2 ? '#e67e22' : '#27ae60';
      popup += `<div class="popup-row" style="color:${color};font-weight:600;">
        🛏️ ${acc.spotsLeft} place${acc.spotsLeft > 1 ? 's' : ''} restante${acc.spotsLeft > 1 ? 's' : ''} / ${acc.capacityNumber}
      </div>`;
    }
    if (acc.description)    popup += `<p style="font-size:12px;color:#666;margin:6px 0;">${acc.description}</p>`;
    if (acc.bookingUrl)     popup += `<a href="${acc.bookingUrl}" target="_blank" class="popup-link">Réserver →</a>`;
    popup += '</div>';

    const marker = L.marker([acc.lat, acc.lng], { icon });
    marker.bindPopup(popup);
    this._markersLayer.addLayer(marker);
  },

  async _loadAccommodations() {
    try {
      const result = await Store.getAccommodationsWithAvailability();
      const accommodations = Array.isArray(result) ? result : [];

      // Trier par distance GPS depuis le domaine
      accommodations.sort((a, b) => {
        const da = distKm(DOMAIN[0], DOMAIN[1], a.lat || 0, a.lng || 0);
        const db = distKm(DOMAIN[0], DOMAIN[1], b.lat || 0, b.lng || 0);
        return da - db;
      });

      if (this._markersLayer) this._markersLayer.clearLayers();
      accommodations.forEach(acc => this._addAccommodationMarker(acc));
      this._renderList(accommodations);
    } catch (e) {
      console.error('[Map] Erreur chargement hébergements :', e);
    }
  },

  _renderList(accommodations) {
    if (!this._elements.accommodationsList) return;

    if (!accommodations.length) {
      this._elements.accommodationsList.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <span style="font-size:3rem;display:block;margin-bottom:1rem;">🏡</span>
          <h3 style="color:#5c4e35;">Hébergements à venir</h3>
          <p style="color:#888;">Les suggestions seront bientôt disponibles.</p>
        </div>`;
      return;
    }

    let html = '<div class="acc-list">';

    accommodations.forEach((acc, idx) => {
      const emoji = this._getEmoji(acc);
      const dist = distKm(DOMAIN[0], DOMAIN[1], acc.lat || 0, acc.lng || 0);
      const distLabel = dist < 0.5 ? 'Sur place' : `~${Math.round(dist)} km`;

      // Badge disponibilité
      let availBadge = '';
      if (acc.capacityNumber > 0 && acc.spotsLeft !== undefined) {
        if (acc.spotsLeft === 0) {
          availBadge = `<span class="acc-badge acc-badge--full">Complet</span>`;
        } else {
          const color = acc.spotsLeft <= 2 ? 'orange' : 'green';
          availBadge = `<span class="acc-badge acc-badge--${color}">${acc.spotsLeft} place${acc.spotsLeft > 1 ? 's' : ''} restante${acc.spotsLeft > 1 ? 's' : ''}</span>`;
        }
      } else if (acc.capacityNumber === 0 && acc.name.includes('Domaine')) {
        availBadge = `<span class="acc-badge acc-badge--contact">Contacter les mariés</span>`;
      } else if (acc.bookingUrl) {
        availBadge = `<span class="acc-badge acc-badge--link">Voir disponibilités</span>`;
      }

      html += `
        <div class="acc-card" data-id="${acc.id}" data-lat="${acc.lat}" data-lng="${acc.lng}" style="animation-delay:${idx * 60}ms">
          <div class="acc-card__head">
            <span class="acc-emoji">${emoji}</span>
            <div class="acc-card__title-group">
              <h3 class="acc-name">${acc.name}</h3>
              <span class="acc-dist">📏 ${distLabel}</span>
            </div>
            ${availBadge}
          </div>
          ${acc.description ? `<p class="acc-desc">${acc.description}</p>` : ''}
          ${acc.bookingUrl && !acc.name.includes('Domaine')
            ? `<a href="${acc.bookingUrl}" target="_blank" rel="noopener" class="acc-link">Réserver / Voir →</a>`
            : acc.name.includes('Domaine')
            ? `<p class="acc-contact">📞 Réservation via les mariés uniquement — 20€/pers/nuit</p>`
            : ''}
        </div>`;
    });

    html += '</div>';
    this._elements.accommodationsList.innerHTML = html;

    // Clic sur une carte → centre la map
    this._elements.accommodationsList.querySelectorAll('.acc-card').forEach(card => {
      card.addEventListener('click', () => {
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
      .popup-link { display:inline-block;margin-top:8px;padding:4px 14px;background:#9b8660;color:#fff;text-decoration:none;border-radius:20px;font-size:13px; }

      /* Liste hébergements */
      .acc-list { display:flex;flex-direction:column;gap:14px;margin-top:24px; }
      .acc-card { background:#fff;border:1.5px solid #e8e0d0;border-radius:12px;padding:16px 18px;cursor:pointer;transition:box-shadow .2s,transform .2s; }
      .acc-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.1);transform:translateY(-2px); }
      .acc-card__head { display:flex;align-items:center;gap:12px;flex-wrap:wrap; }
      .acc-emoji { font-size:1.8rem;flex-shrink:0; }
      .acc-card__title-group { flex:1;min-width:0; }
      .acc-name { margin:0;font-size:1rem;font-weight:600;color:#2D5A3D; }
      .acc-dist { font-size:12px;color:#aaa; }
      .acc-desc { font-size:13px;color:#666;line-height:1.5;margin:10px 0 6px; }
      .acc-link { display:inline-block;margin-top:8px;font-size:13px;color:#9b8660;font-weight:500;text-decoration:underline; }
      .acc-contact { font-size:13px;color:#7a6135;margin-top:8px;font-style:italic; }

      /* Badges disponibilité */
      .acc-badge { display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;margin-left:auto; }
      .acc-badge--green   { background:#eafaf1;color:#1e8449; }
      .acc-badge--orange  { background:#fef9e7;color:#b7770d; }
      .acc-badge--full    { background:#fdecea;color:#c0392b; }
      .acc-badge--contact { background:#fdf8ee;color:#7a6135; }
      .acc-badge--link    { background:#f0f4f8;color:#2874a6; }

      @media(max-width:600px) {
        .acc-card__head { gap:8px; }
        .acc-badge { margin-left:0;margin-top:6px; }
      }
    `;
    document.head.appendChild(s);
  },
};

export default MapComponent;