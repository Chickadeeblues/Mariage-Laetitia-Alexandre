/**
 * i18n.js — Système de traduction
 */

const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.info': 'Informations pratiques',
    'nav.rsvp': 'RSVP',
    'nav.howToGet': 'Comment venir ?',
    'nav.accommodations': 'Hébergements',
    'nav.carpool': 'Covoiturage',
    'nav.giftList': 'Liste de mariage',
    'nav.faq': 'Questions fréquentes',
    'nav.admin': 'Espace mariés',
    'nav.myResponses': 'Mes réponses',
    'nav.sub.messe': 'Messe & Réception',
    'nav.sub.animations': 'Animations & Discours',
    'nav.sub.contacts': 'Contacts utiles',

    // Hero (Page d'accueil)
    'hero.invite': 'Nous avons le bonheur de vous convier',
    'hero.celebrate': 'à célébrer le mariage de',
    'hero.date': '8 MAI 2027',
    'hero.rsvpBefore': 'RSVP avant le 30 décembre 2026',
    'hero.btn.rsvp': 'Confirmer ma présence',
    'hero.btn.info': 'Informations pratiques',
    'hero.btn.edit': 'Modifier ma réponse',

    // Publication (Placeholders)
    'publication.comingSoon': 'Plus d\'informations à venir.',

    // Hub Infos
    'hub.title': 'Informations pratiques',
    'hub.subtitle': 'Tout ce qu\'il faut savoir pour préparer votre venue.',
    'hub.card.messe.title': 'Messe & Réception',
    'hub.card.messe.desc': 'Horaires, lieux et déroulé de la journée',
    'hub.card.sleep.title': 'Où dormir ?',
    'hub.card.sleep.desc': 'Hébergements à proximité du domaine',
    'hub.card.travel.title': 'Comment venir ?',
    'hub.card.travel.desc': 'Itinéraires, parkings et covoiturage',
    'hub.card.gift.title': 'Liste de mariage',
    'hub.card.gift.desc': 'Nos envies pour débuter notre vie ensemble',
    'hub.card.anim.title': 'Animations & Discours',
    'hub.card.anim.desc': 'Programme des animations de la soirée',
    'hub.card.contact.title': 'Contacts utiles',
    'hub.card.contact.desc': 'Les personnes à contacter le jour J',

    // Info Pages (Messe)
    'messe.title': 'Messe & Réception',
    'messe.welcome.title': 'Accueil des invités',
    'messe.welcome.desc': 'Église Notre-Dame-de-Pitié, Malleval (42520)<br><em>Prévoyez d\'arriver 15 min à l\'avance — parking au Bourg du village.</em>',
    'messe.ceremony.title': 'Cérémonie religieuse',
    'messe.ceremony.desc': 'Mariage de Laetitia & Alexandre.',
    'messe.convoy.title': 'Convoi vers le Domaine',
    'messe.convoy.desc': 'Domaine de la Scie du May, Doizieux (42740)<br><em>Suivez les ballons ! Parking sur place.</em>',
    'messe.cocktail.title': 'Vin d\'honneur',
    'messe.cocktail.desc': 'Cocktails et amuse-bouches dans les jardins du domaine.',
    'messe.dinner.title': 'Dîner & Soirée',
    'messe.dinner.desc': 'Repas assis, discours, animations et piste de danse.',
    'messe.note': 'Ces horaires sont indicatifs et seront confirmés prochainement.',

    // Info Pages (Animations)
    'anim.title': 'Discours & animations',
    'anim.btn.participate': 'Je veux participer',
    'anim.btn.program': 'Voir le programme',
    'anim.btn.reveal': 'Révéler les surprises',
    'anim.btn.hide': 'Masquer les surprises',
    'anim.submit': 'Soumission en cours...',

    // Info Pages (Contacts)
    'contact.title': '✉️ Contacts utiles',
    'contact.bridegroom.title': '💑 Les mariés',
    'contact.bridegroom.desc': 'Laetitia & Alexandre<br>Pour toute question sur le mariage, les hébergements ou le programme.<br><em>Contact à venir.</em>',
    'contact.witnessBride.title': '🎯 Témoins de la mariée',
    'contact.witnessBride.desc': '<em>Contact à venir.</em>',
    'contact.witnessGroom.title': '🎯 Témoins du marié',
    'contact.witnessGroom.desc': '<em>Contact à venir.</em>',
    'contact.note': '✏️ Les contacts seront complétés prochainement.',

    // Info Pages (Liste)
    'liste.title': '🎁 Liste de mariage',
    'liste.desc': 'Votre présence est le plus beau des cadeaux.<br>Si vous souhaitez tout de même nous gâter, notre liste de mariage sera bientôt disponible ici.',
    'liste.note': '✏️ Liste à venir.',

    // HowToGet
    'htg.title': 'Comment venir ?',
    'htg.church.title': 'Cérémonie religieuse',
    'htg.church.subtitle': 'Église Notre-Dame-de-Pitié — Malleval (42520)',
    'htg.church.desc': 'Malleval est un village médiéval perché sur un éperon rocheux. Les rues sont étroites et le stationnement limité — prévoyez d\'arriver <strong>au moins 20 min à l\'avance</strong>.',
    'htg.domain.title': 'Réception & Soirée',
    'htg.domain.subtitle': 'Domaine de la Scie du May — Doizieux (42740)',
    'htg.domain.desc': 'Situé au cœur du Parc naturel régional du Pilat. Un grand parking est disponible sur place pour tous les invités.',
    'htg.parking.title': '🅿️ Parkings disponibles',
    'htg.parking.1.name': 'Parking du Bourg',
    'htg.parking.1.badge': 'Principal',
    'htg.parking.1.desc': 'Entrée du village, route du Bourg. <em>~3 min à pied jusqu\'à l\'église.</em>',
    'htg.parking.2.name': 'Parking de la Mairie',
    'htg.parking.2.desc': 'Place de la Mairie, centre-bourg. <em>~2 min à pied jusqu\'à l\'église.</em>',
    'htg.parking.3.name': 'Stationnement route de Pélussin',
    'htg.parking.3.desc': 'En bas du village, sur la D386. <em>~8 min à pied en montée.</em>',
    'htg.alert.noCar': '⚠️ Les ruelles du centre médiéval sont inaccessibles en voiture. Ne remontez pas le village en voiture.',
    'htg.domain.fromChurch': '🗺️ Depuis l\'église (après la cérémonie)',
    'htg.domain.fromChurch.desc': 'Comptez environ <strong>20 minutes en voiture</strong> depuis Malleval. L\'itinéraire vous sera communiqué le jour J. Un convoi depuis l\'église sera organisé pour ceux qui le souhaitent.',
    'htg.train.title': 'Venir en train',
    'htg.train.subtitle': 'Gare TER Le Péage-de-Roussillon',
    'htg.train.desc1': 'La gare la plus proche est <strong>Le Péage-de-Roussillon</strong>, desservie par la ligne TER Lyon ↔ Valence. Depuis Lyon Part-Dieu, comptez environ <strong>40 minutes</strong>.',
    'htg.train.desc2': 'Depuis la gare, il n\'y a pas de transport en commun jusqu\'à Malleval ou Doizieux — pensez à vous organiser avec d\'autres invités !',
    'htg.train.alert': '💡 Des invités proposent du covoiturage depuis la gare. Consultez la page covoiturage !',
    'htg.link.maps': '📍 Ouvrir dans Google Maps →',
    'htg.link.station': '📍 Gare sur Maps →',
    'htg.carpool.title': 'Covoiturage',
    'htg.carpool.desc': 'Pour faciliter les trajets et limiter le nombre de véhicules, n\'hésitez pas à proposer ou chercher une place via notre plateforme de covoiturage.',
    'htg.carpool.btn': '🚗 Voir le covoiturage →',

    // General
    'general.loading': 'Chargement...',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.info': 'Información práctica',
    'nav.rsvp': 'Asistencia',
    'nav.howToGet': '¿Cómo llegar?',
    'nav.accommodations': 'Alojamiento',
    'nav.carpool': 'Viaje compartido',
    'nav.giftList': 'Lista de bodas',
    'nav.faq': 'Preguntas frecuentes',
    'nav.admin': 'Espace mariés',
    'nav.myResponses': 'Mis respuestas',
    'nav.sub.messe': 'Ceremonia y Recepción',
    'nav.sub.animations': 'Animaciones y Discursos',
    'nav.sub.contacts': 'Contactos útiles',

    // Hero (Page d'accueil)
    'hero.invite': 'Tenemos la alegría de invitarles',
    'hero.celebrate': 'a celebrar la boda de',
    'hero.date': '8 DE MAYO DE 2027',
    'hero.rsvpBefore': 'Confirmar antes del <strong>30 de diciembre de 2026</strong>',
    'hero.btn.rsvp': 'Confirmar mi asistencia',
    'hero.btn.info': 'Información práctica',
    'hero.btn.edit': 'Modificar mi respuesta',

    // Publication (Placeholders)
    'publication.comingSoon': 'Más información próximamente.',

    // Hub Infos
    'hub.title': 'Información práctica',
    'hub.subtitle': 'Todo lo que necesitas saber para preparar tu llegada.',
    'hub.card.messe.title': 'Ceremonia y Recepción',
    'hub.card.messe.desc': 'Horarios, lugares y programa del día',
    'hub.card.sleep.title': '¿Dónde dormir?',
    'hub.card.sleep.desc': 'Alojamientos cerca del lugar',
    'hub.card.travel.title': '¿Cómo llegar?',
    'hub.card.travel.desc': 'Rutas, aparcamiento y viajes compartidos',
    'hub.card.gift.title': 'Lista de bodas',
    'hub.card.gift.desc': 'Nuestros deseos para empezar la vida juntos',
    'hub.card.anim.title': 'Animaciones y Discursos',
    'hub.card.anim.desc': 'Programa de animaciones de la noche',
    'hub.card.contact.title': 'Contactos útiles',
    'hub.card.contact.desc': 'Personas a contactar el gran día',

    // Info Pages (Messe)
    'messe.title': 'Ceremonia y Recepción',
    'messe.welcome.title': 'Bienvenida de invitados',
    'messe.welcome.desc': 'Iglesia Notre-Dame-de-Pitié, Malleval (42520)<br><em>Se recomienda llegar 15 min antes — aparcamiento en el pueblo.</em>',
    'messe.ceremony.title': 'Ceremonia religiosa',
    'messe.ceremony.desc': 'Boda de Laetitia y Alexandre.',
    'messe.convoy.title': 'Trayecto hacia la Finca',
    'messe.convoy.desc': 'Finca de la Scie du May, Doizieux (42740)<br><em>¡Sigan los globos! Aparcamiento disponible.</em>',
    'messe.cocktail.title': 'Cóctel',
    'messe.cocktail.desc': 'Cócteles y aperitivos en los jardines de la finca.',
    'messe.dinner.title': 'Cena y Fiesta',
    'messe.dinner.desc': 'Cena sentados, discursos, animaciones y pista de baile.',
    'messe.note': '✏️ Estos horarios son orientativos y serán confirmados próximamente.',

    // Info Pages (Animations)
    'anim.title': 'Discursos y animaciones',
    'anim.btn.participate': 'Quiero participar',
    'anim.btn.program': 'Ver el programa',
    'anim.btn.reveal': 'Revelar sorpresas',
    'anim.btn.hide': 'Ocultar sorpresas',
    'anim.submit': 'Enviando...',

    // Info Pages (Contacts)
    'contact.title': '✉️ Contactos útiles',
    'contact.bridegroom.title': '💑 Los novios',
    'contact.bridegroom.desc': 'Laetitia y Alexandre<br>Para cualquier pregunta sobre la boda, el alojamiento o el programa.<br><em>Contacto próximamente.</em>',
    'contact.witnessBride.title': '🎯 Testigos de la novia',
    'contact.witnessBride.desc': '<em>Contacto próximamente.</em>',
    'contact.witnessGroom.title': '🎯 Testigos del novio',
    'contact.witnessGroom.desc': '<em>Contacto próximamente.</em>',


    // Info Pages (Liste)
    'liste.title': '🎁 Lista de bodas',
    'liste.desc': 'Vuestra presencia es el mejor regalo.<br>Si aun así deseáis hacernos un detalle, nuestra lista de bodas estará disponible pronto aquí.',
    'liste.note': '✏️ Lista próximamente.',

    // HowToGet
    'htg.title': '¿Cómo llegar?',
    'htg.church.title': 'Ceremonia religiosa',
    'htg.church.subtitle': 'Iglesia Notre-Dame-de-Pitié — Malleval (42520)',
    'htg.church.desc': 'Malleval es un pueblo medieval sobre un peñón rocoso. Las calles son estrechas y el aparcamiento es limitado — planead llegar <strong>al menos 20 min antes</strong>.',
    'htg.domain.title': 'Recepción y Fiesta',
    'htg.domain.subtitle': 'Finca de la Scie du May — Doizieux (42740)',
    'htg.domain.desc': 'Situada en el corazón del Parque Natural Regional del Pilat. Hay un amplio aparcamiento disponible.',
    'htg.parking.title': '🅿️ Aparcamientos disponibles',
    'htg.parking.1.name': 'Parking del Pueblo',
    'htg.parking.1.badge': 'Principal',
    'htg.parking.1.desc': 'Entrada del pueblo. <em>~3 min a pie hasta la iglesia.</em>',
    'htg.parking.2.name': 'Parking del Ayuntamiento',
    'htg.parking.2.desc': 'Plaza del Ayuntamiento. <em>~2 min a pie hasta la iglesia.</em>',
    'htg.parking.3.name': 'Aparcamiento ruta de Pélussin',
    'htg.parking.3.desc': 'Abajo del pueblo. <em>~8 min a pie en subida.</em>',
    'htg.alert.noCar': '⚠️ Las calles del centro medieval son inaccesibles en coche.',
    'htg.domain.fromChurch': '🗺️ Desde la iglesia (después de la ceremonia)',
    'htg.domain.fromChurch.desc': 'Aproximadamente <strong>20 minutos en coche</strong> desde Malleval. Se organizará un convoy.',
    'htg.train.title': 'Llegar en tren',
    'htg.train.subtitle': 'Estación TER Le Péage-de-Roussillon',
    'htg.train.desc1': 'La estación más cercana es <strong>Le Péage-de-Roussillon</strong>. Desde Lyon, unos <strong>40 minutos</strong>.',
    'htg.train.desc2': 'No hay transporte público hasta Malleval, ¡organizaos con otros invitados!',
    'htg.train.alert': '💡 Algunos invitados ofrecen viaje compartido desde la estación. ¡Consulta la página de viajes compartidos!',
    'htg.link.maps': '📍 Abrir en Google Maps →',
    'htg.link.station': '📍 Estación en Maps →',
    'htg.carpool.title': 'Viaje compartido',
    'htg.carpool.desc': 'Para facilitar los trayectos y reducir el número de coches, no dudéis en ofrecer o buscar plaza en nuestra plataforma de viaje compartido.',
    'htg.carpool.btn': '🚗 Ver viajes compartidos →',

    // General
    'general.loading': 'Cargando...',
  }
};

const I18n = {
  currentLang: localStorage.getItem('wedding_lang') || 'fr',

  init() {
    this.updateDOM();
  },

  setLang(lang) {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    localStorage.setItem('wedding_lang', lang);
    document.documentElement.lang = lang;
    this.updateDOM();
    
    // Émettre un événement pour que les composants puissent se re-rendre si nécessaire
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
  },

  t(key) {
    return translations[this.currentLang][key] || translations['fr'][key] || key;
  },

  updateDOM() {
    // Met à jour tous les éléments avec l'attribut data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        // Si c'est un input/textarea placeholder
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
           el.placeholder = translation;
        } else {
           el.textContent = translation;
        }
      }
    });
  }
};

export default I18n;
