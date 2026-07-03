import Store from '../store.js';
import Router from '../utils/router.js';
import Animations from '../utils/animations.js';

const RSVP = {
  container: null,
  currentStep: 1,
  totalSteps: 5,
  _accommodations: [], // cache pour l'autocomplete
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
      // Charger les hébergements pour l'autocomplete
      const accs = await Store.getAccommodationsWithAvailability();
      this._accommodations = Array.isArray(accs) ? accs : [];

      const currentGuest = await Store.getCurrentGuest();
      if (currentGuest) {
        this.guestData = {
          ...this.guestData,
          ...currentGuest,
          transport: { ...this.guestData.transport, ...(currentGuest.transport || {}) }
        };
      }
      this.render();
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
        .diet-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:15px 0; }
        .diet-option { display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;color:#555; }
        .allergy-sub { background:#faf8f5;padding:12px;border-radius:8px;margin-top:8px;border:1px dashed #e0d5c1; }
        .transport-mode { display:flex;gap:10px;margin-bottom:1.5rem; }
        .mode-btn { flex:1;padding:10px 5px;border:1.5px solid #e5e0d5;border-radius:8px;background:#fff;cursor:pointer;text-align:center;font-size:13px;transition:all .15s; }
        .mode-btn.selected { border-color:#9b8660;background:#fdfaf5;font-weight:500; }
        .hidden { display:none !important; }

        /* Autocomplete hébergement */
        .acc-autocomplete { position:relative; }
        .acc-suggestions { position:absolute;top:100%;left:0;right:0;background:#fff;border:1.5px solid #e0d5c1;border-top:none;border-radius:0 0 8px 8px;z-index:100;max-height:220px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,.1); }
        .acc-suggestion { padding:10px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid #f5f0e8; }
        .acc-suggestion:hover { background:#fdfaf5; }
        .acc-suggestion:last-child { border-bottom:none; }
        .acc-spots { font-size:12px;margin-left:6px; }
        .acc-spots.green  { color:#1e8449; }
        .acc-spots.orange { color:#b7770d; }
        .acc-spots.red    { color:#c0392b; }
        .acc-info-box { background:#fdfaf5;border:1.5px solid #e0d5c1;border-radius:8px;padding:12px 14px;margin-top:8px;font-size:13px;color:#5c4e35;line-height:1.6; }
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
    const labels = ['Réponse', 'Brunch', 'Repas', 'Transport', 'Logement'];
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

  renderStep1() {
    const v = this.currentStep === 1;
    const att = this.guestData.attending;
    const companions = this.guestData.companions || [];
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-1">
        <input type="text" id="guest-firstname" class="compact-input" value="${this.esc(this.guestData.firstName)}" placeholder="Prénom *" required>
        <input type="text" id="guest-lastname"  class="compact-input" value="${this.esc(this.guestData.lastName)}"  placeholder="Nom *" required>
        <input type="tel"  id="guest-phone"     class="compact-input" value="${this.esc(this.guestData.phone)}"     placeholder="Téléphone portable *" required>
        <div style="height:1px;background:#f5f2eb;margin:1rem 0;"></div>

        <div class="attendance-options">
          <button type="button" class="choice-btn ${att === true    ? 'selected' : ''}" data-val="true">  <span>🎉</span> <strong>Je viens avec joie !</strong></button>
          <button type="button" class="choice-btn ${att === 'maybe' ? 'selected' : ''}" data-val="maybe"><span>🤔</span> <strong>Je viens peut-être</strong></button>
          <button type="button" class="choice-btn ${att === false   ? 'selected' : ''}" data-val="false"><span>💌</span> <strong>Je ne peux pas venir</strong></button>
        </div>

        ${att === true ? `
          <div id="companions-section" style="margin-top:14px;">
            <div class="companion-warning" style="background:#fdf8ee;border-left:3px solid #d4aa5a;border-radius:6px;padding:10px 14px;font-size:13px;color:#7a6135;margin-bottom:12px;">
              Le nombre d'invités étant strictement limité, merci de ne pas ajouter quelqu'un que nous n'avons pas prévu !
            </div>
            <select id="guest-companions-count" class="compact-input">
              <option value="0" ${companions.length === 0 ? 'selected' : ''}>Je viens seul(e)</option>
              ${[1,2,3,4,5].map(n => `<option value="${n}" ${companions.length === n ? 'selected' : ''}>Avec ${n} accompagnant${n>1?'s':''}</option>`).join('')}
            </select>
            <div id="companions-list">
              ${companions.map((c, idx) => `
                <div style="margin-bottom:8px;">
                  <input type="text" class="compact-input companion-name" data-index="${idx}" value="${this.esc(c.name)}" placeholder="Prénom et Nom accompagnant ${idx+1} *">
                </div>`).join('')}
            </div>
          </div>` : ''}

        <div class="form-actions">
          <button type="button" class="btn btn--primary next-btn" style="width:100%;">Suivant →</button>
        </div>
      </div>`;
  },

  renderStep2() {
    const v = this.currentStep === 2;
    const b = this.guestData.brunch;
    return `
      <div class="form-step ${v ? 'active' : ''}" id="step-2">
        <p style="text-align:center;font-size:14px;color:#666;margin-bottom:1.5rem;">
          Pour faire durer le plaisir, nous vous convions à un brunch le <strong>dimanche 9 mai</strong>, de 9h30 à 13h30 au Domaine de la Scie du May.
        </p>
        <div class="attendance-options">
          <button type="button" class="choice-btn ${b === true  ? 'selected' : ''}" data-brunch="true"> <span>☕</span> <strong>Oui, avec plaisir !</strong></button>
          <button type="button" class="choice-btn ${b === false ? 'selected' : ''}" data-brunch="false"><span>🙏</span> <strong>Non, merci !</strong></button>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>`;
  },

  renderStep3() {
    const v = this.currentStep === 3;
    const companions = this.guestData.companions || [];

    const renderBlock = (label, key, diet, allergyDetails) => {
      const d = diet || [];
      const hasAllergy = d.includes('allergy');
      const det = allergyDetails || '';
      const isLactose = det.includes('[Lactose]');
      const isGluten  = det.includes('[Gluten]');
      const isSea     = det.includes('[Fruits de mer]');
      const isPeanut  = det.includes('[Arachides]');
      const otherM    = det.match(/\[Autre:(.*?)\]/);
      const otherTxt  = otherM ? otherM[1].trim() : '';
      return `
        <div style="margin-bottom:1.5rem;">
          <p style="font-weight:500;border-bottom:1px solid #f5f2eb;padding-bottom:4px;">${label}</p>
          <div class="diet-grid">
            <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${key}" value="vegetarian" ${d.includes('vegetarian')?'checked':''}><span>🥗 Végétarien</span></label>
            <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${key}" value="vegan"       ${d.includes('vegan')      ?'checked':''}><span>🌱 Végan</span></label>
            <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${key}" value="no-alcohol"  ${d.includes('no-alcohol') ?'checked':''}><span>🧃 Sans alcool</span></label>
            <label class="diet-option"><input type="checkbox" class="diet-cb" data-person="${key}" value="allergy"     ${hasAllergy               ?'checked':''}><span>⚠️ Allergie</span></label>
          </div>
          <div class="allergy-sub ${hasAllergy?'':'hidden'}" id="allergy-details-${key}">
            <p style="font-size:12px;margin-bottom:8px;">Précisez :</p>
            <label style="margin-right:10px;font-size:13px;"><input type="checkbox" class="allergy-sub-cb" data-person="${key}" value="Lactose"       ${isLactose?'checked':''}> Lactose</label>
            <label style="margin-right:10px;font-size:13px;"><input type="checkbox" class="allergy-sub-cb" data-person="${key}" value="Gluten"        ${isGluten ?'checked':''}> Gluten</label>
            <label style="margin-right:10px;font-size:13px;"><input type="checkbox" class="allergy-sub-cb" data-person="${key}" value="Fruits de mer" ${isSea    ?'checked':''}> Fruits de mer</label>
            <label style="margin-right:10px;font-size:13px;"><input type="checkbox" class="allergy-sub-cb" data-person="${key}" value="Arachides"     ${isPeanut ?'checked':''}> Arachides</label>
            <label style="margin-right:10px;font-size:13px;"><input type="checkbox" class="allergy-sub-cb allergy-other-trigger" data-person="${key}" value="Autre" ${otherM?'checked':''}> Autre</label>
            <input type="text" class="compact-input allergy-other-input ${otherM?'':'hidden'}" data-person="${key}" value="${this.esc(otherTxt)}" placeholder="Précisez…" style="margin-top:8px;">
          </div>
        </div>`;
    };

    let html = `<div class="form-step ${v?'active':''}" id="step-3">`;
    html += renderBlock('Pour vous', 'main', this.guestData.diet, this.guestData.allergyDetails);
    companions.forEach((c, i) => html += renderBlock(`Pour ${c.name||'Accompagnant '+(i+1)}`, String(i), c.diet, c.allergyDetails));
    html += `<div class="form-actions">
      <button type="button" class="btn btn--secondary prev-btn">← Précédent</button>
      <button type="button" class="btn btn--primary next-btn">Suivant →</button>
    </div></div>`;
    return html;
  },

  renderStep4() {
    const v = this.currentStep === 4;
    const t = this.guestData.transport || {};
    const isCar = t.mode === 'car';
    const n = t.passengerNeeds || [];
    return `
      <div class="form-step ${v?'active':''}" id="step-4">

        <div style="margin-bottom:18px;border-bottom:1px solid #e5e0d5;padding-bottom:14px;">
          <label style="font-size:14px;font-weight:500;display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="t-arrive-before" ${t.arrivalBeforeDDay?'checked':''}>
            Arriver dans la région avant le jour J
          </label>
          <div id="arrive-before-fields" class="${t.arrivalBeforeDDay?'':'hidden'}" style="margin-top:10px;">
            <input type="text" id="t-arr-from"  class="compact-input" placeholder="Lieu de départ"  value="${this.esc(t.arrivalFrom)}">
            <input type="text" id="t-arr-to"    class="compact-input" placeholder="Lieu d'arrivée"  value="${this.esc(t.arrivalTo)}">
            <input type="date" id="t-arr-date"  class="compact-input" value="${this.esc(t.arrivalDate)}">
          </div>
        </div>

        <div class="transport-mode">
          <button type="button" class="mode-btn ${t.mode==='car'   ?'selected':''}" data-mode="car">  <span style="display:block;font-size:20px;">🚗</span>En voiture</button>
          <button type="button" class="mode-btn ${t.mode==='train' ?'selected':''}" data-mode="train"><span style="display:block;font-size:20px;">🚆</span>En train</button>
          <button type="button" class="mode-btn ${t.mode==='other' ?'selected':''}" data-mode="other"><span style="display:block;font-size:20px;">✈️</span>Autre</button>
        </div>

        <div id="car-section" class="${isCar?'':'hidden'}">
          <div class="attendance-options">
            <button type="button" class="choice-btn ${t.carpoolRole==='offer'?'selected':''}" data-role="offer">🙌 Je peux proposer des places</button>
            <button type="button" class="choice-btn ${t.carpoolRole==='none' ?'selected':''}" data-role="none"> 👍 Je n'ai pas de place supplémentaire</button>
          </div>
          <div id="offer-section" class="${t.carpoolRole==='offer'?'':'hidden'}" style="margin-top:10px;">
            <input type="text" id="t-driver-city"  class="compact-input" value="${this.esc(t.city)}" placeholder="Ville de départ (ex: Lyon)">
            <select id="t-driver-seats" class="compact-input">
              ${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${t.seatsAvailable==n?'selected':''}>${n} place${n>1?'s':''}</option>`).join('')}
            </select>
            <input type="date" id="t-driver-day"  class="compact-input" value="${this.esc(t.departureDay)}">
            <input type="time" id="t-driver-time" class="compact-input" value="${this.esc(t.departureTime)}">
            <input type="tel"  id="t-driver-phone" class="compact-input" value="${this.esc(t.contactPhone||this.guestData.phone)}" placeholder="Téléphone de contact">
            <input type="email" id="t-driver-email" class="compact-input" value="${this.esc(t.contactEmail)}" placeholder="Email (optionnel)">
          </div>
        </div>

        <div id="other-section" class="${!isCar?'':'hidden'}">
          <div class="attendance-options">
            <button type="button" class="choice-btn ${t.carpoolRole==='need'?'selected':''}" data-need="need">🙋 J'ai besoin d'un covoiturage</button>
            <button type="button" class="choice-btn ${t.carpoolRole==='none'?'selected':''}" data-need="none">👌 Je me débrouille</button>
          </div>
          <div id="need-section" class="${t.carpoolRole==='need'?'':'hidden'}" style="margin-top:14px;">
            <label style="font-weight:500;margin-bottom:8px;display:block;">Pour quel(s) trajet(s) ?</label>
            <label style="display:block;margin-bottom:6px;font-size:14px;"><input type="checkbox" class="p-need-cb" value="church" ${n.includes('church')?'checked':''}> Aller à l'église de Malleval</label>
            <div class="${n.includes('church')?'':'hidden'}" id="church-options" style="margin-left:20px;margin-bottom:8px;">
              <label style="display:block;font-size:13px;margin-bottom:4px;"><input type="radio" name="churchArrival" value="ter" ${t.churchArrival==='ter'?'checked':''}> Depuis la gare TER Le Péage-de-Roussillon</label>
              <input type="time" id="t-church-time" class="compact-input ${t.churchArrival==='ter'?'':'hidden'}" value="${this.esc(t.churchTime)}" placeholder="Heure d'arrivée prévue">
              <label style="display:block;font-size:13px;margin-bottom:4px;"><input type="radio" name="churchArrival" value="far" ${t.churchArrival==='far'?'checked':''}> Depuis un autre lieu</label>
              <div id="church-far-options" class="${t.churchArrival==='far'?'':'hidden'}">
                <input type="text" id="t-pass-city" class="compact-input" value="${this.esc(t.city)}" placeholder="Ville de départ *">
                <input type="date" id="t-pass-day"  class="compact-input" value="${this.esc(t.departureDay)}">
              </div>
            </div>
            <label style="display:block;margin-bottom:6px;font-size:14px;"><input type="checkbox" class="p-need-cb" value="church-venue" ${n.includes('church-venue')?'checked':''}> De l'église à la Scie du May</label>
            <label style="display:block;margin-bottom:6px;font-size:14px;"><input type="checkbox" class="p-need-cb" value="night" ${n.includes('night')?'checked':''}> Aller à mon lieu de couchage le soir</label>
            <div id="night-fields" class="${n.includes('night')?'':'hidden'}" style="margin-left:20px;">
              <input type="text"   id="night-name"     class="compact-input" value="${this.esc(t.nightName)}"     placeholder="Nom du lieu *">
              <input type="text"   id="night-address"  class="compact-input" value="${this.esc(t.nightAddress)}"  placeholder="Adresse *">
              <input type="text"   id="night-city"     class="compact-input" value="${this.esc(t.nightCity)}"     placeholder="Ville *">
              <input type="text"   id="night-zip"      class="compact-input" value="${this.esc(t.nightZip)}"      placeholder="Code postal *">
              <input type="number" id="night-distance" class="compact-input" value="${this.esc(t.nightDistance)}" placeholder="Distance depuis réception (min) *">
            </div>
            <label style="display:block;margin-bottom:10px;font-size:14px;"><input type="checkbox" class="p-need-cb" value="brunch" ${n.includes('brunch')?'checked':''}> Venir au brunch le dimanche</label>
            <select id="t-pass-seats" class="compact-input">
              ${[1,2,3,4,5].map(n=>`<option value="${n}" ${t.seatsNeeded==n?'selected':''}>${n} place${n>1?'s':''} nécessaire${n>1?'s':''}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secondary prev-btn">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn">Suivant →</button>
        </div>
      </div>`;
  },

  renderStep5() {
    const v = this.currentStep === 5;
    const acc = this.guestData.accommodationStatus;
    const accName = this.guestData.accommodationName || '';

    // Trouver l'hébergement sélectionné pour afficher les infos
    const selected = this._accommodations.find(a => a.id === this.guestData.accommodationId);
    let infoBox = '';
    if (selected) {
      const spots = selected.spotsLeft;
      const total = selected.capacityNumber;
      let spotsLine = '';
      if (total > 0 && spots !== undefined) {
        const color = spots === 0 ? '#c0392b' : spots <= 2 ? '#b7770d' : '#1e8449';
        spotsLine = `<div style="color:${color};font-weight:600;margin-top:4px;">
          🛏️ ${spots} place${spots>1?'s':''} restante${spots>1?'s':''} / ${total}
        </div>`;
      }
      infoBox = `<div class="acc-info-box">
        <strong>${selected.name}</strong><br>
        📏 ${selected.distance || '—'}<br>
        ${selected.description || ''}
        ${spotsLine}
      </div>`;
    }

    return `
      <div class="form-step ${v?'active':''}" id="step-5">
        <div class="attendance-options">
          <button type="button" class="choice-btn ${acc==='found'    ?'selected':''}" data-acc="found">    <span>🏡</span> <strong>J'ai trouvé un logement</strong></button>
          <button type="button" class="choice-btn ${acc==='searching'?'selected':''}" data-acc="searching"><span>🔍</span> <strong>Je cherche encore</strong></button>
        </div>

        <div id="acc-found-section" class="${acc==='found'?'':'hidden'}" style="margin-top:14px;">
          <label style="font-size:14px;font-weight:500;display:block;margin-bottom:6px;">Où logerez-vous ?</label>
          <div class="acc-autocomplete">
            <input type="text" id="acc-name-input" class="compact-input" 
              value="${this.esc(accName)}" 
              placeholder="Tapez au moins 3 lettres pour chercher…"
              autocomplete="off">
            <div id="acc-suggestions" class="acc-suggestions hidden"></div>
          </div>
          ${infoBox}
        </div>

        <p style="font-size:13px;color:#777;text-align:center;font-style:italic;margin-top:14px;">
          Les hébergements du Pilat se remplissent vite — réservez dès que possible !<br>
          <a href="#/hebergements" style="color:#9b8660;">Voir la liste des hébergements →</a>
        </p>

        <div class="form-actions" style="margin-top:2rem;">
          <button type="button" class="btn btn--secondary prev-btn">← Précédent</button>
          <button type="button" class="btn btn--primary next-btn" id="final-submit-btn">Confirmer ma réponse ✓</button>
        </div>
      </div>`;
  },

  attachEvents() {
    this.container.querySelectorAll('.next-btn').forEach(btn => btn.addEventListener('click', () => this.handleNext()));
    this.container.querySelectorAll('.prev-btn').forEach(btn => btn.addEventListener('click', () => this.handlePrev()));

    // Présence / brunch / hébergement
    this.container.querySelectorAll('[data-val],[data-brunch],[data-acc]').forEach(btn => {
      btn.addEventListener('click', e => {
        const d = e.currentTarget.dataset;
        if (d.val)   this.guestData.attending = d.val==='true' ? true : d.val==='false' ? false : 'maybe';
        if (d.brunch) this.guestData.brunch   = d.brunch === 'true';
        if (d.acc) {
          this.guestData.accommodationStatus = d.acc;
          if (d.acc !== 'found') { this.guestData.accommodationId = null; this.guestData.accommodationName = ''; }
        }
        this.saveCurrentStepData();
        this.render();
      });
    });

    // Accompagnants
    const compSelect = this.container.querySelector('#guest-companions-count');
    if (compSelect) {
      compSelect.addEventListener('change', e => {
        const count = parseInt(e.target.value, 10);
        while (this.guestData.companions.length < count) this.guestData.companions.push({ name:'', diet:[], allergyDetails:'' });
        if (this.guestData.companions.length > count) this.guestData.companions = this.guestData.companions.slice(0, count);
        this.render();
      });
    }

    // Régimes
    this.container.querySelectorAll('.diet-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const sub = this.container.querySelector(`#allergy-details-${cb.dataset.person}`);
        if (cb.value === 'allergy' && sub) sub.classList.toggle('hidden', !cb.checked);
      });
    });
    this.container.querySelectorAll('.allergy-other-trigger').forEach(cb => {
      cb.addEventListener('change', () => {
        const inp = this.container.querySelector(`.allergy-other-input[data-person="${cb.dataset.person}"]`);
        if (inp) inp.classList.toggle('hidden', !cb.checked);
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

    // Autocomplete hébergement
    const accInput = this.container.querySelector('#acc-name-input');
    const accSugg  = this.container.querySelector('#acc-suggestions');
    if (accInput && accSugg) {
      accInput.addEventListener('input', () => {
        const val = accInput.value.trim();
        if (val.length < 3) { accSugg.classList.add('hidden'); accSugg.innerHTML = ''; return; }

        const matches = this._accommodations.filter(a =>
          a.name.toLowerCase().includes(val.toLowerCase())
        );

        if (!matches.length) { accSugg.classList.add('hidden'); return; }

        accSugg.innerHTML = matches.map(a => {
          let spotsHtml = '';
          if (a.capacityNumber > 0 && a.spotsLeft !== undefined) {
            const cls = a.spotsLeft === 0 ? 'red' : a.spotsLeft <= 2 ? 'orange' : 'green';
            spotsHtml = `<span class="acc-spots ${cls}">(${a.spotsLeft} place${a.spotsLeft>1?'s':''} restante${a.spotsLeft>1?'s':''})</span>`;
          }
          return `<div class="acc-suggestion" data-id="${a.id}" data-name="${this.esc(a.name)}">
            ${a.name} ${spotsHtml}
          </div>`;
        }).join('');

        accSugg.classList.remove('hidden');

        accSugg.querySelectorAll('.acc-suggestion').forEach(item => {
          item.addEventListener('click', () => {
            this.guestData.accommodationId   = item.dataset.id;
            this.guestData.accommodationName = item.dataset.name;
            accInput.value = item.dataset.name;
            accSugg.classList.add('hidden');
            // Rafraîchir l'info box sans re-render complet
            this.render();
          });
        });
      });

      // Fermer suggestions si clic ailleurs
      document.addEventListener('click', e => {
        if (!accInput.contains(e.target) && !accSugg.contains(e.target)) {
          accSugg.classList.add('hidden');
        }
      }, { once: false });
    }
  },

  saveCurrentStepData() {
    if (this.currentStep === 1) {
      this.guestData.firstName = (document.getElementById('guest-firstname')?.value || '').trim();
      this.guestData.lastName  = (document.getElementById('guest-lastname')?.value  || '').trim();
      this.guestData.phone     = (document.getElementById('guest-phone')?.value     || '').trim();
      this.container.querySelectorAll('.companion-name').forEach(inp => {
        if (this.guestData.companions[inp.dataset.index])
          this.guestData.companions[inp.dataset.index].name = inp.value.trim();
      });
    }
    if (this.currentStep === 3) {
      const proc = key => {
        const diets = Array.from(this.container.querySelectorAll(`.diet-cb[data-person="${key}"]:checked`)).map(c => c.value);
        let allergy = '';
        if (diets.includes('allergy')) {
          this.container.querySelectorAll(`.allergy-sub-cb[data-person="${key}"]:checked`).forEach(c => {
            if (c.value === 'Autre') {
              const txt = this.container.querySelector(`.allergy-other-input[data-person="${key}"]`)?.value.trim();
              if (txt) allergy += ` [Autre: ${txt}]`;
            } else allergy += ` [${c.value}]`;
          });
        }
        return { diet: diets, details: allergy.trim() };
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
    if (this.currentStep === 5) {
      // accommodationId et accommodationName sont mis à jour par le clic sur suggestion
      const inp = document.getElementById('acc-name-input');
      if (inp && inp.value.trim() !== this.guestData.accommodationName) {
        // L'utilisateur a modifié le texte sans sélectionner de suggestion
        this.guestData.accommodationName = inp.value.trim();
        this.guestData.accommodationId   = null;
      }
    }
  },

  validateStep() {
    if (this.currentStep === 1) {
      if (!this.guestData.firstName || !this.guestData.lastName || !this.guestData.phone) {
        Animations.showToast('Veuillez remplir Prénom, Nom et Téléphone', 'error'); return false;
      }
      if (this.guestData.attending === null) {
        Animations.showToast('Veuillez indiquer votre présence', 'error'); return false;
      }
      if (this.guestData.attending === true && !this.guestData.companions.every(c => c.name.trim())) {
        Animations.showToast('Veuillez renseigner les noms des accompagnants', 'error'); return false;
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