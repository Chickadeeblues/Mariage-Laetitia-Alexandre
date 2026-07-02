/**
 * infoPages.js — Pages Messe & Réception / Animations / Contacts / Liste
 * Un seul fichier pour les 4 sous-pages d'information.
 */
const INFO_PAGES = {
  messe: {
    pageId: 'page-infos-messe',
    route:  '#/infos/messe',
    render() {
      return `
        <div class="container">
          <div class="section-header animate-on-scroll">
            <h2>💒 Messe &amp; Réception</h2>
            <div class="ornament"></div>
          </div>
          <div class="info-content card" style="max-width:680px;margin:0 auto;padding:32px;">
            <div class="timeline">
              <div class="tl-item">
                <div class="tl-time">14h30</div>
                <div class="tl-body">
                  <h4>Accueil des invités</h4>
                  <p>Église Notre-Dame-de-Pitié, Malleval (42520)<br>
                  <em>Prévoyez d'arriver 15 min à l'avance — parking au Bourg du village.</em></p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-time">15h00</div>
                <div class="tl-body">
                  <h4>Cérémonie religieuse</h4>
                  <p>Mariage de Laetitia &amp; Alexandre.</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-time">16h30</div>
                <div class="tl-body">
                  <h4>Convoi vers le Domaine</h4>
                  <p>Domaine de la Scie du May, Doizieux (42740)<br>
                  <em>Suivez les ballons ! Parking sur place.</em></p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-time">17h00</div>
                <div class="tl-body">
                  <h4>Vin d'honneur</h4>
                  <p>Cocktails et amuse-bouches dans les jardins du domaine.</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-time">20h00</div>
                <div class="tl-body">
                  <h4>Dîner &amp; Soirée</h4>
                  <p>Repas assis, discours, animations et piste de danse.</p>
                </div>
              </div>
            </div>
            <p class="info-placeholder-note">
              ✏️ Ces horaires sont indicatifs et seront confirmés prochainement.
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
        <div class="container">
          <div class="section-header animate-on-scroll">
            <h2>🎤 Animations &amp; Discours</h2>
            <div class="ornament"></div>
          </div>
          <div class="info-content card" style="max-width:680px;margin:0 auto;padding:32px;text-align:center;">
            <span style="font-size:3rem;display:block;margin-bottom:16px;">🎶</span>
            <p style="font-size:16px;color:#5c4e35;font-style:italic;line-height:1.7;">
              Le programme des animations et des discours sera révélé très bientôt.<br>
              Tenez-vous prêts pour une soirée mémorable !
            </p>
            <p class="info-placeholder-note" style="margin-top:24px;">
              ✏️ Si vous souhaitez prendre la parole ou proposer une animation, 
              contactez les mariés via la page <a href="#/infos/contacts">Contacts utiles</a>.
            </p>
          </div>
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
            <h2>✉️ Contacts utiles</h2>
            <div class="ornament"></div>
          </div>
          <div class="info-content" style="max-width:680px;margin:0 auto;">
            <div class="card" style="padding:24px;margin-bottom:16px;">
              <h4 style="color:#2D5A3D;margin-bottom:4px;">💑 Les mariés</h4>
              <p style="font-size:14px;color:#666;">Laetitia &amp; Alexandre<br>
              Pour toute question sur le mariage, les hébergements ou le programme.<br>
              <em>Contact à venir.</em></p>
            </div>
            <div class="card" style="padding:24px;margin-bottom:16px;">
              <h4 style="color:#2D5A3D;margin-bottom:4px;">🎯 Témoin de la mariée</h4>
              <p style="font-size:14px;color:#666;"><em>Contact à venir.</em></p>
            </div>
            <div class="card" style="padding:24px;margin-bottom:16px;">
              <h4 style="color:#2D5A3D;margin-bottom:4px;">🎯 Témoin du marié</h4>
              <p style="font-size:14px;color:#666;"><em>Contact à venir.</em></p>
            </div>
            <div class="card" style="padding:24px;">
              <h4 style="color:#2D5A3D;margin-bottom:4px;">🏰 Domaine de la Scie du May</h4>
              <p style="font-size:14px;color:#666;">Doizieux, 42740<br>
              <em>Contact à venir.</em></p>
            </div>
            <p class="info-placeholder-note" style="margin-top:16px;">
              ✏️ Les contacts seront complétés prochainement.
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
            <h2>🎁 Liste de mariage</h2>
            <div class="ornament"></div>
          </div>
          <div class="info-content card" style="max-width:680px;margin:0 auto;padding:32px;text-align:center;">
            <span style="font-size:3rem;display:block;margin-bottom:16px;">💝</span>
            <p style="font-size:16px;color:#5c4e35;font-style:italic;line-height:1.8;">
              Votre présence est le plus beau des cadeaux.<br>
              Si vous souhaitez tout de même nous gâter, 
              notre liste de mariage sera bientôt disponible ici.
            </p>
            <p class="info-placeholder-note" style="margin-top:24px;">
              ✏️ Liste à venir.
            </p>
          </div>
        </div>`;
    }
  }
};

const InfoPages = {
  init() {
    Object.values(INFO_PAGES).forEach(p => {
      const el = document.getElementById(p.pageId);
      if (el && el.innerHTML.trim() === '') el.innerHTML = p.render();
    });

    window.addEventListener('route-changed', (e) => {
      const page = Object.values(INFO_PAGES).find(p => p.route === e.detail.route);
      if (page) {
        const el = document.getElementById(page.pageId);
        if (el) el.innerHTML = page.render();
        // Liens SPA internes
        el?.querySelectorAll('a[href^="#"]').forEach(a => {
          a.addEventListener('click', ev => {
            ev.preventDefault();
            import('../utils/router.js').then(m => m.default.navigate(a.getAttribute('href')));
          });
        });
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
  `;
  document.head.appendChild(s);
}