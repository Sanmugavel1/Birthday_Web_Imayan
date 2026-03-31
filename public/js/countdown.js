// ══════════════════════════════════════════════
//  BIRTHDAY COUNTDOWN
//  Target: April 2, 2026
// ══════════════════════════════════════════════

(function() {
  const BIRTHDAY = new Date('2026-04-02T00:00:00');

  function update() {
    const now  = new Date();
    const diff = BIRTHDAY - now;

    if (diff <= 0) {
      // It's birthday time!
      document.getElementById('cdDays').textContent  = '0';
      document.getElementById('cdHours').textContent = '0';
      document.getElementById('cdMins').textContent  = '0';
      document.getElementById('cdSecs').textContent  = '0';
      const msg = document.getElementById('birthdayMsg');
      if (msg) msg.classList.remove('hidden');
      return;
    }

    const days  = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const mins  = Math.floor((diff % (1000*60*60)) / (1000*60));
    const secs  = Math.floor((diff % (1000*60)) / 1000);

    const dEl = document.getElementById('cdDays');
    const hEl = document.getElementById('cdHours');
    const mEl = document.getElementById('cdMins');
    const sEl = document.getElementById('cdSecs');

    if (dEl) dEl.textContent = days;
    if (hEl) hEl.textContent = String(hours).padStart(2,'0');
    if (mEl) mEl.textContent = String(mins).padStart(2,'0');
    if (sEl) sEl.textContent = String(secs).padStart(2,'0');
  }

  update();
  setInterval(update, 1000);
})();