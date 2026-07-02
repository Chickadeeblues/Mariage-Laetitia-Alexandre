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

import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

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
  async init() {
    this._elements.container = document.getElementById('carpool-container');
    if (!this._elements.container) return;

    // Rendu initial
    await this._render();
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
  async _getDrivers() {
  const guests = await Store.getGuests() || [];
    return guests
      .filter((g) => g.transport && g.transport.carpoolRole === 'offer')
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
  async _getPassengers() {
  const guests = await Store.getGuests() || [];
    return guests
      .filter((g) => g.transport && g.transport.carpoolRole === 'need')
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
  async _render() {
  if (!this._elements.container) return;
  const allDrivers = await this._getDrivers();
  const allPassengers = await this._getPassengers();
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

export default Carpool;
