/**
 * infoHub.js — Page centrale Informations pratiques
 */
import Router from '../utils/router.js';

const InfoHub = {
  _elements: { page: null },

  init() {
    this._elements.page = document.getElementById('page-infos');
    if (!this._elements.page) return;
    this._render();

    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/infos') this._render();
    });
    
    // Re-render si la langue change
    window.addEventListener('language-changed', () => {
       if (Router.getCurrentRoute() === '#/infos') this._render();
    });
  },

  _render() {
    if (!this._elements.page) return;
    this._elements.page.innerHTML = `
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>${window.I18n.t('hub.title')}</h2>
          <div class="ornament"></div>
          <p class="text-muted">${window.I18n.t('hub.subtitle')}</p>
        </div>
        <div class="info-grid">
          ${this._cards().map(c => `
            <a href="${c.hash}" class="info-card" data-hash="${c.hash}">
              <span class="info-card__icon">${c.icon}</span>
              <h3 class="info-card__title">${c.title}</h3>
              <p class="info-card__desc">${c.desc}</p>
            </a>`).join('')}
        </div>
      </div>
      <style>
        .info-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:2rem; }
        @media(max-width:700px){ .info-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:420px){ .info-grid { grid-template-columns:1fr; } }
        .info-card { display:flex;flex-direction:column;align-items:center;text-align:center;
          padding:28px 16px;background:#fff;border:1.5px solid #e8e0d0;border-radius:14px;
          text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s,border-color .2s;cursor:pointer; }
        .info-card:hover { transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.1);border-color:#c8b89a; }
        .info-card__icon { font-size:2.4rem;margin-bottom:12px; }
        .info-card__title { font-size:1rem;font-weight:600;color:#2D5A3D;margin:0 0 6px; }
        .info-card__desc  { font-size:13px;color:#888;margin:0;line-height:1.5; }
      </style>`;

    this._elements.page.querySelectorAll('.info-card').forEach(card => {
      card.addEventListener('click', e => {
        e.preventDefault();
        Router.navigate(card.dataset.hash);
      });
    });
  },

  _cards() {
    return [
      { icon:'💒', title:window.I18n.t('hub.card.messe.title'),      hash:'#/infos/messe',      desc:window.I18n.t('hub.card.messe.desc') },
      { icon:'🛌', title:window.I18n.t('hub.card.sleep.title'),      hash:'#/hebergements',     desc:window.I18n.t('hub.card.sleep.desc') },
      { icon:'🚗', title:window.I18n.t('hub.card.travel.title'),     hash:'#/comment-venir',    desc:window.I18n.t('hub.card.travel.desc') },
      { icon:'🎁', title:window.I18n.t('hub.card.gift.title'),       hash:'#/liste',            desc:window.I18n.t('hub.card.gift.desc') },
      { icon:'🎤', title:window.I18n.t('hub.card.anim.title'),       hash:'#/infos/animations', desc:window.I18n.t('hub.card.anim.desc') },
      { icon:'✉️', title:window.I18n.t('hub.card.contact.title'),    hash:'#/infos/contacts',   desc:window.I18n.t('hub.card.contact.desc') },
    ];
  },

  destroy() {}
};

export default InfoHub;