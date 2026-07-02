import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const RSVP = {
  container: null,
  currentStep: 1,
  totalSteps: 5,
  guestData: {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    attending: null,
    companionCount: 0,
    companions: [],
    brunch: null,
    diet: [],
    allergyDetails: '',
    accommodationStatus: '', 
    transport: {
      mode: 'car',
      carpoolRole: 'none',
      city: '',
      seatsAvailable: 1,
      seatsNeeded: 1,
      departureDay: '',
      departureTime: '',
      contactPhone: '',
      contactEmail: '',
      passengerNeeds: [],
      churchArrival: '',
      arrivalBeforeDDay: false,
      arrivalFrom: '',
      arrivalTo: '',
      arrivalDate: '',
      churchTime: '',
      nightName: '',
      nightAddress: '',
      nightCity: '',
      nightZip: '',
      nightDistance: ''
    }
  },

async init() {
    this.container = document.getElementById('rsvp-container');
    if (!this.container) return;

    try {
      const currentGuest = await Store.getCurrentGuest();
if (currentGuest) {
  this.guestData = { ...currentGuest };
}
      this.render();
    } catch (error) {
      console.error("[RSVP] Erreur lors de l'initialisation :", error);
    }
  },

  render() {
    if (!this.container) return;
    try {
      this.container.innerHTML = this.getHTML();
      this.attachEvents();
      Animations.fadeIn(this.container);
    } catch (error) {
      console.error("[RSVP] Erreur fatale lors du rendu :", error);
      this.container.innerHTML = `<div style="padding: 20px; text-align: center; color: red; background: #fff; border-radius: 8px;">Une erreur est survenue lors du chargement du formulaire. Veuillez rafraîchir la page.</div>`;
    }
  },

  getHTML() {
    return `
<style>
        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 1px solid #e0d5c1; color: #a89a7a; background: #fff; }
        .step-dot.active { background: #9b8660; border-color: #9b8660; color: #fff; }
        .step-dot.completed { background: #f4efe6; border-color: #d8ceb9; color: #9b8660; }
        
        /* Titre plus grand, sombre et élégant */
        .step-label { font-size: 24px; font-family: 'Playfair Display', serif; color: #4a4a4a; text-align: center; margin-bottom: 15px; font-weight: 400; }
        
        .form-step { display: none; }
        .form-step.active { display: block; }
        .compact-input { width: 100%; padding: 12px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
        .form-actions { display: flex; gap: 10px; justify-content: space-between; flex-wrap: wrap; margin-top: 2rem; }
        
        /* Espace réduit entre le champ téléphone et les boutons */
        .attendance-options { display: flex; flex-direction: column; gap: 8px; margin: 0.5rem 0; }
        
        .choice-btn { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border: 1px solid #e5e0d5; border-radius: 8px; background: #fff; cursor: pointer; font-size: 15px; text-align: left; width: 100%; }
        .choice-btn.selected { border-color: #9b8660; background: #fbf9f4; font-weight: 500; }
        .diet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
        .diet-option { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; color: #555; }
        .allergy-sub-options { background: #faf8f5; padding: 12px; border-radius: 8px; margin-top: 8px; border: 1px dashed #e0d5c1; }
        .transport-mode { display: flex; gap: 10px; margin-bottom: 1.5rem; }
        .mode-btn { flex: 1; padding: 10px 5px; border: 1px solid #e5e0d5; border-radius: 8px; background: #fff; cursor: pointer; text-align: center; font-size: 13px; }
        .mode-btn.selected { border-color: #9b8660; background: #fbf9f4; font-weight: 500; }
        .hidden { display: none !important; }
      </style>
      <div class="card form-steps-card" style="padding: 20px; overflow-x: hidden;">
        ${this.renderProgressBar()}
        <div id="rsvp-form">
          ${this.renderStep1()}
          ${this.renderStep2()}
          ${this.renderStep3()}
          ${this.renderStep4()}
          ${this.renderStep5()}
        </div>
      </div>
    `;
  },

  renderProgressBar() {
    const labels = ['Réponse', 'Brunch', 'Repas', 'Transport', 'Logement'];
    let html = '<div class="step-indicator">';
    for (let i = 1; i <= this.totalSteps; i++) {
      let cls = 'step-dot' + (i === this.currentStep ? ' active' : '') + (i < this.currentStep ? ' completed' : '');
      html += `<div class="${cls}">${i < this.currentStep ? '✓' : i}</div>`;
    }
    html += '</div>';
    html += `<div class="step-label">${labels[this.currentStep - 1]}</div>`;
    return html;
  },

  esc(str) { 
    if (str === null || str === undefined) return '';
    return String(str).replace(/"/g, '&quot;'); 
  },

renderStep1() {
    const v = this.currentStep === 1;
    const att = this.guestData.attending;
    const companions = this.guestData.companions || [];
    
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-1">
        <div>
          <input type="text" id="guest-firstname" class="compact-input" value="${this.esc(this.guestData.firstName)}" placeholder="Prénom *" required>
          <input type="text" id="guest-lastname" class="compact-input" value="${this.esc(this.guestData.lastName)}" placeholder="Nom *" required>
          <input type="tel" id="guest-phone" class="compact-input" value="${this.esc(this.guestData.phone)}" placeholder="Téléphone portable *" required>
        </div>
        <div style="height:1px; background:#f5f2eb; margin: 1rem 0;"></div>
        
        <div class="attendance-options" id="main-attendance-options">
          <button type="button" class="choice-btn ${att === true ? 'selected' : ''}" data-val="true"><span>🎉</span> <strong>Je viens avec joie !</strong></button>
          ${att !== true ? `
            <button type="button" class="choice-btn ${att === 'maybe' ? 'selected' : ''}" data-val="maybe"><span>🤔</span> <strong>Je viens peut-être</strong></button>
            <button type="button" class="choice-btn ${att === false ? 'selected' : ''}" data-val="false"><span>💌</span> <strong>Je ne peux pas venir</strong></button>
          ` : ''}
        </div>

        ${att === true ? `
        <div id="companions-section">
          <div style="margin: 15px 0;">
             <label style="display:block; margin-bottom:5px;">Je viens :</label>
             <button type="button" class="choice-btn ${companions.length === 0 ? 'selected' : ''}" onclick="/* logique pour seul */">Seul(e)</button>
             <select id="guest-companions-count" class="compact-input" style="margin-top:5px;">
                <option value="0" ${companions.length === 0 ? 'selected' : ''}>Accompagné(e)...</option>
                ${[1,2,3,4].map(n => `<option value="${n}" ${companions.length === n ? 'selected' : ''}>Avec ${n} personne(s)</option>`).join('')}
             </select>
          </div>
          <div id="companions-list">
            ${companions.map((comp, idx) => `
              <div style="margin-bottom:10px;">
                <input type="text" class="compact-input companion-name" data-index="${idx}" value="${this.esc(comp.name)}" placeholder="Prénom et Nom de l'accompagnant ${idx + 1} *" required>
                <input type="tel" class="compact-input companion-phone" data-index="${idx}" value="${this.esc(comp.phone || '')}" placeholder="Téléphone (facultatif)">
              </div>
            `).join('')}
          </div>
        </div>` : ''}
        
        <div class="form-actions"><button type="button" class="btn btn--primary next-btn" style="width:100%;">Suivant →</button></div>
      </div>
    `;
  },

  renderStep2() {
    const v = this.currentStep === 2;
    const brunch = this.guestData.brunch;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-2">
        <p style="text-align:center; font-size:14px; color:#666; margin-bottom:1.5rem;">Pour faire durer le plaisir, nous vous convions à un brunch le dimanche 9 mai, de 9h30 à 13h30 au Domaine de la Scie du May.</p>
        <div class="attendance-options">
          <button type="button" class="choice-btn ${brunch === true ? 'selected' : ''}" data-brunch="true"><span>☕</span> <strong>Oui, avec plaisir !</strong></button>
          <button type="button" class="choice-btn ${brunch === false ? 'selected' : ''}" data-brunch="false"><span>🙏</span> <strong>Non, merci !</strong></button>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
  },

  renderStep3() {
    const v = this.currentStep === 3;
    const companions = this.guestData.companions || [];
    
    const renderBlock = (personLabel, personKey, currentDiet, currentAllergyDetails) => {
      const dietArray = currentDiet || [];
      const hasAllergy = dietArray.includes('allergy');
      const details = currentAllergyDetails || '';
      const isLactose = details.includes('[Lactose]');
      const isGluten = details.includes('[Gluten]');
      const isSea = details.includes('[Fruits de mer]');
      const isPeanut = details.includes('[Arachides]');
      const otherMatch = details.match(/\[Autre:(.*?)\]/);
      const otherText = otherMatch ? otherMatch[1].trim() : '';
      const isOther = !!otherMatch;

      return `
        <div style="margin-bottom: 1.5rem;">
          <p style="font-weight: 500; border-bottom: 1px solid #f5f2eb; padding-bottom: 4px;">${personLabel}</p>
          <div class="diet-grid">
            <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${personKey}" value="vegetarian" ${dietArray.includes('vegetarian') ? 'checked' : ''}><span>🥗 Végétarien</span></label>
            <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${personKey}" value="vegan" ${dietArray.includes('vegan') ? 'checked' : ''}><span>🌱 Végan</span></label>
            <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${personKey}" value="no-alcohol" ${dietArray.includes('no-alcohol') ? 'checked' : ''}><span>🧃 Sans alcool</span></label>
            <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${personKey}" value="allergy" ${hasAllergy ? 'checked' : ''}><span>⚠️ Allergie</span></label>
          </div>
          <div class="allergy-sub-options ${hasAllergy ? '' : 'hidden'}" id="allergy-details-${personKey}">
            <p style="font-size:12px; margin-bottom:8px;">Précisez :</p>
            <label style="margin-right:10px;"><input type="checkbox" class="allergy-sub-cb" data-person="${personKey}" value="Lactose" ${isLactose ? 'checked' : ''}> Lactose</label>
            <label style="margin-right:10px;"><input type="checkbox" class="allergy-sub-cb" data-person="${personKey}" value="Gluten" ${isGluten ? 'checked' : ''}> Gluten</label>
            <label style="margin-right:10px;"><input type="checkbox" class="allergy-sub-cb" data-person="${personKey}" value="Fruits de mer" ${isSea ? 'checked' : ''}> Fruits de mer</label>
            <label style="margin-right:10px;"><input type="checkbox" class="allergy-sub-cb" data-person="${personKey}" value="Arachides" ${isPeanut ? 'checked' : ''}> Arachides</label>
            <label style="margin-right:10px;"><input type="checkbox" class="allergy-sub-cb allergy-other-trigger" data-person="${personKey}" value="Autre" ${isOther ? 'checked' : ''}> Autre</label>
            <input type="text" class="compact-input allergy-other-input ${isOther ? '' : 'hidden'}" data-person="${personKey}" value="${this.esc(otherText)}" placeholder="Précisez..." style="margin-top:8px;">
          </div>
        </div>
      `;
    };

    let html = `<div class="form-step ${v ? 'active' : ''}" id="step-3">`;
    html += renderBlock('Pour vous', 'main', this.guestData.diet, this.guestData.allergyDetails);
    companions.forEach((comp, idx) => {
      html += renderBlock(`Pour ${comp.name || 'Accompagnant ' + (idx + 1)}`, String(idx), comp.diet, comp.allergyDetails);
    });
    html += `<div class="form-actions"><button type="button" class="btn btn--secondary prev-btn">← Précédent</button><button type="button" class="btn btn--primary next-btn">Suivant →</button></div></div>`;
    return html;
  },

  renderStep4() {
    const v = this.currentStep === 4;
    const t = this.guestData.transport || {}; // Protection contre les objets mal formatés
    const isCar = t.mode === 'car';
    const showNeedSection = !isCar && t.carpoolRole === 'need';
    const n = t.passengerNeeds || [];

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-4">
        
        <div style="margin-bottom: 20px; border-bottom: 1px solid #e5e0d5; padding-bottom: 15px;">
          <label style="display:block; margin-bottom:10px; font-weight:bold;"><input type="checkbox" id="t-arrive-before" ${t.arrivalBeforeDDay ? 'checked' : ''}> Arriver dans la région avant le jour J</label>
          <div id="arrive-before-fields" class="${t.arrivalBeforeDDay ? '' : 'hidden'}">
            <input type="text" id="t-arr-from" class="compact-input" placeholder="Lieu de départ" value="${this.esc(t.arrivalFrom)}">
            <input type="text" id="t-arr-to" class="compact-input" placeholder="Lieu d'arrivée" value="${this.esc(t.arrivalTo)}">
            <input type="date" id="t-arr-date" class="compact-input" value="${this.esc(t.arrivalDate)}">
          </div>
        </div>

        <div class="transport-mode">
          <button type="button" class="mode-btn ${t.mode === 'car' ? 'selected' : ''}" data-mode="car"><span style="display:block;font-size:20px;">🚗</span>En voiture</button>
          <button type="button" class="mode-btn ${t.mode === 'train' ? 'selected' : ''}" data-mode="train"><span style="display:block;font-size:20px;">🚆</span>En train</button>
          <button type="button" class="mode-btn ${t.mode === 'other' ? 'selected' : ''}" data-mode="other"><span style="display:block;font-size:20px;">✈️</span>Autre</button>
        </div>

        <div id="car-section" class="${isCar ? '' : 'hidden'}">
          <div class="attendance-options">
            <button type="button" class="choice-btn ${t.carpoolRole === 'offer' ? 'selected' : ''}" data-role="offer">Je peux proposer des places</button>
            <button type="button" class="choice-btn ${t.carpoolRole === 'none' ? 'selected' : ''}" data-role="none">Je n'ai pas de place</button>
          </div>
          <div id="offer-section" class="${t.carpoolRole === 'offer' ? '' : 'hidden'}" style="margin-top:10px;">
            <input type="text" id="t-driver-city" class="compact-input" value="${this.esc(t.city)}" placeholder="Ville de départ (ex: Lyon)">
            <select id="t-driver-seats" class="compact-input"><option value="1" disabled>Places dispo</option>${[1,2,3,4].map(num => `<option value="${num}" ${t.seatsAvailable == num ? 'selected' : ''}>${num} places</option>`).join('')}</select>
            <input type="date" id="t-driver-day" class="compact-input" value="${this.esc(t.departureDay)}">
            <input type="time" id="t-driver-time" class="compact-input" value="${this.esc(t.departureTime)}" placeholder="Heure">
          </div>
        </div>

        <div id="other-section" class="${!isCar ? '' : 'hidden'}">
          <div class="attendance-options">
            <button type="button" class="choice-btn ${t.carpoolRole === 'need' ? 'selected' : ''}" data-need="need">J'ai besoin d'un covoiturage</button>
            <button type="button" class="choice-btn ${t.carpoolRole === 'none' ? 'selected' : ''}" data-need="none">Je me débrouille</button>
          </div>
          
          <div id="need-section" class="${showNeedSection ? '' : 'hidden'}" style="margin-top:15px;">
            <label style="font-weight:bold; margin-bottom:10px; display:block;">Pour quel(s) trajet(s) ?</label>
            
            <label><input type="checkbox" class="p-need-cb" value="church" ${n.includes('church') ? 'checked' : ''}> Aller à l'église de Malleval</label>
            <div class="transport-sub-options ${n.includes('church') ? '' : 'hidden'}" id="church-options">
              <label style="display:block; margin-bottom:5px;"><input type="radio" name="churchArrival" value="ter" ${t.churchArrival === 'ter' ? 'checked' : ''}> Gare TER Le Péage-de-Roussillon</label>
              <input type="time" id="t-church-time" class="compact-input ${t.churchArrival === 'ter' ? '' : 'hidden'}" value="${this.esc(t.churchTime)}" placeholder="Heure d'arrivée prévue">
              
              <label style="display:block; margin-bottom:5px;"><input type="radio" name="churchArrival" value="far" ${t.churchArrival === 'far' ? 'checked' : ''}> Depuis un autre lieu</label>
              <div id="church-far-options" class="${t.churchArrival === 'far' ? '' : 'hidden'}">
                <input type="text" id="t-pass-city" class="compact-input" value="${this.esc(t.city)}" placeholder="Ville de départ *">
                <input type="date" id="t-pass-day" class="compact-input" value="${this.esc(t.departureDay)}">
              </div>
            </div>

            <label style="display:block; margin-top:10px;"><input type="checkbox" class="p-need-cb" value="church-venue" ${n.includes('church-venue') ? 'checked' : ''}> Aller de l'église à la Scie du May</label>
            
            <label style="display:block; margin-top:10px;"><input type="checkbox" class="p-need-cb" value="night" id="need-night" ${n.includes('night') ? 'checked' : ''}> Aller à mon lieu de couchage le soir</label>
            <div id="night-fields" class="transport-sub-options ${n.includes('night') ? '' : 'hidden'}">
              <input type="text" id="night-name" class="compact-input" value="${this.esc(t.nightName)}" placeholder="Nom du lieu *">
              <input type="text" id="night-address" class="compact-input" value="${this.esc(t.nightAddress)}" placeholder="Adresse *">
              <input type="text" id="night-city" class="compact-input" value="${this.esc(t.nightCity)}" placeholder="Ville *">
              <input type="text" id="night-zip" class="compact-input" value="${this.esc(t.nightZip)}" placeholder="Code postal *">
              <input type="number" id="night-distance" class="compact-input" value="${this.esc(t.nightDistance)}" placeholder="Distance depuis réception (min) *">
            </div>

            <label style="display:block; margin-top:10px;"><input type="checkbox" class="p-need-cb" value="brunch" ${n.includes('brunch') ? 'checked' : ''}> Venir au brunch le dimanche</label>

            <select id="t-pass-seats" class="compact-input" style="margin-top:15px;"><option value="1" disabled>Places nécessaires *</option>${[1,2,3,4].map(num => `<option value="${num}" ${t.seatsNeeded == num ? 'selected' : ''}>${num} places</option>`).join('')}</select>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
  },

  renderStep5() {
    const v = this.currentStep === 5;
    const acc = this.guestData.accommodationStatus;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-5">
        <div class="attendance-options">
          <button type="button" class="choice-btn ${acc === 'found' ? 'selected' : ''}" data-acc="found"><span>🏡</span> <strong>J'ai trouvé un logement</strong></button>
          <button type="button" class="choice-btn ${acc === 'searching' ? 'selected' : ''}" data-acc="searching"><span>🔍</span> <strong>Je cherche encore</strong></button>
        </div>
        <p style="font-size: 13px; color: #777; text-align: center; font-style: italic;">Les places partent vite dans le Pilat, nous vous encourageons à réserver rapidement !</p>
        <div class="form-actions" style="margin-top: 2.5rem;">
          <button type="button" class="btn btn--secondary prev-btn">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn" id="final-submit-btn">Confirmer ma réponse ✓</button>
        </div>
      </div>
    `;
  },

  attachEvents() {
    this.container.querySelectorAll('.next-btn').forEach(btn => btn.addEventListener('click', () => this.handleNext()));
    this.container.querySelectorAll('.prev-btn').forEach(btn => btn.addEventListener('click', () => this.handlePrev()));

    this.container.querySelectorAll('[data-val], [data-brunch], [data-acc]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const d = e.currentTarget.dataset;
        if (d.val) this.guestData.attending = d.val === 'true' ? true : d.val === 'false' ? false : 'maybe';
        if (d.brunch) this.guestData.brunch = d.brunch === 'true';
        if (d.acc) this.guestData.accommodationStatus = d.acc;
        this.saveCurrentStepData();
        this.render();
      });
    });

    const compSelect = this.container.querySelector('#guest-companions-count');
    if (compSelect) {
      compSelect.addEventListener('change', (e) => {
        const count = parseInt(e.target.value, 10);
        while (this.guestData.companions.length < count) this.guestData.companions.push({ name: '', diet: [], allergyDetails: '' });
        if (this.guestData.companions.length > count) this.guestData.companions = this.guestData.companions.slice(0, count);
        this.render();
      });
    }

    this.container.querySelectorAll('.diet-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const subOpts = this.container.querySelector(`#allergy-details-${cb.dataset.person}`);
        if (cb.value === 'allergy' && subOpts) subOpts.classList.toggle('hidden', !cb.checked);
      });
    });

    this.container.querySelectorAll('.allergy-other-trigger').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const input = this.container.querySelector(`.allergy-other-input[data-person="${cb.dataset.person}"]`);
        if (input) input.classList.toggle('hidden', !cb.checked);
      });
    });

    this.container.querySelectorAll('[data-mode], [data-role], [data-need]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const d = e.currentTarget.dataset;
        if (d.mode) { this.guestData.transport.mode = d.mode; this.guestData.transport.carpoolRole = 'none'; }
        if (d.role || d.need) this.guestData.transport.carpoolRole = d.role || d.need;
        this.saveCurrentStepData();
        this.render();
      });
    });

    const arriveBeforeCb = this.container.querySelector('#t-arrive-before');
    if (arriveBeforeCb) {
      arriveBeforeCb.addEventListener('change', (e) => {
        const fields = this.container.querySelector('#arrive-before-fields');
        if (fields) fields.classList.toggle('hidden', !e.target.checked);
      });
    }

    this.container.querySelectorAll('.p-need-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.value === 'church') {
          const churchOpts = this.container.querySelector('#church-options');
          if (churchOpts) churchOpts.classList.toggle('hidden', !e.target.checked);
        }
        if (e.target.value === 'night') {
          const nightOpts = this.container.querySelector('#night-fields');
          if (nightOpts) nightOpts.classList.toggle('hidden', !e.target.checked);
        }
      });
    });

    this.container.querySelectorAll('input[name="churchArrival"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const timeInput = this.container.querySelector('#t-church-time');
        const farOpts = this.container.querySelector('#church-far-options');
        if (timeInput) timeInput.classList.toggle('hidden', e.target.value !== 'ter');
        if (farOpts) farOpts.classList.toggle('hidden', e.target.value !== 'far');
      });
    });
  },

  saveCurrentStepData() {
    if (this.currentStep === 1) {
      this.guestData.firstName = (document.getElementById('guest-firstname')?.value || '').trim();
      this.guestData.lastName  = (document.getElementById('guest-lastname')?.value || '').trim();
      this.guestData.phone     = (document.getElementById('guest-phone')?.value || '').trim();
      this.container.querySelectorAll('.companion-name').forEach(input => {
        if (this.guestData.companions[input.dataset.index]) this.guestData.companions[input.dataset.index].name = input.value.trim();
      });
    }
    if (this.currentStep === 3) {
      const processDiet = (personKey) => {
        const dietCbs = Array.from(this.container.querySelectorAll(`.diet-cb[data-person="${personKey}"]:checked`)).map(cb => cb.value);
        let allergyStr = '';
        if (dietCbs.includes('allergy')) {
          Array.from(this.container.querySelectorAll(`.allergy-sub-cb[data-person="${personKey}"]:checked`)).forEach(cb => {
            if (cb.value === 'Autre') {
              const otherInput = this.container.querySelector(`.allergy-other-input[data-person="${personKey}"]`)?.value.trim();
              if (otherInput) allergyStr += ` [Autre: ${otherInput}]`;
            } else allergyStr += ` [${cb.value}]`;
          });
        }
        return { diet: dietCbs, details: allergyStr.trim() };
      };
      const mainData = processDiet('main');
      this.guestData.diet = mainData.diet;
      this.guestData.allergyDetails = mainData.details;
      this.guestData.companions.forEach((c, idx) => {
        const compData = processDiet(String(idx));
        c.diet = compData.diet;
        c.allergyDetails = compData.details;
      });
    }
    if (this.currentStep === 4) {
      const t = this.guestData.transport;
      t.arrivalBeforeDDay = document.getElementById('t-arrive-before')?.checked || false;
      if (t.arrivalBeforeDDay) {
        t.arrivalFrom = (document.getElementById('t-arr-from')?.value || '').trim();
        t.arrivalTo   = (document.getElementById('t-arr-to')?.value || '').trim();
        t.arrivalDate = document.getElementById('t-arr-date')?.value || '';
      }

      if (t.mode === 'car' && t.carpoolRole === 'offer') {
        t.city           = (document.getElementById('t-driver-city')?.value || '').trim();
        t.seatsAvailable = parseInt(document.getElementById('t-driver-seats')?.value || '1', 10);
        t.departureDay   = document.getElementById('t-driver-day')?.value || '';
        t.departureTime  = document.getElementById('t-driver-time')?.value || '';
      } else if (t.carpoolRole === 'need') {
        t.passengerNeeds = Array.from(this.container.querySelectorAll('.p-need-cb:checked')).map(cb => cb.value);
        t.churchArrival  = this.container.querySelector('input[name="churchArrival"]:checked')?.value || '';
        t.seatsNeeded    = parseInt(document.getElementById('t-pass-seats')?.value || '1', 10);
        
        if (t.churchArrival === 'ter') {
          t.churchTime = document.getElementById('t-church-time')?.value || '';
        } else if (t.churchArrival === 'far') {
          t.city = (document.getElementById('t-pass-city')?.value || '').trim();
          t.departureDay = document.getElementById('t-pass-day')?.value || '';
        }

        if (t.passengerNeeds.includes('night')) {
          t.nightName     = (document.getElementById('night-name')?.value || '').trim();
          t.nightAddress  = (document.getElementById('night-address')?.value || '').trim();
          t.nightCity     = (document.getElementById('night-city')?.value || '').trim();
          t.nightZip      = (document.getElementById('night-zip')?.value || '').trim();
          t.nightDistance = (document.getElementById('night-distance')?.value || '').trim();
        }
      }
    }
  },

  validateStep() {
    if (this.currentStep === 1) {
      if (!this.guestData.firstName || !this.guestData.lastName || !this.guestData.phone) { Animations.showToast("Veuillez remplir Prénom, Nom et Téléphone", "error"); return false; }
      if (this.guestData.attending === null) { Animations.showToast("Veuillez indiquer votre présence", "error"); return false; }
      if (this.guestData.attending === true && !this.guestData.companions.every(c => c.name.trim())) { Animations.showToast("Veuillez renseigner les noms", "error"); return false; }
    }
    if (this.currentStep === 2 && (this.guestData.attending === true || this.guestData.attending === 'maybe') && this.guestData.brunch === null) {
      Animations.showToast("Veuillez indiquer pour le brunch", "error"); return false;
    }
    if (this.currentStep === 4 && this.guestData.transport.carpoolRole === 'need') {
      const t = this.guestData.transport;
      const n = t.passengerNeeds || [];
      if (n.includes('church') && t.churchArrival === 'far' && !t.city) { Animations.showToast("Précisez la ville de départ", "error"); return false; }
      if (n.includes('night') && (!t.nightName || !t.nightAddress || !t.nightDistance)) { Animations.showToast("Remplissez les champs obligatoires du lieu de couchage", "error"); return false; }
    }
    return true;
  },

