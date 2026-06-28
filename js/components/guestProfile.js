import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const GuestProfile = {
  container: null,

  init() {
    this.container = document.getElementById('guest-profile-container');
    if (!this.container) return;
    
    this.render();
    
    // Auto refresh when auth or guests change
    Store.on('auth-changed', () => this.render());
    Store.on('guests-changed', () => {
       // Only render if we are currently looking at a guest profile
       if (Store.getCurrentGuest()) this.render();
    });
  },

  render() {
    if (!this.container) return;
    const guest = Store.getCurrentGuest();
    
    if (!guest) {
      this.container.innerHTML = this.renderLoginForm();
      this.attachLoginEvents();
    } else {
      this.container.innerHTML = this.renderProfile(guest);
      this.attachProfileEvents();
      
      // Animate children
      const cards = this.container.querySelectorAll('.card');
      cards.forEach((c, idx) => {
        c.style.opacity = '0';
        setTimeout(() => Animations.fadeIn(c), idx * 100);
      });
    }
  },

  renderLoginForm() {
    return `
      <div class="card form-steps-card">
        <h3 class="text-center">Retrouvez vos réponses</h3>
        <p class="text-center text-muted mb-4">Entrez le numéro de téléphone utilisé lors de votre inscription pour retrouver vos réponses.</p>
        <div class="form-group">
          <label>Numéro de téléphone</label>
          <input type="tel" id="login-phone" placeholder="ex: 0612345678" required>
        </div>
        <div class="text-center mt-4">
          <button type="button" class="btn btn--primary" id="login-btn">Rechercher</button>
        </div>
      </div>
    `;
  },

  renderProfile(guest) {
    // Helper pour badges de régime
    const getDietBadges = (dietArr, allergyDetails) => {
      if (!dietArr || dietArr.length === 0) return '<span class="text-muted">Aucun régime particulier</span>';
      let html = '';
      if (dietArr.includes('vegetarian')) html += '<span class="badge badge--vegetarian">Végétarien</span> ';
      if (dietArr.includes('vegan')) html += '<span class="badge badge--vegan">Végan</span> ';
      if (dietArr.includes('no-alcohol')) html += '<span class="badge badge--no-alcohol">Sans alcool</span> ';
      if (dietArr.includes('allergy')) html += `<span class="badge badge--allergy">Allergie : ${allergyDetails}</span> `;
      return html;
    };

    return `
      <div class="profile-header text-center mb-4">
        <h2>Bonjour ${guest.firstName},</h2>
        <p class="text-muted">Voici le récapitulatif de vos réponses.</p>
      </div>

      <div class="admin-grid">
        <div class="card mb-4">
          <h3>Présence</h3>
          <p>
            ${guest.attending === true 
              ? '<span class="badge badge--confirmed text-white px-2 py-1 radius-sm">Confirmée ✅</span>' 
              : '<span class="badge badge--declined text-white px-2 py-1 radius-sm">Déclinée ❌</span>'}
          </p>
          ${guest.attending ? `
            <p class="mt-2"><strong>Accompagnants :</strong> ${guest.companions.length > 0 ? guest.companions.map(c => c.name).join(', ') : 'Aucun'}</p>
          ` : ''}
        </div>

        <div class="card mb-4">
          <h3>Coordonnées</h3>
          <p><strong>Nom :</strong> ${guest.firstName} ${guest.lastName}</p>
          <p><strong>Email :</strong> ${guest.email}</p>
          <p><strong>Tél :</strong> ${guest.phone || '-'}</p>
        </div>
      </div>

      ${guest.attending ? `
      <div class="card mb-4">
        <h3>Régimes alimentaires</h3>
        <div class="mb-3">
          <strong>Pour vous :</strong><br>
          ${getDietBadges(guest.diet, guest.allergyDetails)}
        </div>
        ${guest.companions.map((c) => `
          <div class="mb-3">
            <strong>Pour ${c.name} :</strong><br>
            ${getDietBadges(c.diet, c.allergyDetails)}
          </div>
        `).join('')}
      </div>

      <div class="card mb-4">
        <h3>Transport & Covoiturage</h3>
        ${guest.transport.type === 'none' ? '<p>Vous vous organisez par vos propres moyens.</p>' : ''}
        ${guest.transport.type === 'driver' ? `
          <p><span class="badge badge--vegetarian">Conducteur</span> <strong>Départ de :</strong> ${guest.transport.city}</p>
          <p><strong>Places proposées :</strong> ${guest.transport.seatsAvailable}</p>
          <p><strong>Jour :</strong> ${guest.transport.departureDay}</p>
          <p><strong>Heure :</strong> ${guest.transport.departureTime || 'Non précisée'}</p>
          <p><strong>Contact :</strong> ${guest.transport.contact}</p>
        ` : ''}
        ${guest.transport.type === 'passenger' ? `
          <p><span class="badge badge--pending">Recherche place(s)</span> <strong>Au départ de :</strong> ${guest.transport.city}</p>
          <p><strong>Places nécessaires :</strong> ${guest.transport.seatsNeeded}</p>
          <p><strong>Jour :</strong> ${guest.transport.departureDay}</p>
          <p><strong>Contact :</strong> ${guest.transport.contact}</p>
        ` : ''}
      </div>
      ` : ''}

      <div class="text-center mt-4 form-actions">
        <button type="button" class="btn btn--secondary" id="logout-btn">Se déconnecter</button>
        <button type="button" class="btn btn--primary" id="edit-btn">Modifier mes réponses</button>
      </div>
    `;
  },

  attachLoginEvents() {
    const loginBtn = this.container.querySelector('#login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const phone = this.container.querySelector('#login-phone').value.trim();
        if (!phone) {
          Animations.showToast('Veuillez entrer un numéro de téléphone.', 'error');
          return;
        }
        
        const guest = Store.getGuestByPhone(phone);
        if (guest) {
          Store.setCurrentGuest(guest.id);
          Animations.showToast('Profil trouvé avec succès !', 'success');
        } else {
           Animations.showToast('Aucune réponse trouvée avec ce numéro.', 'error');
        }
      });
    }
  },

  attachProfileEvents() {
    const logoutBtn = this.container.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Store.clearCurrentGuest();
        Animations.showToast('Déconnexion réussie.', 'success');
      });
    }

    const editBtn = this.container.querySelector('#edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        Router.navigate('#/rsvp');
      });
    }
  }
};

export default GuestProfile;
