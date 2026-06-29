import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const adminDashboard = {
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
    const guests = Store.getGuests();
    
    // Calcul précis du brunch basé sur l'invité principal
    const brunchCount = guests.filter(g => g.brunch === true).length;

    const setStat = (id, number, label) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="stat-card__number">${number}</div><div class="stat-card__label">${label}</div>`;
    };

    setStat('stat-total', stats.totalGuests, `Foyers invités (${stats.totalPeople} pers.)`);
    setStat('stat-confirmed', stats.confirmed, `Confirmés (${stats.confirmedPeople} pers.)`);
    setStat('stat-pending', stats.pending, 'En attente (Peut-être)');
    setStat('stat-declined', stats.declined, 'Déclinés');
    
    // Ajout visuel du brunch (Assurez-vous d'avoir un conteneur HTML avec cette ID si nécessaire)
    const brunchEl = document.getElementById('stat-brunch');
    if (brunchEl) {
      brunchEl.innerHTML = `<div class="stat-card__number" style="color: var(--gold);">${brunchCount}</div><div class="stat-card__label">Présents au Brunch</div>`;
    }
  },

  renderDiets() {
    const stats = Store.getStats();
    const container = document.getElementById('admin-diets');
    if (!container) return;

    // Version optimisée et plus compacte de la grille
    let html = `
      <div class="admin-grid mb-3" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
        <div class="card" style="padding: 10px; text-align: center;">
          <h5 style="margin: 0; font-size: 14px;">🥗 Végétariens</h5>
          <strong style="font-size: 20px; color: var(--sage); display: block; margin-top: 5px;">${stats.diets.vegetarian}</strong>
        </div>
        <div class="card" style="padding: 10px; text-align: center;">
          <h5 style="margin: 0; font-size: 14px;">🌱 Végans</h5>
          <strong style="font-size: 20px; color: var(--forest); display: block; margin-top: 5px;">${stats.diets.vegan}</strong>
        </div>
        <div class="card" style="padding: 10px; text-align: center;">
          <h5 style="margin: 0; font-size: 14px;">🧃 Sans alcool</h5>
          <strong style="font-size: 20px; color: #6a9bd8; display: block; margin-top: 5px;">${stats.diets.noAlcohol}</strong>
        </div>
      </div>
    `;

    if (stats.diets.allergies && stats.diets.allergies.length > 0) {
      html += `
        <div class="card" style="padding: 12px;">
          <h5 style="margin: 0 0 8px 0;">⚠️ Allergies déclarées</h5>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.4;">
            ${stats.diets.allergies.map(a => `<li><strong>${a.name} :</strong> ${a.details}</li>`).join('')}
          </ul>
        </div>
      `;
    } else {
      html += `<div class="card" style="padding: 10px;"><p class="text-muted" style="margin:0; font-size:13px;">Aucune allergie déclarée.</p></div>`;
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
              <th style="padding: 10px;">Nom (et accompagnants)</th>
              <th style="padding: 10px;">Présence</th>
              <th style="padding: 10px;">Brunch</th>
              <th style="padding: 10px;">Contact</th>
              <th style="padding: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    guests.forEach((g, idx) => {
      const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
      
      // Gestion fine des statuts de présence
      let presence = '<span class="badge badge--pending" style="background:#fdf8ee; color:#7a6135; padding:3px 6px; border-radius:4px;">Peut-être</span>';
      if (g.attending === true) presence = '<span class="badge badge--confirmed" style="background:#eef7ee; color:#2e6b2e; padding:3px 6px; border-radius:4px;">Oui</span>';
      if (g.attending === false) presence = '<span class="badge badge--declined" style="background:#fdeeee; color:#b02a2a; padding:3px 6px; border-radius:4px;">Non</span>';

      // Remplacement accompagnant par colonne Brunch
      let brunchStatus = '<span style="color: #aaa;">-</span>';
      if (g.brunch === true) brunchStatus = '<strong style="color: var(--sage)">Oui</strong>';
      if (g.brunch === false) brunchStatus = '<span style="color: #bb2d3b">Non</span>';

      // Affichage du nom principal et de sa liste d'accompagnants
      let nameCellContent = `<strong>${g.firstName} ${g.lastName}</strong>`;
      if (g.companions && g.companions.length > 0) {
        nameCellContent += `<div style="padding-left: 12px; margin-top: 4px; font-size: 13px; color: #666; border-left: 2px solid #e0d5c1;">`;
        g.companions.forEach(c => {
          nameCellContent += `<div>👤 ${c.name || 'Sans nom'}</div>`;
        });
        nameCellContent += `</div>`;
      }

      html += `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #eee; vertical-align: top;">
          <td style="padding: 10px;">${nameCellContent}</td>
          <td style="padding: 10px;">${presence}</td>
          <td style="padding: 10px;">${brunchStatus}</td>
          <td style="padding: 10px; font-size: 13px;">${g.email}<br><small style="color:#777;">${g.phone || ''}</small></td>
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
    const guests = Store.getGuests();

    // Génération de la liste nominative des conducteurs et passagers en faisant un lookup sur les guests
    let driversList = '';
    let passengersList = '';

    guests.forEach(g => {
      if (!g.transport) return;
      
      if (g.transport.carpoolRole === 'offer') {
        driversList += `<li style="margin-bottom:6px;">🚗 <strong>${g.firstName} ${g.lastName}</strong> (Départ : ${g.transport.city || 'Non renseigné'}) - <small style="color:#666;">${g.transport.seatsAvailable} places dispo</small></li>`;
      } else if (g.transport.carpoolRole === 'need') {
        passengersList += `<li style="margin-bottom:6px;">🙋 <strong>${g.firstName} ${g.lastName}</strong> (Cherche vers : ${g.transport.city || 'Non renseigné'}) - <small style="color:#666;">${g.transport.seatsNeeded} places demandées</small></li>`;
      }
    });

    let html = `
      <div class="admin-grid mb-4">
        <div class="card" style="border-left: 4px solid var(--sage); padding: 15px;">
          <h4>Conducteurs</h4>
          <p class="text-muted mt-1" style="font-size:14px;">${stats.transport.drivers} voiture(s) - Total de <strong>${stats.transport.seatsAvailable} places</strong>.</p>
          <ul style="margin-top: 10px; padding-left: 20px; font-size: 13px;">
            ${driversList || '<li class="text-muted">Aucun conducteur inscrit</li>'}
          </ul>
        </div>
        <div class="card" style="border-left: 4px solid var(--gold); padding: 15px;">
          <h4>Recherche de places</h4>
          <p class="text-muted mt-1" style="font-size:14px;">${stats.transport.needRide} groupe(s) - Total de <strong>${stats.transport.seatsNeeded} places</strong>.</p>
          <ul style="margin-top: 10px; padding-left: 20px; font-size: 13px;">
            ${passengersList || '<li class="text-muted">Aucune demande inscrite</li>'}
          </ul>
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

export default adminDashboard;