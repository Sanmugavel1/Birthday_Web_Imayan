// public/js/app.js  — MongoDB version (no Firebase imports)

const API = '';

// ── Admin password (same as .env) ──
const ADMIN_PASSWORD = "imayan2026";

// ══ QUIZ DATA (unchanged) ══
const QUIZ = [
  { q:"Q1. What is Imayan's favourite staff?", opts:["Sumithra mam","Kasthuri mam","UHV Sir"], ans:0 },
  { q:"Q2. What is Imayan's favourite God?", opts:["Jesus","Shivan","Pran Baba"], ans:2 },
  { q:"Q3. Who is Imayan's favourite anime character?", opts:["Tsunade","Nami","Robin","Hancock"], ans:0 },
  { q:"Q4. What is Imayan's lucky charm?", opts:["Sanga","Nirmal","Tsunade","Himself"], ans:2 },
  { q:"Q5. What is Imayan's favourite subject?", opts:["Physics","DSP","Controls","Digital"], ans:3 },
  { q:"Q6. What does Imayan spend most time on?", opts:["Nirmal","Insta Reels","Reading","Movies"], ans:0 },
  { q:"Q7. Who is Imayan's favourite student?", opts:null, ans:"gokul" },
  { q:"Q8. What is Imayan's Goal?", opts:["Gate Exam","High LPA Job","Good Family Man","CAO Exam"], ans:0 },
  { q:"Q9. What is Imayan's favourite number?", opts:["106","107","69","68"], ans:0 },
  { q:"Q10. Imayan is a…", opts:["Introvert","Extrovert","Ambivert","Omnivert"], ans:1 }
];

let quizName='', quizRoll='', quizIdx=0, quizScore=0, quizAnswers=[];
let selectedOpt=null;

// ══ UTILS ══
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
}
function getLikedSet() {
  try { return new Set(JSON.parse(localStorage.getItem('likedAnons')||'[]')); } catch { return new Set(); }
}
function saveLikedSet(s) {
  try { localStorage.setItem('likedAnons', JSON.stringify([...s])); } catch {}
}
window.showToast = function(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
};

// ══ NAVIGATION ══
window.switchTab = function(name, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
  if (name === 'gallery') loadGallery();
  if (name === 'video')   loadVideo();
  if (name === 'quiz')    loadLeaderboardPreview();
};

window.enterSite = function() {
  const splash = document.getElementById('splash');
  splash.style.transition = 'opacity 0.8s ease';
  splash.style.opacity = '0';
  setTimeout(() => {
    splash.classList.add('hidden');
    document.getElementById('mainSite').classList.remove('hidden');
    document.getElementById('siteFooter').style.display = 'block';
    loadAnon(); loadTopAnonHome(); loadChampion(); loadPublicWishes();
  }, 800);
};

