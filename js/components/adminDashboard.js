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
    Store.on('guests-changed',        refreshIfActive);
    Store.on('carpools-changed',      refreshIfActive);
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
      await Promise.all([
        this.renderStats(),
        this.renderDiets(),
        this.renderGuestsList(),
        this.renderCarpools(),
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
  // Stats (Correction : 4 cartes alignées, couleurs ciblées)
  // ════════════════════════════════════════════════

  async renderStats() {
    const stats = await Store.getStats();

    const firstStatCard = document.getElementById('stat-total') || 
                          document.getElementById('stat-confirmed') ||
                          document.querySelector('.stat-card')?.parentElement;
                          
    const container = firstStatCard ? (firstStatCard.id ? firstStatCard.parentElement : firstStatCard) : null;

    const confirmedCount = stats.confirmedPeople !== undefined ? stats.confirmedPeople : stats.confirmed || 0;
    const brunchCount = stats.brunchPeople !== undefined ? stats.brunchPeople : stats.brunch || 0;

    if (container) {
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
      container.style.gap = '16px';
      container.style.marginBottom = '24px';
      
      container.innerHTML = `
        <div class="card" style="text-align: center;">
          <div class="stat-card__number">${confirmedCount}</div>
          <div class="stat-card__label">Personnes confirmées</div>
        </div>
        <div class="card" style="text-align: center;">
          <div class="stat-card__number">${brunchCount}</div>
          <div class="stat-card__label">Présents au Brunch</div>
        </div>
        <div class="card" style="text-align: center;">
          <div class="stat-card__number" style="color: var(--sage);">${stats.maybe || 0}</div>
          <div class="stat-card__label">Peut-être</div>
        </div>
        <div class="card" style="text-align: center;">
          <div class="stat-card__number" style="color: #e06666;">${stats.declined || 0}</div>
          <div class="stat-card__label">Déclinés</div>
        </div>
      `;
    }
  },

  // ════════════════════════════════════════════════
  // Régimes alimentaires (Correction : Même format épuré, aligné au dessus)
  // ════════════════════════════════════════════════

  async renderDiets() {
    const container = document.getElementById('admin-diets');
    if (!container) return;
    const stats = await Store.getStats();

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        
        <div class="card" style="text-align: center;">
          <div class="stat-card__number">${stats.diets.vegetarian || 0}</div>
          <div class="stat-card__label">Végétariens</div>
        </div>

        <div class="card" style="text-align: center;">
          <div class="stat-card__number">${stats.diets.vegan || 0}</div>
          <div class="stat-card__label">Végans</div>
        </div>

        <div class="card" style="text-align: center;">
          <div class="stat-card__number">${stats.diets.noAlcohol || 0}</div>
          <div class="stat-card__label">Sans alcool</div>
        </div>

        <div class="card" style="text-align: left;">
          <h4 style="margin: 0 0 8px 0; font-family: var(--font-body); font-size: 14px; font-weight: 600;">Allergies déclarées (${stats.diets.allergies?.length || 0})</h4>
          ${stats.diets.allergies && stats.diets.allergies.length > 0 ? `
            <ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 13px; color: var(--text-dark);">
              ${stats.diets.allergies.map(a => `<li><strong>${a.name} :</strong> ${a.details}</li>`).join('')}
            </ul>
          ` : `<p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">Aucune allergie</p>`}
        </div>

      </div>
    `;
  },

  // ════════════════════════════════════════════════
  // Liste des invités (Colonnes Régime/Hébergement + Alignement & Modif)
  // ════════════════════════════════════════════════

  async renderGuestsList() {
    const container = document.getElementById('admin-guests-list');
    if (!container) return;

    container.innerHTML = '<p class="text-muted text-center mt-2">Chargement…</p>';
    const guests = await Store.getGuests();

    if (guests.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-4">Aucune réponse pour le moment.</p>';
      return;
    }

    const badgeFor = (attending) => {
      if (attending === true)      return '<span class="badge badge--confirmed">✓ Oui</span>';
      if (attending === false)     return '<span class="badge badge--declined">✗ Non</span>';
      if (attending === 'maybe')   return '<span class="badge badge--pending">? Peut-être</span>';
      return '<span class="badge badge--pending">En attente</span>';
    };

    // Fonction interne pour générer les pastilles de régimes
    const getDietBadges = (person) => {
      let badges = [];
      if (person.vegetarian) badges.push('<span class="badge" style="background:#EFF3EC; color:var(--forest); border:1px solid #D5E0D0;">Végé</span>');
      if (person.vegan)      badges.push('<span class="badge" style="background:#E8EFEA; color:var(--forest); border:1px solid #C4D6C8;">Végan</span>');
      if (person.noAlcohol)  badges.push('<span class="badge" style="background:#EDF4FB; color:#4A779D; border:1px solid #CADDED;">Sans Alc.</span>');
      if (person.allergies)  badges.push(`<span class="badge" style="background:#FDF9EE; color:#8C7326; border:1px solid #E8D5A3;" title="${person.allergies}">Allergie</span>`);
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
              <th style="padding:10px; width: 90px;">Actions</th>
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
        transportText += `<br><span class="badge" style="background:var(--sage); color:#fff; font-size:11px; padding:2px 6px; border-radius:4px; display:inline-block; margin-top:4px;">Propose covoiturage</span>`;
      } else if (g.transport?.carpoolRole === 'need') {
        transportText += `<br><span class="badge" style="background:var(--gold); color:#fff; font-size:11px; padding:2px 6px; border-radius:4px; display:inline-block; margin-top:4px;">Demande covoiturage</span>`;
      }

      const brunch = g.brunch === true ? '☕ Oui' : g.brunch === false ? '🙏 Non' : '—';
      const accommodation = g.accommodation || '—';
      const formattedPhone = formatPhone(g.phone);

      // Ligne invité principal
      html += `
        <tr style="background:${bg}; border-bottom:${g.companions?.length > 0 ? 'none' : '1px solid #eee'};">
          <td style="padding:10px;">
            <strong>${g.firstName} ${g.lastName}</strong>
            ${formattedPhone ? `<br><small style="color:var(--text-muted); font-family:monospace; font-size:12px;">${formattedPhone}</small>` : ''}
          </td>
          <td style="padding:10px;">${badgeFor(g.attending)}</td>
          <td style="padding:10px;">${brunch}</td>
          <td style="padding:10px;">${getDietBadges(g)}</td>
          <td style="padding:10px;">${transportText}</td>
          <td style="padding:10px;"><strong>${accommodation}</strong></td>
          <td style="padding:10px; display:flex; gap:6px;">
            <button class="btn btn--outline edit-guest-btn" data-id="${g.id}" style="padding:2px 6px; font-size:12px; color:var(--gold); border-color:var(--gold);" title="Modifier">✏️</button>
            <button class="btn btn--outline delete-guest-btn" data-id="${g.id}" style="padding:2px 6px; font-size:12px; color:red; border-color:red; font-weight:bold;" title="Supprimer">×</button>
          </td>
        </tr>
      `;

      // Lignes des accompagnants
      if (g.companions && g.companions.length > 0) {
        g.companions.forEach((comp, cIdx) => {
          const isLast = cIdx === g.companions.length - 1;
          html += `
            <tr style="background:${bg}; border-bottom:${isLast ? '1px solid #eee' : 'none'};">
              <td style="padding:10px; position:relative;">
                <span style="position:absolute; left:-6px; top:-11px; background:var(--gold); color:#fff; width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.15); z-index:2;">+</span>
                <strong>${comp.name}</strong>
              </td>
              <td style="padding:10px;">${badgeFor(g.attending)}</td>
              <td style="padding:10px;">${brunch}</td>
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

    // Action : Modifier (✏️) manuellement
    container.querySelectorAll('.edit-guest-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const targetGuest = guests.find(g => g.id == id);
        if (!targetGuest) return;

        // 1. Présence
        const pInput = prompt("Présence (oui / non / maybe) :", targetGuest.attending === true ? 'oui' : targetGuest.attending === false ? 'non' : 'maybe');
        if (pInput === null) return; // Annulation globale

        let newAttending = targetGuest.attending;
        if (pInput.toLowerCase() === 'oui') newAttending = true;
        else if (pInput.toLowerCase() === 'non') newAttending = false;
        else if (pInput.toLowerCase() === 'maybe') newAttending = 'maybe';

        // 2. Brunch
        const bInput = prompt("Présence au Brunch (oui / non) :", targetGuest.brunch === true ? 'oui' : 'non');
        const newBrunch = bInput ? (bInput.toLowerCase() === 'oui') : targetGuest.brunch;

        // 3. Hébergement
        const newAcc = prompt("Lieu d'hébergement :", targetGuest.accommodation || '');

        // Sauvegarde des modifications via le Store
        try {
          const updatedData = {
            ...targetGuest,
            attending: newAttending,
            brunch: newBrunch,
            accommodation: newAcc !== null ? newAcc : targetGuest.accommodation
          };
          
          if (Store.saveGuest) {
            await Store.saveGuest(updatedData);
          } else if (Store.updateGuest) {
            await Store.updateGuest(updatedData);
          }
          Animations.showToast("Données mises à jour", "success");
          this.renderDashboard();
        } catch (err) {
          console.error(err);
          Animations.showToast("Erreur lors de la modification", "error");
        }
      });
    });
  },

  // ════════════════════════════════════════════════
  // Covoiturage
  // ════════════════════════════════════════════════

  async renderCarpools() {
    const container = document.getElementById('admin-carpools');
    if (!container) return;
    const stats = await Store.getStats();

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