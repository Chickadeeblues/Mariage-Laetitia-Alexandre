/**
 * infoPages.js — Pages Messe & Réception / Animations / Contacts / Liste
 * Un seul fichier pour les 4 sous-pages d'information.
 */

// Libellés des équipements pour affichage (les valeurs stockées restent des codes courts)
const EQUIPMENT_LABELS = {
  videoprojecteur: 'Vidéo-projecteur',
  micro: 'Micro'
};
function equipLabel(code) {
  return EQUIPMENT_LABELS[code] || code;
}

// Affiche le programme de la soirée. Tant que `revealed` est faux, seul le prénom
// apparaît (pour garder la surprise) ; le type, la description et le matériel sont masqués.
function renderProgram(anims, revealed) {
  const slots = ['Vin d\'honneur', 'Pendant le repas', 'Premier intermède', 'Deuxième intermède'];
  return slots.map(slot => {
    const slotAnims = anims.filter(a => a.timing === slot);
    return `
      <div class="slot-card" style="margin-bottom:20px; padding:15px; background:#fff; border-radius:8px;">
        <h3>${slot}</h3>
        ${slotAnims.length === 0
          ? '<p style="color:#ccc;">Aucune animation pour le moment</p>'
          : slotAnims.map(a => {
              const equipList = [...(a.equipment || []).map(equipLabel), a.equipmentOther].filter(Boolean);
              return `
                <div class="anim-entry" style="padding:8px 0; border-bottom:1px solid #f0ebe0;">
                  <p style="margin:0;">
                    🎉 <strong>${a.firstName}</strong>
                    ${revealed ? ` — ${a.type}` : ' <span style="color:#9b8660;">prépare une surprise...</span>'}
                  </p>
                  ${revealed && a.details ? `<p style="margin:4px 0 0; font-size:13px; color:#666;">${a.details}</p>` : ''}
                  ${revealed && equipList.length ? `<p style="margin:4px 0 0; font-size:12px; color:#9b8660;">🎛️ Matériel : ${equipList.join(', ')}</p>` : ''}
                </div>
              `;
            }).join('')
        }
      </div>
    `;
  }).join('');
}

