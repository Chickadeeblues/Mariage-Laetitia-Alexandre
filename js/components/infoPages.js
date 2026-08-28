/**
 * infoPages.js — Pages Messe & Réception / Animations / Contacts / Liste
 * Un seul fichier pour les 4 sous-pages d'information.
 */

// 3) Liste des types d'animation, inspirée de ce qui se fait couramment dans les mariages
const ANIMATION_TYPES = [
  'Discours',
  'Chant',
  'Danse / Chorégraphie',
  'Jeu pour les mariés',
  'Jeu pour les invités',
  'Sketch / Mise en scène',
  'Diaporama souvenirs',
  'Quiz sur les mariés',
  'Flashmob',
  'Vidéo / Montage',
  'Autre'
];

// 6) Matériel : liste élargie à ce qui est raisonnable de prévoir pour un mariage
const EQUIPMENT_LABELS = {
  videoprojecteur: 'Vidéo-projecteur',
  ecran: 'Écran de projection',
  micro: 'Micro',
  sono: 'Enceinte / Sono',
  branchement: 'Branchement musique (Bluetooth / Jack / clé USB)',
  espace: 'Espace dégagé (danse, jeu)',
  chaises: 'Chaises pour les invités'
};
function equipLabel(code) {
  return EQUIPMENT_LABELS[code] || code;
}

// 1) Les deux zones de la soirée
const TIMING_SLOTS = [
  { value: "Vin d'honneur", title: "Pendant le vin d'honneur", desc: 'Discours des familles et des témoins des mariés' },
  { value: 'Pendant le repas', title: 'Pendant le repas', desc: 'Ouvert à tous les invités !' }
];

// Affiche les deux zones du programme, côte à côte sur grand écran (empilées sur petit écran, cf. CSS).
// Tant que `revealed` est faux, seul le prénom apparaît (pour garder la surprise) ; le type et le matériel sont masqués.
function renderProgram(anims, revealed) {
  const zonesHtml = TIMING_SLOTS.map(slot => {
    const slotAnims = anims.filter(a => a.timing === slot.value);
    return `
      <div class="anim-zone-card" data-timing="${slot.value}">
        <h3>${slot.title}</h3>
        <p class="zone-desc">${slot.desc}</p>
        <div class="anim-zone-list">
          ${slotAnims.length === 0
            ? '<p class="anim-empty">Aucune proposition pour le moment</p>'
            : slotAnims.map(a => {
                const equipList = [...(a.equipment || []).map(equipLabel), a.equipmentOther].filter(Boolean);
                return `
                  <div class="anim-entry">
                    <p class="anim-entry-name">
                      🎉 <strong>${a.firstName}</strong>
                      ${revealed ? ` — ${a.type}` : ' <span class="anim-surprise-tag">prépare une surprise...</span>'}
                    </p>
                    ${revealed && equipList.length ? `<p class="anim-entry-equip">🎛️ Matériel : ${equipList.join(', ')}</p>` : ''}
                  </div>
                `;
              }).join('')
          }
        </div>
        <button type="button" class="btn-participate-zone" data-timing="${slot.value}">✋ Je veux participer</button>
      </div>
    `;
  }).join('');

  return `<div class="anim-zones">${zonesHtml}</div>`;
}

