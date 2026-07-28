import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const tr = (fr, es) => (window.I18n && window.I18n.currentLang === 'es') ? es : fr;

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
        this.guestData = {
          ...this.guestData,
          ...currentGuest,
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
        </div>
      </div>`;
  },

  renderProgressBar() {
    const labels = [
      tr('Réponse', 'Respuesta'), 
      tr('Brunch', 'Brunch'), 
      tr('Régime alimentaire', 'Régimen alimentario'), 
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
  const companions = this.guestData.companions || [];
  const hasCompanions = companions.length > 0;

  // 1° Une fois une réponse choisie, on n'affiche que le choix retenu (gain de place),
  // avec un lien discret pour en changer si besoin.
  const attendanceBlock = att === null ? `
    <div class="attendance-options">
      <button type="button" class="choice-btn" data-val="true">  <span>🎉</span> <strong>${tr('Je viens avec joie !', '¡Asistiré con gusto!')}</strong></button>
      <button type="button" class="choice-btn" data-val="maybe"><span>🤔</span> <strong>${tr('Je viens peut-être', 'Tal vez asista')}</strong></button>
      <button type="button" class="choice-btn" data-val="false"><span>💌</span> <strong>${tr('Je ne peux pas venir', 'No podré asistir')}</strong></button>
    </div>` : `
    <div class="attendance-options">
      <button type="button" class="choice-btn selected" data-val="${att}">
        <span>${att === true ? '🎉' : att === 'maybe' ? '🤔' : '💌'}</span>
        <strong>${att === true ? tr('Je viens avec joie !', '¡Asistiré con gusto!') : att === 'maybe' ? tr('Je viens peut-être', 'Tal vez asista') : tr('Je ne peux pas venir', 'No podré asistir')}</strong>
      </button>
    </div>
    <button type="button" id="change-answer-btn" class="link-btn">${tr('↺ Changer ma réponse', '↺ Cambiar mi respuesta')}</button>`;

  const companionBlock = att === true ? `
    <div id="companions-section" style="margin-top:16px;">
      <label class="companion-toggle">
        <input type="checkbox" id="guest-has-companions" ${hasCompanions ? 'checked' : ''}>
        ${tr('Je viens accompagné(e)', 'Vengo acompañado/a')}
      </label>

      <div id="companion-count-block" class="${hasCompanions ? '' : 'hidden'}" style="margin-top:12px;">
        <label style="display:block; font-size:13px; color:var(--text-muted); margin-bottom:6px; font-weight:500;">
          ${tr('Nombre d\'accompagnants *', 'Número de acompañantes *')}
        </label>
        <select id="guest-companions-count" class="compact-input">
          <option value="">-- ${tr('Choisir', 'Elegir')} --</option>
          ${[1,2,3,4,5].map(n => `<option value="${n}" ${companions.length === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>

        <div id="companions-list" style="margin-top:8px;">
          ${companions.map((c, idx) => `
            <div class="companion-card">
              <p class="companion-card-title">${tr('Accompagnant', 'Acompañante')} ${idx + 1}</p>
              <input type="text" class="compact-input companion-firstname" data-index="${idx}" value="${this.esc(c.firstName)}" placeholder="${tr('Prénom *', 'Nombre *')}">
              <input type="text" class="compact-input companion-lastname"  data-index="${idx}" value="${this.esc(c.lastName)}"  placeholder="${tr('Nom *', 'Apellido *')}">
              <input type="tel"  class="compact-input companion-phone"     data-index="${idx}" value="${this.esc(c.phone)}"     placeholder="${tr('Téléphone (optionnel)', 'Teléfono (opcional)')}">
            </div>`).join('')}
        </div>
      </div>
    </div>` : '';

  return `
    <div class="form-step ${v ? 'active' : ''}" id="step-1">
      <input type="text" id="guest-firstname" class="compact-input" value="${this.esc(this.guestData.firstName)}" placeholder="${tr('Prénom *', 'Nombre *')}" required>
      <input type="text" id="guest-lastname"  class="compact-input" value="${this.esc(this.guestData.lastName)}"  placeholder="${tr('Nom *', 'Apellido *')}" required>
      <input type="tel"  id="guest-phone"     class="compact-input" value="${this.esc(this.guestData.phone)}"     placeholder="${tr('Téléphone portable *', 'Teléfono móvil *')}" required>

      ${attendanceBlock}
      ${companionBlock}

      <div class="form-actions">
        <button type="button" class="btn btn--primary next-btn" style="width:100%;">${tr('Suivant', 'Siguiente')}</button>
      </div>
    </div>`;
},

  renderStep2() {
    const v = this.currentStep === 2;
    const b = this.guestData.brunch;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-2">
        <p style="text-align:center;font-size:14px;color:#666;margin-bottom:1.5rem;">
          ${tr('Pour faire durer le plaisir, nous vous convions à un brunch le <strong>dimanche 9 mai</strong>, de 9h30 à 13h30 au Domaine de la Scie du May.', 'Para prolongar el placer, os invitamos a un brunch el <strong>domingo 9 de mayo</strong>, de 9:30 a 13:30 en la Finca de la Scie du May.')}
        </p>
        <div class="attendance-options">
          <button type="button" class="choice-btn ${b === true  ? 'selected' : ''}" data-brunch="true"> <span>☕</span> <strong>${tr('Oui, avec plaisir !', '¡Sí, con gusto!')}</strong></button>
          <button type="button" class="choice-btn ${b === false ? 'selected' : ''}" data-brunch="false"><span>🙏</span> <strong>${tr('Non, merci !', '¡No, gracias!')}</strong></button>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn">← ${tr('Précédent', 'Anterior')}</button>
          <button type="button" class="btn btn--primary next-btn">${tr('Suivant', 'Siguiente')}</button>
        </div>
      </div>`;
  },

  renderStep3() {
    const v = this.currentStep === 3;
    const companions = this.guestData.companions || [];

    const renderBlock = (label, key, diet, allergyDetails) => {
      const d = diet || [];
      const hasAllergy = d.includes('allergy');
      return `
        <div style="margin-bottom:1.8rem;">
          <p style="font-weight:500;border-bottom:1px solid #f5f2eb;padding-bottom:4px;">${label}</p>
          <div class="diet-pills">
            <label class="diet-pill"><input type="checkbox" class="diet-cb" data-person="${key}" value="vegetarian" ${d.includes('vegetarian')?'checked':''}><span>🥗 ${tr('Végétarien', 'Vegetariano')}</span></label>
            <label class="diet-pill"><input type="checkbox" class="diet-cb" data-person="${key}" value="vegan"       ${d.includes('vegan')      ?'checked':''}><span>🌱 ${tr('Végan', 'Vegano')}</span></label>
            <label class="diet-pill"><input type="checkbox" class="diet-cb" data-person="${key}" value="no-alcohol"  ${d.includes('no-alcohol') ?'checked':''}><span>🧃 ${tr('Sans alcool', 'Sin alcohol')}</span></label>
            <label class="diet-pill"><input type="checkbox" class="diet-cb" data-person="${key}" value="allergy"     ${hasAllergy               ?'checked':''}><span>⚠️ ${tr('Allergie / Intolérance', 'Alergia / Intolerancia')}</span></label>
          </div>
          <div class="allergy-sub ${hasAllergy?'':'hidden'}" id="allergy-details-${key}">
            <label style="display:block;font-size:12px;font-weight:500;margin-bottom:6px;color:#5c4e35;">
              ${tr('Précisez votre allergie / intolérance :', 'Especifique su alergia / intolerancia:')}
            </label>
            <input type="text" class="compact-input allergy-free-text" data-person="${key}" value="${this.esc(allergyDetails)}" placeholder="${tr('Ex : allergie aux fruits de mer, intolérance au gluten…', 'Ej: alergia a los mariscos, intolerancia al gluten…')}" style="margin-bottom:0;">
          </div>
        </div>`;
    };

    let html = `<div class="form-step ${v?'active':''}" id="step-3">`;
    html += `
      <div class="info-note">
        <span class="icon">👩‍🍳</span>
        <span>${tr('Ces informations permettront à notre traiteur de vous proposer des plats adaptés !', 'Esta información permitirá a nuestro catering ofrecerles platos adaptados.')}</span>
      </div>`;
    html += renderBlock(tr('Pour vous', 'Para usted'), 'main', this.guestData.diet, this.guestData.allergyDetails);
    companions.forEach((c, i) => html += renderBlock(tr(`Pour ${this.companionLabel(c, i)}`, `Para ${this.companionLabel(c, i)}`), String(i), c.diet, c.allergyDetails));
    html += `<div class="form-actions">
      <button type="button" class="btn btn--secondary prev-btn">← ${tr('Précédent', 'Anterior')}</button>
      <button type="button" class="btn btn--primary next-btn">${tr('Suivant', 'Siguiente')}</button>
    </div></div>`;
    return html;
  },

  renderStep4() {
    const v = this.currentStep === 4;
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

        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn">← ${tr('Précédent', 'Anterior')}</button>
          <button type="button" class="btn btn--primary next-btn">${tr('Suivant', 'Siguiente')}</button>
        </div>
      </div>`;
  },

  renderStep5() {
    const v = this.currentStep === 5;
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
          <h4>☕ ${tr('Brunch du dimanche', 'Brunch del domingo')}</h4>
          <div class="recap-row"><span>${tr('Réponse', 'Respuesta')}</span><span>${g.brunch === true ? tr('Oui, avec plaisir !', '¡Sí, con gusto!') : g.brunch === false ? tr('Non, merci', 'No, gracias') : '—'}</span></div>
        </div>` : ''}

        ${g.attending === true ? `
        <div class="recap-section">
          <h4>🍽️ ${tr('Régime alimentaire', 'Régimen alimentario')}</h4>
          ${dietHtml}
        </div>

        <div class="recap-section">
          <h4>🚗 ${tr('Transport', 'Transporte')}</h4>
          <div class="recap-row"><span>${tr('Résumé', 'Resumen')}</span><span>${transportSummary}</span></div>
        </div>` : ''}

        <p style="font-size:13px;color:#777;text-align:center;font-style:italic;margin-top:14px;">
          ${tr('Besoin d\'un hébergement ?', '¿Necesita alojamiento?')}
          <a href="#/hebergements" style="color:#9b8660;">${tr('Voir la liste des hébergements →', 'Ver la lista de alojamientos →')}</a>
        </p>

        <div class="form-actions" style="margin-top:1.5rem;">
          <button type="button" class="btn btn--secondary prev-btn">← ${tr('Précédent', 'Anterior')}</button>
          <button type="button" class="btn btn--primary next-btn" id="final-submit-btn">${tr('Confirmer ma réponse ✓', 'Confirmar mi respuesta ✓')}</button>
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

    // 1° Changer de réponse (ré-affiche les 3 choix)
    const changeAnswerBtn = this.container.querySelector('#change-answer-btn');
    if (changeAnswerBtn) {
      changeAnswerBtn.addEventListener('click', () => {
        this.guestData.attending = null;
        this.render();
      });
    }

    // 1° Case "Je viens accompagné(e)"
    const hasCompanionsCb = this.container.querySelector('#guest-has-companions');
    if (hasCompanionsCb) {
      hasCompanionsCb.addEventListener('change', e => {
        if (!e.target.checked) this.guestData.companions = [];
        this.render();
      });
    }

    // Nombre d'accompagnants
    const compSelect = this.container.querySelector('#guest-companions-count');
    if (compSelect) {
      compSelect.addEventListener('change', e => {
        const count = parseInt(e.target.value, 10) || 0;
        while (this.guestData.companions.length < count) this.guestData.companions.push({ firstName:'', lastName:'', phone:'', diet:[], allergyDetails:'' });
        if (this.guestData.companions.length > count) this.guestData.companions = this.guestData.companions.slice(0, count);
        this.render();
      });
    }

    // Régimes : révèle le champ libre allergie/intolérance
    this.container.querySelectorAll('.diet-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const sub = this.container.querySelector(`#allergy-details-${cb.dataset.person}`);
        if (cb.value === 'allergy' && sub) sub.classList.toggle('hidden', !cb.checked);
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

      const hasCompanionsChecked = document.getElementById('guest-has-companions')?.checked;
      if (!hasCompanionsChecked) {
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
    if (this.currentStep === 3) {
      const proc = key => {
        const diets = Array.from(this.container.querySelectorAll(`.diet-cb[data-person="${key}"]:checked`)).map(c => c.value);
        const details = diets.includes('allergy')
          ? (this.container.querySelector(`.allergy-free-text[data-person="${key}"]`)?.value.trim() || '')
          : '';
        return { diet: diets, details };
      };
      const main = proc('main');
      this.guestData.diet = main.diet;
      this.guestData.allergyDetails = main.details;
      this.guestData.companions.forEach((c, i) => {
        const r = proc(String(i)); c.diet = r.diet; c.allergyDetails = r.details;
      });
    }
    if (this.currentStep === 4) {
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
      if (this.guestData.attending === true) {
        const hasCompanionsChecked = this.container.querySelector('#guest-has-companions')?.checked;
        if (hasCompanionsChecked && this.guestData.companions.length === 0) {
          Animations.showToast("Veuillez indiquer le nombre d'accompagnants", 'error'); return false;
        }
        if (!this.guestData.companions.every(c => c.firstName.trim() && c.lastName.trim())) {
          Animations.showToast('Veuillez renseigner le prénom et le nom de chaque accompagnant', 'error'); return false;
        }
      }
    }
    if (this.currentStep === 2 && (this.guestData.attending === true || this.guestData.attending === 'maybe') && this.guestData.brunch === null) {
      Animations.showToast('Veuillez indiquer votre réponse pour le brunch', 'error'); return false;
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
        this.guestData = { ...this.guestData, ...existing, transport: { ...this.guestData.transport, ...(existing.transport||{}) } };
        Animations.showToast('Profil retrouvé !', 'success');
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