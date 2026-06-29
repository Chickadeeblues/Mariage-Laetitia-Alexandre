import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const RSVP = {
  container: null,
  currentStep: 1,
  totalSteps: 5, // Passage à 5 étapes (Le Brunch est isolé)
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
    accommodationStatus: '', // 'found' | 'searching'
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
      passengerNeeds: [],     // Trajets souhaités ['church', 'church-venue', 'night', 'brunch']
      churchArrival: '',      // 'ter' | 'far'
    }
  },

  init() {
    this.container = document.getElementById('rsvp-container');
    if (!this.container) return;

    const currentGuest = Store.getCurrentGuest();
    if (currentGuest) {
      this.guestData = {
        ...this.guestData,
        ...currentGuest,
        transport: { ...this.guestData.transport, ...(currentGuest.transport || {}) }
      };
    }

    this.render();
  },

  render() {
    if (!this.container) return;
    this.container.innerHTML = this.getHTML();
    this.attachEvents();
    Animations.fadeIn(this.container);
    this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  getHTML() {
    return `
      <style>
        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 300;
          border: 1px solid #e0d5c1;
          color: #a89a7a; background: #fff;
          transition: all 0.3s ease;
        }
        .step-dot.active { background: #9b8660; border-color: #9b8660; color: #fff; font-weight: 500; transform: scale(1.05); }
        .step-dot.completed { background: #f4efe6; border-color: #d8ceb9; color: #9b8660; }
        .step-label { font-size: 12px; color: #9b8660; text-align: center; margin-top: 5px; font-style: italic; }

        .form-step { display: none; }
        .form-step.active { display: block; }

        /* Champs compacts sans label */
        .compact-input {
          width: 100%; padding: 14px 16px; margin-bottom: 12px;
          border: 1px solid #e5e0d5; border-radius: 8px;
          font-size: 15px; outline: none; transition: border-color 0.2s;
        }
        .compact-input:focus { border-color: #9b8660; }
        .compact-input::placeholder { color: #aaa; }

        .attendance-options { display: flex; flex-direction: column; gap: 10px; margin: 1rem 0; }
        .choice-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border: 1px solid #e5e0d5; border-radius: 8px;
          background: #fff; cursor: pointer; font-size: 15px; color: #444;
          transition: all 0.2s ease; text-align: left; width: 100%;
        }
        .choice-btn:hover { border-color: #9b8660; background: #faf8f5; }
        .choice-btn.selected { border-color: #9b8660; background: #fbf9f4; color: #5c4e35; font-weight: 500; box-shadow: inset 0 0 0 1px #9b8660; }
        
        .companion-warning { background: #fdfaf3; border-left: 2px solid #cbbfa0; padding: 10px 14px; font-size: 13px; color: #7a6a48; margin-bottom: 14px; font-style: italic; }

        .diet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
        .diet-option { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; color: #555; }
        .diet-option input[type="checkbox"] { accent-color: #9b8660; width: 16px; height: 16px; cursor: pointer; }
        
        .allergy-sub-options { background: #faf8f5; padding: 12px; border-radius: 8px; margin-top: 8px; font-size: 13.5px; border: 1px dashed #e0d5c1; }
        .allergy-sub-options label { display: inline-flex; align-items: center; gap: 6px; margin-right: 15px; margin-bottom: 8px; cursor: pointer; }
        .allergy-sub-options input[type="checkbox"] { accent-color: #b02a2a; }

        .transport-mode { display: flex; gap: 10px; margin-bottom: 1.5rem; }
        .mode-btn { flex: 1; padding: 10px 5px; border: 1px solid #e5e0d5; border-radius: 8px; background: #fff; cursor: pointer; text-align: center; font-size: 13px; color: #555; }
        .mode-btn.selected { border-color: #9b8660; background: #fbf9f4; font-weight: 500; color: #5c4e35; }
        .mode-icon { display: block; font-size: 20px; margin-bottom: 4px; }

        .passenger-needs { background: #faf8f5; padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid #e5e0d5; }
        .passenger-needs > label { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer; font-weight: 500; font-size: 14px; }
        .church-sub-options { margin-left: 28px; margin-bottom: 12px; padding-left: 12px; border-left: 2px solid #e0d5c1; }
        .church-sub-options label { display: block; margin-bottom: 8px; font-size: 13px; cursor: pointer; }

        .form-actions { display: flex; gap: 12px; justify-content: center; margin-top: 2.5rem; }
        .btn-prev { background: none; border: 1px solid #ccc; color: #777; padding: 12px 24px; border-radius: 6px; cursor: pointer; }
        .hidden { display: none !important; }
      </style>

      <div class="card form-steps-card">
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
      let cls = 'step-dot';
      if (i === this.currentStep) cls += ' active';
      else if (i < this.currentStep) cls += ' completed';
      html += `<div class="${cls}">${i < this.currentStep ? '✓' : i}</div>`;
    }
    html += '</div>';
    html += `<div class="step-label">${labels[this.currentStep - 1]}</div>`;
    html += '<div style="margin: 1.5rem 0; height: 1px; background: #f5f2eb;"></div>';
    return html;
  },

  /* ─── Étape 1 : Réponse à l'invitation (Compacte) ─── */
  renderStep1() {
    const v = this.currentStep === 1;
    const att = this.guestData.attending;

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-1">
        <h3 style="text-align:center; margin-bottom:1.5rem; font-size: 1.4rem;">Réponse à l'invitation</h3>
        
        <div>
          <input type="text" id="guest-firstname" class="compact-input" value="${this.esc(this.guestData.firstName)}" placeholder="Prénom *" required>
          <input type="text" id="guest-lastname" class="compact-input" value="${this.esc(this.guestData.lastName)}" placeholder="Nom *" required>
          <input type="tel" id="guest-phone" class="compact-input" value="${this.esc(this.guestData.phone)}" placeholder="Téléphone portable (ex: 06 00 00 00 00) *" required>
        </div>

        <div style="height:1px; background:#f5f2eb; margin: 1.5rem 0;"></div>

        <div class="attendance-options">
          <button type="button" class="choice-btn ${att === true ? 'selected' : ''}" data-val="true">
            <span style="font-size:18px;">🎉</span>
            <div><strong>Je viens avec joie !</strong><div style="font-size:12px; color:#888;">Le 8 mai 2027 au Domaine de la Scie du May</div></div>
          </button>
          <button type="button" class="choice-btn ${att === 'maybe' ? 'selected' : ''}" data-val="maybe">
            <span style="font-size:18px;">🤔</span> <strong>Je viens peut-être</strong>
          </button>
          <button type="button" class="choice-btn ${att === false ? 'selected' : ''}" data-val="false">
            <span style="font-size:18px;">💌</span> <strong>Je ne peux pas venir</strong>
          </button>
        </div>

        <div id="companions-section" class="${att === true ? '' : 'hidden'}">
          <div class="companion-warning">Le nombre d'invités étant strictement limité, merci de ne pas ajouter quelqu'un que nous n'avons pas prévu !</div>
          <div class="form-group" style="margin-bottom: 10px;">
            <label style="font-size:14px;">Nombre d'accompagnants (hors vous-même)</label>
            <select id="guest-companions-count" style="width:100%; padding:10px; border-radius:6px; border:1px solid #e5e0d5;">
              ${[0,1,2,3,4,5].map(n => `<option value="${n}" ${this.guestData.companions.length === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div id="companions-list">
            ${this.guestData.companions.map((comp, idx) => `
              <input type="text" class="compact-input companion-name" data-index="${idx}" value="${this.esc(comp.name)}" placeholder="Prénom et Nom de l'accompagnant ${idx + 1}">
            `).join('')}
          </div>
        </div>

        <div class="form-actions"><button type="button" class="btn btn--primary next-btn">Suivant →</button></div>
      </div>
    `;
  },

  /* ─── Étape 2 : Brunch du lendemain ─── */
  renderStep2() {
    const v = this.currentStep === 2;
    const brunch = this.guestData.brunch;

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-2">
        <h3 style="text-align:center; margin-bottom:1rem; font-size: 1.4rem;">Brunch du lendemain</h3>
        <p style="text-align:center; font-size:14px; color:#666; margin-bottom:1.5rem; line-height:1.5;">
          Pour faire durer le plaisir, nous vous convions à un brunch le dimanche 9 mai, de 9h30 à 13h30 au Domaine de la Scie du May.
        </p>
        
        <div class="attendance-options">
          <button type="button" class="choice-btn ${brunch === true ? 'selected' : ''}" data-brunch="true">
            <span style="font-size:18px;">☕</span> <strong>Oui, avec plaisir !</strong>
          </button>
          <button type="button" class="choice-btn ${brunch === false ? 'selected' : ''}" data-brunch="false">
            <span style="font-size:18px;">🙏</span> <strong>Non, merci !</strong>
          </button>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn btn-prev">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
  },

  /* ─── Étape 3 : Régimes alimentaires & Allergies Détaillées ─── */
  renderStep3() {
    const v = this.currentStep === 3;

    const renderBlock = (personLabel, personKey, currentDiet, currentAllergyDetails) => {
      const hasAllergy = currentDiet && currentDiet.includes('allergy');
      const details = currentAllergyDetails || '';
      
      // Extraction rudimentaire pour pré-cocher les sous-options d'allergie
      const isLactose = details.includes('[Lactose]');
      const isGluten = details.includes('[Gluten]');
      const isSea = details.includes('[Fruits de mer]');
      const isPeanut = details.includes('[Arachides]');
      const otherMatch = details.match(/\[Autre:(.*?)\]/);
      const otherText = otherMatch ? otherMatch[1].trim() : '';
      const isOther = !!otherMatch;

      return `
        <div class="diet-block" style="margin-bottom: 1.5rem;">
          <p style="font-weight: 500; color: #444; margin-bottom: 4px; border-bottom: 1px solid #f5f2eb; padding-bottom: 4px;">${personLabel}</p>
          <div class="diet-grid">
            <div class="diet-col-left">
              <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${personKey}" value="vegetarian" ${currentDiet?.includes('vegetarian') ? 'checked' : ''}><span>🥗 Végétarien</span></label>
              <label class="diet-option" style="margin-top: 10px;"><input type="checkbox" class="diet-cb" data-person="${personKey}" value="vegan" ${currentDiet?.includes('vegan') ? 'checked' : ''}><span>🌱 Végan</span></label>
            </div>
            <div class="diet-col-right">
              <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${personKey}" value="no-alcohol" ${currentDiet?.includes('no-alcohol') ? 'checked' : ''}><span>🧃 Sans alcool</span></label>
              <label class="diet-option" style="margin-top: 10px;"><input type="checkbox" class="diet-cb" data-person="${personKey}" value="allergy" ${hasAllergy ? 'checked' : ''}><span>⚠️ Allergie / Intolérance</span></label>
            </div>
          </div>
          
          <div class="allergy-sub-options ${hasAllergy ? '' : 'hidden'}" id="allergy-details-${personKey}">
            <p style="font-size:12px; color:#666; margin-bottom:8px;">Précisez :</p>
            <label><input type="checkbox" class="allergy-sub-cb" data-person="${personKey}" value="Lactose" ${isLactose ? 'checked' : ''}> Lactose</label>
            <label><input type="checkbox" class="allergy-sub-cb" data-person="${personKey}" value="Gluten" ${isGluten ? 'checked' : ''}> Gluten</label>
            <label><input type="checkbox" class="allergy-sub-cb" data-person="${personKey}" value="Fruits de mer" ${isSea ? 'checked' : ''}> Fruits de mer</label>
            <label><input type="checkbox" class="allergy-sub-cb" data-person="${personKey}" value="Arachides" ${isPeanut ? 'checked' : ''}> Arachides</label>
            <label><input type="checkbox" class="allergy-sub-cb allergy-other-trigger" data-person="${personKey}" value="Autre" ${isOther ? 'checked' : ''}> Autre</label>
            <input type="text" class="compact-input allergy-other-input ${isOther ? '' : 'hidden'}" data-person="${personKey}" value="${this.esc(otherText)}" placeholder="Précisez l'allergie..." style="margin-top:8px; padding:8px 12px; font-size:13px;">
          </div>
        </div>
      `;
    };

    let html = `
      <div class="form-step ${v ? 'active' : ''}" id="step-3">
        <h3 style="text-align:center; margin-bottom: 1.5rem; font-size: 1.4rem;">Régimes alimentaires</h3>
        ${renderBlock('Pour vous', 'main', this.guestData.diet, this.guestData.allergyDetails)}
    `;

    this.guestData.companions.forEach((comp, idx) => {
      html += renderBlock(`Pour ${comp.name || 'Accompagnant ' + (idx + 1)}`, String(idx), comp.diet, comp.allergyDetails);
    });

    html += `
        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn btn-prev">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
    return html;
  },

  /* ─── Étape 4 : Transport & Covoiturage (Détaillé) ─── */
  renderStep4() {
    const v = this.currentStep === 4;
    const t = this.guestData.transport;
    const isCar = t.mode === 'car';
    const showOfferSection = isCar && t.carpoolRole === 'offer';
    const showNeedSection = !isCar && t.carpoolRole === 'need';
    const n = t.passengerNeeds || [];

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-4">
        <h3 style="text-align:center; margin-bottom:1.5rem; font-size: 1.4rem;">Transport & Covoiturage</h3>

        <div class="transport-mode" id="transport-mode">
          <button type="button" class="mode-btn ${t.mode === 'car' ? 'selected' : ''}" data-mode="car"><span class="mode-icon">🚗</span>En voiture</button>
          <button type="button" class="mode-btn ${t.mode === 'train' ? 'selected' : ''}" data-mode="train"><span class="mode-icon">🚆</span>En train</button>
          <button type="button" class="mode-btn ${t.mode === 'other' ? 'selected' : ''}" data-mode="other"><span class="mode-icon">✈️</span>Autre</button>
        </div>

        <div id="car-section" class="${isCar ? '' : 'hidden'}">
          <div class="attendance-options" style="gap: 8px;">
            <button type="button" class="choice-btn ${t.carpoolRole === 'offer' ? 'selected' : ''}" data-role="offer"><span>🙌</span> Je peux proposer des places</button>
            <button type="button" class="choice-btn ${t.carpoolRole === 'none' ? 'selected' : ''}" data-role="none"><span>👍</span> Je n'ai pas de place supplémentaire</button>
          </div>

          <div id="offer-section" class="${showOfferSection ? '' : 'hidden'}" style="margin-top:1.5rem; background:#faf8f5; padding:15px; border-radius:8px;">
            <input type="text" id="t-driver-city" class="compact-input" value="${this.esc(t.city)}" placeholder="Ville de départ (ex: Lyon)">
            <div style="display:flex; gap:10px;">
              <div style="flex:1;"><label style="font-size:12px; color:#666;">Places dispo</label><select id="t-driver-seats" class="compact-input" style="padding:10px;">${[1,2,3,4,5,6,7].map(num => `<option value="${num}" ${t.seatsAvailable == num ? 'selected' : ''}>${num}</option>`).join('')}</select></div>
              <div style="flex:1;"><label style="font-size:12px; color:#666;">Jour</label><input type="date" id="t-driver-day" class="compact-input" style="padding:10px;" value="${this.esc(t.departureDay)}"></div>
            </div>
            <label style="font-size:12px; color:#666;">Heure de départ (Précise)</label><input type="time" id="t-driver-time" class="compact-input" value="${this.esc(t.departureTime)}">
          </div>
        </div>

        <div id="other-section" class="${!isCar ? '' : 'hidden'}">
          <div class="attendance-options" style="gap: 8px;">
            <button type="button" class="choice-btn ${t.carpoolRole === 'need' ? 'selected' : ''}" data-need="need"><span>🙋</span> J'ai besoin d'un covoiturage</button>
            <button type="button" class="choice-btn ${t.carpoolRole === 'none' ? 'selected' : ''}" data-need="none"><span>👌</span> Je me débrouille</button>
          </div>

          <div id="need-section" class="${showNeedSection ? '' : 'hidden'} passenger-needs">
            <p style="font-size:13px; color:#9b8660; margin-bottom:10px; font-weight:500;">Pour quel(s) trajet(s) ?</p>
            
            <label><input type="checkbox" class="p-need-cb" value="church" ${n.includes('church') ? 'checked' : ''}> Aller à l'église de Malleval</label>
            <div class="church-sub-options ${n.includes('church') ? '' : 'hidden'}" id="church-options">
              <label><input type="radio" name="churchArrival" value="ter" ${t.churchArrival === 'ter' ? 'checked' : ''}> J'arrive à la gare TER Le Péage-de-Roussillon (à 20 min.)</label>
              <label><input type="radio" name="churchArrival" value="far" ${t.churchArrival === 'far' ? 'checked' : ''}> Je pars de plus loin</label>
              
              <div id="church-far-options" class="${t.churchArrival === 'far' ? '' : 'hidden'}" style="margin-top:10px;">
                <input type="text" id="t-pass-city" class="compact-input" style="padding:8px; font-size:13px;" value="${this.esc(t.city)}" placeholder="Ville de départ *">
                <div style="display:flex; gap:10px; align-items:center;">
                  <label style="font-size:12px;">Jour :</label><input type="date" id="t-pass-day" class="compact-input" style="padding:8px; margin:0;" value="${this.esc(t.departureDay)}">
                </div>
              </div>
            </div>

            <label><input type="checkbox" class="p-need-cb" value="church-venue" ${n.includes('church-venue') ? 'checked' : ''}> Aller de l'église à la Scie du May</label>
            <label><input type="checkbox" class="p-need-cb" value="night" ${n.includes('night') ? 'checked' : ''}> Aller à mon lieu de couchage le soir</label>
            <label><input type="checkbox" class="p-need-cb" value="brunch" ${n.includes('brunch') ? 'checked' : ''}> Venir au brunch le dimanche</label>
            
            <div style="margin-top: 15px; border-top: 1px solid #e5e0d5; padding-top: 15px;">
              <label style="font-size:13px; display:block; margin-bottom:5px;">Nombre de places nécessaires au total *</label>
              <select id="t-pass-seats" class="compact-input" style="width:100px;">${[1,2,3,4,5].map(num => `<option value="${num}" ${t.seatsNeeded == num ? 'selected' : ''}>${num}</option>`).join('')}</select>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn btn-prev">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
  },

  /* ─── Étape 5 : Hébergement & Validation Finale ─── */
  renderStep5() {
    const v = this.currentStep === 5;
    const acc = this.guestData.accommodationStatus;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-5">
        <h3 style="text-align:center; margin-bottom: 1.5rem; font-size: 1.4rem;">Hébergement</h3>
        
        <div class="attendance-options">
          <button type="button" class="choice-btn ${acc === 'found' ? 'selected' : ''}" data-acc="found">
            <span style="font-size:18px;">🏡</span> <strong>J'ai trouvé un logement</strong>
          </button>
          <button type="button" class="choice-btn ${acc === 'searching' ? 'selected' : ''}" data-acc="searching">
            <span style="font-size:18px;">🔍</span> <strong>Je cherche encore</strong>
          </button>
        </div>

        <p style="font-size: 13px; color: #777; margin-top: 15px; text-align: center; font-style: italic;">
          Les places partent vite dans le Pilat, nous vous encourageons à réserver rapidement !
        </p>

        <div class="form-actions" style="margin-top: 2.5rem;">
          <button type="button" class="btn btn--secondary prev-btn btn-prev">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn" id="final-submit-btn" style="font-size: 16px; padding: 14px 30px;">
            Confirmer ma réponse ✓
          </button>
        </div>
      </div>
    `;
  },

  /* ─── Événements & Interactions ────────────────── */
  attachEvents() {
    this.container.querySelectorAll('.next-btn').forEach(btn => btn.addEventListener('click', () => this.handleNext()));
    this.container.querySelectorAll('.prev-btn').forEach(btn => btn.addEventListener('click', () => this.handlePrev()));

    // Choix Présence & Hébergement
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

    // Compteur Accompagnants
    const compSelect = this.container.querySelector('#guest-companions-count');
    if (compSelect) {
      compSelect.addEventListener('change', (e) => {
        const count = parseInt(e.target.value, 10);
        while (this.guestData.companions.length < count) this.guestData.companions.push({ name: '', diet: [], allergyDetails: '' });
        if (this.guestData.companions.length > count) this.guestData.companions = this.guestData.companions.slice(0, count);
        this.render();
      });
    }

    // Gestion Allergies Principales (Affiche/Masque les sous-options)
    this.container.querySelectorAll('.diet-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const person = cb.dataset.person;
        const val = cb.value;
        const subOpts = this.container.querySelector(`#allergy-details-${person}`);
        if (val === 'allergy' && subOpts) {
          subOpts.classList.toggle('hidden', !cb.checked);
        }
      });
    });

    // Gestion de la case "Autre" pour l'allergie
    this.container.querySelectorAll('.allergy-other-trigger').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const input = this.container.querySelector(`.allergy-other-input[data-person="${cb.dataset.person}"]`);
        if (input) input.classList.toggle('hidden', !cb.checked);
      });
    });

    // Transport - Modes & Rôles
    this.container.querySelectorAll('[data-mode], [data-role], [data-need]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const d = e.currentTarget.dataset;
        if (d.mode) { this.guestData.transport.mode = d.mode; this.guestData.transport.carpoolRole = 'none'; }
        if (d.role || d.need) this.guestData.transport.carpoolRole = d.role || d.need;
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Transport - Affichage dynamique "Église"
    this.container.querySelectorAll('.p-need-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.value === 'church') {
          const churchOpts = this.container.querySelector('#church-options');
          if (churchOpts) churchOpts.classList.toggle('hidden', !e.target.checked);
        }
      });
    });

    // Transport - Affichage "Je pars de plus loin"
    this.container.querySelectorAll('input[name="churchArrival"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const farOpts = this.container.querySelector('#church-far-options');
        if (farOpts) farOpts.classList.toggle('hidden', e.target.value !== 'far');
      });
    });
  },

  /* ─── Sauvegarde des données à la volée ───────── */
  saveCurrentStepData() {
    if (this.currentStep === 1) {
      this.guestData.firstName = (document.getElementById('guest-firstname')?.value || '').trim();
      this.guestData.lastName  = (document.getElementById('guest-lastname')?.value || '').trim();
      this.guestData.phone     = (document.getElementById('guest-phone')?.value || '').trim();

      this.container.querySelectorAll('.companion-name').forEach(input => {
        const idx = parseInt(input.dataset.index, 10);
        if (this.guestData.companions[idx]) this.guestData.companions[idx].name = input.value.trim();
      });
    }

    if (this.currentStep === 3) {
      const processDiet = (personKey) => {
        // Collecte du régime de base
        const dietCbs = Array.from(this.container.querySelectorAll(`.diet-cb[data-person="${personKey}"]:checked`)).map(cb => cb.value);
        let allergyStr = '';
        
        // Si allergie cochée, on collecte les détails
        if (dietCbs.includes('allergy')) {
          const subCbs = Array.from(this.container.querySelectorAll(`.allergy-sub-cb[data-person="${personKey}"]:checked`));
          subCbs.forEach(cb => {
            if (cb.value === 'Autre') {
              const otherInput = this.container.querySelector(`.allergy-other-input[data-person="${personKey}"]`)?.value.trim();
              if (otherInput) allergyStr += ` [Autre: ${otherInput}]`;
            } else {
              allergyStr += ` [${cb.value}]`;
            }
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
      if (t.mode === 'car' && t.carpoolRole === 'offer') {
        t.city           = (document.getElementById('t-driver-city')?.value || '').trim();
        t.seatsAvailable = parseInt(document.getElementById('t-driver-seats')?.value || '1', 10);
        t.departureDay   = document.getElementById('t-driver-day')?.value || '';
        t.departureTime  = document.getElementById('t-driver-time')?.value || '';
      } else if (t.carpoolRole === 'need') {
        t.passengerNeeds = Array.from(this.container.querySelectorAll('.p-need-cb:checked')).map(cb => cb.value);
        t.churchArrival  = this.container.querySelector('input[name="churchArrival"]:checked')?.value || '';
        t.seatsNeeded    = parseInt(document.getElementById('t-pass-seats')?.value || '1', 10);
        t.city           = (document.getElementById('t-pass-city')?.value || '').trim();
        t.departureDay   = document.getElementById('t-pass-day')?.value || '';
      }
    }
  },

  validateStep() {
    if (this.currentStep === 1) {
      if (!this.guestData.firstName || !this.guestData.lastName || !this.guestData.phone) { Animations.showToast("Veuillez remplir Prénom, Nom et Téléphone", "error"); return false; }
      if (this.guestData.attending === null) { Animations.showToast("Veuillez indiquer votre présence", "error"); return false; }
      if (this.guestData.attending === true && !this.guestData.companions.every(c => c.name.trim())) {
        Animations.showToast("Veuillez renseigner le nom de vos accompagnants", "error"); return false;
      }
    }
    if (this.currentStep === 2 && (this.guestData.attending === true || this.guestData.attending === 'maybe') && this.guestData.brunch === null) {
      Animations.showToast("Veuillez indiquer si vous participerez au brunch", "error"); return false;
    }
    if (this.currentStep === 4 && this.guestData.transport.carpoolRole === 'need') {
      const t = this.guestData.transport;
      if (t.passengerNeeds.includes('church') && !t.churchArrival) { Animations.showToast("Précisez votre arrivée pour l'église", "error"); return false; }
      if (t.passengerNeeds.includes('church') && t.churchArrival === 'far' && (!t.city || !t.departureDay)) { Animations.showToast("Précisez votre ville et jour de départ", "error"); return false; }
    }
    return true;
  },

  handleNext() {
    this.saveCurrentStepData();
    if (!this.validateStep()) return;

    if (this.currentStep === 1 && this.guestData.attending === false) { this.submitForm(); return; }

    if (this.currentStep === 1) {
      const existing = Store.getGuestByPhone(this.guestData.phone);
      if (existing && existing.id !== this.guestData.id) {
        this.guestData = { ...this.guestData, ...existing, transport: { ...this.guestData.transport, ...(existing.transport || {}) } };
        Animations.showToast("Ravi de vous revoir ! Profil chargé.", "success");
      }
    }

    if (this.currentStep === 2 && this.guestData.attending !== true) { this.currentStep = 4; this.render(); return; }

    if (this.currentStep < this.totalSteps) { this.currentStep++; this.render(); }
    else { this.submitForm(); }
  },

  handlePrev() {
    this.saveCurrentStepData();
    if (this.currentStep === 4 && this.guestData.attending !== true) { this.currentStep = 2; this.render(); return; }
    if (this.currentStep > 1) { this.currentStep--; this.render(); }
  },

  submitForm() {
    let savedGuest;
    if (this.guestData.id) savedGuest = Store.updateGuest(this.guestData.id, this.guestData);
    else savedGuest = Store.saveGuest(this.guestData);

    Store.setCurrentGuest(savedGuest.id);

    const t = savedGuest.transport;
    if (t && (t.carpoolRole === 'offer' || t.carpoolRole === 'need')) {
      Store.getCarpoolsByGuestId(savedGuest.id).forEach(c => Store.deleteCarpool(c.id));
      
      // Construction automatique d'une description pour l'admin / vue globale
      let autoContact = savedGuest.phone;
      let extraInfo = '';
      if (t.carpoolRole === 'need') {
        const needsFR = [];
        if (t.passengerNeeds.includes('church')) needsFR.push(t.churchArrival === 'ter' ? "Gare TER -> Eglise" : "Plus loin -> Eglise");
        if (t.passengerNeeds.includes('church-venue')) needsFR.push("Eglise -> Domaine");
        if (t.passengerNeeds.includes('night')) needsFR.push("Soir -> Lit");
        if (t.passengerNeeds.includes('brunch')) needsFR.push("Brunch du dimanche");
        extraInfo = `[Trajets : ${needsFR.join(', ')}]`;
      }

      Store.saveCarpool({
        guestId: savedGuest.id,
        type: t.carpoolRole === 'offer' ? 'offer' : 'request',
        city: t.city || (t.carpoolRole === 'need' && t.churchArrival === 'ter' ? 'Gare TER Roussillon' : 'Non précisée'),
        seatsAvailable: t.seatsAvailable,
        seatsNeeded: t.seatsNeeded,
        departureDay: t.departureDay,
        departureTime: t.departureTime,
        contact: `${autoContact} ${extraInfo}`.trim()
      });
    }

    Animations.showToast("Votre réponse a été enregistrée avec succès !", "success");
    this.currentStep = 1;
    Router.navigate('#/mes-reponses');
  },

  esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default RSVP;