import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const AdminDashboard = {
  loginBtn: null,
  logoutBtn: null,

  init() {
    // Événements login
    this.loginBtn = document.getElementById('admin-login-btn');
    if (this.loginBtn) {
      this.loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        const errDiv = document.getElementById('admin-error');
        if (await Store.adminLogin(password)) {
          if (errDiv) errDiv.style.display = 'none';
          document.getElementById('admin-password').value = '';
          Animations.showToast("Connexion réussie", "success");
          Router.navigate('#/admin/dashboard');
        } else {
          if (errDiv) {
            errDiv.textContent = "Mot de passe incorrect";
            errDiv.style.display = 'block';
            errDiv.style.color = 'red';
            errDiv.style.marginTop = '10px';
          }
          Animations.showToast("Mot de passe incorrect", "error");
        }
      });
    }

    // Événements logout
    this.logoutBtn = document.getElementById('admin-logout-btn');
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        Store.adminLogout();
        Animations.showToast("Déconnexion", "success");
        Router.navigate('#/admin');
      });
    }

    // Auto-refresh quand les données changent (si on est sur le dashboard)
    const refreshIfActive = () => {
      if (Router.getCurrentRoute() === '#/admin/dashboard' && Store.isAdmin()) {
        this.renderDashboard();
      }
    };

    Store.on('guests-changed', refreshIfActive);
    Store.on('carpools-changed', refreshIfActive);
    Store.on('accommodations-changed', refreshIfActive);

    // Si on navigue sur le dashboard, rendre les données
    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/admin/dashboard') {
        if (!Store.isAdmin()) {
          Router.navigate('#/admin');
          return;
        }
        this.renderDashboard();
      }
    });
  },

  renderDashboard() {
    this.renderStats();
    this.renderDiets();
    this.renderGuestsList();
    this.renderCarpools();
    this.renderAccommodations();
  },

  renderStats() {
    const stats = Store.getStats();

    const setStat = (id, number, label) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="stat-card__number">${number}</div><div class="stat-card__label">${label}</div>`;
    };

    setStat('stat-total', stats.totalGuests, `Foyers invités (${stats.totalPeople} pers.)`);
    setStat('stat-confirmed', stats.confirmed, `Confirmés (${stats.confirmedPeople} pers.)`);
    setStat('stat-declined', stats.declined, 'Déclinés');
    setStat('stat-pending', stats.pending, 'En attente');
  },

  renderDiets() {
    const stats = Store.getStats();
    const container = document.getElementById('admin-diets');
    if (!container) return;

    let html = `
      <div class="admin-grid mb-4">
        <div class="card">
          <h4>Végétariens</h4>
          <div class="stat-card__number" style="color: var(--sage)">${stats.diets.vegetarian}</div>
        </div>
        <div class="card">
          <h4>Végans</h4>
          <div class="stat-card__number" style="color: var(--forest)">${stats.diets.vegan}</div>
        </div>
        <div class="card">
          <h4>Sans alcool</h4>
          <div class="stat-card__number" style="color: #6a9bd8">${stats.diets.noAlcohol}</div>
        </div>
      </div>
    `;

    if (stats.diets.allergies.length > 0) {
      html += `
        <div class="card">
          <h4>Allergies déclarées</h4>
          <ul style="margin-top: 10px; padding-left: 20px;">
            ${stats.diets.allergies.map(a => `<li><strong>${a.name} :</strong> ${a.details}</li>`).join('')}
          </ul>
        </div>
      `;
    } else {
      html += `<div class="card"><p class="text-muted">Aucune allergie déclarée pour le moment.</p></div>`;
    }

    container.innerHTML = html;
  },

  renderGuestsList() {
    const container = document.getElementById('admin-guests-list');
    if (!container) return;
    const guests = Store.getGuests();

    if (guests.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-4">Aucune réponse pour le moment.</p>';
      return;
    }

    let html = `
      <div class="table-responsive">
        <table class="admin-table" style="width:100%; border-collapse: collapse; margin-top:20px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--gold); text-align: left;">
              <th style="padding: 10px;">Nom</th>
              <th style="padding: 10px;">Présence</th>
              <th style="padding: 10px;">Accomp.</th>
              <th style="padding: 10px;">Contact</th>
              <th style="padding: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    guests.forEach((g, idx) => {
      const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
      let presence = '<span class="badge badge--pending">En attente</span>';
      if (g.attending === true) presence = '<span class="badge badge--confirmed">Oui</span>';
      if (g.attending === false) presence = '<span class="badge badge--declined">Non</span>';

      html += `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #eee;">
          <td style="padding: 10px;"><strong>${g.firstName} ${g.lastName}</strong></td>
          <td style="padding: 10px;">${presence}</td>
          <td style="padding: 10px;">${g.companions.length}</td>
          <td style="padding: 10px;">${g.email}<br><small>${g.phone || ''}</small></td>
          <td style="padding: 10px;">
            <button class="btn btn--outline delete-guest-btn" data-id="${g.id}" style="padding: 4px 8px; font-size: 12px; color: red; border-color: red;">Supprimer</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;

    // Attacher les événements de suppression
    container.querySelectorAll('.delete-guest-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cet invité et toutes ses données associées (covoiturage) ?")) {
          Store.deleteGuest(e.target.dataset.id);
          Animations.showToast("Invité supprimé", "success");
        }
      });
    });
  },

  renderCarpools() {
    const container = document.getElementById('admin-carpools');
    if (!container) return;
    const stats = Store.getStats();

    let html = `
      <div class="admin-grid mb-4">
        <div class="card" style="border-left: 4px solid var(--sage);">
          <h4>Conducteurs</h4>
          <p class="text-muted mt-2">${stats.transport.drivers} voitures proposent un total de <strong>${stats.transport.seatsAvailable} places</strong>.</p>
        </div>
        <div class="card" style="border-left: 4px solid var(--gold);">
          <h4>Recherche de places</h4>
          <p class="text-muted mt-2">${stats.transport.needRide} personnes ont besoin d'un total de <strong>${stats.transport.seatsNeeded} places</strong>.</p>
        </div>
      </div>
      <p class="text-center mt-2"><a href="#/covoiturage" class="btn btn--secondary">Gérer les covoiturages sur la page publique</a></p>
    `;

    container.innerHTML = html;
  },

  renderAccommodations() {
    const container = document.getElementById('admin-accommodations');
    if (!container) return;
    const accommodations = Store.getAccommodations();

    let html = `
      <div class="mb-4">
        <button class="btn btn--primary" id="add-acc-btn">+ Ajouter un hébergement</button>
      </div>
      <div class="carpool-list" style="margin-top: 20px;">
    `;

    accommodations.forEach(acc => {
      html += `
        <div class="card mb-3">
          <h4>${acc.name}</h4>
          <p class="text-muted"><small>📍 ${acc.lat}, ${acc.lng} | 🛏️ Capacité : ${acc.capacity}</small></p>
          <div class="mt-3">
            <button class="btn btn--outline delete-acc-btn" data-id="${acc.id}" style="padding: 4px 8px; font-size: 12px; color: red; border-color: red;">Supprimer</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    const addBtn = container.querySelector('#add-acc-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const name = prompt("Nom de l'hébergement :");
        if (!name) return;
        const lat = prompt("Latitude (ex: 45.42) :");
        const lng = prompt("Longitude (ex: 4.59) :");
        const capacity = prompt("Capacité (ex: 4 personnes) :");

        Store.saveAccommodation({
          name, lat: parseFloat(lat) || 45.411, lng: parseFloat(lng) || 4.588, capacity,
          description: "", distance: "", bookingUrl: ""
        });
        Animations.showToast("Hébergement ajouté", "success");
      });
    }

    container.querySelectorAll('.delete-acc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm("Supprimer cet hébergement ?")) {
          Store.deleteAccommodation(e.target.dataset.id);
          Animations.showToast("Hébergement supprimé", "success");
        }
      });
    });
  }
};

export default AdminDashboard;