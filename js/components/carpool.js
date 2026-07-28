/**
 * ============================================================
 * Composant Carpool — Gestion du covoiturage (Version Ergonomique)
 * ============================================================
 *
 * Fonctionnalités :
 *   - Affichage simplifié : "Place disponible" / "Place demandée"
 *   - Tri par filtres cumulatifs : Ville, Jour de départ, Places nécessaires
 *   - Cartes épurées, sans émoji, avec badge circulaire
 *   - Révélation dynamique du contact téléphonique au clic sur "Contacter"
 */

import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const Carpool = {
  /** Références DOM */
  _elements: {
    container: null,
  },

  /** Filtres courants */
  _cityFilter: '',
  _dayFilter: '',
  _seatsFilter: 0,

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

  // ─── EXTRACTION & FORMATAGE DES DONNÉES ─────────────────

  /**
   * Récupère les conducteurs depuis le Store.
   */
  async _getDrivers() {
    try {
      const result = await Store.getGuests();
      const guests = Array.isArray(result) ? result : [];
      return guests
        .filter((g) => g.transport && g.transport.carpoolRole === 'offer')
        .map((g) => ({
          id: g.id,
          name: `${g.firstName} ${g.lastName}`,
          city: g.transport.city || 'Non précisé',
          seatsAvailable: g.transport.seatsAvailable || 0,
          departureDay: g.transport.departureDay || '',
          departureTime: g.transport.departureTime || '',
          contact: g.transport.contactPhone || g.phone || '',
        }));
    } catch (e) {
      console.error('[Carpool] Erreur _getDrivers :', e);
      return [];
    }
  },

  /**
   * Récupère les passagers depuis le Store.
   */
  async _getPassengers() {
    try {
      const result = await Store.getGuests();
      const guests = Array.isArray(result) ? result : [];
      return guests
        .filter((g) => g.transport && g.transport.carpoolRole === 'need')
        .map((g) => ({
          id: g.id,
          name: `${g.firstName} ${g.lastName}`,
          city: g.transport.city || 'Non précisé',
          seatsNeeded: g.transport.seatsNeeded || 1,
          departureDay: g.transport.departureDay || '',
          contact: g.transport.contactPhone || g.phone || '',
        }));
    } catch (e) {
      console.error('[Carpool] Erreur _getPassengers :', e);
      return [];
    }
  },

  /**
   * Formate proprement la date ISO au format français.
   */
  _formatDate(dateStr) {
    if (!dateStr) return 'non précisé';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const months = [
          'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
          'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
        ];
        return `${day} ${months[monthIndex]} ${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Applique l'ensemble des filtres cumulatifs (Ville, Jour, Places).
   */
  _applyFilters(list, isDriver) {
    return list.filter((item) => {
      const city = (item.city || '').toLowerCase().trim();
      const filterCity = this._cityFilter.toLowerCase().trim();
      const matchesCity = !filterCity || city.includes(filterCity);

      const matchesDay = !this._dayFilter || item.departureDay === this._dayFilter;

      const seats = isDriver ? item.seatsAvailable : item.seatsNeeded;
      const matchesSeats = !this._seatsFilter || seats >= this._seatsFilter;

      return matchesCity && matchesDay && matchesSeats;
    });
  },

  // ─── RENDU HTML ───────────────────────────────────────

  /**
   * Génère le rendu principal du composant.
   */
  async _render() {
    if (!this._elements.container) return;
    
    let isPublished = true;
    try {
      isPublished = await Store.getSettings('publication').then(s => s['covoiturage']);
    } catch (err) {}

    if (!isPublished) {
      this._elements.container.innerHTML = `
        <div class="container" style="text-align: center; padding: 4rem 1rem;">
           <span style="font-size:3rem;display:block;margin-bottom:16px;">⏳</span>
           <h3 style="color:#2D5A3D; font-family: var(--font-display);">${window.I18n.t('publication.comingSoon')}</h3>
        </div>
      `;
      return;
    }

    const allDrivers = await this._getDrivers();
    const allPassengers = await this._getPassengers();
    
    const drivers = this._applyFilters(allDrivers, true);
    const passengers = this._applyFilters(allPassengers, false);

    const totalSeatsAvailable = allDrivers.reduce((sum, d) => sum + d.seatsAvailable, 0);
    const totalSeatsNeeded = allPassengers.reduce((sum, p) => sum + p.seatsNeeded, 0);

    this._elements.container.innerHTML = `
      <!-- En-tête : Boutons à gauche, Tableau récapitulatif à droite -->
      <div class="carpool-top-layout" style="display: flex; justify-content: space-between; align-items: stretch; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;">
        
        <!-- Partie Gauche : Boutons de sélection -->
        <div class="carpool-left-panel" style="display: flex; flex-direction: column; gap: 1rem; flex: 1; min-width: 250px;">
          <button id="btn-mode-request" class="btn-carpool-mode" data-mode="request">
            Demander un covoiturage
          </button>
          <button id="btn-mode-offer" class="btn-carpool-mode" data-mode="offer">
            Proposer un covoiturage
          </button>
        </div>

        <!-- Partie Droite : Tableau récapitulatif (largeur réduite) -->
        <div class="carpool-stats" style="flex: 1; min-width: 250px; margin-bottom: 0;">
          <div class="carpool-stat">
            <span class="carpool-stat-number">${totalSeatsAvailable}</span>
            <span class="carpool-stat-label">place${totalSeatsAvailable > 1 ? 's' : ''} disponible${totalSeatsAvailable > 1 ? 's' : ''}</span>
          </div>
          <div class="carpool-stat-divider"></div>
          <div class="carpool-stat">
            <span class="carpool-stat-number">${totalSeatsNeeded}</span>
            <span class="carpool-stat-label">place${totalSeatsNeeded > 1 ? 's' : ''} demandée${totalSeatsNeeded > 1 ? 's' : ''}</span>
          </div>
        </div>

      </div>

      <!-- Formulaire global : Toute la largeur de la page -->
      <div id="carpool-right-panel" class="carpool-right-panel" style="display: none; background: var(--white); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid rgba(156, 175, 136, 0.2); box-shadow: var(--shadow-sm); margin-bottom: 2.5rem;">
        
        <!-- Ville de départ ou Case à cocher Gare -->
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label>Ville de départ</label>
          <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            <input type="text" id="carpool-city" class="form-control" placeholder="Ex: Lyon..." style="flex: 2; min-width: 200px;" />
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal; cursor: pointer; color: var(--forest); flex: 1; min-width: 220px;">
              <input type="checkbox" id="carpool-station-checkbox" /> Gare TER Péage-de-Roussillon
            </label>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
          
          <!-- Jour de départ (Indicateur intégré) -->
          <div class="form-group" style="flex: 1; min-width: 180px;">
            <select id="carpool-day" class="form-control carpool-placeholder-select" style="text-align: center; text-align-last: center;">
              <option value="" selected disabled>Jour de départ</option>
              <option value="2027-05-06">Jeudi 6 mai 2027</option>
              <option value="2027-05-07">Vendredi 7 mai 2027</option>
              <option value="2027-05-08">Samedi 8 mai 2027</option>
            </select>
          </div>

          <!-- Heure de départ (Indicateur intégré + Déclencheur d'horloge) -->
          <div class="form-group" style="flex: 1; min-width: 180px;">
            <input type="text" id="carpool-time" class="form-control" placeholder="Heure de départ" style="text-align: center;" />
          </div>

          <!-- Places (Indicateur intégré dans le champ nombre avec boutons - et +) -->
          <div class="form-group" style="flex: 1; min-width: 180px;">
            <div class="carpool-stepper" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <button type="button" id="btn-seats-minus" class="btn-stepper">-</button>
              <input type="number" id="carpool-seats" class="form-control" min="1" placeholder="1 place" style="text-align: center; width: 90px;" />
              <button type="button" id="btn-seats-plus" class="btn-stepper">+</button>
            </div>
          </div>

        </div>

        </div>
      </div>

      <!-- Contenu principal -->
      <div class="carpool-columns">
        <!-- Colonne Offres -->
        <div class="carpool-column">
          <h3 class="carpool-column-title">
            Conducteurs
            <span class="column-count">${drivers.length}</span>
          </h3>
          <div class="carpool-cards" id="carpool-drivers-list">
            ${drivers.length ? drivers.map((d) => this._renderDriverCard(d)).join('') : `
              <div class="carpool-empty">
                <p>Aucun conducteur ne correspond à vos critères</p>
              </div>
            `}
          </div>
        </div>

        <!-- Colonne Demandes -->
        <div class="carpool-column">
          <h3 class="carpool-column-title">
            Passagers
            <span class="column-count">${passengers.length}</span>
          </h3>
          <div class="carpool-cards" id="carpool-passengers-list">
            ${passengers.length ? passengers.map((p) => this._renderPassengerCard(p)).join('') : `
              <div class="carpool-empty">
                <p>Aucune demande ne correspond à vos critères</p>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Appel à l'action -->
      <div class="carpool-cta">
        <button class="btn btn-primary" id="carpool-cta-btn">
          Proposer ou chercher un covoiturage
        </button>
      </div>
    `;

    this._attachListeners();
    this._injectStyles();

    if (Animations && Animations.staggerChildren) {
      Animations.staggerChildren(this._elements.container, '.carpool-card', 60);
    }
  },

  /**
   * Rendu de carte conducteur épurée.
   */
  _renderDriverCard(driver) {
    const formattedDate = this._formatDate(driver.departureDay);
    const timeStr = driver.departureTime ? ` à ${driver.departureTime}` : '';
    return `
      <div class="card carpool-card carpool-card--driver">
        <div class="carpool-card-main">
          <div class="carpool-card-info">
            <h4 class="carpool-card-name">${driver.name}</h4>
            <p class="carpool-card-route">
              Depuis <strong>${driver.city}</strong> Le <strong>${formattedDate}${timeStr}</strong>
            </p>
          </div>
          <div class="carpool-seats-badge-container">
            <span class="carpool-seats-circle" title="Places disponibles">${driver.seatsAvailable}</span>
            <span class="carpool-seats-label">dispo.</span>
          </div>
        </div>
        ${driver.contact ? `
          <div class="carpool-card-footer">
            <div class="carpool-card-contact-wrapper">
              <button class="btn-reveal-contact" data-phone="${driver.contact}">Contacter</button>
              <span class="revealed-contact" style="display:none;">
                <a href="tel:${driver.contact}" class="carpool-contact-link">${driver.contact}</a>
              </span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Rendu de carte passager épurée.
   */
  _renderPassengerCard(passenger) {
    const formattedDate = this._formatDate(passenger.departureDay);
    return `
      <div class="card carpool-card carpool-card--passenger">
        <div class="carpool-card-main">
          <div class="carpool-card-info">
            <h4 class="carpool-card-name">${passenger.name}</h4>
            <p class="carpool-card-route">
              Depuis <strong>${passenger.city}</strong> Le <strong>${formattedDate}</strong>
            </p>
          </div>
          <div class="carpool-seats-badge-container">
            <span class="carpool-seats-circle passenger" title="Places nécessaires">${passenger.seatsNeeded}</span>
            <span class="carpool-seats-label">requise${passenger.seatsNeeded > 1 ? 's' : ''}</span>
          </div>
        </div>
        ${passenger.contact ? `
          <div class="carpool-card-footer">
            <div class="carpool-card-contact-wrapper">
              <button class="btn-reveal-contact" data-phone="${passenger.contact}">Contacter</button>
              <span class="revealed-contact" style="display:none;">
                <a href="tel:${passenger.contact}" class="carpool-contact-link">${passenger.contact}</a>
              </span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ─── LISTENERS D'ÉVÉNEMENTS ─────────────────────────────

  /**
   * Attache les écouteurs d'événements.
   */
/**
   * Attache les écouteurs d'événements.
   */
  _attachListeners() {
    let selectedMode = null; // 'request' ou 'offer'

    const btnRequest = document.getElementById('btn-mode-request');
    const btnOffer = document.getElementById('btn-mode-offer');
    const rightPanel = document.getElementById('carpool-right-panel');
    const btnValidate = document.getElementById('btn-validate-carpool');
    
    // Déclaration UNIQUE de tous les éléments du formulaire
    const stationCheckbox = document.getElementById('carpool-station-checkbox');
    const cityInput = document.getElementById('carpool-city');
    const seatsInput = document.getElementById('carpool-seats');
    const btnMinus = document.getElementById('btn-seats-minus');
    const btnPlus = document.getElementById('btn-seats-plus');
    const timeInput = document.getElementById('carpool-time');
    const daySelect = document.getElementById('carpool-day');

    const toggleMode = (mode) => {
      selectedMode = mode;
      if (btnRequest) btnRequest.classList.toggle('is-active', mode === 'request');
      if (btnOffer) btnOffer.classList.toggle('is-active', mode === 'offer');
      if (rightPanel) rightPanel.style.display = 'block';
      if (btnValidate) {
        btnValidate.textContent = mode === 'request' ? 'Valider ma demande' : 'Valider ma proposition';
      }
    };

    if (btnRequest) btnRequest.addEventListener('click', () => toggleMode('request'));
    if (btnOffer) btnOffer.addEventListener('click', () => toggleMode('offer'));

    // 1. Gestion de la case à cocher Gare TER
    if (stationCheckbox && cityInput) {
      stationCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          cityInput.value = 'Gare TER Péage-de-Roussillon';
          cityInput.disabled = true;
        } else {
          cityInput.value = '';
          cityInput.disabled = false;
        }
      });
    }

    // 2. Gestion du sélecteur de places (- / +) et du placeholder
    if (btnMinus && seatsInput) {
      btnMinus.addEventListener('click', () => {
        let val = parseInt(seatsInput.value, 10) || 1;
        if (val > 1) {
          seatsInput.value = val - 1;
          seatsInput.placeholder = '';
        }
      });
    }
    if (btnPlus && seatsInput) {
      btnPlus.addEventListener('click', () => {
        let val = parseInt(seatsInput.value, 10) || 0;
        seatsInput.value = val + 1;
        seatsInput.placeholder = '';
      });
    }
    if (seatsInput) {
      seatsInput.addEventListener('input', () => {
        if (seatsInput.value) seatsInput.placeholder = '';
      });
    }

    // 3. Transformation intelligente du champ Heure en horloge native
    if (timeInput) {
      timeInput.addEventListener('focus', () => {
        timeInput.type = 'time';
        if (typeof timeInput.showPicker === 'function') {
          try {
            timeInput.showPicker(); // Ouvre l'horloge native
          } catch (e) {
            // Silence en cas d'erreur de support navigateur
          }
        }
      });
      timeInput.addEventListener('blur', () => {
        if (!timeInput.value) {
          timeInput.type = 'text';
          timeInput.placeholder = 'Heure de départ';
        }
      });
    }

    // 4. Gestion de la couleur du sélecteur "Jour" pour imiter un placeholder
    if (daySelect) {
      daySelect.addEventListener('change', () => {
        if (daySelect.value) {
          daySelect.style.color = 'var(--text-dark)';
        }
      });
      daySelect.style.color = 'var(--text-muted)'; // Gris par défaut
    }

    // 5. Validation et enregistrement (Logique Supabase)
    if (btnValidate) {
      btnValidate.addEventListener('click', () => {
        const payload = {
          type: selectedMode,
          city: stationCheckbox && stationCheckbox.checked ? 'Gare TER Péage-de-Roussillon' : (cityInput ? cityInput.value : ''),
          departureDay: daySelect ? daySelect.value : '',
          departureTime: timeInput ? timeInput.value : '',
          seats: seatsInput ? (parseInt(seatsInput.value, 10) || 1) : 1
        };
        console.log("Données à enregistrer :", payload);
        // await Store.saveCarpool(payload);
      });
    }

    // 6. Dépliage du contact (Cartes existantes)
    const container = this._elements.container;
    if (container) {
      container.querySelectorAll('.btn-reveal-contact').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const wrapper = btn.closest('.carpool-card-contact-wrapper');
          const contactSpan = wrapper.querySelector('.revealed-contact');
          btn.style.display = 'none';
          contactSpan.style.display = 'inline-block';
        });
      });
    }

    // 7. Redirection RSVP (Appel à l'action en bas)
    const ctaBtn = document.getElementById('carpool-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        Router.navigate('#/rsvp');
      });
    }
  },
  
  // ─── FEUILLES DE STYLES CSS ─────────────────────────────

  /**
   * Injecte dynamiquement les styles épurés et responsifs.
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
        gap: 3rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, rgba(45, 90, 61, 0.04), rgba(156, 175, 136, 0.08));
        border-radius: var(--radius-lg);
        border: 1px solid rgba(156, 175, 136, 0.15);
      }
      .carpool-stat {
        text-align: center;
      }
      .carpool-stat-number {
        display: block;
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--forest);
        line-height: 1;
      }
      .carpool-stat-label {
        font-size: 0.85rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .carpool-stat-divider {
        width: 1px;
        height: 40px;
        background: rgba(156, 175, 136, 0.3);
      }

      /* Colonnes de cartes */
      .carpool-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      .carpool-column-title {
        color: var(--forest);
        font-size: 1.2rem;
        font-weight: 600;
        font-family: var(--font-display);
        margin-bottom: 1.25rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid rgba(156, 175, 136, 0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .column-count {
        background: var(--sage);
        color: #fff;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
      }

      /* Design Lite des Cartes */
      .carpool-cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .carpool-card {
        padding: 1.25rem;
        border-radius: var(--radius-md);
        border: 1px solid rgba(156, 175, 136, 0.2);
        background: var(--white);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .carpool-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      .carpool-card-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }
      .carpool-card-info {
        flex: 1;
      }
      .carpool-card-name {
        margin: 0 0 0.25rem 0;
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--forest);
      }
      .carpool-card-route {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-muted);
      }
      .carpool-card-route strong {
        color: var(--text-dark);
      }

      /* Badge rond pour les places */
      .carpool-seats-badge-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 60px;
      }
      .carpool-seats-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--sage);
        color: #fff;
        font-weight: 600;
        font-size: 1.05rem;
        box-shadow: 0 2px 6px rgba(156, 175, 136, 0.2);
      }
      .carpool-seats-circle.passenger {
        background-color: var(--gold);
        box-shadow: 0 2px 6px rgba(201, 168, 76, 0.2);
      }
      .carpool-seats-label {
        font-size: 0.65rem;
        color: var(--text-muted);
        margin-top: 4px;
        text-transform: uppercase;
        font-weight: 500;
      }
      
      .btn-carpool-mode {
        padding: 1rem;
        font-family: var(--font-body);
        font-size: 1.1rem;
        font-weight: 500;
        border-radius: var(--radius-sm);
        border: 1px solid var(--sage);
        background-color: var(--cream);
        color: var(--forest);
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
      }

      .btn-carpool-mode.is-active {
        background-color: #D3DCD0;
        border-color: var(--forest);
        font-weight: 600;
      }

      /* Révélation de contact */
      .carpool-card-footer {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px dashed rgba(156, 175, 136, 0.25);
      }
      .btn-reveal-contact {
        background: none;
        border: 1px solid var(--sage);
        color: var(--forest);
        padding: 0.35rem 1rem;
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
        font-family: var(--font-body);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-reveal-contact:hover {
        background-color: var(--sage);
        color: white;
      }
      .revealed-contact {
        font-weight: 600;
        font-size: 0.95rem;
        animation: fadeInReveal 0.25s ease-out;
      }
      .carpool-contact-link {
        color: var(--forest);
        text-decoration: none;
        border-bottom: 1px solid var(--sage);
        padding-bottom: 1px;
      }
      .carpool-contact-link:hover {
        color: var(--gold);
        border-color: var(--gold);
      }

      .carpool-empty {
        text-align: center;
        padding: 2.5rem 1rem;
        color: var(--text-muted);
        border: 1px dashed rgba(156, 175, 136, 0.25);
        border-radius: var(--radius-md);
        background-color: rgba(250, 248, 245, 0.5);
      }

      .carpool-cta {
        text-align: center;
        padding: 2rem 0;
      }

      @keyframes fadeInReveal {
        from { opacity: 0; transform: translateY(3px); }
        to { opacity: 1; transform: translateY(0); }
      }
	  
	  /* Boutons du Stepper de places (- et +) */
      .btn-stepper {
        width: 38px;
        height: 38px;
        background: var(--cream);
        border: 1px solid var(--sage);
        border-radius: var(--radius-sm);
        color: var(--forest);
        font-weight: bold;
        font-size: 1.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
      }
      .btn-stepper:hover {
        background: #D3DCD0;
      }

      @media (max-width: 768px) {
        .carpool-columns {
          grid-template-columns: 1fr;
        }
        .carpool-stats {
          gap: 1.5rem;
        }
        .carpool-stat-divider {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  },
};

export default Carpool;