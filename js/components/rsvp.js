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
      tr('Régime alimentaire', 'Régimen'), 
	  tr('Buffet gourmand', 'Bufé goloso'),
      tr('Brunch du lendemain', 'Brunch'),      
      tr('Transport et Covoiturage', 'Transporte'), 
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
    const d = this.guestData.dessert || {};
    
    // Par défaut, on considère que c'est une surprise si l'utilisateur n'a pas encore répondu "false"
    const isSurprise = d.isSurprise !== false;

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-4">
        <p style="text-align:center;font-size:16px;font-weight:500;color:var(--text-dark);line-height:1.6;margin-bottom:2rem;">
          ${tr('Nous vous proposons, si vous le souhaitez et si le pouvez, de participer à créer un buffet gourmand, en apportant votre meilleur dessert !', 'Les proponemos, si lo desean y pueden por supuesto, participar en crear un festín de golosinas, ¡trayendo su mejor postre!')}
        </p>
        <div class="attendance-options">
          <button type="button" class="choice-btn ${d.participate === true ? 'selected' : ''}" data-dessert="true"> <span>🍰</span> <strong>${tr('Oui, je suis partant(e)', 'Sí, me apunto')}</strong></button>
          <button type="button" class="choice-btn ${d.participate === false ? 'selected' : ''}" data-dessert="false"><span>🙏</span> <strong>${tr('Non, difficile pour moi', 'No, es difícil para mí')}</strong></button>
        </div>
        
        <div id="dessert-details" class="${d.participate === true ? '' : 'hidden'}" style="margin-top: 20px; background: #fdfaf5; border: 1.5px solid #e7dcc4; border-radius: 10px; padding: 16px;">
          
          <!-- Choix : Surprise ou je sais déjà -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
            <label style="font-size:14px; display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="radio" name="d-isSurprise" value="true" ${isSurprise ? 'checked' : ''} onchange="document.getElementById('dessert-details-fields').style.display='none'">
              ${tr('Surprise, je répondrai plus tard !', '¡Sorpresa, responderé más tarde!')}
            </label>
            <label style="font-size:14px; display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="radio" name="d-isSurprise" value="false" ${!isSurprise ? 'checked' : ''} onchange="document.getElementById('dessert-details-fields').style.display='block'">
              ${tr('Je sais ce que je vais apporter', 'Sé lo que voy a llevar')}
            </label>
          </div>

          <!-- Les champs à remplir (masqués si 'Surprise' est coché) -->
          <div id="dessert-details-fields" style="display: ${!isSurprise ? 'block' : 'none'}; border-top: 1px dashed #e7dcc4; padding-top: 15px;">
            
            <input type="text" id="d-type" class="compact-input" value="${this.esc(d.type)}" placeholder="${tr('Type de dessert (ex: Tarte au citron...) *', 'Tipo de postre (ej: Tarta de limón...) *')}">
            
            <input type="number" id="d-portions" class="compact-input" value="${this.esc(d.portions)}" placeholder="${tr('Nombre de parts (environ) *', 'Número de porciones (aprox.) *')}" style="margin-top: 10px;">
            
            <label style="display:block; font-size:13px; font-weight:500; color:var(--text-dark); margin-bottom:8px; margin-top:15px;">
              ${tr('Besoin de le stocker au frais ?', '¿Necesita guardarse en frío?')}
            </label>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <label style="font-size:14px; display:flex; align-items:center; gap:6px;">
                <input type="radio" name="d-fridge" value="yes" ${d.fridge === 'yes' ? 'checked' : ''}> ${tr('Oui', 'Sí')}
              </label>
              <label style="font-size:14px; display:flex; align-items:center; gap:6px;">
                <input type="radio" name="d-fridge" value="no" ${d.fridge === 'no' ? 'checked' : ''}> ${tr('Non', 'No')}
              </label>
            </div>
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
    
    // Valeur par défaut pour le compteur de places
    const seats = tData.seatsAvailable || 1;

    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-5">

        <!-- 1. En-tête : Je viens : -->
        <div style="margin-bottom:18px;border-bottom:1px solid #e5e0d5;padding-bottom:14px;">
          <label style="font-size:16px;font-weight:500;display:block;margin-bottom:12px;">
            ${tr('Je viens :', 'Vengo :')}
          </label>
          <div class="transport-mode">
            <button type="button" class="mode-btn ${tData.mode === 'car' ? 'selected' : ''}" data-mode="car">  <span style="display:block;font-size:20px;">🚗</span>${tr('En voiture', 'En coche')}</button>
            <button type="button" class="mode-btn ${tData.mode === 'train' ? 'selected' : ''}" data-mode="train"><span style="display:block;font-size:20px;">🚆</span>${tr('En train', 'En tren')}</button>
            <button type="button" class="mode-btn ${tData.mode === 'other' ? 'selected' : ''}" data-mode="other"><span style="display:block;font-size:20px;">✈️</span>${tr('Autre', 'Otro')}</button>
          </div>
        </div>

        <div id="car-section" class="${isCar ? '' : 'hidden'}">
          <div class="attendance-options">
            <button type="button" class="choice-btn ${tData.carpoolRole === 'offer' ? 'selected' : ''}" data-role="offer">🙌 ${tr('Je peux proposer des places', 'Puedo ofrecer plazas')}</button>
            <button type="button" class="choice-btn ${tData.carpoolRole === 'none' ? 'selected' : ''}" data-role="none"> 👍 ${tr('Je n\'ai pas de place supplémentaire', 'No tengo plazas adicionales')}</button>
          </div>
          
          <div id="offer-section" class="${tData.carpoolRole === 'offer' ? '' : 'hidden'}" style="margin-top:16px;">
            
            <!-- 2. Compteur de places (+ / -) -->
            <div style="display:flex;align-items:center;justify-content:center;gap:15px;margin-bottom:16px;">
              <button type="button" class="seat-adjust-btn" data-action="minus" style="width:36px;height:36px;border-radius:50%;border:1px solid #ccc;background:#fff;font-size:18px;cursor:pointer;">-</button>
              <span style="font-size:16px;font-weight:500;min-width:80px;text-align:center;">
                ${seats} ${tr('place' + (seats > 1 ? 's' : ''), 'plaza' + (seats > 1 ? 's' : ''))}
              </span>
              <button type="button" class="seat-adjust-btn" data-action="plus" style="width:36px;height:36px;border-radius:50%;border:1px solid #ccc;background:#fff;font-size:18px;cursor:pointer;">+</button>
              <input type="hidden" id="t-driver-seats" value="${seats}">
            </div>

            <!-- 3. Informations de départ -->
            <input type="text" id="t-driver-city" class="compact-input" value="${this.esc(tData.city)}" placeholder="${tr('Ville de départ *', 'Ciudad de salida *')}">
            
            <!-- Astuce : type="text" transformé en "date/time" au clic pour afficher le placeholder proprement -->
            <input type="text" id="t-driver-day" class="compact-input" value="${this.esc(tData.departureDay)}" placeholder="${tr('Jour de départ *', 'Día de salida *')}" onfocus="(this.type='date')" onblur="(this.value === '' ? this.type='text' : this.type='date')">
            <input type="text" id="t-driver-time" class="compact-input" value="${this.esc(tData.departureTime)}" placeholder="${tr('Heure approximative de départ (optionnel)', 'Hora aproximada de salida (opcional)')}" onfocus="(this.type='time')" onblur="(this.value === '' ? this.type='text' : this.type='time')">

            <!-- 4. Contact -->
            <div style="margin-top:20px;margin-bottom:8px;font-weight:500;font-size:14px;">
              ${tr('Comment me contacter :', 'Cómo contactarme :')}
            </div>
            <input type="tel" id="t-driver-phone" class="compact-input" value="${this.esc(tData.contactPhone || this.guestData.phone)}" placeholder="${tr('Téléphone de contact', 'Teléfono de contacto')}">
            <input type="email" id="t-driver-email" class="compact-input" value="${this.esc(tData.contactEmail)}" placeholder="${tr('Email (optionnel)', 'Email (opcional)')}">
          </div>
        </div>

        <div id="other-section" class="${!isCar ? '' : 'hidden'}">
          <div class="attendance-options">
            <button type="button" class="choice-btn ${tData.carpoolRole === 'need' ? 'selected' : ''}" data-need="need">🙋 ${tr('J\'ai besoin d\'un covoiturage', 'Necesito transporte')}</button>
            <button type="button" class="choice-btn ${tData.carpoolRole === 'none' ? 'selected' : ''}" data-need="none">👌 ${tr('Je me débrouille', 'Me organizo solo')}</button>
          </div>
          <div id="need-section" class="${tData.carpoolRole === 'need' ? '' : 'hidden'}" style="margin-top:14px;">
            <label style="font-weight:600;margin-bottom:14px;display:block;">${tr('Pour quel(s) trajet(s) avez-vous besoin d\'aide ?', '¿Para qué trayecto(s) necesitas ayuda?')}</label>
            
            <style>
              .switch-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; }
              .switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
              .switch input { opacity: 0; width: 0; height: 0; }
              .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .3s; border-radius: 24px; }
              .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
              input:checked + .slider { background-color: #4CAF50; }
              input:checked + .slider:before { transform: translateX(20px); }
            </style>

            <!-- Trajet 1 : Église -->
            <div class="switch-row">
              <span>${tr('Aller à l\'église de Malleval', 'Ir a la iglesia de Malleval')}</span>
              <label class="switch">
                <input type="checkbox" class="p-need-cb" value="church" ${n.includes('church') ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div class="${n.includes('church') ? '' : 'hidden'}" id="church-options" style="background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:12px;">
              <label style="display:block;font-size:13px;margin-bottom:6px;"><input type="radio" name="churchArrival" value="ter" ${tData.churchArrival === 'ter' ? 'checked' : ''}> ${tr('Depuis la gare TER Le Péage-de-Roussillon', 'Desde la estación Le Péage-de-Roussillon')}</label>
              <input type="text" id="t-church-time" class="compact-input ${tData.churchArrival === 'ter' ? '' : 'hidden'}" value="${this.esc(tData.churchTime)}" placeholder="${tr('Heure d\'arrivée prévue', 'Hora prevista de llegada')}" onfocus="(this.type='time')" onblur="(this.value === '' ? this.type='text' : this.type='time')">
              <label style="display:block;font-size:13px;margin-bottom:6px;"><input type="radio" name="churchArrival" value="far" ${tData.churchArrival === 'far' ? 'checked' : ''}> ${tr('Depuis un autre lieu', 'Desde otro lugar')}</label>
              <div id="church-far-options" class="${tData.churchArrival === 'far' ? '' : 'hidden'}">
                <input type="text" id="t-pass-city" class="compact-input" value="${this.esc(tData.city)}" placeholder="${tr('Ville de départ *', 'Ciudad de salida *')}">
                <input type="text" id="t-pass-day" class="compact-input" value="${this.esc(tData.departureDay)}" placeholder="${tr('Jour de départ *', 'Día de salida *')}" onfocus="(this.type='date')" onblur="(this.value === '' ? this.type='text' : this.type='date')">
              </div>
            </div>

            <!-- Trajet 2 : Église -> Réception (ON par défaut si non défini) -->
            <div class="switch-row">
              <span>${tr('De l\'église à la Scie du May', 'De la iglesia a la Scie du May')}</span>
              <label class="switch">
                <input type="checkbox" class="p-need-cb" value="church-venue" ${(n.length === 0 && tData.carpoolRole === 'need') || n.includes('church-venue') ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>

            <!-- Trajet 3 : Couchage -->
            <div class="switch-row">
              <span>${tr('Aller au lieu de couchage (samedi soir)', 'Ir al alojamiento (sábado por la noche)')}</span>
              <label class="switch">
                <input type="checkbox" class="p-need-cb" value="night" ${n.includes('night') ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div id="night-fields" class="${n.includes('night') ? '' : 'hidden'}" style="background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:12px;">
              <input type="text"   id="night-name"     class="compact-input" value="${this.esc(tData.nightName)}"     placeholder="${tr('Nom du lieu *', 'Nombre del lugar *')}">
              <input type="text"   id="night-address"  class="compact-input" value="${this.esc(tData.nightAddress)}"  placeholder="${tr('Adresse *', 'Dirección *')}">
              <input type="text"   id="night-city"     class="compact-input" value="${this.esc(tData.nightCity)}"     placeholder="${tr('Ville *', 'Ciudad *')}">
              <input type="text"   id="night-zip"      class="compact-input" value="${this.esc(tData.nightZip)}"      placeholder="${tr('Code postal *', 'Código postal *')}">
              <input type="number" id="night-distance" class="compact-input" value="${this.esc(tData.nightDistance)}" placeholder="${tr('Distance depuis réception (min) *', 'Distancia desde la recepción (min) *')}">
            </div>

            <!-- Trajet 4 : Brunch -->
            <div class="switch-row">
              <span>${tr('Venir au brunch le dimanche', 'Asistir al brunch el domingo')}</span>
              <label class="switch">
                <input type="checkbox" class="p-need-cb" value="brunch" ${n.includes('brunch') ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>

            <!-- Nombre de places nécessaires -->
            <div style="margin-top:16px;border-top:1px solid #eee;padding-top:12px;">
              <label style="font-size:13px;display:block;margin-bottom:6px;">${tr('Nombre de places nécessaires :', 'Plazas necesarias :')}</label>
              <select id="t-pass-seats" class="compact-input">
                ${[1,2,3,4,5].map(num => `<option value="${num}" ${tData.seatsNeeded == num ? 'selected' : ''}>${num} ${tr('place' + (num > 1 ? 's' : '') + ' nécessaire' + (num > 1 ? 's' : ''), 'plaza' + (num > 1 ? 's' : '') + ' necesaria' + (num > 1 ? 's' : ''))}</option>`).join('')}
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

        <!-- Vos informations -->
        <div class="recap-section">
          <h4>👤 ${tr('Vos informations', 'Sus datos')}</h4>
          <div class="recap-row"><span>${tr('Nom', 'Nombre')}</span><span>${this.esc(g.firstName)} ${this.esc(g.lastName)}</span></div>
          <div class="recap-row"><span>${tr('Téléphone', 'Teléfono')}</span><span>${this.esc(g.phone)}</span></div>
          <div class="recap-row"><span>${tr('Présence', 'Asistencia')}</span><span>${attLabel}</span></div>
        </div>

        <!-- Accompagnants -->
        ${g.attending === true ? `
        <div class="recap-section">
          <h4>👥 ${tr('Accompagnants', 'Acompañantes')}</h4>
          ${companionsHtml}
        </div>` : ''}

        <!-- Régime alimentaire -->
        ${(g.attending === true || g.attending === 'maybe') ? `
        <div class="recap-section">
          <h4>🍽️ ${tr('Régime alimentaire', 'Régimen alimentario')}</h4>
          ${dietHtml}
        </div>` : ''}
		
        <!-- Buffet gourmand -->
        ${g.attending === true ? `
        <div class="recap-section">
          <h4>🍰 ${tr('Buffet gourmand', 'Bufé goloso')}</h4>
          <div class="recap-row">
            <span>${tr('Réponse', 'Respuesta')}</span>
            <span>${g.dessert?.participate === true ? tr('Oui, je participe', 'Sí, participo') : g.dessert?.participate === false ? tr('Non, difficile pour moi', 'No, es difícil') : '—'}</span>
          </div>
          ${g.dessert?.participate === true ? (
            g.dessert?.isSurprise === true || g.dessert?.isSurprise === 'true' ? `
              <div class="recap-row">
                <span>${tr('Dessert', 'Postre')}</span>
                <span>${tr('Surprise, je répondrai plus tard !', '¡Sorpresa, responderé más tarde!')}</span>
              </div>
            ` : `
              <div class="recap-row">
                <span>${tr('Dessert', 'Postre')}</span>
                <span>${this.esc(g.dessert.type) || '—'} (${this.esc(g.dessert.portions) || '?'} parts)</span>
              </div>
              <div class="recap-row">
                <span>${tr('Au frais', 'En frío')}</span>
                <span>${g.dessert.fridge === 'yes' ? tr('Oui', 'Sí') : g.dessert.fridge === 'no' ? tr('Non', 'No') : tr('Surprise', 'Sorpresa')}</span>
              </div>
            `
          ) : ''}
        </div>` : ''}

        <!-- Brunch du dimanche -->
        ${(g.attending === true || g.attending === 'maybe') ? `
        <div class="recap-section">
          <h4>☕ ${tr('Brunch du dimanche', 'Brunch del domingo')}</h4>
          <div class="recap-row"><span>${tr('Réponse', 'Respuesta')}</span><span>${g.brunch === true ? tr('Oui, avec plaisir !', '¡Sí, con gusto!') : g.brunch === false ? tr('Non, merci', 'No, gracias') : '—'}</span></div>
        </div>` : ''}

        <!-- Transport -->
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

    // AJOUT : [data-dessert] dans la liste des boutons écoutés
    this.container.querySelectorAll('[data-val], [data-brunch], [data-acc], [data-dessert], [data-has-companions]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const d = e.currentTarget.dataset;
        if (d.val) this.guestData.attending = d.val === 'true' ? true : d.val === 'false' ? false : 'maybe';
        if (d.brunch) this.guestData.brunch = d.brunch === 'true';
        if (d.acc) this.guestData.accommodationStatus = d.acc;
        
        // AJOUT : Enregistrement du choix Oui/Non pour le dessert
        if (d.dessert) {
          this.guestData.dessert = this.guestData.dessert || {};
          this.guestData.dessert.participate = d.dessert === 'true';
        }

        // Choix "Je viens accompagné(e) : Oui / Non"
        if (d.hasCompanions !== undefined) {
          this.guestData.hasCompanions = d.hasCompanions === 'true';
          if (this.guestData.hasCompanions && this.guestData.companions.length === 0) {
            this.guestData.companions.push({ firstName: '', lastName: '', phone: '', diet: [], allergyDetails: '' });
          }
          if (!this.guestData.hasCompanions) {
            this.guestData.companions = [];
          }
        }
        
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
    if (this.currentStep === 2) {
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
    
	// AJOUT : Sauvegarde des champs du Buffet Gourmand (Étape 3)
    if (this.currentStep === 3) {
      if (this.guestData.dessert && this.guestData.dessert.participate === true) {
        const surpriseRadio = this.container.querySelector('input[name="d-isSurprise"]:checked');
        this.guestData.dessert.isSurprise = surpriseRadio ? surpriseRadio.value === 'true' : true;
        
        this.guestData.dessert.type = (document.getElementById('d-type')?.value || '').trim();
        this.guestData.dessert.portions = (document.getElementById('d-portions')?.value || '').trim();
        this.guestData.dessert.fridge = this.container.querySelector('input[name="d-fridge"]:checked')?.value || null;
      }
    }
	
	if (this.currentStep === 4) {
      if (this.guestData.dessert && this.guestData.dessert.participate === true) {
        const surpriseRadio = this.container.querySelector('input[name="d-isSurprise"]:checked');
        this.guestData.dessert.isSurprise = surpriseRadio ? surpriseRadio.value === 'true' : true;
        
        this.guestData.dessert.type = (document.getElementById('d-type')?.value || '').trim();
        this.guestData.dessert.portions = (document.getElementById('d-portions')?.value || '').trim();
        this.guestData.dessert.fridge = this.container.querySelector('input[name="d-fridge"]:checked')?.value || null;
      }
    }

    if (this.currentStep === 5) {
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
        let checkedNeeds = Array.from(this.container.querySelectorAll('.p-need-cb:checked')).map(cb => cb.value);
        
        // Si l'utilisateur vient de basculer en mode "need" et qu'aucune case n'a encore été manipulée, 
        // on active par défaut le trajet Église -> Réception (church-venue)
        if (checkedNeeds.length === 0 && !t.passengerNeeds) {
          checkedNeeds = ['church-venue'];
        }
        t.passengerNeeds = checkedNeeds;

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
		
		// AJOUT : Compteur de places pour le covoiturage (Étape 5)
    this.container.querySelectorAll('.seat-adjust-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        let currentSeats = this.guestData.transport.seatsAvailable || 1;
        
        if (action === 'plus' && currentSeats < 6) currentSeats++;
        if (action === 'minus' && currentSeats > 1) currentSeats--;
        
        this.guestData.transport.seatsAvailable = currentSeats;
        this.saveCurrentStepData();
        this.render();
      });
    });
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
    
    // AJOUT : Vérification du dessert si l'utilisateur dit "Je sais ce que je vais apporter"
    if (this.currentStep === 4 && this.guestData.dessert?.participate === true && this.guestData.dessert?.isSurprise === false) {
      if (!this.guestData.dessert.type || !this.guestData.dessert.portions) { 
        Animations.showToast("Veuillez préciser le type de dessert et le nombre de parts", "error"); return false; 
      }
    }

    // Le transport passe à l'étape 5
    if (this.currentStep === 5 && this.guestData.transport.carpoolRole === 'need') {
      const t = this.guestData.transport;
      const n = t.passengerNeeds || [];
      if (n.includes('church') && t.churchArrival === 'far' && !t.city) { Animations.showToast("Précisez la ville de départ", "error"); return false; }
      if (n.includes('night') && (!t.nightName || !t.nightAddress || !t.nightDistance)) { Animations.showToast("Remplissez les champs obligatoires du lieu de couchage", "error"); return false; }
    }
    return true;
  },

  handleNext() {
    this.saveCurrentStepData(); 

    if (this.validateStep()) {
      if (this.currentStep === 1 && this.guestData.attending === false) { this.submitForm(); return; }
      if (this.currentStep === 1) {
        const existing = Store.getGuestByPhone(this.guestData.phone);
        if (existing && existing.id !== this.guestData.id) this.guestData = { ...this.guestData, ...existing };
      }
      
      // Adaptation des sauts d'étapes (Le récapitulatif est l'étape 6)
      if (this.currentStep === 2 && this.guestData.attending !== true) { this.currentStep = 6; this.render(); return; }

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
    // Adaptation des sauts d'étapes
    if (this.currentStep === 6 && this.guestData.attending !== true) { this.currentStep = 2; this.render(); return; }
    
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
    }
  },

  async submitForm() {
    const submitBtn = document.getElementById('final-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours...";
    }

    let savedGuest;
    if (this.guestData.id) savedGuest = Store.updateGuest(this.guestData.id, this.guestData);
    else savedGuest = Store.saveGuest(this.guestData);
    Store.setCurrentGuest(savedGuest.id);

    const t = savedGuest.transport;
    if (t && (t.carpoolRole === 'offer' || t.carpoolRole === 'need')) {
      Store.getCarpoolsByGuestId(savedGuest.id).forEach(c => Store.deleteCarpool(c.id));
      Store.saveCarpool({
        guestId: savedGuest.id,
        type: t.carpoolRole,
        city: t.city,
        seatsAvailable: t.seatsAvailable,
        seatsNeeded: t.seatsNeeded,
        contact: savedGuest.phone
      });
    }

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyszfkicFmzXw7gFPnvJwQGVEk1NPmVLO6_9v9XId3UUcn7CHZBFsFfEty1JXpgMrkHrg/exec";

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.guestData)
      });
      Animations.showToast("Réponse transmise aux mariés !", "success");
    } catch (error) {
      console.error("[RSVP] Erreur envoi Google :", error);
      Animations.showToast("Erreur d'envoi vers la base centrale.", "error");
    }

    this.currentStep = 1;
    Router.navigate('#/mes-reponses');
  }
};

export default RSVP;