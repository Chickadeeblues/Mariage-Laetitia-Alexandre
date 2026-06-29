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
        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 2rem; }
        .step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 500;
          border: 1.5px solid #cbbfa0;
          color: #cbbfa0; background: #fff;
          transition: all 0.2s;
          position: relative; z-index: 1;
          flex-shrink: 0;
        }
        .step-dot.active { background: #9b8660; border-color: #9b8660; color: #fff; }
        .step-dot.completed { background: #c8b89a; border-color: #c8b89a; color: #fff; }
        .step-connector { height: 1.5px; width: 36px; background: #e0d5c1; flex-shrink: 0; }
        .step-connector.completed { background: #c8b89a; }
        .step-label { font-size: 11px; color: #9b8660; text-align: center; margin-top: 5px; }

        .form-step { display: none; }
        .form-step.active { display: block; }

        .attendance-options { display: flex; flex-direction: column; gap: 10px; margin: 1.5rem 0; }
        .choice-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border: 1.5px solid #ddd; border-radius: 10px;
          background: #fff; cursor: pointer; font-size: 15px; color: #444;
          transition: all 0.18s; text-align: left; width: 100%;
        }
        .choice-btn:hover { border-color: #9b8660; background: #fdfaf5; }
        .choice-btn.selected { border-color: #9b8660; background: #fdfaf5; color: #5c4e35; font-weight: 500; }
        .choice-btn .choice-icon { font-size: 20px; flex-shrink: 0; }

        .companion-warning {
          background: #fdf8ee; border-left: 3px solid #d4aa5a;
          border-radius: 6px; padding: 10px 14px;
          font-size: 13px; color: #7a6135; margin: 14px 0;
          line-height: 1.5;
        }

        .diet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .diet-option {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border: 1.5px solid #e5e0d5;
          border-radius: 8px; cursor: pointer; font-size: 14px;
          transition: all 0.15s; background: #fff;
        }
        .diet-option:hover { border-color: #9b8660; }
        .diet-option.selected { border-color: #9b8660; background: #fdfaf5; }
        .diet-option input { display: none; }

        .transport-mode { display: flex; gap: 10px; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .mode-btn {
          flex: 1; min-width: 90px; padding: 12px 8px; border: 1.5px solid #ddd;
          border-radius: 10px; background: #fff; cursor: pointer; text-align: center;
          font-size: 14px; color: #555; transition: all 0.18s;
        }
        .mode-btn:hover { border-color: #9b8660; }
        .mode-btn.selected { border-color: #9b8660; background: #fdfaf5; font-weight: 500; color: #5c4e35; }
        .mode-btn .mode-icon { font-size: 22px; display: block; margin-bottom: 5px; }

        .carpool-sub { margin-top: 1rem; }
        .hidden { display: none !important; }

        .form-actions { display: flex; gap: 12px; justify-content: center; margin-top: 2rem; }
        .btn-prev { background: none; border: 1.5px solid #ccc; color: #777; }
        .btn-prev:hover { border-color: #9b8660; color: #5c4e35; }

        .contact-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 480px) { .contact-row { grid-template-columns: 1fr; } }

        .section-note {
          font-size: 13px; color: #888; font-style: italic;
          text-align: center; margin: 1rem 0;
          line-height: 1.6;
        }

        .hebergement-card {
          background: #fdfaf5; border: 1.5px solid #e0d5c1;
          border-radius: 10px; padding: 18px 20px; margin-top: 1rem;
          text-align: center; line-height: 1.7;
        }
        .hebergement-card a { color: #9b8660; font-weight: 500; }

        .allergy-section { margin-top: 8px; }
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

  /* ─── Barre de progression ─────────────────────── */
  renderProgressBar() {
    const labels = ['Identité', 'Ma réponse', 'Repas', 'Transport', 'Hébergement'];
    let html = '<div style="margin-bottom: 0.5rem;">';
    html += '<div class="step-indicator">';
    for (let i = 1; i <= this.totalSteps; i++) {
      let cls = 'step-dot';
      if (i === this.currentStep) cls += ' active';
      else if (i < this.currentStep) cls += ' completed';
      const icon = i < this.currentStep ? '✓' : i;
      html += `<div class="${cls}" title="${labels[i-1]}">${icon}</div>`;
      if (i < this.totalSteps) {
        const connCls = i < this.currentStep ? 'step-connector completed' : 'step-connector';
        html += `<div class="${connCls}"></div>`;
      }
    }
    html += '</div>';
    html += `<div class="step-label">${labels[this.currentStep - 1]}</div>`;
    html += '</div><div style="margin: 1.5rem 0; height: 1px; background: #f0ebe0;"></div>';
    return html;
  },

  /* ─── Étape 1 : Identité ─────────────────────── */
  renderStep1() {
    const v = this.currentStep === 1;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-1">
        <h3 style="text-align:center; margin-bottom:1.5rem;">Vos coordonnées</h3>
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
        <p class="section-note">Votre numéro nous permettra de vous ajouter à la boucle WhatsApp du mariage.</p>
        <div class="form-actions">
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
  },

  /* ─── Étape 2 : Ma réponse + Brunch ─────────── */
  renderStep2() {
    const v = this.currentStep === 2;
    const att = this.guestData.attending;
    const brunch = this.guestData.brunch;
    const showCompanions = att === true;
    const showBrunch = att === true || att === 'maybe';

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-2">
        <h3 style="text-align:center; margin-bottom:1.5rem;">Ma réponse</h3>

        <div class="attendance-options" id="attendance-options">
          <button type="button" class="choice-btn ${att === true ? 'selected' : ''}" data-val="true" id="att-yes">
            <span class="choice-icon">🎉</span>
            <div>
              <div>Je viens avec joie !</div>
              <div style="font-size:12px; color:#999; font-weight:normal;">Le 8 mai 2027 au Domaine de la Scie du May</div>
            </div>
          </button>
          <button type="button" class="choice-btn ${att === 'maybe' ? 'selected' : ''}" data-val="maybe" id="att-maybe">
            <span class="choice-icon">🤔</span>
            <div>Je viens peut-être</div>
          </button>
          <button type="button" class="choice-btn ${att === false ? 'selected' : ''}" data-val="false" id="att-no">
            <span class="choice-icon">💌</span>
            <div>
              <div>Je ne peux pas venir</div>
              <div style="font-size:12px; color:#999; font-weight:normal;">Merci pour votre réponse</div>
            </div>
          </button>
        </div>

        <!-- Accompagnants (si oui) -->
        <div id="companions-section" class="${showCompanions ? '' : 'hidden'}">
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

        <!-- Brunch du lendemain -->
        <div id="brunch-section" class="${showBrunch ? '' : 'hidden'}" style="margin-top: 1.5rem;">
          <div style="height:1px; background:#f0ebe0; margin-bottom:1.5rem;"></div>
          <h4 style="margin-bottom: 0.5rem;">Brunch du lendemain</h4>
          <p style="font-size:14px; color:#777; margin-bottom:1rem;">
            Dimanche 9 mai, de 9h30 à 13h30 au Domaine de la Scie du May — pour finir la fête en douceur !
          </p>
          <div class="attendance-options" style="gap: 8px;">
            <button type="button" class="choice-btn ${brunch === true ? 'selected' : ''}" data-brunch="true">
              <span class="choice-icon">☕</span> Avec plaisir !
            </button>
            <button type="button" class="choice-btn ${brunch === false ? 'selected' : ''}" data-brunch="false">
              <span class="choice-icon">🙏</span> Non, merci !
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn btn-prev">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>
    `;
  },

  /* ─── Étape 3 : Régimes alimentaires ────────── */
  renderStep3() {
    const v = this.currentStep === 3;
    const diets = [
      { val: 'vegetarian', label: 'Végétarien', icon: '🥗' },
      { val: 'vegan',      label: 'Végan',      icon: '🌱' },
      { val: 'no-alcohol', label: 'Sans alcool', icon: '🧃' },
      { val: 'allergy',    label: 'Allergie',    icon: '⚠️' }
    ];

    const renderBlock = (personLabel, personKey, currentDiet, currentAllergyDetails) => {
      const hasAllergy = currentDiet && currentDiet.includes('allergy');
      return `
        <div class="diet-block" style="margin-bottom: 1.2rem;">
          <p style="font-size:14px; color:#666; margin-bottom:8px;">${personLabel}</p>
          <div class="diet-grid">
            ${diets.map(d => {
              const checked = currentDiet && currentDiet.includes(d.val);
              return `
                <label class="diet-option ${checked ? 'selected' : ''}">
                  <input type="checkbox" class="diet-cb" data-person="${personKey}" value="${d.val}" ${checked ? 'checked' : ''}>
                  <span>${d.icon}</span> ${d.label}
                </label>
              `;
            }).join('')}
          </div>
          <div class="allergy-section ${hasAllergy ? '' : 'hidden'}" id="allergy-details-${personKey}">
            <input type="text" class="allergy-input" data-person="${personKey}"
              value="${this.esc(currentAllergyDetails || '')}" placeholder="Précisez l'allergie ou l'intolénce">
          </div>
        </div>
      `;
    };

    let html = `
      <div class="form-step ${v ? 'active' : ''}" id="step-3">
        <h3 style="text-align:center; margin-bottom: 0.5rem;">Régimes alimentaires</h3>
        <p class="section-note">Indiquez vos contraintes alimentaires pour que nos traiteurs puissent préparer le meilleur repas.</p>
        ${renderBlock('Pour vous', 'main', this.guestData.diet, this.guestData.allergyDetails)}
    `;

    this.guestData.companions.forEach((comp, idx) => {
      html += renderBlock(
        `Pour ${comp.name || 'Accompagnant ' + (idx + 1)}`,
        String(idx),
        comp.diet,
        comp.allergyDetails
      );
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

  /* ─── Étape 4 : Transport ────────────────────── */
  renderStep4() {
    const v = this.currentStep === 4;
    const t = this.guestData.transport;
    const isCar = t.mode === 'car';
    const showCarpoolSub = isCar && t.carpoolRole === 'offer';
    const showNeedSub = !isCar || t.carpoolRole === 'need';
    const showNeedSection = (t.mode === 'train' || t.mode === 'other') && t.carpoolRole !== 'none';

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-4">
        <h3 style="text-align:center; margin-bottom:1.5rem;">Transport & Covoiturage</h3>

        <!-- Mode de transport -->
        <div class="transport-mode" id="transport-mode">
          <button type="button" class="mode-btn ${t.mode === 'car' ? 'selected' : ''}" data-mode="car">
            <span class="mode-icon">🚗</span> En voiture
          </button>
          <button type="button" class="mode-btn ${t.mode === 'train' ? 'selected' : ''}" data-mode="train">
            <span class="mode-icon">🚆</span> En train
          </button>
          <button type="button" class="mode-btn ${t.mode === 'other' ? 'selected' : ''}" data-mode="other">
            <span class="mode-icon">✈️</span> Autre
          </button>
        </div>

        <!-- Si voiture -->
        <div id="car-section" class="${isCar ? '' : 'hidden'}">
          <div class="attendance-options" style="gap: 8px;" id="carpool-role">
            <button type="button" class="choice-btn ${t.carpoolRole === 'offer' ? 'selected' : ''}" data-role="offer">
              <span class="choice-icon">🙌</span> Je peux proposer des places pour un covoiturage
            </button>
            <button type="button" class="choice-btn ${t.carpoolRole === 'none' ? 'selected' : ''}" data-role="none">
              <span class="choice-icon">👍</span> Je n'ai pas de place supplémentaire
            </button>
          </div>

          <!-- Offre de covoiturage -->
          <div id="offer-section" class="${showCarpoolSub ? '' : 'hidden'}">
            <div class="form-group">
              <label>Ville de départ</label>
              <input type="text" id="t-driver-city" value="${this.esc(t.city)}" placeholder="Ex : Lyon">
            </div>
            <div class="contact-row">
              <div class="form-group">
                <label>Places disponibles</label>
                <select id="t-driver-seats">
                  ${[1,2,3,4,5,6,7].map(n => `<option value="${n}" ${t.seatsAvailable == n ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Jour de départ</label>
                <input type="date" id="t-driver-day" value="${this.esc(t.departureDay)}">
              </div>
            </div>
            <div class="form-group">
              <label>Heure de départ</label>
              <input type="time" id="t-driver-time" value="${this.esc(t.departureTime)}">
            </div>
            <p style="font-size:13px; color:#888; margin-bottom:8px;">Pour me contacter :</p>
            <div class="contact-row">
              <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" id="t-driver-phone" value="${this.esc(t.contactPhone || this.guestData.phone)}">
              </div>
              <div class="form-group">
                <label>Email <small style="font-weight:normal; color:#aaa;">(optionnel)</small></label>
                <input type="email" id="t-driver-email" value="${this.esc(t.contactEmail || '')}" placeholder="mail@exemple.fr">
              </div>
            </div>
          </div>
        </div>

        <!-- Si train ou autre → proposition de besoin de covoiturage -->
        <div id="other-section" class="${!isCar ? '' : 'hidden'}">
          <div class="attendance-options" style="gap: 8px;" id="need-role">
            <button type="button" class="choice-btn ${t.carpoolRole === 'need' ? 'selected' : ''}" data-need="need">
              <span class="choice-icon">🙋</span> J'ai besoin d'un covoiturage
            </button>
            <button type="button" class="choice-btn ${t.carpoolRole === 'none' ? 'selected' : ''}" data-need="none">
              <span class="choice-icon">👌</span> Je me débrouille
            </button>
          </div>

          <!-- Demande de covoiturage -->
          <div id="need-section" class="${t.carpoolRole === 'need' ? '' : 'hidden'}">
            <div class="form-group">
              <label>Ville de départ souhaitée</label>
              <input type="text" id="t-pass-city" value="${this.esc(t.city)}" placeholder="Ex : Paris">
            </div>
            <div class="contact-row">
              <div class="form-group">
                <label>Places nécessaires</label>
                <select id="t-pass-seats">
                  ${[1,2,3,4,5].map(n => `<option value="${n}" ${t.seatsNeeded == n ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Jour souhaité</label>
                <input type="date" id="t-pass-day" value="${this.esc(t.departureDay)}">
              </div>
            </div>
            <p style="font-size:13px; color:#888; margin-bottom:8px;">Pour me contacter :</p>
            <div class="contact-row">
              <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" id="t-pass-phone" value="${this.esc(t.contactPhone || this.guestData.phone)}">
              </div>
              <div class="form-group">
                <label>Email <small style="font-weight:normal; color:#aaa;">(optionnel)</small></label>
                <input type="email" id="t-pass-email" value="${this.esc(t.contactEmail || '')}" placeholder="mail@exemple.fr">
              </div>
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

  /* ─── Étape 5 : Hébergement ──────────────────── */
  renderStep5() {
    const v = this.currentStep === 5;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-5">
        <h3 style="text-align:center; margin-bottom: 0.5rem;">Hébergement</h3>
        <div class="hebergement-card">
          <p style="font-size: 22px; margin-bottom: 8px;">🏡</p>
          <p style="font-weight: 500; color: #5c4e35; margin-bottom: 8px;">
            Des hébergements pour tous les goûts à moins de 15 min en voiture !
          </p>
          <p style="font-size: 14px; color: #888; margin-bottom: 14px;">
            Gîtes, chambres d'hôtes, hôtels et camping — nous avons sélectionné les meilleures adresses à proximité du domaine pour que vous profitiez de la soirée sans vous soucier du retour.
          </p>
          <p style="font-size: 13px; color: #c0945a; font-weight: 500;">
            ⏳ Les hébergements se remplissent vite — réservez dès que possible !
          </p>
          <p style="margin-top: 12px;">
            <a href="#/hebergements" style="color: #9b8660; font-weight: 500; text-decoration: underline;">
              Voir la liste complète des hébergements →
            </a>
          </p>
        </div>

        <div class="form-actions" style="margin-top: 2rem;">
          <button type="button" class="btn btn--secondary prev-btn btn-prev">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn" id="final-submit-btn"
            style="font-size: 16px; padding: 14px 28px; letter-spacing: 0.03em;">
            Confirmer ma réponse ✓
          </button>
        </div>
      </div>
    `;
  },

  /* ─── Événements ─────────────────────────────── */
  attachEvents() {
    // Boutons Suivant / Précédent
    this.container.querySelectorAll('.next-btn').forEach(btn =>
      btn.addEventListener('click', () => this.handleNext())
    );
    this.container.querySelectorAll('.prev-btn').forEach(btn =>
      btn.addEventListener('click', () => this.handlePrev())
    );

    // Choix présence
    this.container.querySelectorAll('[data-val]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.dataset.val;
        this.guestData.attending = val === 'true' ? true : val === 'false' ? false : 'maybe';
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Choix brunch
    this.container.querySelectorAll('[data-brunch]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.guestData.brunch = e.currentTarget.dataset.brunch === 'true';
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Nombre d'accompagnants
    const compSelect = this.container.querySelector('#guest-companions-count');
    if (compSelect) {
      compSelect.addEventListener('change', (e) => {
        const count = parseInt(e.target.value, 10);
        while (this.guestData.companions.length < count)
          this.guestData.companions.push({ name: '', diet: [], allergyDetails: '' });
        if (this.guestData.companions.length > count)
          this.guestData.companions = this.guestData.companions.slice(0, count);
        this.render();
      });
    }

    // Régimes alimentaires (toggle visuel + état)
    this.container.querySelectorAll('.diet-option').forEach(label => {
      label.addEventListener('click', () => {
        const cb = label.querySelector('input[type="checkbox"]');
        cb.checked = !cb.checked;
        label.classList.toggle('selected', cb.checked);
        const person = cb.dataset.person;
        const val = cb.value;
        let dietArr = person === 'main'
          ? this.guestData.diet
          : this.guestData.companions[parseInt(person, 10)].diet;
        if (!dietArr) dietArr = [];
        if (cb.checked && !dietArr.includes(val)) dietArr.push(val);
        if (!cb.checked) dietArr.splice(dietArr.indexOf(val), 1);

        if (val === 'allergy') {
          const det = this.container.querySelector('#allergy-details-' + person);
          if (det) det.classList.toggle('hidden', !cb.checked);
        }
      });
    });

    // Mode de transport
    this.container.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.guestData.transport.mode = e.currentTarget.dataset.mode;
        this.guestData.transport.carpoolRole = 'none';
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Rôle covoiturage (conducteur)
    this.container.querySelectorAll('[data-role]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.guestData.transport.carpoolRole = e.currentTarget.dataset.role;
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Rôle covoiturage (passager)
    this.container.querySelectorAll('[data-need]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.guestData.transport.carpoolRole = e.currentTarget.dataset.need;
        this.saveCurrentStepData();
        this.render();
      });
    });
  },

  /* ─── Sauvegarde des données de l'étape ──────── */
  saveCurrentStepData() {
    if (this.currentStep === 1) {
      this.guestData.firstName = (document.getElementById('guest-firstname')?.value || '').trim();
      this.guestData.lastName  = (document.getElementById('guest-lastname')?.value || '').trim();
      this.guestData.phone     = (document.getElementById('guest-phone')?.value || '').trim();
    }

    if (this.currentStep === 2) {
      this.container.querySelectorAll('.companion-name').forEach(input => {
        const idx = parseInt(input.dataset.index, 10);
        if (this.guestData.companions[idx])
          this.guestData.companions[idx].name = input.value.trim();
      });
    }

    if (this.currentStep === 3) {
      this.container.querySelectorAll('.allergy-input').forEach(input => {
        const p = input.dataset.person;
        if (p === 'main') this.guestData.allergyDetails = input.value.trim();
        else {
          const idx = parseInt(p, 10);
          if (this.guestData.companions[idx])
            this.guestData.companions[idx].allergyDetails = input.value.trim();
        }
      });
    }

    if (this.currentStep === 4) {
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

  /* ─── Validation ─────────────────────────────── */
  validateStep() {
    if (this.currentStep === 1) {
      if (!this.guestData.firstName || !this.guestData.lastName || !this.guestData.phone) {
        Animations.showToast("Veuillez remplir les champs obligatoires (*)", "error");
        return false;
      }
    }
    if (this.currentStep === 2) {
      if (this.guestData.attending === null) {
        Animations.showToast("Veuillez indiquer votre présence", "error");
        return false;
      }
      if (this.guestData.attending === true) {
        const allNamed = this.guestData.companions.every(c => c.name.trim());
        if (!allNamed) {
          Animations.showToast("Veuillez indiquer le nom de vos accompagnants", "error");
          return false;
        }
      }
    }
    return true;
  },

  /* ─── Navigation ─────────────────────────────── */
  handleNext() {
    this.saveCurrentStepData();
    if (!this.validateStep()) return;

    // Si déclin → on saute directement à la soumission
    if (this.currentStep === 2 && this.guestData.attending === false) {
      this.submitForm();
      return;
    }

    // Pré-remplissage si invité déjà connu
    if (this.currentStep === 1) {
      const existing = Store.getGuestByPhone(this.guestData.phone);
      if (existing && existing.id !== this.guestData.id) {
        this.guestData = {
          ...this.guestData,
          ...existing,
          transport: { ...this.guestData.transport, ...(existing.transport || {}) }
        };
        Animations.showToast("Nous avons retrouvé votre profil !", "success");
      }
    }

    // Sauter l'étape régimes si absent ou peut-être
    if (this.currentStep === 2 && this.guestData.attending !== true) {
      this.currentStep = 4;
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
    // Sauter l'étape régimes en retour si absent ou peut-être
    if (this.currentStep === 4 && this.guestData.attending !== true) {
      this.currentStep = 2;
      this.render();
      return;
    }
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
    }
  },

  /* ─── Soumission ─────────────────────────────── */
  submitForm() {
    let savedGuest;
    if (this.guestData.id) {
      savedGuest = Store.updateGuest(this.guestData.id, this.guestData);
    } else {
      savedGuest = Store.saveGuest(this.guestData);
    }

    Store.setCurrentGuest(savedGuest.id);

    // Covoiturage
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

    Animations.showToast("Merci pour votre réponse !", "success");
    this.currentStep = 1;
    Router.navigate('#/mes-reponses');
  },

  /* ─── Utilitaire anti-XSS ───────────────────── */
  esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};

export default RSVP;