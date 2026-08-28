/**
 * howToGet.js — Page "Comment venir ?"
 */
const HowToGet = {
  _elements: { page: null, contentArea: null, buttons: null },
  _mode: 'voiture', // 'voiture' ou 'train'

  init() {
    this._elements.page = document.getElementById('page-comment-venir');
    if (!this._elements.page) return;
    
    this._renderShell();
    this._updateContent();
    
    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/comment-venir') {
        this._renderShell();
        this._updateContent();
      }
    });
    
    window.addEventListener('language-changed', () => {
      if (window.location.hash === '#/comment-venir') {
        this._renderShell();
        this._updateContent();
      }
    });
  },

  _setMode(mode) {
    this._mode = mode;
    this._updateContent();
    this._updateActiveButton();
  },

  _updateActiveButton() {
    if (!this._elements.buttons) return;
    this._elements.buttons.forEach(btn => {
      if (btn.dataset.mode === this._mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  _renderShell() {
    if (!this._elements.page) return;

    this._elements.page.innerHTML = `
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>${window.I18n?.t('htg.title') || 'Comment venir ?'}</h2>
          <div class="ornament"></div>
        </div>

        <div class="htg-transport-selector">
          <button class="btn-transport ${this._mode === 'voiture' ? 'active' : ''}" data-mode="voiture">🚗 En voiture</button>
          <button class="btn-transport ${this._mode === 'train' ? 'active' : ''}" data-mode="train">🚆 En train</button>
          <a href="#/covoiturage" class="btn-transport btn-carpool" data-internal="true">Covoiturage</a>
        </div>

        <div id="htg-dynamic-content" class="htg-content-grid"></div>
      </div>

      <style>
        .htg-transport-selector { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 3rem; }
        
        /* Boutons de transport */
        .btn-transport { padding: 10px 24px; font-family: var(--font-body, 'Outfit', sans-serif); font-size: 15px; font-weight: 500; border: 1px solid var(--forest, #2D5A3D); background: var(--cream, #FAF8F5); color: var(--forest, #2D5A3D); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; text-decoration: none; display: inline-flex; align-items: center; }
        
        /* Onglet sélectionné : Vert sauge clair */
        .btn-transport.active { background: #dce3d5; color: var(--forest, #2D5A3D); border-color: var(--sage, #9CAF88); }
        .btn-transport:hover:not(.active) { background: #f0ebe0; }
        
        /* Bouton Covoiturage : Blanc cassé */
        .btn-transport.btn-carpool { background: var(--cream, #FAF8F5); color: var(--gold, #C9A84C); border-color: var(--gold, #C9A84C); }
        .btn-transport.btn-carpool:hover { background: #f0ebe0; }

        .htg-content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; }
        
        .htg-block { background: var(--white, #FFFFFF); padding: 32px; border: 1px solid #e8e0d0; border-radius: 12px; display: flex; flex-direction: column; }
        .htg-block-title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.6rem; color: var(--forest, #2D5A3D); margin: 0 0 16px 0; border-bottom: 1px solid #e8e0d0; padding-bottom: 12px; }
        
        .htg-address { font-style: normal; font-size: 15px; color: var(--text-dark, #2C2C2C); margin-bottom: 20px; line-height: 1.5; padding-left: 16px; border-left: 3px solid var(--sage, #9CAF88); }
        .htg-address strong { color: var(--forest, #2D5A3D); font-size: 16px; }
        
        .htg-block-body { flex-grow: 1; margin-bottom: 24px; }
        .htg-text { font-size: 14.5px; color: var(--text-muted, #6B6B6B); line-height: 1.6; margin-bottom: 16px; }
        .htg-text strong { color: var(--text-dark, #2C2C2C); }
        
        .htg-subtitle { font-size: 14px; font-weight: 600; color: var(--text-dark, #2C2C2C); margin: 20px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .htg-list { list-style: none; padding: 0; margin: 0; }
        .htg-list li { font-size: 14px; color: var(--text-muted, #6B6B6B); margin-bottom: 8px; padding-left: 16px; position: relative; line-height: 1.5; }
        .htg-list li::before { content: '•'; color: var(--gold, #C9A84C); position: absolute; left: 0; font-weight: bold; }
        .htg-list li strong { color: var(--text-dark, #2C2C2C); }
        
        .htg-highlight-box { background: var(--cream, #FAF8F5); border-radius: 6px; padding: 16px; font-size: 14px; color: var(--text-dark, #2C2C2C); line-height: 1.5; border-left: 3px solid var(--gold, #C9A84C); }
        .htg-pmr-box { background: #eef5f0; border-radius: 6px; padding: 12px 16px; font-size: 13.5px; color: var(--text-dark, #2C2C2C); line-height: 1.5; border-left: 3px solid var(--sage, #9CAF88); margin-top: 12px; }
        
        .htg-link-map { display: inline-block; font-size: 13px; color: var(--gold, #C9A84C); font-weight: 600; text-decoration: underline; text-underline-offset: 4px; align-self: flex-start; transition: color 0.2s; }
        .htg-link-map:hover { color: var(--forest, #2D5A3D); }
      </style>`;

    this._elements.contentArea = document.getElementById('htg-dynamic-content');
    this._elements.buttons = this._elements.page.querySelectorAll('button[data-mode]');

    this._elements.buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._setMode(e.target.dataset.mode);
      });
    });

    this._elements.page.querySelectorAll('a[data-internal="true"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        import('../utils/router.js').then(m => m.default.navigate(a.getAttribute('href')));
      });
    });
  },

  _updateContent() {
    if (!this._elements.contentArea) return;

    const isCar = this._mode === 'voiture';

    const churchContent = isCar 
      ? `<p class="htg-text">
           Le centre du village est constitué de ruelles médiévales <strong>inaccessibles aux véhicules</strong>. Prévoyez un peu de marge pour vous garer et rejoindre l'église à pied.
         </p>
         <h4 class="htg-subtitle">Parkings à disposition</h4>
         <ul class="htg-list">
           <li><strong>Place du Pressoir</strong> (à environ 5 min à pied)</li>
           <li><strong>Parking de la Mairie</strong> (à environ 5 min à pied)</li>
           <li><strong>Parking du Bourg</strong> (à environ 7 min à pied)</li>
           <li><strong>Parking des Faugés</strong> (à environ 12 min à pied, en montée)</li>
         </ul>
         <div class="htg-pmr-box">
           <strong>♿ Accessibilité :</strong> Un dépose-minute est possible devant le parking de la salle des fêtes (Rue de Renaud de Forez), permettant d'être déposé à proximité immédiate de l'église (attention, le stationnement prolongé n'y est pas garanti).
         </div>`
      : `<p class="htg-text">
           La gare la plus proche est la <strong>Gare TER Le Péage-de-Roussillon</strong> (ligne Lyon ↔ Valence, à environ 40 min de Lyon Part-Dieu).
         </p>
         <p class="htg-text">
           Depuis la gare, l'église se trouve à une quinzaine de minutes en voiture. N'hésitez pas à consulter la page covoiturage pour trouver un trajet depuis la gare.
         </p>`;

    const receptionContent = isCar
      ? `<p class="htg-text">
           Comptez environ 35 minutes depuis l'église. 
         </p>
         <div class="htg-highlight-box">
           <strong>Stationnement :</strong> Un parking gratuit est disponible sur place. Une fois arrivés à Doizieux, suivez les ballons pour trouver l'entrée du domaine !
         </div>`
      : `<p class="htg-text">
         </p>
         <div class="htg-highlight-box">
           <strong>Important :</strong> Le domaine n'étant pas desservi directement par les transports en commun, <strong>le covoiturage est indispensable</strong> depuis l'église ou la gare pour vous y rendre.
         </div>`;

    this._elements.contentArea.innerHTML = `
      <div class="htg-block">
        <h3 class="htg-block-title">Cérémonie religieuse</h3>
        <address class="htg-address">
          <strong>Église Notre-Dame-de-Pitié</strong><br>
          42520 Malleval
        </address>
        <div class="htg-block-body">
          ${churchContent}
        </div>
        <a href="https://maps.google.com/?q=Église+Notre-Dame-de-Pitié,Malleval,42520" target="_blank" rel="noopener" class="htg-link-map">Ouvrir dans Google Maps</a>
      </div>

      <div class="htg-block">
        <h3 class="htg-block-title">Réception</h3>
        <address class="htg-address">
          <strong>Domaine de la Scie du May</strong><br>
          38 Les Scies, 42740 Doizieux
        </address>
        <div class="htg-block-body">
          ${receptionContent}
        </div>
        <a href="https://maps.google.com/?q=Domaine+de+la+Scie+du+May,38+Les+Scies,Doizieux,42740" target="_blank" rel="noopener" class="htg-link-map">Ouvrir dans Google Maps</a>
      </div>
    `;
  },

  destroy() {
    this._elements.page = null;
    this._elements.contentArea = null;
    this._elements.buttons = null;
  }
};

export default HowToGet;