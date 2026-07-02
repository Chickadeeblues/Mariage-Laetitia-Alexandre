import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';
import RSVP from './rsvp.js'; // Import nécessaire pour forcer la réinitialisation lors d'une modification

const GuestProfile = {
  container: null,

async init() {
    this.container = document.getElementById('guest-profile-container');
    if (!this.container) return;
    this.render();
	Store.on('auth-changed', () => this.render());
	Store.on('guests-changed', async () => {
    if (await Store.getCurrentGuest()) this.render();
  });
}
  },

async render() {
  if (!this.container) return;
  const guest = await Store.getCurrentGuest(); // await ajouté
  if (!guest) {
      this.container.innerHTML = this.renderLoginForm();
      this.attachLoginEvents();
    } else {
      this.container.innerHTML = this.renderProfile(guest);
      this.attachProfileEvents();
      
      // Animations d'apparition
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
        <p class="text-center text-muted mb-4">Entrez le numéro de téléphone utilisé lors de votre inscription pour retrouver ou modifier vos réponses.</p>
        <div class="form-group">
          <label for="login-phone">Numéro de téléphone portable</label>
          <input type="tel" id="login-phone" placeholder="06 00 00 00 00">
        </div>
        <div class="text-center mt-4">
          <button type="button" class="btn btn--primary" id="login-btn" style="width: 100%;">Accéder à mon espace</button>
        </div>
      </div>
    `;
  },

  renderProfile(guest) {
    let presenceText = '';
    let presenceClass = '';
    if (guest.attending === true) {
      presenceText = '🎉 Présence confirmée ! Je viens avec joie.';
      presenceClass = 'status--confirmed';
    } else if (guest.attending === 'maybe') {
      presenceText = '🤔 En attente (Je viens peut-être).';
      presenceClass = 'status--pending';
    } else {
      presenceText = '💌 Décliné (Je ne peux pas venir).';
      presenceClass = 'status--declined';
    }

    // Gestion de l'affichage adaptatif du Brunch
    let brunchText = 'Non renseigné';
    if (guest.brunch === true) brunchText = '☕ Oui, avec plaisir !';
    if (guest.brunch === false) brunchText = '🙏 Non, merci.';

    return `
      <div class="card profile-header-card text-center mb-4">
        <h2>Bonjour ${guest.firstName} !</h2>
        <p class="text-muted">Ravi de vous revoir sur l'espace de notre mariage.</p>
        <div class="badge-presence ${presenceClass}" style="display:inline-block; margin-top:10px; padding:8px 16px; border-radius:20px; font-weight:500;">
          ${presenceText}
        </div>
      </div>

      ${guest.attending !== false ? `
        <div class="grid grid--2-cols">
          <div class="card">
            <h3>Vos choix</h3>
            <ul class="profile-details-list" style="list-style:none; padding:0; margin-top:15px; line-height:1.8;">
              <li><strong>Brunch du lendemain :</strong> ${brunchText}</li>
              <li><strong>Contact :</strong> ${guest.phone} ${guest.email ? `(${guest.email})` : ''}</li>
              ${guest.companions && guest.companions.length > 0 ? `
                <li style="margin-top: 10px;">
                  <strong>Accompagnants (${guest.companions.length}) :</strong>
                  <ul style="padding-left:15px; font-size:14px; color:#555;">
                    ${guest.companions.map(c => `<li>👤 ${c.name || 'Sans nom'}</li>`).join('')}
                  </ul>
                </li>
              ` : '<li><strong>Accompagnant :</strong> Aucun</li>'}
            </ul>
          </div>

          <div class="card">
            <h3>Préférences & Logistique</h3>
            <div style="margin-top:15px; font-size:14px; line-height:1.6;">
              <p><strong>Régime alimentaire :</strong> 
                ${guest.diet && guest.diet.length > 0 ? guest.diet.map(d => {
                  if (d === 'vegetarian') return '🥗 Végétarien';
                  if (d === 'vegan') return '🌱 Végan';
                  if (d === 'no-alcohol') return '🧃 Sans alcool';
                  if (d === 'allergy') return '⚠️ Allergie';
                  return d;
                }).join(', ') : 'Aucun régime particulier'}
              </p>
              ${guest.allergyDetails ? `<p style="font-size:13px; color:#c62828; font-style:italic;">Note : ${guest.allergyDetails}</p>` : ''}
              
              <div style="height:1px; background:#f5f2eb; margin:12px 0;"></div>
              
              <p><strong>Transport choisi :</strong> 
                ${guest.transport?.mode === 'car' ? '🚗 En voiture' : guest.transport?.mode === 'train' ? '🚆 En train' : '✈️ Autre'}
              </p>
              ${guest.transport?.carpoolRole === 'offer' ? `
                <p style="color:green; font-size:13px;">🚘 Vous proposez ${guest.transport.seatsAvailable} places depuis ${guest.transport.city || 'votre ville'}.</p>
              ` : guest.transport?.carpoolRole === 'need' ? `
                <p style="color:#b8860b; font-size:13px;">🙋 Vous recherchez ${guest.transport.seatsNeeded} places vers ${guest.transport.city || 'votre destination'}.</p>
              ` : '<p class="text-muted" style="font-size:13px;">Pas de covoiturage actif.</p>'}
            </div>
          </div>
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
    loginBtn.addEventListener('click', async () => { 
        const phone = this.container.querySelector('#login-phone').value.trim();
        if (!phone) {
          Animations.showToast('Veuillez entrer un numéro de téléphone.', 'error');
          return;
        }
        
        const guest = await Store.getGuestByPhone(phone);
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
        // CORRECTION CRUCIALE : Forcer la réinitialisation de l'étape du formulaire RSVP à 1
        if (RSVP && typeof RSVP.init === 'function') {
          RSVP.currentStep = 1; 
        }
        Router.navigate('#/rsvp');
      });
    }
  },

  // Utilisé par app.js lors des changements de routes vers '#/mes-reponses'
async refresh() {
  await this.render();
}
};

export default GuestProfile;