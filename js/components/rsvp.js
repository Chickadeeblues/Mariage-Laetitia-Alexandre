import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const RSVP = {
  container: null,
  currentStep: 1,
  totalSteps: 4, // Réduit à 4 étapes car l'identité et la réponse fusionnent en Étape 1
  guestData: {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    attending: null,       // true | false | 'maybe'
    companionCount: 0,
    companions: [],
    brunch: null,          // true | false
    diet: [],
    allergyDetails: '',
    transport: {
      mode: 'car',         // 'car' | 'train' | 'other'
      carpoolRole: 'none', // 'offer' | 'need' | 'none'
      city: '',
      seatsAvailable: 1,
      seatsNeeded: 1,
      departureDay: '',
      departureTime: '',
      contactPhone: '',
      contactEmail: ''
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
        /* 1. Bulles d'étapes légères et élégantes */
        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 2rem; }
        .step-dot {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 300;
          border: 1px solid #e0d5c1;
          color: #a89a7a; background: #fff;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .step-dot.active { background: #9b8660; border-color: #9b8660; color: #fff; font-weight: 500; transform: scale(1.05); }
        .step-dot.completed { background: #f4efe6; border-color: #d8ceb9; color: #9b8660; }
        .step-label { font-size: 12px; color: #9b8660; text-align: center; margin-top: 8px; font-style: italic; letter-spacing: 0.05em; }

        .form-step { display: none; }
        .form-step.active { display: block; }

        .attendance-options { display: flex; flex-direction: column; gap: 10px; margin: 1.5rem 0; }
        .choice-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border: 1px solid #e5e0d5; border-radius: 8px;
          background: #fff; cursor: pointer; font-size: 15px; color: #444;
          transition: all 0.2s ease; text-align: left; width: 100%;
        }
        .choice-btn:hover { border-color: #9b8660; background: #faf8f5; }
        .choice-btn.selected { border-color: #9b8660; background: #fbf9f4; color: #5c4e35; font-weight: 500; box-shadow: inset 0 0 0 1px #9b8660; }
        .choice-icon { font-size: 18px; }

        .companion-warning {
          background: #fdfaf3; border-left: 2px solid #cbbfa0;
          padding: 10px 14px; font-size: 13px; color: #7a6a48; margin: 14px 0;
          line-height: 1.5; font-style: italic;
        }

        /* 3. Régimes alimentaires optimisés en 2 colonnes sans encadrement */
        .diet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 30px; margin: 20px 0; }
        .diet-option {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; font-size: 14px; color: #555;
          padding: 6px 0; transition: color 0.2s;
        }
        .diet-option:hover { color: #9b8660; }
        .diet-option input[type="checkbox"] {
          accent-color: #9b8660; width: 16px; height: 16px; cursor: pointer;
        }

        .transport-mode { display: flex; gap: 12px; margin-bottom: 1.5rem; }
        .mode-btn {
          flex: 1; padding: 12px 8px; border: 1px solid #e5e0d5;
          border-radius: 8px; background: #fff; cursor: pointer; text-align: center;
          font-size: 14px; color: #555; transition: all 0.2s;
        }
        .mode-btn:hover { border-color: #9b8660; background: #faf8f5; }
        .mode-btn.selected { border-color: #9b8660; background: #fbf9f4; font-weight: 500; color: #5c4e35; }
        .mode-btn .mode-icon { display: block; font-size: 20px; margin-bottom: 4px; }

        .form-actions { display: flex; gap: 12px; justify-content: center; margin-top: 2.5rem; }
        .btn-prev { background: none; border: 1px solid #ccc; color: #777; padding: 12px 24px; border-radius: 6px; cursor: pointer; }
        .btn-prev:hover { border-color: #9b8660; color: #5c4e35; }

        .contact-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .section-note { font-size: 13px; color: #888; text-align: center; margin: 1rem 0; font-style: italic; }

        .hebergement-card {
          background: #fcfbfa; border: 1px solid #eae5dc;
          border-radius: 8px; padding: 20px; margin-top: 1rem;
          text-align: center; line-height: 1.6;
        }
        .hidden { display: none !important; }
      </style>

      <div class="card form-steps-card">
        ${this.renderProgressBar()}
        <div id="rsvp-form">
          ${this.renderStep1()}
          ${this.renderStep2()}
          ${this.renderStep3()}
          ${this.renderStep4()}
        </div>
      </div>
    `;
  },

  renderProgressBar() {
    const labels = ['Réponse', 'Repas', 'Transport', 'Hébergement'];
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

  /* ─── Étape 1 : Coordonnées + Ma Réponse (Fusionnées) ─── */
  renderStep1() {
    const v = this.currentStep === 1;
    const att = this.guestData.attending;
    const brunch = this.guestData.brunch;

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-1">
        <h3 style="text-align:center; margin-bottom:1.5rem;">Vos coordonnées & Présence</h3>
        
        <div class="form-group">
          <label>Prénom *</label>
          <input type="text" id="guest-firstname" value="${this.esc(this.guestData.firstName)}" placeholder="Marie" required>
        </div>
        <div class="form-group">
          <label>Nom *</label>
          <input type="text" id="guest-lastname" value="${this.esc(this.guestData.lastName)}" placeholder="Dupont" required>
        </div>
        <div class="form-group">
          <label>Téléphone portable *</label>
          <input type="tel" id="guest-phone" value="${this.esc(this.guestData.phone)}" placeholder="06 00 00 00 00" required>
        </div>
        <p class="section-note" style="margin-bottom: 2rem;">Votre numéro nous permettra de vous ajouter à la boucle WhatsApp du mariage.</p>

        <div style="height:1px; background:#f5f2eb; margin: 2rem 0;"></div>

        <label style="font-weight:500; color:var(--forest);">Votre présence *</label>
        <div class="attendance-options">
          <button type="button" class="choice-btn ${att === true ? 'selected' : ''}" data-val="true">
            <span class="choice-icon">🎉</span>
            <div><strong>Je viens avec joie !</strong><div style="font-size:12px; color:#888;">Le 8 mai 2027 au Domaine de la Scie du May</div></div>
          </button>
          <button type="button" class="choice-btn ${att === 'maybe' ? 'selected' : ''}" data-val="maybe">
            <span class="choice-icon">🤔</span>
            <div><strong>Je viens peut-être</strong></div>
          </button>
          <button type="button" class="choice-btn ${att === false ? 'selected' : ''}" data-val="false">
            <span class="choice-icon">💌</span>
            <div><strong>Je ne peux pas venir</strong></div>
          </button>
        </div>

        <div id="companions-section" class="${att === true ? '' : 'hidden'}">
          <div class="companion-warning">
            Le nombre d'invités étant strictement limité, merci de ne pas ajouter quelqu'un que nous n'avons pas prévu !
          </div>
          <div class="form-group">
            <label>Nombre d'accompagnants (hors vous-même)</label>
            <select id="guest-companions-count">
              ${[0,1,2,3,4,5].map(n => `<option value="${n}" ${this.guestData.companions.length === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div id="companions-list">
            ${this.guestData.companions.map((comp, idx) => `
              <div class="form-group">
                <label>Nom de l'accompagnant ${idx + 1}</label>
                <input type="text" class="companion-name" data-index="${idx}" value="${this.esc(comp.name)}" placeholder="Prénom Nom">
              </div>
            `).join('')}
          </div>
        </div>

        <div id="brunch-section" class="${att === true || att === 'maybe' ? '' : 'hidden'}" style="margin-top: 2rem;">
          <div style="height:1px; background:#f5f2eb; margin-bottom:1.5rem;"></div>
          <h4>Brunch du lendemain</h4>
          <p style="font-size:14px; color:#666; margin-bottom:1rem;">
            Dimanche 9 mai, de 9h30 à 13h30 au Domaine de la Scie du May — pour finir la fête en douceur !
          </p>
          <div class="attendance-options" style="gap: 10px;">
            <button type="button" class="choice-btn ${brunch === true ? 'selected' : ''}" data-brunch="true">
              <span class="choice-icon">☕</span> Avec plaisir !
            </button>
            <button type="button" class="choice-btn ${brunch === false ? 'selected' : ''}" data-brunch="false">
              <span class="choice-icon">🙏</span> Non, merci !
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
  },

  /* ─── Étape 2 : Régimes alimentaires (2 Colonnes Opti) ─── */
  renderStep2() {
    const v = this.currentStep === 2;

    const renderBlock = (personLabel, personKey, currentDiet, currentAllergyDetails) => {
      const hasAllergy = currentDiet && currentDiet.includes('allergy');
      return `
        <div class="diet-block" style="margin-bottom: 1.5rem;">
          <p style="font-weight: 500; color: #444; margin-bottom: 4px;">${personLabel}</p>
          <div class="diet-grid">
            <div class="diet-col-left">
              <label class="diet-option">
                <input type="checkbox" class="diet-cb" data-person="${personKey}" value="vegetarian" ${currentDiet?.includes('vegetarian') ? 'checked' : ''}>
                <span>🥗 Végétarien</span>
              </label>
              <label class="diet-option" style="margin-top: 10px;">
                <input type="checkbox" class="diet-cb" data-person="${personKey}" value="vegan" ${currentDiet?.includes('vegan') ? 'checked' : ''}>
                <span>🌱 Végan</span>
              </label>
            </div>
            <div class="diet-col-right">
              <label class="diet-option">
                <input type="checkbox" class="diet-cb" data-person="${personKey}" value="no-alcohol" ${currentDiet?.includes('no-alcohol') ? 'checked' : ''}>
                <span>🧃 Sans alcool</span>
              </label>
              <label class="diet-option" style="margin-top: 10px;">
                <input type="checkbox" class="diet-cb" data-person="${personKey}" value="allergy" ${currentDiet?.includes('allergy') ? 'checked' : ''}>
                <span>⚠️ Allergie / Intolérance</span>
              </label>
            </div>
          </div>
          <div class="allergy-section ${hasAllergy ? '' : 'hidden'}" id="allergy-details-${personKey}" style="margin-top: 10px;">
            <input type="text" class="allergy-input" data-person="${personKey}" value="${this.esc(currentAllergyDetails || '')}" placeholder="Précisez l'allergie ou l'intolérance *">
          </div>
        </div>
      `;
    };

    let html = `
      <div class="form-step ${v ? 'active' : ''}" id="step-2">
        <h3 style="text-align:center; margin-bottom: 0.5rem;">Régimes alimentaires</h3>
        <p class="section-note">Indiquez vos contraintes afin que les traiteurs adaptent vos plats.</p>
        <div style="margin-top: 1.5rem;">
          ${renderBlock('Pour vous', 'main', this.guestData.diet, this.guestData.allergyDetails)}
        </div>
    `;

    this.guestData.companions.forEach((comp, idx) => {
      html += `<div style="height:1px; background:#f5f2eb; margin: 1.5rem 0;"></div>`;
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

  /* ─── Étape 3 : Transport & Covoiturage progressif ─── */
  renderStep3() {
    const v = this.currentStep === 3;
    const t = this.guestData.transport;
    const isCar = t.mode === 'car';
    const showOfferSection = isCar && t.carpoolRole === 'offer';
    const showNeedSection = !isCar && t.carpoolRole === 'need';

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-4">
        <h3 style="text-align:center; margin-bottom:1.5rem;">Transport & Covoiturage</h3>

        <div class="transport-mode" id="transport-mode">
          <button type="button" class="mode-btn ${t.mode === 'car' ? 'selected' : ''}" data-mode="car"><span class="mode-icon">🚗</span>En voiture</button>
          <button type="button" class="mode-btn ${t.mode === 'train' ? 'selected' : ''}" data-mode="train"><span class="mode-icon">🚆</span>En train</button>
          <button type="button" class="mode-btn ${t.mode === 'other' ? 'selected' : ''}" data-mode="other"><span class="mode-icon">✈️</span>Autre</button>
        </div>

        <div id="car-section" class="${isCar ? '' : 'hidden'}">
          <label style="font-weight:500; display:block; margin-top:1.5rem;">Covoiturage :</label>
          <div class="attendance-options" style="gap: 8px;">
            <button type="button" class="choice-btn ${t.carpoolRole === 'offer' ? 'selected' : ''}" data-role="offer"><span class="choice-icon">🙌</span> Je peux proposer des places pour un covoiturage</button>
            <button type="button" class="choice-btn ${t.carpoolRole === 'none' ? 'selected' : ''}" data-role="none"><span class="choice-icon">👍</span> Je n'ai pas de place supplémentaire</button>
          </div>

          <div id="offer-section" class="${showOfferSection ? '' : 'hidden'}" style="margin-top:1.5rem;">
            <div class="form-group"><label>Ville de départ</label><input type="text" id="t-driver-city" value="${this.esc(t.city)}" placeholder="Ex : Lyon"></div>
            <div class="contact-row">
              <div class="form-group">
                <label>Places disponibles</label>
                <select id="t-driver-seats">${[1,2,3,4,5,6,7].map(n => `<option value="${n}" ${t.seatsAvailable == n ? 'selected' : ''}>${n}</option>`).join('')}</select>
              </div>
              <div class="form-group"><label>Jour de départ</label><input type="date" id="t-driver-day" value="${this.esc(t.departureDay)}"></div>
            </div>
            <div class="form-group"><label>Heure de départ</label><input type="time" id="t-driver-time" value="${this.esc(t.departureTime)}"></div>
            <p style="font-size:13px; color:#5c4e35; margin: 15px 0 5px 0; font-weight:500;">Pour me contacter :</p>
            <div class="form-group"><label>Téléphone</label><input type="tel" id="t-driver-phone" value="${this.esc(t.contactPhone || this.guestData.phone)}"></div>
            <div class="form-group"><label>Email <small style="color:#aaa; font-weight:normal;">(optionnel)</small></label><input type="email" id="t-driver-email" value="${this.esc(t.contactEmail)}" placeholder="mail@exemple.fr"></div>
          </div>
        </div>

        <div id="other-section" class="${!isCar ? '' : 'hidden'}">
          <div class="attendance-options" style="gap: 8px;">
            <button type="button" class="choice-btn ${t.carpoolRole === 'need' ? 'selected' : ''}" data-need="need"><span class="choice-icon">🙋</span> J'ai besoin d'un covoiturage</button>
            <button type="button" class="choice-btn ${t.carpoolRole === 'none' ? 'selected' : ''}" data-need="none"><span class="choice-icon">👌</span> Je me débrouille</button>
          </div>

          <div id="need-section" class="${showNeedSection ? '' : 'hidden'}" style="margin-top:1.5rem;">
            <div class="form-group"><label>Ville de départ souhaitée</label><input type="text" id="t-pass-city" value="${this.esc(t.city)}" placeholder="Ex : Paris"></div>
            <div class="contact-row">
              <div class="form-group">
                <label>Places nécessaires</label>
                <select id="t-pass-seats">${[1,2,3,4,5].map(n => `<option value="${n}" ${t.seatsNeeded == n ? 'selected' : ''}>${n}</option>`).join('')}</select>
              </div>
              <div class="form-group"><label>Jour souhaité</label><input type="date" id="t-pass-day" value="${this.esc(t.departureDay)}"></div>
            </div>
            <p style="font-size:13px; color:#5c4e35; margin: 15px 0 5px 0; font-weight:500;">Pour me contacter :</p>
            <div class="form-group"><label>Téléphone</label><input type="tel" id="t-pass-phone" value="${this.esc(t.contactPhone || this.guestData.phone)}"></div>
            <div class="form-group"><label>Email <small style="color:#aaa; font-weight:normal;">(optionnel)</small></label><input type="email" id="t-pass-email" value="${this.esc(t.contactEmail)}" placeholder="mail@exemple.fr"></div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn btn-prev">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
  },

  /* ─── Étape 4 : Hébergement + Validation Finale ─── */
  renderStep4() {
    const v = this.currentStep === 4;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-5">
        <h3 style="text-align:center; margin-bottom: 1rem;">Hébergement</h3>
        <div class="hebergement-card">
          <p style="font-size: 24px; margin-bottom: 5px;">🏡</p>
          <p style="font-weight: 500; color: #5c4e35; margin-bottom: 8px;">Des hébergements disponibles à proximité !</p>
          <p style="font-size: 14px; color: #777; margin-bottom: 12px;">
            Une liste d'hébergements sélectionnés (hôtels, gîtes, chambres d'hôtes) situés à moins de 15 minutes en voiture du domaine est à votre disposition sur le site pour vous permettre de profiter pleinement de la fête.
          </p>
          <p style="font-size: 13px; color: #b8860b; font-weight: 500; margin-bottom: 15px;">⏳ Les places partent vite, nous vous encourageons à réserver au plus rapide !</p>
          <a href="#/hebergements" style="color:#9b8660; text-decoration:underline; font-size:14px; font-weight:500;">Consulter la liste complète des adresses →</a>
        </div>

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

    // Choix Présence Global
    this.container.querySelectorAll('[data-val]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.dataset.val;
        this.guestData.attending = val === 'true' ? true : val === 'false' ? false : 'maybe';
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Choix Brunch
    this.container.querySelectorAll('[data-brunch]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.guestData.brunch = e.currentTarget.dataset.brunch === 'true';
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Gestion Dynamique des Accompagnants
    const compSelect = this.container.querySelector('#guest-companions-count');
    if (compSelect) {
      compSelect.addEventListener('change', (e) => {
        const count = parseInt(e.target.value, 10);
        while (this.guestData.companions.length < count) {
          this.guestData.companions.push({ name: '', diet: [], allergyDetails: '' });
        }
        if (this.guestData.companions.length > count) {
          this.guestData.companions = this.guestData.companions.slice(0, count);
        }
        this.render();
      });
    }

    // Capture des cases cochées (Régimes Alimentaires)
    this.container.querySelectorAll('.diet-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const person = cb.dataset.person;
        const val = cb.value;
        let dietArr = person === 'main' ? this.guestData.diet : this.guestData.companions[parseInt(person, 10)].diet;
        
        if (!dietArr) dietArr = [];
        if (cb.checked) {
          if (!dietArr.includes(val)) dietArr.push(val);
        } else {
          const idx = dietArr.indexOf(val);
          if (idx > -1) dietArr.splice(idx, 1);
        }

        if (val === 'allergy') {
          const det = this.container.querySelector('#allergy-details-' + person);
          if (det) det.classList.toggle('hidden', !cb.checked);
        }
      });
    });

    // Choix Mode principal de Transport
    this.container.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.guestData.transport.mode = e.currentTarget.dataset.mode;
        this.guestData.transport.carpoolRole = 'none'; // reset sub-role
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Sous-choix Conducteur Voiture
    this.container.querySelectorAll('[data-role]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.guestData.transport.carpoolRole = e.currentTarget.dataset.role;
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Sous-choix Besoin Covoiturage Train / Autre
    this.container.querySelectorAll('[data-need]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.guestData.transport.carpoolRole = e.currentTarget.dataset.need;
        this.saveCurrentStepData();
        this.render();
      });
    });
  },

  /* ─── Extraction des données formulaires ───────── */
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

    if (this.currentStep === 2) {
      this.container.querySelectorAll('.allergy-input').forEach(input => {
        const p = input.dataset.person;
        if (p === 'main') this.guestData.allergyDetails = input.value.trim();
        else {
          const idx = parseInt(p, 10);
          if (this.guestData.companions[idx]) this.guestData.companions[idx].allergyDetails = input.value.trim();
        }
      });
    }

    if (this.currentStep === 3) {
      const t = this.guestData.transport;
      if (t.mode === 'car' && t.carpoolRole === 'offer') {
        t.city           = (document.getElementById('t-driver-city')?.value || '').trim();
        t.seatsAvailable = parseInt(document.getElementById('t-driver-seats')?.value || '1', 10);
        t.departureDay   = document.getElementById('t-driver-day')?.value || '';
        t.departureTime  = document.getElementById('t-driver-time')?.value || '';
        t.contactPhone   = (document.getElementById('t-driver-phone')?.value || '').trim();
        t.contactEmail   = (document.getElementById('t-driver-email')?.value || '').trim();
      } else if (t.carpoolRole === 'need') {
        t.city         = (document.getElementById('t-pass-city')?.value || '').trim();
        t.seatsNeeded  = parseInt(document.getElementById('t-pass-seats')?.value || '1', 10);
        t.departureDay = document.getElementById('t-pass-day')?.value || '';
        t.contactPhone = (document.getElementById('t-pass-phone')?.value || '').trim();
        t.contactEmail = (document.getElementById('t-pass-email')?.value || '').trim();
      }
    }
  },

  validateStep() {
    if (this.currentStep === 1) {
      if (!this.guestData.firstName || !this.guestData.lastName || !this.guestData.phone) {
        Animations.showToast("Veuillez remplir les champs obligatoires (*)", "error");
        return false;
      }
      if (this.guestData.attending === null) {
        Animations.showToast("Veuillez indiquer votre présence", "error");
        return false;
      }
      if (this.guestData.attending === true) {
        const allNamed = this.guestData.companions.every(c => c.name.trim());
        if (!allNamed) {
          Animations.showToast("Veuillez renseigner le nom complet de vos accompagnants", "error");
          return false;
        }
      }
      if ((this.guestData.attending === true || this.guestData.attending === 'maybe') && this.guestData.brunch === null) {
        Animations.showToast("Veuillez indiquer si vous participerez au brunch", "error");
        return false;
      }
    }
    return true;
  },

  handleNext() {
    this.saveCurrentStepData();
    if (!this.validateStep()) return;

    // Si déclin de l'invitation (false) -> Soumission directe, pas besoin du reste du formulaire !
    if (this.currentStep === 1 && this.guestData.attending === false) {
      this.submitForm();
      return;
    }

    // Récupération automatique si le numéro existe déjà
    if (this.currentStep === 1) {
      const existing = Store.getGuestByPhone(this.guestData.phone);
      if (existing && existing.id !== this.guestData.id) {
        this.guestData = { ...this.guestData, ...existing, transport: { ...this.guestData.transport, ...(existing.transport || {}) } };
        Animations.showToast("Ravi de vous revoir ! Votre profil a été chargé.", "success");
      }
    }

    // Sauter l'étape régimes si la personne a répondu "Peut-être" (on passe direct aux transports)
    if (this.currentStep === 1 && this.guestData.attending !== true) {
      this.currentStep = 3;
      this.render();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.render();
    } else {
      this.submitForm();
    }
  },

  handlePrev() {
    this.saveCurrentStepData();
    if (this.currentStep === 3 && this.guestData.attending !== true) {
      this.currentStep = 1;
      this.render();
      return;
    }
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

    // Synchronisation vers l'espace Covoiturage global du Store
    const t = savedGuest.transport;
    if (t && (t.carpoolRole === 'offer' || t.carpoolRole === 'need')) {
      const existing = Store.getCarpoolsByGuestId(savedGuest.id);
      existing.forEach(c => Store.deleteCarpool(c.id));

      Store.saveCarpool({
        guestId: savedGuest.id,
        type: t.carpoolRole === 'offer' ? 'offer' : 'request',
        city: t.city,
        seatsAvailable: t.seatsAvailable,
        seatsNeeded: t.seatsNeeded,
        departureDay: t.departureDay,
        departureTime: t.departureTime,
        contact: t.contactPhone || t.contactEmail || savedGuest.phone
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