// ══ WISHES ══
window.submitWish = async function() {
  const name  = document.getElementById('wishName').value.trim();
  const roll  = document.getElementById('wishRoll').value.trim();
  const treat = document.getElementById('wishTreat').value.trim();
  const msg   = document.getElementById('wishMsg').value.trim();
  if (!name || !msg) { showToast('⚠️ Please enter your name and wish'); return; }
  try {
    const res = await fetch(`${API}/api/wishes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, roll, treat, msg })
    });
    if (!res.ok) throw new Error();
    ['wishName','wishRoll','wishTreat','wishMsg'].forEach(id => document.getElementById(id).value = '');
    showToast('💌 Wish sent! Only Imayan will see it 🎉');
    loadPublicWishes();
  } catch(e) { showToast('❌ Failed to send.'); }
};

async function loadPublicWishes() {
  const res  = await fetch(`${API}/api/wishes`);
  const data = await res.json();
  const list = document.getElementById('wishesList');
  if (!data.length) { list.innerHTML = '<p class="empty-hint">Be the first to send a wish! 🌟</p>'; return; }
  list.innerHTML = '';
  data.forEach(d => {
    const div = document.createElement('div');
    div.className = 'wish-card';
    div.innerHTML = `
      <div class="wc-top">
        <div class="wc-avatar">${escHtml(d.name.charAt(0).toUpperCase())}</div>
        <div><div class="wc-name">${escHtml(d.name)}</div></div>
        <span class="wc-tag">💌 Wish</span>
      </div>
      <div class="wc-msg">"${escHtml(d.msg)}"</div>
      <div class="wc-time">${formatTime(d.createdAt)}</div>`;
    list.appendChild(div);
  });
}

async function loadAdminWishes() {
  const res  = await fetch(`${API}/api/wishes`);
  const data = await res.json();
  const list = document.getElementById('adminWishesList');
  if (!data.length) { list.innerHTML = '<p class="empty-hint">No wishes yet.</p>'; return; }
  list.innerHTML = '';
  data.forEach(d => {
    const div = document.createElement('div');
    div.className = 'admin-wish-card';
    div.innerHTML = `
      <strong>👤 ${escHtml(d.name)} ${d.roll ? '| Roll: '+escHtml(d.roll) : ''}</strong>
      ${d.treat ? `<span>🍕 Treat: ${escHtml(d.treat)}</span>` : ''}
      <p>💬 ${escHtml(d.msg)}</p>
      <div class="meta">🕐 ${formatTime(d.createdAt)}</div>`;
    list.appendChild(div);
  });
}

// ══ ANONYMOUS ══
window.submitAnon = async function() {
  const msg = document.getElementById('anonMsg').value.trim();
  if (!msg) { showToast('⚠️ Please type your message'); return; }
  try {
    const res = await fetch(`${API}/api/anon`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ msg })
    });
    if (!res.ok) throw new Error();
    document.getElementById('anonMsg').value = '';
    document.getElementById('anonChars').textContent = '500 characters remaining';
    showToast('🕵️ Sent anonymously!');
    loadAnon(); loadTopAnonHome();
  } catch(e) { showToast('❌ Failed to send.'); }
};

document.getElementById('anonMsg').addEventListener('input', function() {
  document.getElementById('anonChars').textContent = (500 - this.value.length) + ' characters remaining';
});

window.likeAnon = async function(id, btn) {
  const liked = getLikedSet();
  if (liked.has(id)) { showToast('💛 Already liked!'); return; }
  try {
    await fetch(`${API}/api/anon/${id}/like`, { method: 'PATCH' });
    liked.add(id); saveLikedSet(liked);
    btn.classList.add('liked');
    const countEl = btn.querySelector('.like-count');
    countEl.textContent = parseInt(countEl.textContent || '0') + 1;
    btn.querySelector('.like-heart').classList.add('liked');
    showToast('❤️ Liked!');
    loadTopAnonHome();
  } catch(e) { console.error(e); }
};

async function loadAnon() {
  const res  = await fetch(`${API}/api/anon`);
  const data = await res.json();
  const list = document.getElementById('anonList');
  if (!data.length) { list.innerHTML = '<p class="empty-hint">No anonymous messages yet...</p>'; return; }
  const liked = getLikedSet();
  list.innerHTML = '';
  data.forEach(d => {
    const id = d._id;
    const isLiked = liked.has(id);
    const div = document.createElement('div');
    div.className = 'anon-card';
    div.innerHTML = `
      <div class="anon-label">🕵️ Anonymous</div>
      <div class="anon-msg">"${escHtml(d.msg)}"</div>
      <div class="anon-card-footer">
        <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="likeAnon('${id}', this)">
          <span class="like-heart">❤️</span>
          <span class="like-count">${d.likes || 0}</span>
        </button>
      </div>`;
    list.appendChild(div);
  });
}

async function loadTopAnonHome() {
  try {
    const res = await fetch(`${API}/api/anon/top`);
    const d   = await res.json();
    if (!d) return;
    document.getElementById('topAnonMsg').textContent   = `"${d.msg}"`;
    document.getElementById('topAnonLikes').textContent = `❤️ ${d.likes} like${d.likes !== 1 ? 's' : ''}`;
    document.getElementById('topAnonCard').style.display = 'block';
  } catch(e) {}
}

async function loadAdminAnon() {
  const res  = await fetch(`${API}/api/anon`);
  const data = (await res.json()).sort((a,b) => b.likes - a.likes);
  const list = document.getElementById('adminAnonList');
  if (!data.length) { list.innerHTML = '<p class="empty-hint">No messages yet.</p>'; return; }
  list.innerHTML = '';
  data.forEach(d => {
    const div = document.createElement('div');
    div.className = 'admin-wish-card';
    div.innerHTML = `
      <strong>🕵️ Anonymous</strong>
      <p>${escHtml(d.msg)}</p>
      <div class="meta">❤️ ${d.likes || 0} likes · 🕐 ${formatTime(d.createdAt)}</div>`;
    list.appendChild(div);
  });
}

// ══ QUIZ ══
window.startQuiz = function() {
  quizName = document.getElementById('quizName').value.trim();
  quizRoll = document.getElementById('quizRoll').value.trim();
  if (!quizName || !quizRoll) { showToast('⚠️ Enter your name and register number'); return; }
  quizIdx=0; quizScore=0; quizAnswers=[]; selectedOpt=null;
  document.getElementById('quizEntry').classList.add('hidden');
  document.getElementById('quizResult').classList.add('hidden');
  document.getElementById('quizGame').classList.remove('hidden');
  renderQuestion();
};

function renderQuestion() {
  const q = QUIZ[quizIdx];
  selectedOpt = null;
  const pct = ((quizIdx + 1) / QUIZ.length) * 100;
  document.getElementById('qpFill').style.width = pct + '%';
  document.getElementById('qpText').textContent = `Question ${quizIdx+1} of ${QUIZ.length}`;
  document.getElementById('qqNum').textContent  = `Q${quizIdx+1}`;
  document.getElementById('qqText').textContent = q.q;
  const optionsEl = document.getElementById('qqOptions');
  const textEl    = document.getElementById('qqTextAns');
  const nextBtn   = document.getElementById('quizNextBtn');
  optionsEl.innerHTML = ''; textEl.classList.add('hidden'); textEl.value=''; nextBtn.classList.add('hidden');
  if (q.opts === null) {
    textEl.classList.remove('hidden'); nextBtn.classList.remove('hidden'); textEl.focus();
  } else {
    ['A','B','C','D'].slice(0, q.opts.length).forEach((letter, i) => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.innerHTML = `<span class="opt-letter">${letter}</span><span>${escHtml(q.opts[i])}</span>`;
      btn.onclick = () => {
        document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected'); selectedOpt = i;
        nextBtn.classList.remove('hidden');
      };
      optionsEl.appendChild(btn);
    });
  }
}

window.nextQuestion = function() {
  const q = QUIZ[quizIdx];
  if (q.opts === null) {
    const ans = document.getElementById('qqTextAns').value.trim().toLowerCase();
    if (ans === q.ans.toLowerCase()) quizScore++;
    quizAnswers.push({ q:q.q, given:ans, correct:q.ans, ok: ans===q.ans.toLowerCase() });
  } else {
    if (selectedOpt === null) { showToast('⚠️ Please pick an answer'); return; }
    const ok = selectedOpt === q.ans;
    if (ok) quizScore++;
    quizAnswers.push({ q:q.q, given:q.opts[selectedOpt], correct:q.opts[q.ans], ok });
  }
  quizIdx++;
  if (quizIdx < QUIZ.length) renderQuestion(); else finishQuiz();
};

async function finishQuiz() {
  document.getElementById('quizGame').classList.add('hidden');
  document.getElementById('quizResult').classList.remove('hidden');
  document.getElementById('resultScore').textContent = quizScore;
  let emoji='😅', msg='';
  if      (quizScore <= 3) { emoji='😂'; msg='Bro, do you even know Imayan? 😂 Try harder!'; }
  else if (quizScore <= 5) { emoji='🤔'; msg='Not bad! You know him a little... or got lucky 😏'; }
  else if (quizScore <= 7) { emoji='😎'; msg='Pretty good! You definitely hang around Imayan a lot!'; }
  else if (quizScore <= 9) { emoji='🏅'; msg='Wow! You really know Imayan well! Impressive! 🎉'; }
  else                     { emoji='🏆'; msg="PERFECT SCORE! You're officially Imayan's #1 fan! 👑"; }
  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultMsg').textContent   = msg;
  try {
    await fetch(`${API}/api/quiz`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name:quizName, roll:quizRoll, score:quizScore, total:QUIZ.length })
    });
    loadChampion(); loadLeaderboardPreview();
  } catch(e) { console.error(e); }
}

async function loadLeaderboardPreview() {
  try {
    const res  = await fetch(`${API}/api/quiz`);
    const data = await res.json();
    const el   = document.getElementById('leaderPreview');
    if (!data.length) { el.innerHTML=''; return; }
    const best = new Map();
    data.forEach(d => {
      const key = d.name.toLowerCase();
      if (!best.has(key) || best.get(key).score < d.score) best.set(key, d);
    });
    const sorted = [...best.values()].sort((a,b) => b.score - a.score).slice(0,3);
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = '<h5>🏆 Top Scorers</h5>' + sorted.map((d,i) => `
      <div class="leader-item">
        <span class="leader-rank">${medals[i]||'⭐'}</span>
        <span class="leader-name">${escHtml(d.name)}</span>
        <span class="leader-score">${d.score}/10</span>
      </div>`).join('');
  } catch(e) {}
}

async function loadChampion() {
  try {
    const res  = await fetch(`${API}/api/quiz`);
    const data = await res.json();
    if (!data.length) return;
    const best = new Map();
    data.forEach(d => {
      const key = d.name.toLowerCase();
      if (!best.has(key) || best.get(key).score < d.score) best.set(key, d);
    });
    const champion = [...best.values()].sort((a,b) => b.score - a.score)[0];
    if (!champion) return;
    document.getElementById('qcName').textContent  = champion.name;
    document.getElementById('qcScore').textContent = `Score: ${champion.score}/10`;
    document.getElementById('quizChampion').style.display = 'block';
  } catch(e) {}
}

async function loadAdminQuiz() {
  const res  = await fetch(`${API}/api/quiz`);
  const data = await res.json();
  const list = document.getElementById('adminQuizList');
  if (!data.length) { list.innerHTML = '<p class="empty-hint">No quiz attempts yet.</p>'; return; }
  list.innerHTML = '';
  data.forEach((d, i) => {
    const div = document.createElement('div');
    div.className = 'admin-wish-card';
    div.innerHTML = `
      <strong>#${i+1} ${escHtml(d.name)} ${d.roll ? '| '+escHtml(d.roll) : ''}</strong>
      <p>Score: ${d.score}/${d.total}</p>
      <div class="meta">🕐 ${formatTime(d.createdAt)}</div>`;
    list.appendChild(div);
  });
}

// ══ GALLERY ══
window.uploadGalleryPhotos = async function() {
  const input = document.getElementById('galleryUpload');
  if (!input.files.length) { showToast('⚠️ Select at least one photo'); return; }
  showToast('⏳ Uploading...');
  const fd = new FormData();
  [...input.files].forEach(f => fd.append('photos', f));
  try {
    await fetch(`${API}/api/uploads/gallery`, {
      method:'POST', headers:{'x-admin-pass': ADMIN_PASSWORD}, body: fd
    });
    input.value = '';
    showToast('✅ Photos uploaded!');
    loadGallery(); loadAdminGallery();
  } catch(e) { showToast('❌ Upload failed.'); }
};

async function loadGallery() {
  const res  = await fetch(`${API}/api/uploads/gallery`);
  const urls = await res.json();
  const grid = document.getElementById('galleryGrid');
  if (!urls.length) { grid.innerHTML = '<p class="empty-hint">Photos coming soon! 📸</p>'; return; }
  grid.innerHTML = '';
  urls.forEach(url => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.onclick   = () => openLightbox(url);
    div.innerHTML = `<img src="${url}" alt="Gallery" loading="lazy" />`;
    grid.appendChild(div);
  });
}

async function loadAdminGallery() {
  const res  = await fetch(`${API}/api/uploads/gallery`);
  const urls = await res.json();
  const grid = document.getElementById('adminGallery');
  grid.innerHTML = '';
  urls.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    grid.appendChild(img);
  });
}

// ══ VIDEO ══
window.uploadVideo = async function() {
  const input  = document.getElementById('videoUpload');
  const status = document.getElementById('videoStatus');
  if (!input.files[0]) { showToast('⚠️ Select a video file'); return; }
  status.textContent = '⏳ Uploading video...';
  const fd = new FormData();
  fd.append('video', input.files[0]);
  try {
    await fetch(`${API}/api/uploads/video`, {
      method:'POST', headers:{'x-admin-pass': ADMIN_PASSWORD}, body: fd
    });
    status.textContent = '✅ Video uploaded!';
    input.value = '';
    loadVideo();
  } catch(e) { status.textContent = '❌ Upload failed.'; }
};

async function loadVideo() {
  try {
    const res  = await fetch(`${API}/api/uploads/video`);
    const data = await res.json();
    if (!data || !data.url) return;
    const wrap = document.getElementById('videoWrap');
    const vid  = document.getElementById('mainVideo');
    const ph   = wrap.querySelector('.video-placeholder');
    if (ph) ph.style.display = 'none';
    vid.src = data.url;
    vid.classList.remove('hidden');
  } catch(e) {}
}

// ══ HERO PHOTOS ══
window.uploadHeroPhoto = async function(num) {
  const input  = document.getElementById('heroUpload' + num);
  const status = document.getElementById('heroStatus');
  if (!input.files[0]) { showToast('⚠️ Select a photo'); return; }
  status.textContent = '⏳ Uploading...';
  const fd = new FormData();
  fd.append('photo', input.files[0]);
  try {
    const res  = await fetch(`${API}/api/uploads/hero/${num}`, {
      method:'POST', headers:{'x-admin-pass': ADMIN_PASSWORD}, body: fd
    });
    const data = await res.json();
    status.textContent = `✅ Photo ${num} uploaded!`;
    input.value = '';
    document.getElementById('heroImg' + num).src = data.url;
  } catch(e) { status.textContent = '❌ Upload failed.'; }
};

// ══ ADMIN MODAL ══
window.openAdmin = function() {
  document.getElementById('adminModal').classList.remove('hidden');
  document.getElementById('adminLogin').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('adminPass').value = '';
};
window.closeAdmin = function() { document.getElementById('adminModal').classList.add('hidden'); };
window.adminLogin = function() {
  if (document.getElementById('adminPass').value === ADMIN_PASSWORD) {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    loadAdminWishes(); loadAdminAnon(); loadAdminGallery(); loadAdminQuiz();
  } else {
    document.getElementById('loginError').classList.remove('hidden');
  }
};
document.getElementById('adminPass').addEventListener('keydown', e => { if (e.key==='Enter') window.adminLogin(); });
window.switchAdminTab = function(name, el) {
  document.querySelectorAll('.apanel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.atab').forEach(t => t.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  el.classList.add('active');
};

// ══ LIGHTBOX ══
window.openLightbox = function(url) {
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.remove('hidden');
};
window.closeLightbox = function(e) {
  if (e) e.stopPropagation();
  document.getElementById('lightbox').classList.add('hidden');
};

// ══ INIT ══
loadPublicWishes();