// Formulaire de proposition d'animation. Le prénom est récupéré automatiquement
// via Store.getCurrentGuest() ; si aucun invité n'est identifié, on le demande manuellement.
function renderParticipationForm(currentGuest) {
  const firstNameBlock = currentGuest
    ? `<p style="margin-bottom:12px; font-size:14px;">Inscription au nom de <strong>${currentGuest.firstName}</strong> ✅</p>`
    : `
      <p style="margin-bottom:8px; font-size:13px; color:#c0392b;">
        Nous n'avons pas retrouvé votre fiche invité. Merci d'indiquer votre prénom :
      </p>
      <input type="text" id="anim-firstname-manual" placeholder="Votre prénom" class="form-control" required style="width:100%; margin-bottom:12px;">
    `;

  return `
    <form id="animation-form" style="background:#fdfaf5; padding:20px; border-radius:8px;">
      <p><em>Remplissez ce formulaire pour proposer une animation (5 min max). Votre prénom sera visible dans le programme, mais le détail restera une surprise jusqu'au jour J 🤫</em></p>
      ${firstNameBlock}

      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Type d'animation</label>
      <select id="anim-type" class="form-control" required style="width:100%; margin-bottom:12px;">
        <option value="">-- Choisir --</option>
        <option value="Discours">Discours</option>
        <option value="Chant">Chant</option>
        <option value="Danse">Danse</option>
        <option value="Jeu">Jeu</option>
        <option value="Vidéo">Vidéo</option>
        <option value="Autre">Autre</option>
      </select>

      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Moment souhaité</label>
      <select id="anim-timing" class="form-control" required style="width:100%; margin-bottom:12px;">
        <option>Vin d'honneur</option>
        <option>Pendant le repas</option>
        <option>Premier intermède</option>
        <option>Deuxième intermède</option>
      </select>

      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Précisez votre idée (facultatif)</label>
      <textarea id="anim-details" class="form-control" rows="3" style="width:100%; margin-bottom:12px; box-sizing:border-box;" placeholder="Ex : une chanson personnalisée avec un couplet par ami..."></textarea>

      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Matériel dont vous pourriez avoir besoin</label>
      <div style="margin-bottom:6px;">
        <label style="font-size:13px; margin-right:16px;"><input type="checkbox" class="anim-equipment" value="videoprojecteur"> Vidéo-projecteur</label>
        <label style="font-size:13px;"><input type="checkbox" class="anim-equipment" value="micro"> Micro</label>
      </div>
      <input type="text" id="anim-equipment-other" placeholder="Autre besoin (précisez)" class="form-control" style="width:100%; margin-bottom:16px;">

      <button type="submit" class="btn btn--primary">Envoyer ma proposition</button>
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
        <div class="section-header animate-on-scroll">
          <h2>${window.I18n.t('anim.title')}</h2>
          <div class="ornament"></div>
        </div>
        
        <div id="animations-view-switcher" style="text-align:center; margin-bottom:20px;">
          <button id="btn-toggle-view" class="btn">${window.I18n.t('anim.btn.participate')}</button>
          <button id="btn-reveal" class="btn" style="margin-left:10px;">${window.I18n.t('anim.btn.reveal')}</button>
        </div>

        <div id="program-content"></div>
        <div id="form-content" style="display:none;"></div>
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
        const btnToggle = document.getElementById('btn-toggle-view');
        const btnReveal = document.getElementById('btn-reveal');

        let isFormVisible = false;
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
        await loadProgram();

        // Toggle Formulaire
        btnToggle?.addEventListener('click', () => {
          isFormVisible = !isFormVisible;
          progEl.style.display = isFormVisible ? 'none' : 'block';
          formEl.style.display = isFormVisible ? 'block' : 'none';
          btnToggle.textContent = isFormVisible ? window.I18n.t('anim.btn.program') : window.I18n.t('anim.btn.participate');

          if (isFormVisible) {
            formEl.innerHTML = renderParticipationForm(currentGuest);
            document.getElementById('animation-form')?.addEventListener('submit', async (ev) => {
              ev.preventDefault();
              const form = ev.target;

              const firstName = currentGuest?.firstName || form.querySelector('#anim-firstname-manual')?.value.trim();
              if (!firstName) {
                alert("Merci d'indiquer votre prénom.");
                return;
              }

              const equipment = Array.from(form.querySelectorAll('.anim-equipment:checked')).map(cb => cb.value);

              const submitBtn = form.querySelector('button[type="submit"]');
              submitBtn.disabled = true;
              submitBtn.textContent = 'Envoi...';

              try {
                await StoreRef.saveAnimation({
                  guestId: currentGuest?.id || null,
                  firstName,
                  type: form.querySelector('#anim-type').value,
                  timing: form.querySelector('#anim-timing').value,
                  details: form.querySelector('#anim-details').value.trim(),
                  equipment,
                  equipmentOther: form.querySelector('#anim-equipment-other').value.trim()
                });

                alert(window.I18n.t('anim.submit'));

                // Retour au programme, rafraîchi avec la nouvelle inscription
                isFormVisible = false;
                progEl.style.display = 'block';
                formEl.style.display = 'none';
                btnToggle.textContent = window.I18n.t('anim.btn.participate');
                await loadProgram();
              } catch (err) {
                console.error('[InfoPages] Erreur envoi animation :', err);
                alert("Une erreur est survenue, merci de réessayer.");
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer ma proposition';
              }
            });
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
    #animation-form .form-control { padding:8px 10px; border:1px solid #e0d9c8; border-radius:6px; font-size:13px; font-family:var(--font-body); }
    #animation-form input[type="checkbox"] { margin-right:4px; }
  `;
  document.head.appendChild(s);
}