// 7) Liste des propositions du guest connecté, avec édition / suppression
function renderMyAnimations(myAnims) {
  if (!myAnims || myAnims.length === 0) return '';
  return `
    <div class="my-animations">
      <h4>📋 Mes propositions</h4>
      ${myAnims.map(a => `
        <div class="my-anim-row">
          <div>
            <strong class="my-anim-type">${a.type}</strong>
            <span class="my-anim-timing"> — ${a.timing}</span>
          </div>
          <div class="my-anim-actions">
            <button type="button" class="btn-edit-anim" data-id="${a.id}" title="Modifier">✎ Modifier</button>
            <button type="button" class="btn-delete-anim" data-id="${a.id}" title="Supprimer">🗑️ Supprimer</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Formulaire de proposition d'animation. Le prénom est récupéré automatiquement
// via Store.getCurrentGuest() ; si aucun invité n'est identifié, on le demande manuellement.
// `editingEntry` (facultatif) : pré-remplit le formulaire pour une modification.
function renderParticipationForm(currentGuest, defaultTiming, editingEntry = null) {
  const firstNameBlock = currentGuest
    ? `<p style="margin-bottom:12px; font-size:14px;">Inscription au nom de <strong>${currentGuest.firstName}</strong> ✅</p>`
    : `
      <p style="margin-bottom:8px; font-size:13px; color:#c0392b;">
        Nous n'avons pas retrouvé votre fiche invité. Merci d'indiquer votre prénom :
      </p>
      <input type="text" id="anim-firstname-manual" placeholder="Votre prénom" class="form-control" required style="width:100%; margin-bottom:12px;" value="${editingEntry?.firstName || ''}">
    `;

  const timing = editingEntry?.timing || defaultTiming || TIMING_SLOTS[0].value;
  const selectedType = editingEntry?.type || '';
  const selectedEquipment = editingEntry?.equipment || [];
  const equipmentOtherVal = editingEntry?.equipmentOther || '';

  return `
    <form id="animation-form" style="background:#fdfaf5; padding:20px; border-radius:8px; border:2px solid #e7dcc4;">
      ${editingEntry ? `<input type="hidden" id="anim-edit-id" value="${editingEntry.id}">` : ''}

      <!-- 2) Message mis en avant : 5 min max + bienveillance -->
      <div style="background:#fff3cd; border:1px solid #ffe28a; border-radius:8px; padding:12px 14px; margin-bottom:16px;">
        <p style="margin:0; font-size:13px; color:#6b5b1e; line-height:1.6;">
          ⏱️ <strong>5 minutes maximum</strong> — et on compte sur vous pour des mots et des moments
          <strong>positifs et bienveillants</strong> ! 💛
        </p>
      </div>

      ${firstNameBlock}

      <!-- 4) Moment souhaité : Vin d'honneur ou Repas uniquement -->
      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Moment souhaité</label>
      <div style="margin-bottom:16px; display:flex; gap:20px;">
        ${TIMING_SLOTS.map(slot => `
          <label style="font-size:13px;">
            <input type="radio" name="anim-timing" value="${slot.value}" ${timing === slot.value ? 'checked' : ''}> ${slot.title}
          </label>
        `).join('')}
      </div>

      <!-- 3) Type d'animation, liste élargie -->
      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Type d'animation</label>
      <select id="anim-type" class="form-control" required style="width:100%; margin-bottom:16px;">
        <option value="">-- Choisir --</option>
        ${ANIMATION_TYPES.map(t => `<option value="${t}" ${selectedType === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>

      <!-- 6) Matériel, liste élargie -->
      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Matériel dont vous pourriez avoir besoin</label>
      <div style="margin-bottom:8px; display:flex; flex-wrap:wrap; gap:8px 16px;">
        ${Object.entries(EQUIPMENT_LABELS).map(([code, label]) => `
          <label style="font-size:13px;">
            <input type="checkbox" class="anim-equipment" value="${code}" ${selectedEquipment.includes(code) ? 'checked' : ''}> ${label}
          </label>
        `).join('')}
      </div>
      <input type="text" id="anim-equipment-other" placeholder="Autre besoin (précisez)" class="form-control" style="width:100%; margin-bottom:16px;" value="${equipmentOtherVal}">

      <div style="display:flex; gap:10px;">
        <button type="submit" class="btn btn--primary">${editingEntry ? 'Enregistrer les modifications' : 'Envoyer ma proposition'}</button>
        <button type="button" id="btn-cancel-form" class="btn" style="background:#eee; color:#555;">Annuler</button>
      </div>
    </form>
  `;
}

const INFO_PAGES = {
  messe: {
    pageId: 'page-infos-messe',
    route:  '#/infos/messe',
    render() {
      return `
        <div class="container">
          <div class="section-header animate-on-scroll">
            <h2>${window.I18n.t('messe.title')}</h2>
            <div class="ornament"></div>
          </div>
          <div class="info-content card" style="max-width:680px;margin:0 auto;padding:32px;">
            <div class="timeline">
              <div class="tl-item">
                <div class="tl-time">14h30</div>
                <div class="tl-body">
                  <h4>${window.I18n.t('messe.welcome.title')}</h4>
                  <p>${window.I18n.t('messe.welcome.desc')}</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-time">15h00</div>
                <div class="tl-body">
                  <h4>${window.I18n.t('messe.ceremony.title')}</h4>
                  <p>${window.I18n.t('messe.ceremony.desc')}</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-time">16h30</div>
                <div class="tl-body">
                  <h4>${window.I18n.t('messe.convoy.title')}</h4>
                  <p>${window.I18n.t('messe.convoy.desc')}</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-time">17h00</div>
                <div class="tl-body">
                  <h4>${window.I18n.t('messe.cocktail.title')}</h4>
                  <p>${window.I18n.t('messe.cocktail.desc')}</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-time">20h00</div>
                <div class="tl-body">
                  <h4>${window.I18n.t('messe.dinner.title')}</h4>
                  <p>${window.I18n.t('messe.dinner.desc')}</p>
                </div>
              </div>
            </div>
            <p class="info-placeholder-note">
              ${window.I18n.t('messe.note')}
            </p>
          </div>
        </div>`;
    }
  },

  animations: {
  pageId: 'page-infos-animations',
  route:  '#/infos/animations',
  render() {
    return `
      <div class="container" id="animations-container">
        <div class="section-header animate-on-scroll" style="position:relative;">
          <h2>${window.I18n.t('anim.title')}</h2>
          <div class="ornament"></div>
          <button id="btn-reveal" class="btn" style="position:absolute; top:0; right:0; display:none;">${window.I18n.t('anim.btn.reveal')}</button>
        </div>

        <div id="my-animations-content"></div>
        <div id="program-content"></div>
        <div id="form-content" style="display:none; margin-top:20px;"></div>
      </div>`;
  }
},
  
  contacts: {
    pageId: 'page-infos-contacts',
    route:  '#/infos/contacts',
    render() {
      return `
        <div class="container">
          <div class="section-header animate-on-scroll">
            <h2>${window.I18n.t('contact.title')}</h2>
            <div class="ornament"></div>
          </div>
          <div class="info-content" style="max-width:680px;margin:0 auto;">
            <div class="card" style="padding:24px;margin-bottom:16px;">
              <h4 style="color:#2D5A3D;margin-bottom:4px;">${window.I18n.t('contact.bridegroom.title')}</h4>
              <p style="font-size:14px;color:#666;">${window.I18n.t('contact.bridegroom.desc')}</p>
            </div>
            <div class="card" style="padding:24px;margin-bottom:16px;">
              <h4 style="color:#2D5A3D;margin-bottom:4px;">${window.I18n.t('contact.witnessBride.title')}</h4>
              <p style="font-size:14px;color:#666;">${window.I18n.t('contact.witnessBride.desc')}</p>
            </div>
            <div class="card" style="padding:24px;margin-bottom:16px;">
              <h4 style="color:#2D5A3D;margin-bottom:4px;">${window.I18n.t('contact.witnessGroom.title')}</h4>
              <p style="font-size:14px;color:#666;">${window.I18n.t('contact.witnessGroom.desc')}</p>
            </div>
            <div class="card" style="padding:24px;">
              <h4 style="color:#2D5A3D;margin-bottom:4px;">${window.I18n.t('contact.domain.title')}</h4>
              <p style="font-size:14px;color:#666;">${window.I18n.t('contact.domain.desc')}</p>
            </div>
            <p class="info-placeholder-note" style="margin-top:16px;">
              ${window.I18n.t('contact.note')}
            </p>
          </div>
        </div>`;
    }
  },

  liste: {
    pageId: 'page-liste',
    route:  '#/liste',
    render() {
      return `
        <div class="container">
          <div class="section-header animate-on-scroll">
            <h2>${window.I18n.t('liste.title')}</h2>
            <div class="ornament"></div>
          </div>
          <div class="info-content card" style="max-width:680px;margin:0 auto;padding:32px;text-align:center;">
            <span style="font-size:3rem;display:block;margin-bottom:16px;">💝</span>
            <p style="font-size:16px;color:#5c4e35;font-style:italic;line-height:1.8;">
              ${window.I18n.t('liste.desc')}
            </p>
            <p class="info-placeholder-note" style="margin-top:24px;">
              ${window.I18n.t('liste.note')}
            </p>
          </div>
        </div>`;
    }
  }
};

const InfoPages = {
  currentRoute: null,
  init() {
    const renderPage = async (route) => {
      const page = Object.values(INFO_PAGES).find(p => p.route === route);
      if (!page) return;

      const el = document.getElementById(page.pageId);
      if (!el) return;

      // 1. Charger les paramètres de publication
      let settings = { messe: true, animations: true, contacts: true, liste: true };
      try {
        const StoreModule = await import('../store.js');
        settings = await StoreModule.default.getSettings('publication');
      } catch (err) {}

      // Trouver la clé correspondante
      const keyMap = {
        '#/infos/messe': 'messe',
        '#/infos/animations': 'animations',
        '#/infos/contacts': 'contacts',
        '#/liste': 'liste'
      };
      const pubKey = keyMap[route];
      
      const isPublished = pubKey ? settings[pubKey] : true;

      if (!isPublished) {
        el.innerHTML = `
          <div class="container" style="text-align: center; padding: 4rem 1rem;">
             <span style="font-size:3rem;display:block;margin-bottom:16px;">⏳</span>
             <h3 style="color:#2D5A3D; font-family: var(--font-display);">${window.I18n.t('publication.comingSoon')}</h3>
          </div>
        `;
        return; // on s'arrête ici
      }

      // 1b. Si publié, on injecte le vrai HTML
      el.innerHTML = page.render(); 

      // 2. Si c'est la page animations, on attache les écouteurs ICI
      if (route === '#/infos/animations') {
        const progEl = document.getElementById('program-content');
        const formEl = document.getElementById('form-content');
        const myAnimsEl = document.getElementById('my-animations-content');
        const btnReveal = document.getElementById('btn-reveal');

        let isRevealed = false;

        const StoreModule = await import('../store.js');
        const StoreRef = StoreModule.default;

        // Le bouton "Révéler" reste réservé aux mariés (accès admin), sinon la surprise
        // pourrait être cassée par n'importe quel invité qui cliquerait dessus.
        if (btnReveal) btnReveal.style.display = StoreRef.isAdmin() ? 'inline-block' : 'none';

        const currentGuest = await StoreRef.getCurrentGuest();

        const loadProgram = async () => {
          const anims = await StoreRef.getAnimations();
          if (progEl) progEl.innerHTML = renderProgram(anims, isRevealed);
        };

        const loadMyAnimations = async () => {
          if (!currentGuest || !myAnimsEl) { if (myAnimsEl) myAnimsEl.innerHTML = ''; return; }
          const mine = await StoreRef.getAnimationsByGuestId(currentGuest.id);
          myAnimsEl.innerHTML = renderMyAnimations(mine);
        };

        await Promise.all([loadProgram(), loadMyAnimations()]);

        // 7) Ouvre le formulaire (création ou modification selon `editingEntry`)
        const openForm = (defaultTiming, editingEntry = null) => {
          formEl.innerHTML = renderParticipationForm(currentGuest, defaultTiming, editingEntry);
          formEl.style.display = 'block';
          formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

          document.getElementById('btn-cancel-form')?.addEventListener('click', () => {
            formEl.style.display = 'none';
            formEl.innerHTML = '';
          });

          document.getElementById('animation-form')?.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const form = ev.target;

            const firstName = currentGuest?.firstName || form.querySelector('#anim-firstname-manual')?.value.trim();
            if (!firstName) {
              alert("Merci d'indiquer votre prénom.");
              return;
            }

            const timing = form.querySelector('input[name="anim-timing"]:checked')?.value;
            const type = form.querySelector('#anim-type').value;
            if (!timing || !type) {
              alert("Merci de choisir un moment et un type d'animation.");
              return;
            }

            const equipment = Array.from(form.querySelectorAll('.anim-equipment:checked')).map(cb => cb.value);
            const equipmentOther = form.querySelector('#anim-equipment-other').value.trim();
            const editId = form.querySelector('#anim-edit-id')?.value;

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalLabel = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi...';

            try {
              const payload = { guestId: currentGuest?.id || null, firstName, type, timing, equipment, equipmentOther };
              if (editId) {
                await StoreRef.updateAnimation(editId, payload);
              } else {
                await StoreRef.saveAnimation(payload);
              }

              alert(editId ? 'Votre proposition a été mise à jour.' : window.I18n.t('anim.submit'));

              formEl.style.display = 'none';
              formEl.innerHTML = '';
              await Promise.all([loadProgram(), loadMyAnimations()]);
            } catch (err) {
              console.error('[InfoPages] Erreur envoi animation :', err);
              alert('Une erreur est survenue, merci de réessayer.');
              submitBtn.disabled = false;
              submitBtn.textContent = originalLabel;
            }
          });
        };

        // 1) Un bouton "Je veux participer" par zone (délégation, car injectés dynamiquement)
        progEl?.addEventListener('click', (e) => {
          const btn = e.target.closest('.btn-participate-zone');
          if (btn) openForm(btn.dataset.timing);
        });

        // 7) Modifier / supprimer une proposition existante
        myAnimsEl?.addEventListener('click', async (e) => {
          const editBtn = e.target.closest('.btn-edit-anim');
          if (editBtn) {
            const mine = await StoreRef.getAnimationsByGuestId(currentGuest.id);
            const entry = mine.find(a => String(a.id) === editBtn.dataset.id);
            if (entry) openForm(entry.timing, entry);
            return;
          }
          const delBtn = e.target.closest('.btn-delete-anim');
          if (delBtn) {
            if (confirm('Supprimer cette proposition ?')) {
              try {
                await StoreRef.deleteAnimation(delBtn.dataset.id);
                await Promise.all([loadProgram(), loadMyAnimations()]);
              } catch (err) {
                console.error('[InfoPages] Erreur suppression animation :', err);
                alert('La suppression a échoué : ' + err.message);
              }
            }
          }
        });

        // Révéler (mariés uniquement)
        btnReveal?.addEventListener('click', async () => {
          isRevealed = !isRevealed;
          btnReveal.textContent = isRevealed ? window.I18n.t('anim.btn.hide') : window.I18n.t('anim.btn.reveal');
          await loadProgram();
        });
      }
    };
    
    window.addEventListener('route-changed', async (e) => {
      InfoPages.currentRoute = e.detail.route;
      await renderPage(e.detail.route);
    });
    
    window.addEventListener('language-changed', async () => {
      if (InfoPages.currentRoute) {
        await renderPage(InfoPages.currentRoute);
      }
    });
  },
  destroy() {}
};

export default InfoPages;
// CSS injecté une seule fois
if (!document.getElementById('info-pages-styles')) {
  const s = document.createElement('style');
  s.id = 'info-pages-styles';
  s.textContent = `
    .info-content { }
    .info-placeholder-note { font-size:13px;color:#aaa;font-style:italic;margin-top:16px; }
    .info-placeholder-note a { color:#9b8660; }
    /* Timeline */
    .timeline { display:flex;flex-direction:column;gap:0; }
    .tl-item { display:flex;gap:16px;padding-bottom:24px;position:relative; }
    .tl-item::before { content:'';position:absolute;left:52px;top:24px;bottom:0;width:2px;background:#f0ebe0; }
    .tl-item:last-child::before { display:none; }
    .tl-time { width:44px;flex-shrink:0;font-size:13px;font-weight:600;color:#9b8660;padding-top:2px;text-align:right; }
    .tl-body { flex:1; }
    .tl-body h4 { margin:0 0 4px;font-size:15px;color:#2D5A3D; }
    .tl-body p  { margin:0;font-size:13px;color:#666;line-height:1.6; }
    /* Formulaire animations */
    #animation-form .form-control { padding:8px 10px; border:1px solid #e0d9c8; border-radius:6px; font-size:14px; font-family:var(--font-body); }
    #animation-form input[type="checkbox"] { margin-right:4px; }

    /* 2) Zones "Vin d'honneur" / "Repas" : côte à côte sur grand écran, empilées sur petit écran */
    .anim-zones { display:flex; gap:20px; align-items:stretch; margin-bottom:20px; }
    .anim-zone-card {
      flex:1; min-width:0; display:flex; flex-direction:column;
      background:#fff; border-radius:10px; padding:22px;
      box-shadow:0 2px 10px rgba(0,0,0,0.06);
    }
    .anim-zone-card h3 { margin:0 0 6px; font-size:19px; color:#2D5A3D; }
    .anim-zone-card .zone-desc { margin:0 0 16px; font-size:14px; color:#9b8660; font-style:italic; }
    .anim-zone-list { flex:1; margin-bottom:18px; }
    .anim-empty { margin:0; font-size:14px; color:#ccc; }
    .anim-entry { padding:9px 0; border-bottom:1px solid #f0ebe0; }
    .anim-entry-name { margin:0; font-size:15px; color:#333; line-height:1.5; }
    .anim-entry-equip { margin:4px 0 0; font-size:13px; color:#9b8660; }
    .anim-surprise-tag { color:#9b8660; font-style:italic; }
    @media (max-width:768px) {
      .anim-zones { flex-direction:column; }
    }

    /* 3) Bouton "Je veux participer" nettement plus visible */
    .btn-participate-zone {
      margin-top:auto; align-self:flex-start;
      background:#2D5A3D; color:#fff; font-weight:600; font-size:14px;
      padding:11px 24px; border:none; border-radius:24px; cursor:pointer;
      box-shadow:0 3px 10px rgba(45,90,61,0.3);
      transition:background 0.2s ease, transform 0.15s ease;
    }
    .btn-participate-zone:hover { background:#234a32; transform:translateY(-1px); }

    /* Mes propositions */
    .my-animations { margin-bottom:20px; padding:16px 18px; background:#f4f8f3; border-radius:8px; border:1px dashed #a9c6a0; }
    .my-animations h4 { margin:0 0 10px; color:#2D5A3D; font-size:15px; }
    .my-anim-row { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:9px 0; border-bottom:1px solid #e2ecdf; }
    .my-anim-type { font-size:14px; color:#333; }
    .my-anim-timing { font-size:13px; color:#666; }
    .my-anim-actions { display:flex; gap:8px; flex-shrink:0; }
    .btn-edit-anim, .btn-delete-anim {
      background:#fff; border-radius:5px; padding:6px 12px; cursor:pointer; font-size:13px; font-weight:600;
    }
    .btn-edit-anim { border:1px solid #ced4da; color:#555; }
    .btn-delete-anim { border:1px solid #f5c6cb; color:#c0392b; }
  `;
  document.head.appendChild(s);
}