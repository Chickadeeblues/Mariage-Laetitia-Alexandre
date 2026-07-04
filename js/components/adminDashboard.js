import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

// Utilitaire pour formater le téléphone (0600000000 -> 06 00 00 00 00)
const formatPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

const AdminDashboard = {
  logoutBtn: null,

  init() {
    // ── Login ──────────────────────────────────────
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        const errDiv   = document.getElementById('admin-error');
        if (await Store.adminLogin(password)) {
          if (errDiv) errDiv.style.display = 'none';
          document.getElementById('admin-password').value = '';
          Animations.showToast("Connexion réussie", "success");
          Router.navigate('#/admin/dashboard');
        } else {
          if (errDiv) {
            errDiv.textContent   = "Mot de passe incorrect";
            errDiv.style.display = 'block';
            errDiv.style.color   = 'red';
            errDiv.style.marginTop = '10px';
          }
          Animations.showToast("Mot de passe incorrect", "error");
        }
      });
    }

    // ── Logout ─────────────────────────────────────
    this.logoutBtn = document.getElementById('admin-logout-btn');
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        Store.adminLogout();
        Animations.showToast("Déconnexion", "success");
        Router.navigate('#/admin');
      });
    }

    // ── Auto-refresh sur changement de données ─────
    const refreshIfActive = () => {
      if (Router.getCurrentRoute() === '#/admin/dashboard' && Store.isAdmin()) {
        this.renderDashboard();
      }
    };
    Store.on('guests-changed',         refreshIfActive);
    Store.on('carpools-changed',       refreshIfActive);
    Store.on('accommodations-changed', refreshIfActive);

    // ── Rendu au changement de route ───────────────
    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/admin/dashboard') {
        if (!Store.isAdmin()) { Router.navigate('#/admin'); return; }
        this.renderDashboard();
      }
    });
  },

  // ════════════════════════════════════════════════
  // Dashboard principal
  // ════════════════════════════════════════════════

  async renderDashboard() {
    this.showLoader();
    try {
      // On récupère les invités en amont pour garantir la précision des calculs
      const guests = await Store.getGuests();
      const stats  = await Store.getStats();

      await Promise.all([
        this.renderStatsAndDiets(stats, guests),
        this.renderGuestsList(guests),
        this.renderCarpools(stats),
        this.renderAccommodations()
      ]);
    } catch (e) {
      console.error('[Admin] Erreur renderDashboard :', e);
      Animations.showToast("Erreur de chargement des données", "error");
    } finally {
      this.hideLoader();
    }
  },

  showLoader() {
    const el = document.getElementById('admin-loader');
    if (el) el.style.display = 'block';
  },
  hideLoader() {
    const el = document.getElementById('admin-loader');
    if (el) el.style.display = 'none';
  },

  // ════════════════════════════════════════════════
  // 1 & 2 & 3. Grille unifiée (Stats + Régimes : 8 cartes strictes)
  // ════════════════════════════════════════════════

  async renderStatsAndDiets(stats, guests) {
    // 1. Calcul infaillible des participants au Brunch depuis la liste brute
    const exactBrunchCount = guests.reduce((total, g) => {
      const isAttending = g.attending === true || g.attending === 'true' || g.attending === 'oui' || g.attending === 1;
      const wantsBrunch = g.brunch === true || g.brunch === 'true' || g.brunch === 'oui' || g.brunch === 1;
      if (isAttending && wantsBrunch) {
        return total + 1 + (Array.isArray(g.companions) ? g.companions.length : 0);
      }
      return total;
    }, 0);

    const confirmedCount = stats.confirmedPeople !== undefined ? stats.confirmedPeople : stats.confirmed || 0;

    // Localisation des conteneurs dans le DOM
    const firstStatCard = document.getElementById('stat-total') || 
                          document.getElementById('stat-confirmed') ||
                          document.querySelector('.stat-card')?.parentElement;
    const statsContainer = firstStatCard ? (firstStatCard.id ? firstStatCard.parentElement : firstStatCard) : null;
    const dietsContainer = document.getElementById('admin-diets');

    // Style commun et strict pour garantir 8 cartes absolument identiques
    const cardStyle = `
      background: var(--white, #fff);
      border-radius: var(--radius-lg, 16px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      height: 110px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 10px;
      box-sizing: border-box;
      overflow: hidden;
    `;

    const gridStyle = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 16px;
      width: 100%;
    `;

    // ── Rangée 1 : Statistiques de présence ──
    if (statsContainer) {
      statsContainer.style.cssText = gridStyle;
      statsContainer.innerHTML = `
        <div class="card" style="${cardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--text-dark);">${confirmedCount}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Confirmés</div>
        </div>
        <div class="card" style="${cardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--text-dark);">${exactBrunchCount}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Présents au Brunch</div>
        </div>
        <div class="card" style="${cardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--sage);">${stats.maybe || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Peut-être</div>
        </div>
        <div class="card" style="${cardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:#e06666;">${stats.declined || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Déclinés</div>
        </div>
      `;
    }

    // ── Rangée 2 : Régimes alimentaires (Chiffres colorés & format identique) ──
    if (dietsContainer) {
      dietsContainer.style.cssText = gridStyle;
      
      const allergiesCount = stats.diets.allergies?.length || 0;
      const allergiesTooltip = allergiesCount > 0 
        ? stats.diets.allergies.map(a => `${a.name}: ${a.details}`).join(' | ') 
        : 'Aucune allergie';

      dietsContainer.innerHTML = `
        <div class="card" style="${cardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--sage);">${stats.diets.vegetarian || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Végétariens</div>
        </div>
        <div class="card" style="${cardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--forest);">${stats.diets.vegan || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Végans</div>
        </div>
        <div class="card" style="${cardStyle}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:#4A779D;">${stats.diets.noAlcohol || 0}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Sans alcool</div>
        </div>
        <div class="card" style="${cardStyle}" title="${allergiesTooltip}">
          <div class="stat-card__number" style="font-size:28px; font-weight:700; color:var(--gold);">${allergiesCount}</div>
          <div class="stat-card__label" style="font-size:13px; color:var(--text-muted); margin-top:4px;">Allergies déclarées</div>
          ${allergiesCount > 0 ? `<div style="font-size:10px; color:var(--gold); margin-top:2px; max-width:90%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${allergiesTooltip}</div>` : ''}
        </div>
      `;
    }
  },

  // ════════════════════════════════════════════════
  // Liste des invités
  // ════════════════════════════════════════════════

  async renderGuestsList(guests) {
    const container = document.getElementById('admin-guests-list');
    if (!container) return;

    if (guests.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-4">Aucune réponse pour le moment.</p>';
      return;
    }

    const badgeFor = (attending) => {
      if (attending === true || attending === 'true' || attending === 'oui') return '<span class="badge badge--confirmed">✓ Oui</span>';
      if (attending === false || attending === 'false' || attending === 'non') return '<span class="badge badge--declined">✗ Non</span>';
      if (attending === 'maybe') return '<span class="badge badge--pending">? Peut-être</span>';
      return '<span class="badge badge--pending">En attente</span>';
    };

    const getDietBadges = (person) => {
      let badges = [];
      if (person.vegetarian) badges.push('<span class="badge" style="background:#EFF3EC; color:var(--forest); border:1px solid #D5E0D0; font-size:11px;">Végé</span>');
      if (person.vegan)      badges.push('<span class="badge" style="background:#E8EFEA; color:var(--forest); border:1px solid #C4D6C8; font-size:11px;">Végan</span>');
      if (person.noAlcohol)  badges.push('<span class="badge" style="background:#EDF4FB; color:#4A779D; border:1px solid #CADDED; font-size:11px;">Sans Alc.</span>');
      if (person.allergies || person.allergyDetails || person.allergy_details) {
        const details = person.allergies || person.allergyDetails || person.allergy_details;
        badges.push(`<span class="badge" style="background:#FDF9EE; color:#8C7326; border:1px solid #E8D5A3; font-size:11px;" title="${details}">⚠️ Allergie</span>`);
      }
      return badges.length > 0 ? badges.join(' ') : '—';
    };

    let html = `
      <div class="table-responsive">
        <table class="admin-table" style="width:100%; border-collapse:collapse; margin-top:20px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--gold); text-align: left;">
              <th style="padding:10px;">Nom & Téléphone</th>
              <th style="padding:10px;">Présence</th>
              <th style="padding:10px;">Brunch</th>
              <th style="padding:10px;">Régime</th>
              <th style="padding:10px;">Transport</th>
              <th style="padding:10px;">Hébergement</th>
              <th style="padding:10px; width: 80px;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    guests.forEach((g, idx) => {
      const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
      
      let transportText = '—';
      if (g.transport?.mode) {
        const modes = { car: 'Voiture', train: 'Train', other: 'Autre' };
        transportText = modes[g.transport.mode] || g.transport.mode;
      }
      if (g.transport?.carpoolRole === 'offer') {
        transportText += `<br><span class="badge" style="background:var(--sage); color:#fff; font-size:10px; padding:2px 4px; border-radius:4px; display:inline-block; margin-top:2px;">Propose covoiturage</span>`;
      } else if (g.transport?.carpoolRole === 'need') {
        transportText += `<br><span class="badge" style="background:var(--gold); color:#fff; font-size:10px; padding:2px 4px; border-radius:4px; display:inline-block; margin-top:2px;">Demande covoiturage</span>`;
      }

      const isBrunch = g.brunch === true || g.brunch === 'true' || g.brunch === 'oui' || g.brunch === 1;
      const brunchText = isBrunch ? '☕ Oui' : '🙏 Non';
      const accommodation = g.accommodationName || g.accommodation_name || g.accommodation || '—';
      const formattedPhone = formatPhone(g.phone);

      // Ligne de l'invité principal
      html += `
        <tr style="background:${bg}; border-bottom:${g.companions?.length > 0 ? 'none' : '1px solid #eee'};">
          <td style="padding:10px;">
            <strong>${g.firstName || ''} ${g.lastName || ''}</strong>
            ${formattedPhone ? `<br><small style="color:var(--text-muted); font-family:monospace; font-size:12px;">${formattedPhone}</small>` : ''}
          </td>
          <td style="padding:10px;">${badgeFor(g.attending)}</td>
          <td style="padding:10px;">${brunchText}</td>
          <td style="padding:10px;">${getDietBadges(g)}</td>
          <td style="padding:10px;">${transportText}</td>
          <td style="padding:10px;"><strong>${accommodation}</strong></td>
          <td style="padding:10px; display:flex; gap:6px;">
            <button class="btn btn--outline edit-guest-btn" data-id="${g.id}" style="padding:2px 8px; font-size:14px; color:var(--gold); border-color:var(--gold); cursor:pointer;" title="Modifier">✏️</button>
            <button class="btn btn--outline delete-guest-btn" data-id="${g.id}" style="padding:2px 8px; font-size:14px; color:red; border-color:red; font-weight:bold; cursor:pointer;" title="Supprimer">×</button>
          </td>
        </tr>
      `;

      // Lignes des accompagnants (alignement gauche exact)
      if (g.companions && g.companions.length > 0) {
        g.companions.forEach((comp, cIdx) => {
          const isLast = cIdx === g.companions.length - 1;
          html += `
            <tr style="background:${bg}; border-bottom:${isLast ? '1px solid #eee' : 'none'};">
              <td style="padding:10px; position:relative;">
                <span style="position:absolute; left:-6px; top:-10px; background:var(--gold); color:#fff; width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.15); z-index:2;">+</span>
                <strong>${comp.name}</strong>
              </td>
              <td style="padding:10px;">${badgeFor(g.attending)}</td>
              <td style="padding:10px;">${brunchText}</td>
              <td style="padding:10px;">${getDietBadges(comp)}</td>
              <td style="padding:10px;"><span class="text-muted">—</span></td>
              <td style="padding:10px;"><span class="text-muted">—</span></td>
              <td style="padding:10px;"></td>
            </tr>
          `;
        });
      }
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;

    // Action : Supprimer (×)
    container.querySelectorAll('.delete-guest-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Supprimer cet invité et toutes ses données ?")) {
          await Store.deleteGuest(id);
          Animations.showToast("Invité supprimé", "success");
        }
      });
    });

    // Action : Modifier (✏️) via Modale interactive ergonomique
    container.querySelectorAll('.edit-guest-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const targetGuest = guests.find(g => g.id == id);
        if (targetGuest) this.openEditModal(targetGuest);
      });
    });
  },

  // ════════════════════════════════════════════════
  // 4. Modale interactive d'édition (Adieu les prompt!)
  // ════════════════════════════════════════════════

  openEditModal(guest) {
    // Supprime une ancienne modale si existante
    const existingModal = document.getElementById('admin-edit-modal');
    if (existingModal) existingModal.remove();

    const isBrunch = guest.brunch === true || guest.brunch === 'true' || guest.brunch === 'oui' || guest.brunch === 1;
    const currentAcc = guest.accommodationName || guest.accommodation_name || guest.accommodation || '';
    const currentMode = guest.transport?.mode || '';

    // Construction HTML de la fenêtre modale
    const modalHtml = `
      <div id="admin-edit-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);">
        <div style="background:var(--cream, #FAF8F5); border-radius:var(--radius-lg, 20px); width:90%; max-width:450px; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.2); border:1px solid var(--gold);">
          
          <h3 style="margin:0 0 16px 0; font-family:var(--font-display); color:var(--forest); font-size:24px; border-bottom:1px solid var(--gold-light); padding-bottom:8px;">
            ✏️ Modifier : ${guest.firstName} ${guest.lastName}
          </h3>

          <form id="admin-edit-form">
            <label style="display:block; font-size:14px; font-weight:600; color:var(--text-dark); margin-bottom:4px;">Présence au mariage</label>
            <select id="edit-attending" style="width:100%; padding:10px; border-radius:var(--radius-sm, 8px); border:1px solid #ccc; margin-bottom:14px; font-family:var(--font-body);">
              <option value="true" ${guest.attending === true || guest.attending === 'true' ? 'selected' : ''}>✓ Confirmé (Oui)</option>
              <option value="false" ${guest.attending === false || guest.attending === 'false' ? 'selected' : ''}>✗ Décliné (Non)</option>
              <option value="maybe" ${guest.attending === 'maybe' ? 'selected' : ''}>? Peut-être</option>
              <option value="null" ${guest.attending == null ? 'selected' : ''}>En attente</option>
            </select>

            <label style="display:block; font-size:14px; font-weight:600; color:var(--text-dark); margin-bottom:4px;">Présence au Brunch du dimanche</label>
            <select id="edit-brunch" style="width:100%; padding:10px; border-radius:var(--radius-sm, 8px); border:1px solid #ccc; margin-bottom:14px; font-family:var(--font-body);">
              <option value="true" ${isBrunch ? 'selected' : ''}>☕ Oui, sera présent</option>
              <option value="false" ${!isBrunch ? 'selected' : ''}>🙏 Non, ne vient pas</option>
            </select>

            <label style="display:block; font-size:14px; font-weight:600; color:var(--text-dark); margin-bottom:4px;">Mode de transport</label>
            <select id="edit-transport" style="width:100%; padding:10px; border-radius:var(--radius-sm, 8px); border:1px solid #ccc; margin-bottom:14px; font-family:var(--font-body);">
              <option value="" ${!currentMode ? 'selected' : ''}>— Non renseigné —</option>
              <option value="car" ${currentMode === 'car' ? 'selected' : ''}>🚗 Voiture</option>
              <option value="train" ${currentMode === 'train' ? 'selected' : ''}>🚆 Train</option>
              <option value="other" ${currentMode === 'other' ? 'selected' : ''}>✈️ Autre</option>
            </select>

            <label style="display:block; font-size:14px; font-weight:600; color:var(--text-dark); margin-bottom:4px;">Lieu d'hébergement</label>
            <input type="text" id="edit-acc" value="${currentAcc}" placeholder="Ex: Domaine de la Scie du May" style="width:100%; padding:10px; border-radius:var(--radius-sm, 8px); border:1px solid #ccc; margin-bottom:20px; box-sizing:border-box; font-family:var(--font-body);" />

            <div style="display:flex; justify-content:flex-end; gap:10px;">
              <button type="button" id="edit-cancel-btn" class="btn btn--outline" style="padding:8px 16px;">Annuler</button>
              <button type="submit" class="btn btn--primary" style="padding:8px 16px; background:var(--forest); color:#fff; border:none; border-radius:var(--radius-sm);">Enregistrer</button>
            </div>
          </form>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('admin-edit-modal');
    const cancelBtn = document.getElementById('edit-cancel-btn');
    const form = document.getElementById('admin-edit-form');

    // Fermeture de la modale
    const closeModal = () => modal.remove();
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Soumission de la modification
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const attVal = document.getElementById('edit-attending').value;
      const newAttending = attVal === 'true' ? true : attVal === 'false' ? false : attVal === 'maybe' ? 'maybe' : null;
      const newBrunch    = document.getElementById('edit-brunch').value === 'true';
      const newTransport = document.getElementById('edit-transport').value;
      const newAcc       = document.getElementById('edit-acc').value.trim();

      const updatedGuest = {
        ...guest,
        attending: newAttending,
        brunch: newBrunch,
        accommodation_name: newAcc,
        accommodationName: newAcc,
        transport: {
          ...(guest.transport || {}),
          mode: newTransport || undefined
        }
      };

      try {
        if (typeof Store.updateGuest === 'function') {
          await Store.updateGuest(guest.id, updatedGuest);
        } else if (typeof Store.saveGuest === 'function') {
          await Store.saveGuest(updatedGuest);
        }
        Animations.showToast("Modification enregistrée", "success");
        closeModal();
        this.renderDashboard();
      } catch (err) {
        console.error(err);
        Animations.showToast("Erreur lors de la sauvegarde", "error");
      }
    });
  },

  // ════════════════════════════════════════════════
  // Covoiturage
  // ════════════════════════════════════════════════

  async renderCarpools(stats) {
    const container = document.getElementById('admin-carpools');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-grid mb-4">
        <div class="card" style="border-left:4px solid var(--sage);">
          <h4>🚗 Conducteurs</h4>
          <p class="text-muted mt-2">
            ${stats.transport.drivers} voiture(s) — 
            <strong>${stats.transport.seatsAvailable} place(s)</strong> disponible(s).
          </p>
        </div>
        <div class="card" style="border-left:4px solid var(--gold);">
          <h4>🙋 Recherche de places</h4>
          <p class="text-muted mt-2">
            ${stats.transport.needRide} personne(s) — 
            <strong>${stats.transport.seatsNeeded} place(s)</strong> recherchée(s).
          </p>
        </div>
      </div>
      <p class="text-center mt-2">
        <a href="#/covoiturage" class="btn btn--secondary">
          Gérer les covoiturages sur la page publique
        </a>
      </p>
    `;
  },

  // ════════════════════════════════════════════════
  // Hébergements
  // ════════════════════════════════════════════════

  async renderAccommodations() {
    const container = document.getElementById('admin-accommodations');
    if (!container) return;

    container.innerHTML = '<p class="text-muted text-center mt-2">Chargement…</p>';
    const accommodations = await Store.getAccommodations();

    let html = `
      <div class="mb-4">
        <button class="btn btn--primary" id="add-acc-btn">+ Ajouter un hébergement</button>
      </div>
      <div class="carpool-list" style="margin-top:20px;">
    `;

    accommodations.forEach(acc => {
      html += `
        <div class="card mb-3">
          <h4>${acc.name}</h4>
          <p class="text-muted">
            <small>📍 ${acc.lat}, ${acc.lng} | 🛏️ ${acc.capacity} | 📏 ${acc.distance || '—'}</small>
          </p>
          ${acc.bookingUrl
            ? `<p><a href="${acc.bookingUrl}" target="_blank" style="font-size:13px; color:var(--gold);">Voir le lien de réservation →</a></p>`
            : ''}
          <div class="mt-3">
            <button class="btn btn--outline delete-acc-btn"
              data-id="${acc.id}"
              style="padding:4px 8px; font-size:12px; color:red; border-color:red;">
              Supprimer
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    const addBtn = container.querySelector('#add-acc-btn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const name = prompt("Nom de l'hébergement :");
        if (!name) return;
        const lat      = prompt("Latitude (ex: 45.42) :");
        const lng      = prompt("Longitude (ex: 4.59) :");
        const capacity = prompt("Capacité (ex: 4 personnes) :");
        const bookingUrl = prompt("Lien de réservation (optionnel) :") || '';

        await Store.saveAccommodation({
          name,
          lat:        parseFloat(lat) || 45.411,
          lng:        parseFloat(lng) || 4.588,
          capacity:   capacity || '',
          bookingUrl,
          description: '',
          distance:    '',
          icon:        'gite'
        });
        Animations.showToast("Hébergement ajouté", "success");
      });
    }

    container.querySelectorAll('.delete-acc-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm("Supprimer cet hébergement ?")) {
          await Store.deleteAccommodation(e.target.dataset.id);
          Animations.showToast("Hébergement supprimé", "success");
        }
      });
    });
  }
};

export default AdminDashboard;