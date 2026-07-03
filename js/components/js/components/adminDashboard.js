import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

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
  // Stats
  // ════════════════════════════════════════════════

  async renderStats() {
    const stats = await Store.getStats();

    const setStat = (id, number, label) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `
        <div class="stat-card__number">${number}</div>
        <div class="stat-card__label">${label}</div>`;
    };

    setStat('stat-total',     stats.totalGuests,  `Foyers invités (${stats.totalPeople} pers.)`);
    setStat('stat-confirmed', stats.confirmed,    `Confirmés (${stats.confirmedPeople} pers.)`);
    setStat('stat-maybe',     stats.maybe,        'Peut-être');
    setStat('stat-declined',  stats.declined,     'Déclinés');
    setStat('stat-pending',   stats.pending,      'En attente');
  },

  // ════════════════════════════════════════════════
  // Régimes alimentaires
  // ════════════════════════════════════════════════

  async renderDiets() {
    const container = document.getElementById('admin-diets');
    if (!container) return;
    const stats = await Store.getStats();

    let html = `
      <div class="admin-grid mb-4">
        <div class="card">
          <h4>🥗 Végétariens</h4>
          <div class="stat-card__number" style="color: var(--sage)">${stats.diets.vegetarian}</div>
        </div>
        <div class="card">
          <h4>🌱 Végans</h4>
          <div class="stat-card__number" style="color: var(--forest)">${stats.diets.vegan}</div>
        </div>
        <div class="card">
          <h4>🧃 Sans alcool</h4>
          <div class="stat-card__number" style="color: #6a9bd8">${stats.diets.noAlcohol}</div>
        </div>
      </div>
    `;

    if (stats.diets.allergies.length > 0) {
      html += `
        <div class="card">
          <h4>⚠️ Allergies déclarées</h4>
          <ul style="margin-top: 10px; padding-left: 20px;">
            ${stats.diets.allergies.map(a =>
              `<li><strong>${a.name} :</strong> ${a.details}</li>`
            ).join('')}
          </ul>
        </div>`;
    } else {
      html += `<div class="card"><p class="text-muted">Aucune allergie déclarée pour le moment.</p></div>`;
    }

    container.innerHTML = html;
  },

  // ════════════════════════════════════════════════
  // Liste des invités
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

    let html = `
      <div class="table-responsive">
        <table class="admin-table" style="width:100%; border-collapse:collapse; margin-top:20px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--gold); text-align: left;">
              <th style="padding:10px;">Nom</th>
              <th style="padding:10px;">Présence</th>
              <th style="padding:10px;">Brunch</th>
              <th style="padding:10px;">Accomp.</th>
              <th style="padding:10px;">Contact</th>
              <th style="padding:10px;">Transport</th>
              <th style="padding:10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    guests.forEach((g, idx) => {
      const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
      const transport = g.transport?.mode
        ? { car: '🚗', train: '🚆', other: '✈️' }[g.transport.mode] || '—'
        : '—';
      const brunch = g.brunch === true ? '☕ Oui' : g.brunch === false ? '🙏 Non' : '—';

      html += `
        <tr style="background:${bg}; border-bottom:1px solid #eee;">
          <td style="padding:10px;"><strong>${g.firstName} ${g.lastName}</strong></td>
          <td style="padding:10px;">${badgeFor(g.attending)}</td>
          <td style="padding:10px;">${brunch}</td>
          <td style="padding:10px;">${g.companions.length}</td>
          <td style="padding:10px;">${g.email || ''}<br><small>${g.phone || ''}</small></td>
          <td style="padding:10px;">${transport}</td>
          <td style="padding:10px;">
            <button class="btn btn--outline delete-guest-btn"
              data-id="${g.id}"
              style="padding:4px 8px; font-size:12px; color:red; border-color:red;">
              Supprimer
            </button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;

    container.querySelectorAll('.delete-guest-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm("Supprimer cet invité et toutes ses données ?")) {
          await Store.deleteGuest(e.target.dataset.id);
          Animations.showToast("Invité supprimé", "success");
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

    // Ajouter un hébergement
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

    // Supprimer un hébergement
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