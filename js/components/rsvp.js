import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const RSVP = {
  container: null,
  currentStep: 1,
  totalSteps: 4,
  guestData: {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    attending: null,
    companions: [],
    diet: [],
    allergyDetails: '',
    transport: {
      type: 'none',
      city: '',
      seatsAvailable: 1,
      seatsNeeded: 1,
      departureDay: '',
      departureTime: '',
      contact: ''
    }
  },

  init() {
    this.container = document.getElementById('rsvp-container');
    if (!this.container) return;

    // Check if we already have a guest in session
    const currentGuest = Store.getCurrentGuest();
    if (currentGuest) {
      this.guestData = { ...currentGuest };
    }

    this.render();
  },

  render() {
    if (!this.container) return;
    this.container.innerHTML = this.getHTML();
    this.attachEvents();
    Animations.fadeIn(this.container);
  },

  getHTML() {
    return `
      <div class="card form-steps-card">
        ${this.renderProgressBar()}
        <form id="rsvp-form">
          ${this.renderStep1()}
          ${this.renderStep2()}
          ${this.renderStep3()}
          ${this.renderStep4()}
        </form>
      </div>
    `;
  },

  renderProgressBar() {
    let html = '<div class="form-steps-indicator">';
    for (let i = 1; i <= this.totalSteps; i++) {
      let classes = 'step-dot';
      if (i === this.currentStep) classes += ' active';
      else if (i < this.currentStep) classes += ' completed';
      html += `<div class="${classes}">${i}</div>`;
      if (i < this.totalSteps) {
        html += `<div class="step-line ${i < this.currentStep ? 'completed' : ''}"></div>`;
      }
    }
    html += '</div>';
    return html;
  },

  renderStep1() {
    const isVisible = this.currentStep === 1;
    return `
      <div class="form-step ${isVisible ? 'active' : 'hidden'}" id="step-1">
        <h3 class="text-center">Vos coordonnées</h3>
        <div class="form-group">
          <label>Prénom *</label>
          <input type="text" id="guest-firstname" value="${this.guestData.firstName}" required>
        </div>
        <div class="form-group">
          <label>Nom *</label>
          <input type="text" id="guest-lastname" value="${this.guestData.lastName}" required>
        </div>
        <div class="form-group">
          <label>Téléphone * <small>(pour être inscrit sur la boucle Whatsapp)</small></label>
          <input type="tel" id="guest-phone" value="${this.guestData.phone}" required>
        </div>
        <div class="form-group mt-3">
          <label class="checkbox-label" style="font-size: 0.9em; font-weight: normal;">
            <input type="checkbox" id="email-opt-in" ${this.guestData.email ? 'checked' : ''}>
            Je préfère être contacté(e) par mail
          </label>
        </div>
        <div class="form-group ${this.guestData.email ? '' : 'hidden'}" id="email-group">
          <label>Email *</label>
          <input type="email" id="guest-email" value="${this.guestData.email}">
        </div>
        <div class="text-center mt-4">
          <button type="button" class="btn btn--primary next-btn">Suivant</button>
        </div>
      </div>
    `;
  },

  renderStep2() {
    const isVisible = this.currentStep === 2;
    return `
      <div class="form-step ${isVisible ? 'active' : 'hidden'}" id="step-2">
        <h3 class="text-center">Serez-vous présent(e) ?</h3>
        <div class="form-group text-center">
          <button type="button" class="btn ${this.guestData.attending === true ? 'btn--primary' : 'btn--secondary'} attendance-btn" data-val="true">Je serai là, avec joie</button>
          <button type="button" class="btn ${this.guestData.attending === false ? 'btn--primary' : 'btn--secondary'} attendance-btn" data-val="false" style="margin-top: 10px;">Malheureusement, je ne pourrai pas venir</button>
        </div>
        ${this.guestData.attending === false ? '<p class="text-center text-muted mt-3" style="font-style: italic;">Merci pour ta réponse !</p>' : ''}
        
        <div id="companions-section" class="${this.guestData.attending === true ? '' : 'hidden'}">
          <div class="form-group mt-4">
            <label>Nombre d'accompagnants</label>
            <select id="guest-companions-count">
              ${[0,1,2,3,4,5].map(n => `<option value="${n}" ${this.guestData.companions.length === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div id="companions-list">
            ${this.guestData.companions.map((comp, idx) => `
              <div class="form-group">
                <label>Nom de l'accompagnant ${idx + 1}</label>
                <input type="text" class="companion-name" data-index="${idx}" value="${comp.name}" required>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-actions mt-4 text-center">
          <button type="button" class="btn btn--secondary prev-btn">Précédent</button>
          <button type="button" class="btn btn--primary next-btn">${this.guestData.attending === false ? 'Confirmer' : 'Suivant'}</button>
        </div>
      </div>
    `;
  },

  renderStep3() {
    const isVisible = this.currentStep === 3;
    const diets = ['vegetarian', 'vegan', 'no-alcohol', 'allergy'];
    const dietLabels = { 'vegetarian': 'Végétarien', 'vegan': 'Végan', 'no-alcohol': 'Sans alcool', 'allergy': 'Allergie' };

    const renderDietCheckboxes = (personType, index, currentDiet, currentAllergyDetails) => {
      let html = `<div class="diet-section"><h4 class="mt-2">${personType}</h4><div class="diet-checkboxes">`;
      diets.forEach(d => {
        const isChecked = currentDiet && currentDiet.includes(d);
        html += `
          <label class="checkbox-label">
            <input type="checkbox" class="diet-cb" data-person="${index}" value="${d}" ${isChecked ? 'checked' : ''}>
            ${dietLabels[d]}
          </label>
        `;
      });
      html += `</div>`;
      const hasAllergy = currentDiet && currentDiet.includes('allergy');
      html += `
        <div class="form-group allergy-details ${hasAllergy ? '' : 'hidden'}" id="allergy-details-${index}">
          <label>Précisez l'allergie</label>
          <input type="text" class="allergy-input" data-person="${index}" value="${currentAllergyDetails || ''}">
        </div>
      </div>`;
      return html;
    };

    let html = `
      <div class="form-step ${isVisible ? 'active' : 'hidden'}" id="step-3">
        <h3 class="text-center">Régimes alimentaires</h3>
        ${renderDietCheckboxes('Pour vous', 'main', this.guestData.diet, this.guestData.allergyDetails)}
    `;

    this.guestData.companions.forEach((comp, idx) => {
      html += renderDietCheckboxes(`Pour ${comp.name || 'Accompagnant ' + (idx+1)}`, idx, comp.diet, comp.allergyDetails);
    });

    html += `
        <div class="form-actions mt-4 text-center">
          <button type="button" class="btn btn--secondary prev-btn">Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant</button>
        </div>
      </div>
    `;
    return html;
  },

  renderStep4() {
    const isVisible = this.currentStep === 4;
    const t = this.guestData.transport;
    return `
      <div class="form-step ${isVisible ? 'active' : 'hidden'}" id="step-4">
        <h3 class="text-center">Transport & Covoiturage</h3>
        <div class="form-group">
          <label class="radio-label">
            <input type="radio" name="transport-type" value="driver" ${t.type === 'driver' ? 'checked' : ''}>
            Je viens en voiture et peux proposer des places
          </label>
          <label class="radio-label">
            <input type="radio" name="transport-type" value="passenger" ${t.type === 'passenger' ? 'checked' : ''}>
            J'ai besoin d'un covoiturage
          </label>
          <label class="radio-label">
            <input type="radio" name="transport-type" value="none" ${t.type === 'none' ? 'checked' : ''}>
            Je m'organise autrement / Pas besoin
          </label>
        </div>

        <div id="transport-driver-section" class="${t.type === 'driver' ? '' : 'hidden'}">
          <div class="form-group">
            <label>Ville de départ</label>
            <input type="text" id="t-driver-city" value="${t.city}">
          </div>
          <div class="form-group">
            <label>Places disponibles</label>
            <select id="t-driver-seats">
              ${[1,2,3,4,5,6,7].map(n => `<option value="${n}" ${t.seatsAvailable == n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Jour de départ</label>
            <select id="t-driver-day">
              <option value="7 mai - Veille" ${t.departureDay === '7 mai - Veille' ? 'selected' : ''}>7 mai - Veille</option>
              <option value="8 mai - Jour J" ${t.departureDay === '8 mai - Jour J' ? 'selected' : ''}>8 mai - Jour J</option>
            </select>
          </div>
          <div class="form-group">
            <label>Heure de départ approx.</label>
            <input type="time" id="t-driver-time" value="${t.departureTime}">
          </div>
          <div class="form-group">
            <label>Contact pour covoiturage (Tél/Email)</label>
            <input type="text" id="t-driver-contact" value="${t.contact || this.guestData.phone || this.guestData.email}">
          </div>
        </div>

        <div id="transport-passenger-section" class="${t.type === 'passenger' ? '' : 'hidden'}">
           <div class="form-group">
            <label>Ville de départ souhaitée</label>
            <input type="text" id="t-pass-city" value="${t.city}">
          </div>
          <div class="form-group">
            <label>Places nécessaires</label>
            <select id="t-pass-seats">
              ${[1,2,3,4,5].map(n => `<option value="${n}" ${t.seatsNeeded == n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Jour souhaité</label>
            <select id="t-pass-day">
              <option value="7 mai - Veille" ${t.departureDay === '7 mai - Veille' ? 'selected' : ''}>7 mai - Veille</option>
              <option value="8 mai - Jour J" ${t.departureDay === '8 mai - Jour J' ? 'selected' : ''}>8 mai - Jour J</option>
            </select>
          </div>
          <div class="form-group">
            <label>Contact (Tél/Email)</label>
            <input type="text" id="t-pass-contact" value="${t.contact || this.guestData.phone || this.guestData.email}">
          </div>
        </div>

        <div class="form-actions mt-4 text-center">
          <button type="button" class="btn btn--secondary prev-btn">Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Confirmer mon inscription</button>
        </div>
      </div>
    `;
  },

  attachEvents() {
    // Navigation Next/Prev
    const nextBtns = this.container.querySelectorAll('.next-btn');
    nextBtns.forEach(btn => btn.addEventListener('click', () => this.handleNext()));

    const prevBtns = this.container.querySelectorAll('.prev-btn');
    prevBtns.forEach(btn => btn.addEventListener('click', () => this.handlePrev()));

    // Attendance buttons
    const attendanceBtns = this.container.querySelectorAll('.attendance-btn');
    attendanceBtns.forEach(btn => btn.addEventListener('click', (e) => {
      this.guestData.attending = e.target.dataset.val === 'true';
      this.render(); // re-render to update classes and visibility
    }));

    // Companions count
    const compSelect = this.container.querySelector('#guest-companions-count');
    if (compSelect) {
      compSelect.addEventListener('change', (e) => {
        const count = parseInt(e.target.value, 10);
        // keep existing, add new or remove
        while (this.guestData.companions.length < count) {
          this.guestData.companions.push({ name: '', diet: [], allergyDetails: '' });
        }
        if (this.guestData.companions.length > count) {
          this.guestData.companions = this.guestData.companions.slice(0, count);
        }
        this.render();
      });
    }

    // Diet checkboxes
    const dietCbs = this.container.querySelectorAll('.diet-cb');
    dietCbs.forEach(cb => cb.addEventListener('change', (e) => {
      const person = e.target.dataset.person;
      const val = e.target.value;
      const checked = e.target.checked;
      
      let dietArr;
      if (person === 'main') {
        if (!this.guestData.diet) this.guestData.diet = [];
        dietArr = this.guestData.diet;
      } else {
        const idx = parseInt(person, 10);
        if (!this.guestData.companions[idx].diet) this.guestData.companions[idx].diet = [];
        dietArr = this.guestData.companions[idx].diet;
      }

      if (checked && !dietArr.includes(val)) dietArr.push(val);
      if (!checked && dietArr.includes(val)) dietArr.splice(dietArr.indexOf(val), 1);

      // Show/hide allergy details
      if (val === 'allergy') {
        const detailsContainer = this.container.querySelector('#allergy-details-' + person);
        if (detailsContainer) {
          if (checked) detailsContainer.classList.remove('hidden');
          else detailsContainer.classList.add('hidden');
        }
      }
    }));

    // Transport radios
    const transportRadios = this.container.querySelectorAll('input[name="transport-type"]');
    transportRadios.forEach(radio => radio.addEventListener('change', (e) => {
      this.guestData.transport.type = e.target.value;
      const driverSec = this.container.querySelector('#transport-driver-section');
      const passSec = this.container.querySelector('#transport-passenger-section');
      if(driverSec) driverSec.classList.toggle('hidden', e.target.value !== 'driver');
      if(passSec) passSec.classList.toggle('hidden', e.target.value !== 'passenger');
    }));

    // Email opt-in checkbox
    const emailOptIn = this.container.querySelector('#email-opt-in');
    if (emailOptIn) {
      emailOptIn.addEventListener('change', (e) => {
        const emailGroup = this.container.querySelector('#email-group');
        if (e.target.checked) {
          emailGroup.classList.remove('hidden');
        } else {
          emailGroup.classList.add('hidden');
          this.guestData.email = ''; // clear it
        }
      });
    }
  },

  saveCurrentStepData() {
    if (this.currentStep === 1) {
      this.guestData.firstName = document.getElementById('guest-firstname').value.trim();
      this.guestData.lastName = document.getElementById('guest-lastname').value.trim();
      this.guestData.email = document.getElementById('guest-email').value.trim();
      this.guestData.phone = document.getElementById('guest-phone').value.trim();
    } else if (this.currentStep === 2) {
      const companionInputs = this.container.querySelectorAll('.companion-name');
      companionInputs.forEach(input => {
        const idx = parseInt(input.dataset.index, 10);
        if (this.guestData.companions[idx]) {
          this.guestData.companions[idx].name = input.value.trim();
        }
      });
    } else if (this.currentStep === 3) {
      const allergyInputs = this.container.querySelectorAll('.allergy-input');
      allergyInputs.forEach(input => {
        const person = input.dataset.person;
        if (person === 'main') {
          this.guestData.allergyDetails = input.value.trim();
        } else {
          const idx = parseInt(person, 10);
          if (this.guestData.companions[idx]) {
            this.guestData.companions[idx].allergyDetails = input.value.trim();
          }
        }
      });
    } else if (this.currentStep === 4) {
      const t = this.guestData.transport;
      if (t.type === 'driver') {
        t.city = document.getElementById('t-driver-city').value.trim();
        t.seatsAvailable = parseInt(document.getElementById('t-driver-seats').value, 10);
        t.departureDay = document.getElementById('t-driver-day').value;
        t.departureTime = document.getElementById('t-driver-time').value;
        t.contact = document.getElementById('t-driver-contact').value.trim();
      } else if (t.type === 'passenger') {
        t.city = document.getElementById('t-pass-city').value.trim();
        t.seatsNeeded = parseInt(document.getElementById('t-pass-seats').value, 10);
        t.departureDay = document.getElementById('t-pass-day').value;
        t.contact = document.getElementById('t-pass-contact').value.trim();
      }
    }
  },

  validateStep() {
    if (this.currentStep === 1) {
      if (!this.guestData.firstName || !this.guestData.lastName || !this.guestData.phone) {
        Animations.showToast("Veuillez remplir les champs obligatoires (*)", "error");
        return false;
      }
      const emailOptIn = this.container.querySelector('#email-opt-in');
      if (emailOptIn && emailOptIn.checked && !this.guestData.email) {
        Animations.showToast("Veuillez renseigner votre email", "error");
        return false;
      }
    }
    if (this.currentStep === 2) {
      if (this.guestData.attending === null) {
        Animations.showToast("Veuillez indiquer votre présence", "error");
        return false;
      }
      if (this.guestData.attending === true) {
        let allNamed = true;
        this.guestData.companions.forEach(c => { if (!c.name) allNamed = false; });
        if (!allNamed) {
          Animations.showToast("Veuillez indiquer le nom de vos accompagnants", "error");
          return false;
        }
      }
    }
    return true;
  },

  handleNext() {
    this.saveCurrentStepData();
    if (!this.validateStep()) return;

    if (this.currentStep === 2 && this.guestData.attending === false) {
      this.submitForm();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      // Check if phone already exists on step 1 to pre-fill
      if (this.currentStep === 1) {
         const existing = Store.getGuestByPhone(this.guestData.phone);
         if (existing && existing.id !== this.guestData.id) {
           this.guestData = { ...existing };
           Animations.showToast("Nous avons retrouvé votre profil !", "success");
         }
      }

      this.currentStep++;
      this.render();
    } else {
      this.submitForm();
    }
  },

  handlePrev() {
    this.saveCurrentStepData();
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
    }
  },

  submitForm() {
    let savedGuest;
    if (this.guestData.id) {
      savedGuest = Store.updateGuest(this.guestData.id, this.guestData);
    } else {
      savedGuest = Store.saveGuest(this.guestData);
    }

    Store.setCurrentGuest(savedGuest.id);
    
    // Save carpool if applicable
    const t = savedGuest.transport;
    if (t && (t.type === 'driver' || t.type === 'passenger')) {
      const carpoolData = {
        guestId: savedGuest.id,
        type: t.type === 'driver' ? 'offer' : 'request',
        city: t.city,
        seats: t.type === 'driver' ? t.seatsAvailable : t.seatsNeeded,
        departureDay: t.departureDay,
        departureTime: t.departureTime,
        contact: t.contact
      };
      Store.saveCarpool(carpoolData);
    }

    Animations.showToast("Merci pour votre réponse !", "success");
    
    // Reset state for potential next use
    this.currentStep = 1;
    
    Router.navigate('#/mes-reponses');
  }
};

export default RSVP;
