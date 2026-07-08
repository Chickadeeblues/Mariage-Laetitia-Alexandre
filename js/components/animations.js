import Store from '../store.js';
import Animations from '../utils/animations.js';

export default async function renderAnimations() {
  const currentGuest = await Store.getCurrentGuest(); // Supposé existant dans votre Store
  const container = document.getElementById('content'); // Ou votre conteneur habituel
  
  container.innerHTML = `
    <div class="card p-4">
      <h2 class="text-center mb-4">Animations & Discours</h2>
      <div class="alert alert-info" style="background: #fdfaf5; border: 1px solid var(--gold); padding: 15px; margin-bottom: 20px;">
        <strong>Bienveillance & Rythme :</strong> Pour que la fête soit belle, nous demandons que chaque intervention ne dépasse pas <strong>5 minutes</strong>. Merci pour votre enthousiasme et votre bienveillance !
      </div>

      <form id="animation-form">
        <input type="hidden" id="guest_name" value="${currentGuest.firstName} ${currentGuest.lastName}">
        
        <div class="mb-3">
          <label>Relation aux mariés :</label>
          <select id="relation" class="form-control" required>
            <option value="">Choisissez...</option>
            <option>Famille de la mariée</option><option>Famille du marié</option>
            <option>Témoin de la mariée</option><option>Témoin du marié</option>
            <option>Ami(e) de la mariée</option><option>Ami(e) du marié</option>
            <option>Ami(e) des mariés</option>
          </select>
        </div>

        <div class="mb-3">
          <label>Type d'animation :</label>
          <select id="type" class="form-control" required>
            <option value="">Choisissez...</option>
            <option value="Discours">Discours</option>
            <option value="Sketch">Sketch</option>
            <option value="Vidéo">Vidéo</option>
            <option value="Chant">Chant</option>
            <option value="Musique">Musique</option>
            <option value="Jeu">Jeu</option>
          </select>
        </div>
        
        <div class="mb-3">
          <label>Moment souhaité (automatique) :</label>
          <input type="text" id="timing" class="form-control" readonly style="background: #eee;">
        </div>

        <div class="mb-3">
          <label>Besoin de matériel :</label><br>
          <input type="checkbox" name="equip" value="Micro/Enceinte"> Micro et enceinte<br>
          <input type="checkbox" name="equip" value="Projecteur"> Projecteur vidéo<br>
          <input type="checkbox" name="equip" value="Scène"> Espace scénique<br>
          <input type="text" name="equip_other" placeholder="Autre (à préciser)..." class="form-control mt-1">
        </div>

        <button type="submit" class="btn btn--primary">Envoyer ma proposition</button>
      </form>
    </div>
  `;

  // Logique automatique pour le timing
  document.getElementById('type').addEventListener('change', (e) => {
    const timingInput = document.getElementById('timing');
    timingInput.value = (e.target.value === 'Discours') ? 'Vin d\'honneur' : 'Repas';
  });

  document.getElementById('animation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const equip = Array.from(document.querySelectorAll('input[name="equip"]:checked')).map(c => c.value);
    const other = document.querySelector('input[name="equip_other"]').value;
    if(other) equip.push(other);

    const data = {
      guest_id: currentGuest.id,
      name: document.getElementById('guest_name').value,
      relation: document.getElementById('relation').value,
      type: document.getElementById('type').value,
      timing: document.getElementById('timing').value,
      equipment: equip
    };

    await Store.saveAnimation(data); // Ajoutez cette méthode dans votre store.js
    Animations.showToast("Merci pour votre proposition !");
  });
}