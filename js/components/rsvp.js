import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const tr = (fr, es) => (window.I18n && window.I18n.currentLang === 'es') ? es : fr;

const RSVP = {
  container: null,
  currentStep: 1,
  totalSteps: 6,
  guestData: {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    attending: null,
    hasCompanions: false,
    companionCount: 0,
    companions: [],
    brunch: null,
    diet: [],
    allergyDetails: '',
    allergyList: [],
    allergyOther: '',
    dessert: { participate: null, type: '', portions: '', fridge: null },
    accommodationStatus: '',
    accommodationId: null,
    accommodationName: '',
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
        const parseAllergy = (str) => {
          if (!str) return { list: [], other: '' };
          const list = [];
          let other = str;
          if (other.includes('[Gluten]')) { list.push('gluten'); other = other.replace('[Gluten]', ''); }
          if (other.includes('[Lactose]')) { list.push('lactose'); other = other.replace('[Lactose]', ''); }
          if (other.includes('[Fruits à coque]')) { list.push('nuts'); other = other.replace('[Fruits à coque]', ''); }
          if (other.includes('[Fruits de mer]')) { list.push('seafood'); other = other.replace('[Fruits de mer]', ''); }
          other = other.replace(/^- /, '').trim();
          if (other) list.push('other');
          return { list, other };
        };
        
        const mainA = parseAllergy(currentGuest.allergyDetails);
        const comps = (currentGuest.companions || []).map(c => {
          const ca = parseAllergy(c.allergyDetails);
          return { ...c, allergyList: ca.list, allergyOther: ca.other };
        });

        this.guestData = {
          ...this.guestData,
          ...currentGuest,
          hasCompanions: (currentGuest.companions && currentGuest.companions.length > 0) ? true : false,
          allergyList: mainA.list,
          allergyOther: mainA.other,
          companions: comps,
          dessert: currentGuest.dessert || { participate: null, type: '', portions: '', fridge: null },
          transport: { ...this.guestData.transport, ...(currentGuest.transport || {}) }
        };
      }
      this.render();
      
      window.addEventListener('language-changed', () => {
        if (window.location.hash === '#/rsvp') {
          this.saveCurrentStepData();
          this.render();
        }
      });
    } catch (error) {
      console.error('[RSVP] Erreur init :', error);
    }
  },

  render() {
    if (!this.container) return;
    try {
      this.container.innerHTML = this.getHTML();
      this.attachEvents();
      Animations.fadeIn(this.container);
      this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error('[RSVP] Erreur rendu :', error);
      this.container.innerHTML = `<div style="padding:20px;text-align:center;color:red;">
        Une erreur est survenue. Veuillez rafraîchir la page.</div>`;
    }
  },

  getHTML() {
    return `
      <style>
        .step-indicator { display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:1.5rem; }
        .step-dot { width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:1.5px solid #cbbfa0;color:#cbbfa0;background:#fff;flex-shrink:0;transition:all .2s; }
        .step-dot.active { background:#9b8660;border-color:#9b8660;color:#fff; }
        .step-dot.completed { background:#c8b89a;border-color:#c8b89a;color:#fff; }
        .step-connector { height:1.5px;width:28px;background:#e0d5c1;flex-shrink:0; }
        .step-connector.completed { background:#c8b89a; }
        .step-label { font-size:18px;color:#4a4a4a;text-align:center;margin-bottom:16px; }
        .form-step { display:none; }
        .form-step.active { display:block; }
        .compact-input { width:100%;padding:12px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;font-size:14px; }
        .form-actions { display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;margin-top:2rem; }
        .attendance-options { display:flex;flex-direction:column;gap:8px;margin:.5rem 0; }
        .choice-btn { display:flex;align-items:center;gap:12px;padding:14px 18px;border:1.5px solid #e5e0d5;border-radius:8px;background:#fff;cursor:pointer;font-size:15px;text-align:left;width:100%;transition:all .15s; }
        .choice-btn:hover { border-color:#9b8660;background:#fdfaf5; }
        .choice-btn.selected { border-color:#9b8660;background:#fdfaf5;font-weight:500; }
        .link-btn { background:none;border:none;color:#9b8660;font-size:13px;text-decoration:underline;cursor:pointer;padding:4px 0;margin-bottom:10px; }
        .link-btn:hover { color:#7a6a4f; }

        /* Accompagnants (étape 1) */
        .companion-toggle { display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:#4a4a4a;cursor:pointer; }
        .companion-toggle input { width:17px;height:17px;accent-color: var(--sage, #7fa876); }
        .companion-card { background:#fdfaf5;border:1.5px solid #e7dcc4;border-radius:10px;padding:14px;margin-bottom:10px; }
        .companion-card-title { margin:0 0 8px;font-size:13px;font-weight:600;color: var(--forest, #2D5A3D); }
        .companion-card .compact-input { margin-bottom:8px; }
        .companion-card .compact-input:last-child { margin-bottom:0; }

        /* Régimes alimentaires : pastilles "bubbly" champêtre (vert sauge / doré / blanc) */
        .diet-pills { display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 18px; }
        .diet-pill {
          display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:999px;
          border:2px solid var(--sage, #a9c6a0);background:#fff;font-size:14px;color:var(--forest, #2D5A3D);
          cursor:pointer;transition:all .18s ease;user-select:none;
        }
        .diet-pill input { display:none; }
        .diet-pill:hover { border-color:var(--gold, #9b8660);transform:translateY(-1px); }
        .diet-pill:has(input:checked) {
          background:var(--sage, #a9c6a0);border-color:var(--sage, #a9c6a0);color:#fff;font-weight:600;
          box-shadow:0 3px 8px rgba(127,168,118,.35);
        }
        .allergy-sub { background:#faf8f5;padding:12px;border-radius:8px;margin-top:8px;border:1px dashed #e0d5c1; }
        .info-note {
          background:#fdfaf5;border:1.5px solid var(--sage, #d8e6d2);border-radius:12px;
          padding:14px 16px;margin-bottom:18px;font-size:13px;color:#5c6b52;line-height:1.6;
          display:flex;align-items:flex-start;gap:10px;
        }
        .info-note .icon { font-size:18px;flex-shrink:0; }

        .transport-mode { display:flex;gap:10px;margin-bottom:1.5rem; }
        .mode-btn { flex:1;padding:10px 5px;border:1.5px solid #e5e0d5;border-radius:8px;background:#fff;cursor:pointer;text-align:center;font-size:13px;transition:all .15s; }
        .mode-btn.selected { border-color:#9b8660;background:#fdfaf5;font-weight:500; }
        .hidden { display:none !important; }

        /* Récapitulatif (étape 5) */
        .recap-section { background:#fff;border:1.5px solid #f0ebe0;border-radius:10px;padding:16px 18px;margin-bottom:14px; }
        .recap-section h4 { margin:0 0 10px;font-size:14px;color:var(--forest, #2D5A3D);display:flex;align-items:center;gap:8px; }
        .recap-row { display:flex;justify-content:space-between;gap:10px;font-size:14px;color:#444;padding:5px 0;border-bottom:1px solid #f5f2eb; }
        .recap-row:last-child { border-bottom:none; }
        .recap-row span:first-child { color:#888; }
        .recap-empty { font-size:13px;color:#aaa;font-style:italic; }
      </style>

      <div class="card form-steps-card" style="padding:20px;overflow-x:hidden;">
        ${this.renderProgressBar()}
        <div id="rsvp-form">
          ${this.renderStep1()}
          ${this.renderStep2()}
          ${this.renderStep3()}
          ${this.renderStep4()}
          ${this.renderStep5()}
          ${this.renderStep6()}
        </div>
      </div>`;
  },

  renderProgressBar() {
    const labels = [
      tr('Réponse', 'Respuesta'), 
      tr('Régime alimentaire & Allergies', 'Régimen y Alergias'), 
      tr('Brunch', 'Brunch'), 
      tr('Buffet gourmand', 'Bufé goloso'),
      tr('Transport', 'Transporte'), 
      tr('Récapitulatif', 'Resumen')
    ];
    let html = '<div class="step-indicator">';
    for (let i = 1; i <= this.totalSteps; i++) {
      let cls = 'step-dot';
      if (i === this.currentStep) cls += ' active';
      else if (i < this.currentStep) cls += ' completed';
      html += `<div class="${cls}">${i < this.currentStep ? '✓' : i}</div>`;
      if (i < this.totalSteps) {
        html += `<div class="step-connector${i < this.currentStep ? ' completed' : ''}"></div>`;
      }
    }
    html += '</div>';
    html += `<div class="step-label">${labels[this.currentStep - 1]}</div>`;
    html += '<div style="height:1px;background:#f0ebe0;margin-bottom:1.2rem;"></div>';
    return html;
  },

  esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  companionLabel(c, i) {
    const full = `${c?.firstName || ''} ${c?.lastName || ''}`.trim();
    return full || tr('Accompagnant ' + (i + 1), 'Acompañante ' + (i + 1));
  },

  renderStep1() {
    const v = this.currentStep === 1;
    const att = this.guestData.attending;
    const hasCompanions = this.guestData.hasCompanions;
    const companions = this.guestData.companions || [];

    const attendanceBlock = `
      <div class="attendance-options">
        <button type="button" class="choice-btn ${att === true ? 'selected' : ''}" data-val="true">  <span>🎉</span> <strong>${tr('Je viens avec joie !', '¡Asistiré con gusto!')}</strong></button>
        <button type="button" class="choice-btn ${att === 'maybe' ? 'selected' : ''}" data-val="maybe"><span>🤔</span> <strong>${tr('Je viens peut-être', 'Tal vez asista')}</strong></button>
        <button type="button" class="choice-btn ${att === false ? 'selected' : ''}" data-val="false"><span>💌</span> <strong>${tr('Je ne peux pas venir', 'No podré asistir')}</strong></button>
      </div>`;

    const declineMessage = att === false ? `
      <div style="margin-top: 15px; margin-bottom: 15px; padding: 15px; background: #fdfaf5; border: 1.5px solid #e7dcc4; border-radius: 8px; text-align: center; color: var(--forest);">
        <strong>${tr('Nous en sommes tristes, mais merci pour ta réponse !', 'Estamos tristes, pero ¡gracias por tu respuesta!')}</strong>
      </div>` : '';

    const companionBlock = (att === true || att === 'maybe') ? `
      <div id="companions-section" style="margin-top:16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 10px;">
          <label style="font-size:16px; color:var(--text-dark); font-weight:600; margin:0;">
            ${tr('Je viens accompagné(e) :', 'Vengo acompañado/a:')}
          </label>
          <div class="attendance-options" style="display: flex; gap: 8px; flex-direction: row; margin:0;">
            <button type="button" class="choice-btn ${hasCompanions === true ? 'selected' : ''}" data-has-companions="true" style="padding: 8px 20px; width: auto; min-width: 60px; text-align:center; justify-content:center;"><strong>${tr('Oui', 'Sí')}</strong></button>
            <button type="button" class="choice-btn ${hasCompanions === false ? 'selected' : ''}" data-has-companions="false" style="padding: 8px 20px; width: auto; min-width: 60px; text-align:center; justify-content:center;"><strong>${tr('Non', 'No')}</strong></button>
          </div>
        </div>

        <div id="companion-count-block" class="${hasCompanions === true ? '' : 'hidden'}" style="margin-top:16px;">
          <div id="companions-list">
            ${companions.map((c, idx) => `
              <div class="companion-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <p class="companion-card-title" style="margin: 0;">${tr('Accompagnant', 'Acompañante')} ${idx + 1}</p>
                  ${idx > 0 ? `<button type="button" class="link-btn remove-companion-btn" data-index="${idx}" style="margin: 0; color: var(--sage, #7fa876); font-weight: 500; font-size: 14px; text-decoration: none;">✕ ${tr('Retirer', 'Quitar')}</button>` : ''}
                </div>
                <input type="text" class="compact-input companion-firstname" data-index="${idx}" value="${this.esc(c.firstName)}" placeholder="${tr('Prénom *', 'Nombre *')}">
                <input type="text" class="compact-input companion-lastname"  data-index="${idx}" value="${this.esc(c.lastName)}"  placeholder="${tr('Nom *', 'Apellido *')}">
                <input type="tel"  class="compact-input companion-phone"     data-index="${idx}" value="${this.esc(c.phone)}"     placeholder="${tr('Téléphone (optionnel)', 'Teléfono (opcional)')}">
              </div>`).join('')}
          </div>
          <div style="text-align: center; margin-top: 10px;">
            <button type="button" class="btn btn--secondary" id="add-companion-btn" style="padding: 8px 16px; font-size: 14px;">+ ${tr('Ajouter une personne', 'Añadir una persona')}</button>
          </div>
        </div>
      </div>` : '';

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-1">
        <input type="text" id="guest-firstname" class="compact-input" value="${this.esc(this.guestData.firstName)}" placeholder="${tr('Prénom *', 'Nombre *')}" required>
        <input type="text" id="guest-lastname"  class="compact-input" value="${this.esc(this.guestData.lastName)}"  placeholder="${tr('Nom *', 'Apellido *')}" required>
        <input type="tel"  id="guest-phone"     class="compact-input" value="${this.esc(this.guestData.phone)}"     placeholder="${tr('Téléphone portable *', 'Teléfono móvil *')}" required>

        ${attendanceBlock}
        ${declineMessage}
        ${companionBlock}

        <div class="form-actions" style="justify-content: flex-end;">
          <button type="button" class="btn btn--primary next-btn" style="min-width: 140px;">${att === false ? tr('Confirmer ma réponse ✓', 'Confirmar mi respuesta ✓') : tr('Suivant', 'Siguiente')}</button>
        </div>
      </div>`;
  },

  renderStep2() {
    const v = this.currentStep === 2;
    const companions = this.guestData.companions || [];

    const renderBlock = (label, key, diet, allergyList, allergyOther) => {
      const d = diet || [];
      const al = allergyList || [];
      const hasAllergy = d.includes('allergy');
      const hasOther = al.includes('other');
      
      return `
        <div style="margin-bottom:1.8rem;">
          <p style="font-weight:500;border-bottom:1px solid #f5f2eb;padding-bottom:4px;text-align:center;">${label}</p>
          <div class="diet-pills" style="justify-content: center;">
            <label class="diet-pill"><input type="checkbox" class="diet-cb" data-person="${key}" value="vegetarian" ${d.includes('vegetarian')?'checked':''}><span>🥗 ${tr('Végétarien', 'Vegetariano')}</span></label>
            <label class="diet-pill"><input type="checkbox" class="diet-cb" data-person="${key}" value="vegan"       ${d.includes('vegan')      ?'checked':''}><span>🌱 ${tr('Végan', 'Vegano')}</span></label>
            <label class="diet-pill"><input type="checkbox" class="diet-cb" data-person="${key}" value="no-alcohol"  ${d.includes('no-alcohol') ?'checked':''}><span>🧃 ${tr('Sans alcool', 'Sin alcohol')}</span></label>
            <label class="diet-pill"><input type="checkbox" class="diet-cb" data-person="${key}" value="allergy"     ${hasAllergy               ?'checked':''}><span>⚠️ ${tr('Allergie / Intolérance', 'Alergia / Intolerancia')}</span></label>
          </div>
          
          <div class="allergy-sub ${hasAllergy?'':'hidden'}" id="allergy-details-${key}">
            <p style="text-align: center; margin-bottom: 10px; font-size: 13px; font-weight: 500; color: #5c4e35;">${tr('Précisez :', 'Especifique:')}</p>
            <div class="diet-pills" style="justify-content: center; margin-top: 0; margin-bottom: 10px;">
              <label class="diet-pill"><input type="checkbox" class="allergy-type-cb" data-person="${key}" value="gluten" ${al.includes('gluten')?'checked':''}><span>🌾 Gluten</span></label>
              <label class="diet-pill"><input type="checkbox" class="allergy-type-cb" data-person="${key}" value="lactose" ${al.includes('lactose')?'checked':''}><span>🥛 Lactose</span></label>
              <label class="diet-pill"><input type="checkbox" class="allergy-type-cb" data-person="${key}" value="nuts" ${al.includes('nuts')?'checked':''}><span>🥜 Fruits à coque</span></label>
              <label class="diet-pill"><input type="checkbox" class="allergy-type-cb" data-person="${key}" value="seafood" ${al.includes('seafood')?'checked':''}><span>🦐 Fruits de mer</span></label>
              <label class="diet-pill"><input type="checkbox" class="allergy-type-cb" data-person="${key}" value="other" ${hasOther?'checked':''}><span>Autre</span></label>
            </div>
            <div class="allergy-other-sub ${hasOther?'':'hidden'}" id="allergy-other-${key}">
              <input type="text" class="compact-input allergy-free-text" data-person="${key}" value="${this.esc(allergyOther)}" placeholder="${tr('Précisez (ex : fraises, soja…)', 'Especifique (ej: fresas, soja…)')}" style="margin-bottom:0;">
            </div>
          </div>
        </div>`;
    };

    let html = `<div class="form-step ${v?'active':''}" id="step-2">`;
    html += renderBlock(tr('Pour moi', 'Para mí'), 'main', this.guestData.diet, this.guestData.allergyList, this.guestData.allergyOther);
    companions.forEach((c, i) => html += renderBlock(tr(`Pour ${this.companionLabel(c, i)}`, `Para ${this.companionLabel(c, i)}`), String(i), c.diet, c.allergyList, c.allergyOther));
    html += `<div class="form-actions" style="justify-content: center; gap: 20px;">
      <button type="button" class="btn btn--secondary prev-btn" style="min-width: 140px;">${tr('Précédent', 'Anterior')}</button>
      <button type="button" class="btn btn--primary next-btn" style="min-width: 140px;">${tr('Suivant', 'Siguiente')}</button>
    </div></div>`;
    return html;
  },

  renderStep3() {
    const v = this.currentStep === 3;
    const b = this.guestData.brunch;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-3">
        <p style="text-align:center;font-size:16px;font-weight:500;color:var(--text-dark);line-height:1.6;margin-bottom:2rem;">
          ${tr('Pour faire durer le plaisir, nous vous convions à un brunch le <strong>dimanche 9 mai</strong>, de 9h30 à 13h30 au Domaine de la Scie du May.', 'Para prolongar el placer, os invitamos a un brunch el <strong>domingo 9 de mayo</strong>, de 9:30 a 13:30 en la Finca de la Scie du May.')}
        </p>
        <div class="attendance-options">
          <button type="button" class="choice-btn ${b === true  ? 'selected' : ''}" data-brunch="true"> <span>☕</span> <strong>${tr('Oui, avec plaisir !', '¡Sí, con gusto!')}</strong></button>
          <button type="button" class="choice-btn ${b === false ? 'selected' : ''}" data-brunch="false"><span>🙏</span> <strong>${tr('Non, merci !', '¡No, gracias!')}</strong></button>
        </div>
        <div class="form-actions" style="justify-content: center; gap: 20px; margin-top: 2.5rem;">
          <button type="button" class="btn btn--secondary prev-btn" style="min-width: 140px;">${tr('Précédent', 'Anterior')}</button>
          <button type="button" class="btn btn--primary next-btn" style="min-width: 140px;">${tr('Suivant', 'Siguiente')}</button>
        </div>
      </div>`;
  },

  renderStep4() {
    const v = this.currentStep === 4;
    const d = this.guestData.dessert;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-4">
        <p style="text-align:center;font-size:16px;font-weight:500;color:var(--text-dark);line-height:1.6;margin-bottom:2rem;">
          ${tr('Pour le dessert, nous vous proposons, si vous le souhaitez et le pouvez bien sûr, de participer à créer une farandole de gourmandise, en apportant votre meilleur dessert !', 'Para el postre, les proponemos, si lo desean y pueden por supuesto, participar en crear un festín de golosinas, ¡trayendo su mejor postre!')}
        </p>
        <div class="attendance-options">
          <button type="button" class="choice-btn ${d.participate === true ? 'selected' : ''}" data-dessert="true"> <span>🍰</span> <strong>${tr('Oui, je suis partant(e)', 'Sí, me apunto')}</strong></button>
          <button type="button" class="choice-btn ${d.participate === false ? 'selected' : ''}" data-dessert="false"><span>🙏</span> <strong>${tr('Non, difficile pour moi', 'No, es difícil para mí')}</strong></button>
        </div>
        
        <div id="dessert-details" class="${d.participate === true ? '' : 'hidden'}" style="margin-top: 20px; background: #fdfaf5; border: 1.5px solid #e7dcc4; border-radius: 10px; padding: 16px;">
          <label style="display:block; font-size:13px; font-weight:500; color:var(--text-dark); margin-bottom:6px;">
            ${tr('Type de dessert *', 'Tipo de postre *')}
          </label>
          <input type="text" id="d-type" class="compact-input" value="${this.esc(d.type)}" placeholder="${tr('Ex : Tarte au citron, Tiramisu...', 'Ej : Tarta de limón, Tiramisú...')}">
          
          <label style="display:block; font-size:13px; font-weight:500; color:var(--text-dark); margin-bottom:6px; margin-top:12px;">
            ${tr('Nombre de parts (environ) *', 'Número de porciones (aprox.) *')}
          </label>
          <input type="number" id="d-portions" class="compact-input" value="${this.esc(d.portions)}" placeholder="${tr('Ex : 8', 'Ej : 8')}">
          
          <label style="display:block; font-size:13px; font-weight:500; color:var(--text-dark); margin-bottom:8px; margin-top:12px;">
            ${tr('Besoin de le stocker au frais ?', '¿Necesita guardarse en frío?')}
          </label>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <label style="font-size:14px; display:flex; align-items:center; gap:6px;">
              <input type="radio" name="d-fridge" value="yes" ${d.fridge === 'yes' ? 'checked' : ''}> ${tr('Oui', 'Sí')}
            </label>
            <label style="font-size:14px; display:flex; align-items:center; gap:6px;">
              <input type="radio" name="d-fridge" value="no" ${d.fridge === 'no' ? 'checked' : ''}> ${tr('Non', 'No')}
            </label>
            <label style="font-size:14px; display:flex; align-items:center; gap:6px;">
              <input type="radio" name="d-fridge" value="maybe" ${d.fridge === 'maybe' ? 'checked' : ''}> ${tr('Surprise, je répondrai plus tard', 'Sorpresa, responderé más tarde')}
            </label>
          </div>
        </div>

        <div class="form-actions" style="justify-content: center; gap: 20px; margin-top: 2.5rem;">
          <button type="button" class="btn btn--secondary prev-btn" style="min-width: 140px;">${tr('Précédent', 'Anterior')}</button>
          <button type="button" class="btn btn--primary next-btn" style="min-width: 140px;">${tr('Suivant', 'Siguiente')}</button>
        </div>
      </div>`;
  },

  renderStep5() {
    const v = this.currentStep === 5;
    const tData = this.guestData.transport || {};
    const isCar = tData.mode === 'car';
    const n = tData.passengerNeeds || [];
    return `
      <div class="form-step ${v?'active':''}" id="step-4">

        <div style="margin-bottom:18px;border-bottom:1px solid #e5e0d5;padding-bottom:14px;">
          <label style="font-size:14px;font-weight:500;display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="t-arrive-before" ${tData.arrivalBeforeDDay?'checked':''}>
            ${tr('Arriver dans la région avant le jour J', 'Llegar a la región antes del gran día')}
          </label>
          <div id="arrive-before-fields" class="${tData.arrivalBeforeDDay?'':'hidden'}" style="margin-top:10px;">
            <input type="text" id="t-arr-from"  class="compact-input" placeholder="${tr('Lieu de départ', 'Lugar de salida')}"  value="${this.esc(tData.arrivalFrom)}">
            <input type="text" id="t-arr-to"    class="compact-input" placeholder="${tr('Lieu d\'arrivée', 'Lugar de llegada')}"  value="${this.esc(tData.arrivalTo)}">
            <input type="date" id="t-arr-date"  class="compact-input" value="${this.esc(tData.arrivalDate)}">
          </div>
        </div>

        <div class="transport-mode">
          <button type="button" class="mode-btn ${tData.mode==='car'   ?'selected':''}" data-mode="car">  <span style="display:block;font-size:20px;">🚗</span>${tr('En voiture', 'En coche')}</button>
          <button type="button" class="mode-btn ${tData.mode==='train' ?'selected':''}" data-mode="train"><span style="display:block;font-size:20px;">🚆</span>${tr('En train', 'En tren')}</button>
          <button type="button" class="mode-btn ${tData.mode==='other' ?'selected':''}" data-mode="other"><span style="display:block;font-size:20px;">✈️</span>${tr('Autre', 'Otro')}</button>
        </div>

        <div id="car-section" class="${isCar?'':'hidden'}">
          <div class="attendance-options">
            <button type="button" class="choice-btn ${tData.carpoolRole==='offer'?'selected':''}" data-role="offer">🙌 ${tr('Je peux proposer des places', 'Puedo ofrecer plazas')}</button>
            <button type="button" class="choice-btn ${tData.carpoolRole==='none' ?'selected':''}" data-role="none"> 👍 ${tr('Je n\'ai pas de place supplémentaire', 'No tengo plazas adicionales')}</button>
          </div>
          <div id="offer-section" class="${tData.carpoolRole==='offer'?'':'hidden'}" style="margin-top:10px;">
            <input type="text" id="t-driver-city"  class="compact-input" value="${this.esc(tData.city)}" placeholder="${tr('Ville de départ (ex: Lyon)', 'Ciudad de salida (ej: Madrid)')}">
            <select id="t-driver-seats" class="compact-input">
              ${[1,2,3,4,5,6].map(num=>`<option value="${num}" ${tData.seatsAvailable==num?'selected':''}>${num} ${tr('place'+(num>1?'s':''), 'plaza'+(num>1?'s':''))}</option>`).join('')}
            </select>
            <input type="date" id="t-driver-day"  class="compact-input" value="${this.esc(tData.departureDay)}">
            <input type="time" id="t-driver-time" class="compact-input" value="${this.esc(tData.departureTime)}">
            <input type="tel"  id="t-driver-phone" class="compact-input" value="${this.esc(tData.contactPhone||this.guestData.phone)}" placeholder="${tr('Téléphone de contact', 'Teléfono de contacto')}">
            <input type="email" id="t-driver-email" class="compact-input" value="${this.esc(tData.contactEmail)}" placeholder="${tr('Email (optionnel)', 'Email (opcional)')}">
          </div>
        </div>

        <div id="other-section" class="${!isCar?'':'hidden'}">
          <div class="attendance-options">
            <button type="button" class="choice-btn ${tData.carpoolRole==='need'?'selected':''}" data-need="need">🙋 ${tr('J\'ai besoin d\'un covoiturage', 'Necesito transporte')}</button>
            <button type="button" class="choice-btn ${tData.carpoolRole==='none'?'selected':''}" data-need="none">👌 ${tr('Je me débrouille', 'Me organizo solo')}</button>
          </div>
          <div id="need-section" class="${tData.carpoolRole==='need'?'':'hidden'}" style="margin-top:14px;">
            <label style="font-weight:500;margin-bottom:8px;display:block;">${tr('Pour quel(s) trajet(s) ?', '¿Para qué trayecto(s)?')}</label>
            <label style="display:block;margin-bottom:6px;font-size:14px;"><input type="checkbox" class="p-need-cb" value="church" ${n.includes('church')?'checked':''}> ${tr('Aller à l\'église de Malleval', 'Ir a la iglesia de Malleval')}</label>
            <div class="${n.includes('church')?'':'hidden'}" id="church-options" style="margin-left:20px;margin-bottom:8px;">
              <label style="display:block;font-size:13px;margin-bottom:4px;"><input type="radio" name="churchArrival" value="ter" ${tData.churchArrival==='ter'?'checked':''}> ${tr('Depuis la gare TER Le Péage-de-Roussillon', 'Desde la estación Le Péage-de-Roussillon')}</label>
              <input type="time" id="t-church-time" class="compact-input ${tData.churchArrival==='ter'?'':'hidden'}" value="${this.esc(tData.churchTime)}" placeholder="${tr('Heure d\'arrivée prévue', 'Hora prevista de llegada')}">
              <label style="display:block;font-size:13px;margin-bottom:4px;"><input type="radio" name="churchArrival" value="far" ${tData.churchArrival==='far'?'checked':''}> ${tr('Depuis un autre lieu', 'Desde otro lugar')}</label>
              <div id="church-far-options" class="${tData.churchArrival==='far'?'':'hidden'}">
                <input type="text" id="t-pass-city" class="compact-input" value="${this.esc(tData.city)}" placeholder="${tr('Ville de départ *', 'Ciudad de salida *')}">
                <input type="date" id="t-pass-day"  class="compact-input" value="${this.esc(tData.departureDay)}">
              </div>
            </div>
            <label style="display:block;margin-bottom:6px;font-size:14px;"><input type="checkbox" class="p-need-cb" value="church-venue" ${n.includes('church-venue')?'checked':''}> ${tr('De l\'église à la Scie du May', 'De la iglesia a la Scie du May')}</label>
            <label style="display:block;margin-bottom:6px;font-size:14px;"><input type="checkbox" class="p-need-cb" value="night" ${n.includes('night')?'checked':''}> ${tr('Aller à mon lieu de couchage le soir', 'Ir a mi alojamiento por la noche')}</label>
            <div id="night-fields" class="${n.includes('night')?'':'hidden'}" style="margin-left:20px;">
              <input type="text"   id="night-name"     class="compact-input" value="${this.esc(tData.nightName)}"     placeholder="${tr('Nom du lieu *', 'Nombre del lugar *')}">
              <input type="text"   id="night-address"  class="compact-input" value="${this.esc(tData.nightAddress)}"  placeholder="${tr('Adresse *', 'Dirección *')}">
              <input type="text"   id="night-city"     class="compact-input" value="${this.esc(tData.nightCity)}"     placeholder="${tr('Ville *', 'Ciudad *')}">
              <input type="text"   id="night-zip"      class="compact-input" value="${this.esc(tData.nightZip)}"      placeholder="${tr('Code postal *', 'Código postal *')}">
              <input type="number" id="night-distance" class="compact-input" value="${this.esc(tData.nightDistance)}" placeholder="${tr('Distance depuis réception (min) *', 'Distancia desde la recepción (min) *')}">
            </div>
            <label style="display:block;margin-bottom:10px;font-size:14px;"><input type="checkbox" class="p-need-cb" value="brunch" ${n.includes('brunch')?'checked':''}> ${tr('Venir au brunch le dimanche', 'Asistir al brunch el domingo')}</label>
            <select id="t-pass-seats" class="compact-input">
              ${[1,2,3,4,5].map(num=>`<option value="${num}" ${tData.seatsNeeded==num?'selected':''}>${num} ${tr('place'+(num>1?'s':'')+' nécessaire'+(num>1?'s':''), 'plaza'+(num>1?'s':'')+' necesaria'+(num>1?'s':''))}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-actions" style="justify-content: center; gap: 20px; margin-top: 2rem;">
          <button type="button" class="btn btn--secondary prev-btn" style="min-width: 140px;">${tr('Précédent', 'Anterior')}</button>
          <button type="button" class="btn btn--primary next-btn" style="min-width: 140px;">${tr('Suivant', 'Siguiente')}</button>
        </div>
      </div>`;
  },

  renderStep6() {
    const v = this.currentStep === 6;
    const g = this.guestData;
    const t = g.transport || {};

    const dietLabel = code => ({
      vegetarian: tr('Végétarien', 'Vegetariano'),
      vegan: tr('Végan', 'Vegano'),
      'no-alcohol': tr('Sans alcool', 'Sin alcohol'),
      allergy: tr('Allergie/Intolérance', 'Alergia/Intolerancia')
    }[code] || code);

    const dietSummary = (diet, allergyDetails) => {
      const d = diet || [];
      if (!d.length) return tr('Aucune restriction', 'Sin restricciones');
      let s = d.map(dietLabel).join(', ');
      if (d.includes('allergy') && allergyDetails) s += ` — ${this.esc(allergyDetails)}`;
      return s;
    };

    const attLabel = g.attending === true ? tr('Je viens avec joie !', '¡Asistiré con gusto!')
      : g.attending === 'maybe' ? tr('Je viens peut-être', 'Tal vez asista')
      : tr('Je ne peux pas venir', 'No podré asistir');

    let transportSummary = tr('Non renseigné', 'No especificado');
    if (t.mode === 'car') {
      transportSummary = t.carpoolRole === 'offer'
        ? tr(`Je propose ${t.seatsAvailable || 1} place(s) depuis ${t.city || '—'}`, `Ofrezco ${t.seatsAvailable || 1} plaza(s) desde ${t.city || '—'}`)
        : tr('En voiture — pas de place supplémentaire', 'En coche — sin plazas adicionales');
    } else if (t.mode) {
      transportSummary = t.carpoolRole === 'need'
        ? tr('Covoiturage demandé', 'Transporte compartido solicitado')
        : tr('Je me débrouille par mes propres moyens', 'Me organizo por mi cuenta');
    }

    const companionsHtml = (g.companions || []).length
      ? (g.companions || []).map((c, i) => `
          <div class="recap-row"><span>${this.esc(this.companionLabel(c, i))}</span><span>${c.phone ? '📞 ' + this.esc(c.phone) : '—'}</span></div>
        `).join('')
      : `<p class="recap-empty">${tr('Aucun accompagnant', 'Sin acompañantes')}</p>`;

    const dietHtml = `
      <div class="recap-row"><span>${tr('Vous', 'Usted')}</span><span>${dietSummary(g.diet, g.allergyDetails)}</span></div>
      ${(g.companions || []).map((c, i) => `<div class="recap-row"><span>${this.esc(this.companionLabel(c, i))}</span><span>${dietSummary(c.diet, c.allergyDetails)}</span></div>`).join('')}
    `;

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-5">
        <p style="text-align:center;font-size:14px;color:#666;margin-bottom:1.2rem;">
          ${tr('Vérifiez que tout est correct avant de confirmer votre réponse.', 'Compruebe que todo sea correcto antes de confirmar su respuesta.')}
        </p>

        <div class="recap-section">
          <h4>👤 ${tr('Vos informations', 'Sus datos')}</h4>
          <div class="recap-row"><span>${tr('Nom', 'Nombre')}</span><span>${this.esc(g.firstName)} ${this.esc(g.lastName)}</span></div>
          <div class="recap-row"><span>${tr('Téléphone', 'Teléfono')}</span><span>${this.esc(g.phone)}</span></div>
          <div class="recap-row"><span>${tr('Présence', 'Asistencia')}</span><span>${attLabel}</span></div>
        </div>

        ${g.attending === true ? `
        <div class="recap-section">
          <h4>👥 ${tr('Accompagnants', 'Acompañantes')}</h4>
          ${companionsHtml}
        </div>` : ''}

        ${(g.attending === true || g.attending === 'maybe') ? `
        <div class="recap-section">
          <h4>🍽️ ${tr('Régime alimentaire', 'Régimen alimentario')}</h4>
          ${dietHtml}
        </div>` : ''}

        ${(g.attending === true || g.attending === 'maybe') ? `
        <div class="recap-section">
          <h4>☕ ${tr('Brunch du dimanche', 'Brunch del domingo')}</h4>
          <div class="recap-row"><span>${tr('Réponse', 'Respuesta')}</span><span>${g.brunch === true ? tr('Oui, avec plaisir !', '¡Sí, con gusto!') : g.brunch === false ? tr('Non, merci', 'No, gracias') : '—'}</span></div>
        </div>
        
        <div class="recap-section">
          <h4>🍰 ${tr('Buffet gourmand', 'Bufé goloso')}</h4>
          <div class="recap-row"><span>${tr('Réponse', 'Respuesta')}</span><span>${g.dessert?.participate === true ? tr('Oui, je participe', 'Sí, participo') : g.dessert?.participate === false ? tr('Non, difficile pour moi', 'No, es difícil') : '—'}</span></div>
          ${g.dessert?.participate === true ? `
            <div class="recap-row"><span>${tr('Dessert', 'Postre')}</span><span>${this.esc(g.dessert.type) || '—'} (${this.esc(g.dessert.portions) || '?'} parts)</span></div>
            <div class="recap-row"><span>${tr('Au frais', 'En frío')}</span><span>${g.dessert.fridge === 'yes' ? tr('Oui', 'Sí') : g.dessert.fridge === 'no' ? tr('Non', 'No') : tr('Surprise', 'Sorpresa')}</span></div>
          ` : ''}
        </div>` : ''}

        ${g.attending === true ? `
        <div class="recap-section">
          <h4>🚗 ${tr('Transport', 'Transporte')}</h4>
          <div class="recap-row"><span>${tr('Résumé', 'Resumen')}</span><span>${transportSummary}</span></div>
        </div>` : ''}

        <p style="font-size:13px;color:#777;text-align:center;font-style:italic;margin-top:14px;">
          ${tr('Besoin d\'un hébergement ?', '¿Necesita alojamiento?')}
          <a href="#/hebergements" style="color:#9b8660;">${tr('Voir la liste des hébergements →', 'Ver la lista de alojamientos →')}</a>
        </p>

        <div class="form-actions" style="justify-content: center; gap: 20px; margin-top: 1.5rem;">
          <button type="button" class="btn btn--secondary prev-btn" style="min-width: 140px;">${tr('Précédent', 'Anterior')}</button>
          <button type="button" class="btn btn--primary next-btn" id="final-submit-btn" style="min-width: 140px;">${tr('Confirmer ✓', 'Confirmar ✓')}</button>
        </div>
      </div>`;
  },

  attachEvents() {
    this.container.querySelectorAll('.next-btn').forEach(btn => btn.addEventListener('click', () => this.handleNext()));
    this.container.querySelectorAll('.prev-btn').forEach(btn => btn.addEventListener('click', () => this.handlePrev()));

    // Présence / brunch
    this.container.querySelectorAll('[data-val],[data-brunch]').forEach(btn => {
      btn.addEventListener('click', e => {
        const d = e.currentTarget.dataset;
        if (d.val)   this.guestData.attending = d.val==='true' ? true : d.val==='false' ? false : 'maybe';
        if (d.brunch) this.guestData.brunch   = d.brunch === 'true';
        this.saveCurrentStepData();
        this.render();
      });
    });

    // 1° Boutons "Je viens accompagné(e) : Oui / Non"
    this.container.querySelectorAll('[data-has-companions]').forEach(btn => {
      btn.addEventListener('click', e => {
        const val = e.currentTarget.dataset.hasCompanions === 'true';
        this.guestData.hasCompanions = val;
        if (!val) {
          this.guestData.companions = [];
        } else if (this.guestData.companions.length === 0) {
          // Si 0 accompagnant, on en ajoute un par défaut
          this.guestData.companions.push({ firstName:'', lastName:'', phone:'', diet:[], allergyDetails:'' });
        }
        this.saveCurrentStepData();
        this.render();
      });
    });

    // 1° Ajouter un accompagnant
    const addCompanionBtn = this.container.querySelector('#add-companion-btn');
    if (addCompanionBtn) {
      addCompanionBtn.addEventListener('click', () => {
        this.saveCurrentStepData();
        this.guestData.companions.push({ firstName:'', lastName:'', phone:'', diet:[], allergyDetails:'' });
        this.render();
      });
    }

    // 1° Retirer un accompagnant
    this.container.querySelectorAll('.remove-companion-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.saveCurrentStepData();
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        this.guestData.companions.splice(idx, 1);
        if (this.guestData.companions.length === 0) {
           this.guestData.hasCompanions = false;
        }
        this.render();
      });
    });

    // Régimes : révèle le champ libre allergie/intolérance
    this.container.querySelectorAll('.diet-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const sub = this.container.querySelector(`#allergy-details-${cb.dataset.person}`);
        if (cb.value === 'allergy' && sub) sub.classList.toggle('hidden', !cb.checked);
      });
    });

    // Sous-allergies : révèle le champ "Autre"
    this.container.querySelectorAll('.allergy-type-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const sub = this.container.querySelector(`#allergy-other-${cb.dataset.person}`);
        if (cb.value === 'other' && sub) sub.classList.toggle('hidden', !cb.checked);
      });
    });

    // Dessert
    this.container.querySelectorAll('[data-dessert]').forEach(btn => {
      btn.addEventListener('click', e => {
        const val = e.currentTarget.dataset.dessert === 'true';
        this.guestData.dessert = this.guestData.dessert || { type: '', portions: '', fridge: null };
        this.guestData.dessert.participate = val;
        this.container.querySelectorAll('[data-dessert]').forEach(b => b.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        const details = this.container.querySelector('#dessert-details');
        if (details) details.classList.toggle('hidden', !val);
      });
    });

    // Transport
    this.container.querySelectorAll('[data-mode],[data-role],[data-need]').forEach(btn => {
      btn.addEventListener('click', e => {
        const d = e.currentTarget.dataset;
        if (d.mode) { this.guestData.transport.mode = d.mode; this.guestData.transport.carpoolRole = 'none'; }
        if (d.role || d.need) this.guestData.transport.carpoolRole = d.role || d.need;
        this.saveCurrentStepData();
        this.render();
      });
    });

    const arrCb = this.container.querySelector('#t-arrive-before');
    if (arrCb) arrCb.addEventListener('change', e => {
      this.container.querySelector('#arrive-before-fields')?.classList.toggle('hidden', !e.target.checked);
    });

    this.container.querySelectorAll('.p-need-cb').forEach(cb => {
      cb.addEventListener('change', e => {
        if (e.target.value === 'church') this.container.querySelector('#church-options')?.classList.toggle('hidden', !e.target.checked);
        if (e.target.value === 'night')  this.container.querySelector('#night-fields')?.classList.toggle('hidden', !e.target.checked);
      });
    });

    this.container.querySelectorAll('input[name="churchArrival"]').forEach(r => {
      r.addEventListener('change', e => {
        this.container.querySelector('#t-church-time')?.classList.toggle('hidden', e.target.value !== 'ter');
        this.container.querySelector('#church-far-options')?.classList.toggle('hidden', e.target.value !== 'far');
      });
    });

  },

  saveCurrentStepData() {
    if (this.currentStep === 1) {
      this.guestData.firstName = (document.getElementById('guest-firstname')?.value || '').trim();
      this.guestData.lastName  = (document.getElementById('guest-lastname')?.value  || '').trim();
      this.guestData.phone     = (document.getElementById('guest-phone')?.value     || '').trim();

      if (!this.guestData.hasCompanions) {
        this.guestData.companions = [];
      } else {
        this.container.querySelectorAll('.companion-firstname').forEach(inp => {
          if (this.guestData.companions[inp.dataset.index]) this.guestData.companions[inp.dataset.index].firstName = inp.value.trim();
        });
        this.container.querySelectorAll('.companion-lastname').forEach(inp => {
          if (this.guestData.companions[inp.dataset.index]) this.guestData.companions[inp.dataset.index].lastName = inp.value.trim();
        });
        this.container.querySelectorAll('.companion-phone').forEach(inp => {
          if (this.guestData.companions[inp.dataset.index]) this.guestData.companions[inp.dataset.index].phone = inp.value.trim();
        });
      }
    }
    if (this.currentStep === 2) {
      const proc = key => {
        const diets = Array.from(this.container.querySelectorAll(`.diet-cb[data-person="${key}"]:checked`)).map(c => c.value);
        let details = '';
        const allergyList = [];
        let allergyOther = '';
        if (diets.includes('allergy')) {
          Array.from(this.container.querySelectorAll(`.allergy-type-cb[data-person="${key}"]:checked`)).forEach(c => {
             allergyList.push(c.value);
             if (c.value === 'gluten') details += '[Gluten] ';
             if (c.value === 'lactose') details += '[Lactose] ';
             if (c.value === 'nuts') details += '[Fruits à coque] ';
             if (c.value === 'seafood') details += '[Fruits de mer] ';
          });
          if (allergyList.includes('other')) {
             allergyOther = (this.container.querySelector(`.allergy-free-text[data-person="${key}"]`)?.value.trim() || '');
             if (allergyOther) details += '- ' + allergyOther;
          }
        }
        return { diet: diets, details: details.trim(), allergyList, allergyOther };
      };
      const main = proc('main');
      this.guestData.diet = main.diet;
      this.guestData.allergyDetails = main.details;
      this.guestData.allergyList = main.allergyList;
      this.guestData.allergyOther = main.allergyOther;
      this.guestData.companions.forEach((c, i) => {
        const r = proc(String(i)); 
        c.diet = r.diet; 
        c.allergyDetails = r.details;
        c.allergyList = r.allergyList;
        c.allergyOther = r.allergyOther;
      });
    }
    if (this.currentStep === 4) {
      if (this.guestData.dessert && this.guestData.dessert.participate === true) {
        this.guestData.dessert.type = (document.getElementById('d-type')?.value || '').trim();
        this.guestData.dessert.portions = (document.getElementById('d-portions')?.value || '').trim();
        this.guestData.dessert.fridge = this.container.querySelector('input[name="d-fridge"]:checked')?.value || null;
      } else if (this.guestData.dessert && this.guestData.dessert.participate === false) {
        this.guestData.dessert.type = '';
        this.guestData.dessert.portions = '';
        this.guestData.dessert.fridge = null;
      }
    }
    if (this.currentStep === 5) {
      const t = this.guestData.transport;
      t.arrivalBeforeDDay = document.getElementById('t-arrive-before')?.checked || false;
      if (t.arrivalBeforeDDay) {
        t.arrivalFrom = (document.getElementById('t-arr-from')?.value || '').trim();
        t.arrivalTo   = (document.getElementById('t-arr-to')?.value   || '').trim();
        t.arrivalDate = document.getElementById('t-arr-date')?.value  || '';
      }
      if (t.mode === 'car' && t.carpoolRole === 'offer') {
        t.city           = (document.getElementById('t-driver-city')?.value  || '').trim();
        t.seatsAvailable = parseInt(document.getElementById('t-driver-seats')?.value || '1', 10);
        t.departureDay   = document.getElementById('t-driver-day')?.value   || '';
        t.departureTime  = document.getElementById('t-driver-time')?.value  || '';
        t.contactPhone   = (document.getElementById('t-driver-phone')?.value || '').trim();
        t.contactEmail   = (document.getElementById('t-driver-email')?.value || '').trim();
      } else if (t.carpoolRole === 'need') {
        t.passengerNeeds = Array.from(this.container.querySelectorAll('.p-need-cb:checked')).map(c => c.value);
        t.churchArrival  = this.container.querySelector('input[name="churchArrival"]:checked')?.value || '';
        t.seatsNeeded    = parseInt(document.getElementById('t-pass-seats')?.value || '1', 10);
        if (t.churchArrival === 'ter') t.churchTime = document.getElementById('t-church-time')?.value || '';
        if (t.churchArrival === 'far') {
          t.city         = (document.getElementById('t-pass-city')?.value || '').trim();
          t.departureDay = document.getElementById('t-pass-day')?.value   || '';
        }
        if (t.passengerNeeds.includes('night')) {
          t.nightName     = (document.getElementById('night-name')?.value     || '').trim();
          t.nightAddress  = (document.getElementById('night-address')?.value  || '').trim();
          t.nightCity     = (document.getElementById('night-city')?.value     || '').trim();
          t.nightZip      = (document.getElementById('night-zip')?.value      || '').trim();
          t.nightDistance = (document.getElementById('night-distance')?.value || '').trim();
        }
      }
    }
    // Step 5 : récapitulatif en lecture seule, rien à sauvegarder ici.
  },

  validateStep() {
    if (this.currentStep === 1) {
      if (!this.guestData.firstName || !this.guestData.lastName || !this.guestData.phone) {
        Animations.showToast('Veuillez remplir Prénom, Nom et Téléphone', 'error'); return false;
      }
      if (this.guestData.attending === null) {
        Animations.showToast('Veuillez indiquer votre présence', 'error'); return false;
      }
      if (this.guestData.attending === true || this.guestData.attending === 'maybe') {
        if (this.guestData.hasCompanions === null) {
          Animations.showToast('Veuillez indiquer si vous venez accompagné(e)', 'error'); return false;
        }
        if (this.guestData.hasCompanions && this.guestData.companions.length === 0) {
          Animations.showToast("Veuillez indiquer le nombre d'accompagnants", 'error'); return false;
        }
        if (this.guestData.hasCompanions && !this.guestData.companions.every(c => c.firstName.trim() && c.lastName.trim())) {
          Animations.showToast('Veuillez renseigner le prénom et le nom de chaque accompagnant', 'error'); return false;
        }
      }
    }
    if (this.currentStep === 3 && (this.guestData.attending === true || this.guestData.attending === 'maybe') && this.guestData.brunch === null) {
      Animations.showToast('Veuillez indiquer votre réponse pour le brunch', 'error'); return false;
    }
    if (this.currentStep === 4 && (this.guestData.attending === true || this.guestData.attending === 'maybe')) {
      if (!this.guestData.dessert || this.guestData.dessert.participate === null) {
        Animations.showToast('Veuillez indiquer votre réponse pour le buffet gourmand', 'error'); return false;
      }
      if (this.guestData.dessert.participate === true) {
        if (!this.guestData.dessert.type) {
          Animations.showToast('Veuillez préciser le type de dessert', 'error'); return false;
        }
        if (!this.guestData.dessert.portions) {
          Animations.showToast('Veuillez indiquer le nombre de parts', 'error'); return false;
        }
      }
    }
    return true;
  },

  async handleNext() {
    this.saveCurrentStepData();
    if (!this.validateStep()) return;

    if (this.currentStep === 1 && this.guestData.attending === false) { this.submitForm(); return; }

    if (this.currentStep === 1) {
      const existing = await Store.getGuestByPhone(this.guestData.phone);
      if (existing && existing.id !== this.guestData.id) {
        const p = (a) => {
          const lst = [];
          let oth = a || '';
          if(oth.includes('[Gluten]')){ lst.push('gluten'); oth = oth.replace('[Gluten]', ''); }
          if(oth.includes('[Lactose]')){ lst.push('lactose'); oth = oth.replace('[Lactose]', ''); }
          if(oth.includes('[Fruits à coque]')){ lst.push('nuts'); oth = oth.replace('[Fruits à coque]', ''); }
          if(oth.includes('[Fruits de mer]')){ lst.push('seafood'); oth = oth.replace('[Fruits de mer]', ''); }
          oth = oth.replace(/^- /, '').trim();
          if (oth) lst.push('other');
          return { list: lst, other: oth };
        };
        const mA = p(existing.allergyDetails);
        const cA = (existing.companions||[]).map(c => {
           const ca = p(c.allergyDetails);
           return {...c, allergyList: ca.list, allergyOther: ca.other};
        });

        this.guestData = { 
           ...this.guestData, 
           ...existing, 
           allergyList: mA.list, allergyOther: mA.other, companions: cA,
           transport: { ...this.guestData.transport, ...(existing.transport||{}) } 
        };
        Animations.showToast('Profil retrouvé !', 'success');
      }
    }

    if (this.currentStep === 1 && this.guestData.attending !== true) { this.currentStep = 3; this.render(); return; }
    if (this.currentStep === 3 && this.guestData.attending !== true) { this.currentStep = 5; this.render(); return; }

    if (this.currentStep < this.totalSteps) { this.currentStep++; this.render(); }
    else { this.submitForm(); }
  },

  handlePrev() {
    this.saveCurrentStepData();
    if (this.currentStep === 3 && this.guestData.attending !== true) { this.currentStep = 1; this.render(); return; }
    if (this.currentStep === 5 && this.guestData.attending !== true) { this.currentStep = 3; this.render(); return; }
    if (this.currentStep > 1) { this.currentStep--; this.render(); }
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

      Animations.showToast('Merci pour votre réponse !', 'success');
      this.currentStep = 1;
      Router.navigate('#/mes-reponses');
    } catch (err) {
      console.error('[RSVP] Erreur submitForm :', err);
      Animations.showToast('Une erreur est survenue, veuillez réessayer.', 'error');
    }
  }
};

export default RSVP;