/**
 * faq.js — Page FAQ
 * Remplace le cube "Contacts utiles" dans le hub
 * Route : #/faq
 */

const FAQ = {
  _elements: { page: null },

  init() {
    this._elements.page = document.getElementById('page-faq');
    if (!this._elements.page) return;
    this._render();
    window.addEventListener('route-changed', (e) => {
      if (e.detail.route === '#/faq') this._render();
    });
  },

  _render() {
    if (!this._elements.page) return;
    this._elements.page.innerHTML = `
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>Questions fréquentes</h2>
          <div class="ornament"></div>
          <p class="text-muted">Tout ce que vous voulez savoir avant le grand jour.</p>
        </div>

        <div class="faq-list">
          ${this._questions().map((section, si) => `
            <div class="faq-section">
              <h3 class="faq-section-title">${section.title}</h3>
              ${section.items.map((item, ii) => `
                <div class="faq-item" id="faq-${si}-${ii}">
                  <button class="faq-question" aria-expanded="false" data-target="faq-answer-${si}-${ii}">
                    <span>${item.q}</span>
                    <span class="faq-chevron">▾</span>
                  </button>
                  <div class="faq-answer hidden" id="faq-answer-${si}-${ii}">
                    <div class="faq-answer-inner">${item.a}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>

      <style>
        .faq-list { max-width: 720px; margin: 0 auto 60px; }

        .faq-section { margin-bottom: 32px; }
        .faq-section-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0ebe0;
        }

        .faq-item {
          border: 1.5px solid #ede8df;
          border-radius: 10px;
          margin-bottom: 8px;
          overflow: hidden;
          transition: border-color 0.2s;
          background: #fff;
        }
        .faq-item:hover { border-color: #c8b89a; }
        .faq-item.open  { border-color: var(--sage); }

        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-dark);
          transition: color 0.2s;
        }
        .faq-question:hover { color: var(--forest); }
        .faq-item.open .faq-question { color: var(--forest); }

        .faq-chevron {
          font-size: 12px;
          flex-shrink: 0;
          transition: transform 0.25s ease;
          color: var(--text-muted);
        }
        .faq-item.open .faq-chevron { transform: rotate(180deg); color: var(--forest); }

        .faq-answer {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.3s ease;
        }
        .faq-answer:not(.hidden) { max-height: 600px; }

        .faq-answer-inner {
          padding: 0 20px 18px;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.7;
        }
        .faq-answer-inner a {
          color: var(--forest);
          text-decoration: underline;
          font-weight: 500;
        }
        .faq-answer-inner strong { color: var(--text-dark); }
        .faq-answer-inner ul {
          margin: 8px 0 0 16px;
          list-style: disc;
        }
        .faq-answer-inner ul li { margin-bottom: 4px; }

        .faq-note {
          background: #fdfaf5;
          border-left: 3px solid var(--gold);
          border-radius: 6px;
          padding: 12px 16px;
          margin-top: 8px;
          font-size: 13px;
          color: #7a6135;
          line-height: 1.6;
        }

        @media (max-width: 600px) {
          .faq-question { padding: 14px 16px; font-size: 0.88rem; }
          .faq-answer-inner { padding: 0 16px 14px; font-size: 0.85rem; }
        }
      </style>`;

    // Accordéon
    this._elements.page.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const answer   = document.getElementById(targetId);
        const item     = btn.closest('.faq-item');
        const isOpen   = item.classList.contains('open');

        // Fermer tous les autres
        this._elements.page.querySelectorAll('.faq-item.open').forEach(el => {
          el.classList.remove('open');
          el.querySelector('.faq-answer').classList.add('hidden');
          el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        // Ouvrir celui-ci si était fermé
        if (!isOpen) {
          item.classList.add('open');
          answer.classList.remove('hidden');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Liens SPA internes
    this._elements.page.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        import('../utils/router.js').then(m => m.default.navigate(a.getAttribute('href')));
      });
    });
  },

  _questions() {
    return [
      {
        title: '📅 Programme & Informations générales',
        items: [
          {
            q: 'Quels sont les horaires de la journée ?',
            a: `La cérémonie religieuse commence à <strong>15h00</strong> à l'église Notre-Dame-de-Pitié de Malleval. 
                La soirée se poursuit au Domaine de la Scie du May et se terminera aux alentours de <strong>minuit</strong>.
                <div class="faq-note">💡 Prévoyez d'arriver à l'église avec un peu d'avance — les rues de Malleval sont étroites et le stationnement limité.</div>`
          },
          {
            q: 'Quel est le dress code ?',
            a: `Nous vous invitons à venir <strong>habillés chic champêtre</strong> — robes fleuries, costumes légers, couleurs douces de saison.
                <div class="faq-note">🌿 Le Pilat peut être frais en début mai, surtout le soir en extérieur. Pensez à prévoir une veste ou un châle !</div>`
          },
          {
            q: 'Y a-t-il un vestiaire sur place ?',
            a: `Oui, un vestiaire est disponible au Domaine de la Scie du May pour la soirée.`
          },
          {
            q: 'Peut-on prendre des photos ?',
            a: `<strong>Pendant la messe</strong> : nous vous demandons de respecter le caractère sacré de la cérémonie — un photographe sera présent pour immortaliser ce moment, merci de ranger vos téléphones et appareils photo.<br><br>
                <strong>Pendant le vin d'honneur et la soirée</strong> : notre photographe sera là, et vous pourrez bien sûr prendre autant de photos que vous le souhaitez !`
          },
        ]
      },
      {
        title: '👥 Invités',
        items: [
          {
            q: 'Les enfants sont-ils les bienvenus ?',
            a: `Nous avons souhaité faire de cette journée un moment entre adultes, pour que chacun puisse profiter pleinement de la fête. 
                Les enfants sont donc accueillis <strong>uniquement s'ils sont expressément mentionnés sur votre invitation</strong>.<br><br>
                Nous espérons que vous comprendrez ce choix et vous souhaitons une belle soirée sans les enfants — une excellente occasion de souffler ! 😊`
          },
          {
            q: 'Puis-je venir accompagné(e) d\'une personne non mentionnée sur mon invitation ?',
            a: `Le nombre de places étant <strong>strictement limité</strong>, nous avons dû composer notre liste d'invités avec soin. 
                Si vous souhaitez inviter quelqu'un qui ne figure pas sur votre invitation, nous vous invitons à nous en parler directement — 
                nous ferons tout notre possible pour trouver une solution, dans la mesure du possible.
                <div class="faq-note">📩 Contactez-nous via la section <a href="#/infos/contacts">Contacts utiles</a>.</div>`
          },
        ]
      },
      {
        title: '🚗 Transport & Hébergement',
        items: [
          {
            q: 'Y a-t-il une navette depuis la gare ?',
            a: `Il n'y a pas de navette officielle depuis la gare TER de Le Péage-de-Roussillon. 
                Nous vous encourageons à <strong>consulter la page Covoiturage</strong> — des invités proposent peut-être un trajet depuis la gare !
                <div class="faq-note">🚆 <a href="#/covoiturage">Voir les covoiturages disponibles →</a></div>`
          },
          {
            q: 'Y a-t-il des taxis ou VTC dans le secteur ?',
            a: `Oui, voici quelques contacts utiles pour rentrer en toute sécurité :
                <ul>
                  <li><a href="https://www.taxiproxi.fr/taxis-malleval-42520" target="_blank" rel="noopener">TaxiProxi — secteur Malleval →</a></li>
                  <li><a href="https://alternativi.fr/annuaire/taxi/malleval-42520" target="_blank" rel="noopener">Alternativi — taxis Malleval →</a></li>
                </ul>
                <div class="faq-note">🍷 Pensez à prévoir votre retour à l'avance, surtout si vous souhaitez profiter de la soirée sereinement !</div>`
          },
          {
            q: 'Peut-on dormir sur place au domaine ?',
            a: `Le domaine dispose de gîtes, réservés en priorité aux <strong>mariés et à leur famille proche</strong>. 
                Si vous souhaitez savoir s'il reste des disponibilités, n'hésitez pas à nous contacter directement.
                <div class="faq-note">🛌 Consultez aussi notre <a href="#/hebergements">page hébergements</a> pour découvrir les adresses à proximité — réservez vite, le Pilat se remplit rapidement !</div>`
          },
        ]
      },
      {
        title: '🍽️ Repas & Régimes alimentaires',
        items: [
          {
            q: 'Le traiteur a-t-il été informé de mes contraintes alimentaires ?',
            a: `Oui ! Toutes les informations que vous avez renseignées dans le formulaire RSVP (régimes, allergies, intolérances) 
                sont transmises à notre traiteur. <strong>Votre réponse est prise en compte.</strong><br><br>
                Si vous avez oublié de le mentionner ou souhaitez modifier votre réponse, vous pouvez mettre à jour votre RSVP à tout moment depuis la page 
                <a href="#/mes-reponses">Mes réponses</a>.`
          },
        ]
      },
      {
        title: '🎤 Animations & Discours',
        items: [
          {
            q: 'Comment proposer un discours ou une animation ?',
            a: `Nous serions ravis que vous participiez à la fête ! Rendez-vous sur la page 
                <a href="#/infos/animations">Animations &amp; Discours</a> pour vous inscrire et nous donner un aperçu de ce que vous préparez.
                <div class="faq-note">✨ Plus vous vous inscrivez tôt, mieux nous pourrons organiser le programme de la soirée.</div>`
          },
        ]
      },
      {
        title: '📸 Après le mariage',
        items: [
          {
            q: 'Où trouver les photos après la fête ?',
            a: `Un album partagé sera disponible ici après le mariage pour que vous puissiez retrouver et télécharger vos photos préférées.<br><br>
                <div class="faq-note" id="faq-photos-link">
                  📷 Le lien sera disponible ici après le 8 mai 2027. Revenez nous voir !
                </div>`
                // → Après le mariage, remplacer la div ci-dessus par :
                // <a href="LIEN_GOOGLE_DRIVE" target="_blank" class="btn btn--primary" style="margin-top:12px;">Voir les photos →</a>
          },
          {
            q: 'Comment vous contacter pour toute autre question ?',
            a: `N'hésitez pas à nous écrire directement :<br><br>
                <strong>Laetitia &amp; Alexandre</strong><br>
                <!-- Remplacer par vos coordonnées réelles -->
                <em>Coordonnées à venir</em>
                <div class="faq-note">📩 Vous pouvez aussi consulter la page <a href="#/infos/contacts">Contacts utiles</a> pour joindre les témoins ou le domaine.</div>`
          },
        ]
      },
    ];
  },

  destroy() {}
};

export default FAQ;