async handleNext() {
    // CORRECTION MAJEURE : Sauvegarder d'abord, puis valider.
    this.saveCurrentStepData(); 

    if (this.validateStep()) {
      if (this.currentStep === 1 && this.guestData.attending === false) { this.submitForm(); return; }
      if (this.currentStep === 1) {
        const existing = await Store.getGuestByPhone(this.guestData.phone);
        if (existing && existing.id !== this.guestData.id) this.guestData = { ...this.guestData, ...existing };
      }
      if (this.currentStep === 2 && this.guestData.attending !== true) { this.currentStep = 4; this.render(); return; }

      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.render();
      } else {
        this.submitForm();
      }
    }
  },

  handlePrev() {
    this.saveCurrentStepData();
    if (this.currentStep === 4 && this.guestData.attending !== true) { this.currentStep = 2; this.render(); return; }
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
    }
  },

async submitForm() {
  try {
    let savedGuest;
    if (this.guestData.id) {
      savedGuest = await Store.updateGuest(this.guestData.id, this.guestData);
    } else {
      savedGuest = await Store.saveGuest(this.guestData);
    }

    Store.setCurrentGuest(savedGuest.id);

    const t = savedGuest.transport;
    if (t && (t.carpoolRole === 'offer' || t.carpoolRole === 'need')) {
      const existing = await Store.getCarpoolsByGuestId(savedGuest.id);
      for (const c of existing) await Store.deleteCarpool(c.id);
      await Store.saveCarpool({
        guestId:        savedGuest.id,
        type:           t.carpoolRole === 'offer' ? 'offer' : 'request',
        city:           t.city,
        seatsAvailable: t.seatsAvailable,
        seatsNeeded:    t.seatsNeeded,
        departureDay:   t.departureDay,
        departureTime:  t.departureTime,
        contact:        t.contactPhone || savedGuest.phone
      });
    }

    Animations.showToast("Merci pour votre réponse !", "success");
    this.currentStep = 1;
    Router.navigate('#/mes-reponses');

  } catch (err) {
    console.error('[RSVP] Erreur submitForm :', err);
    Animations.showToast("Une erreur est survenue, veuillez réessayer.", "error");
  }
}

};  

export default RSVP;