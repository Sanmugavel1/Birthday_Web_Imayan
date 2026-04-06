// ════════════════════════════════════════════════════
//  public/js/app.js  — MongoDB backend, Full Admin CRUD
//  Upload method: FileReader base64 → MongoDB (same as portfolio)
//  Works on Render free tier — NO disk needed!
// ════════════════════════════════════════════════════

const API = '';
const ADMIN_PASSWORD = "imayan2026"; // Must match ADMIN_PASSWORD in your .env exactly

// ══ QUIZ DATA ════════════════════════════════════════
const QUIZ = [
  { q:"Q1. 🍳 What is Nirmal's daily side dish?",
    opts:["Mixture","Potato","Always Egg","Hot Blood"],
    ans:2 },
  { q:"Q2. 🌈 Nirmal is gay or not?",
    opts:["Yes","No","Both","Only in night"],
    ans:3 },
  { q:"Q3. 💘 Nirmal has had how many relationships?",
    opts:["Yogi, Vasanth, Venkat","Imayan, Vasanth, Venkat","No relation just friend","Secret + All above"],
    ans:0 },
  { q:"Q4. ⚡ What is Nirmal's super power?",
    opts:["Shape Shifter","Gender Shifter","Human","Imayan"],
    ans:1 },
  { q:"Q5. 🔢 What number does Nirmal like?",
    opts:["69","4706","4520","4352"],
    ans:1 },
  { q:"Q6. 🏍️ What is Nirmal's fav stuff?",
    opts:["His phone","Vasanth's Bullet","His pillow","Imayan's jokes"],
    ans:1 },
  { q:"Q7. 📛 Name Nirmal in a single word.",
    opts:["Leg Shaker (Thoda Nadigi)","Joker","Pervert","Lover Boy"],
    ans:2 },
  { q:"Q8. 👶 Who is Nirmal's fav child?",
    opts:["Khasi","Kamal KK","Radha"],
    ans:0 },
  { q:"Q9. 🤝 If a friend is in trouble, Nirmal will help and assist.",
    opts:["True","False"],
    ans:1 },
  { q:"Q10. 👨‍🏫 Who is Nirmal's fav teacher?",
    opts:["Imayan","Sanmugam","Pranesh","Master and Vasanth"],
    ans:0 }
];

let quizName='', quizRoll='', quizIdx=0, quizScore=0;
let selectedOpt = null;

// ══ UTILS ════════════════════════════════════════════
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

window.showToast = function(msg, type='normal') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { t.className = 'toast hidden'; }, 3200);
};

function adminHeaders() {
  return { 'Content-Type': 'application/json', 'x-admin-pass': ADMIN_PASSWORD };
}

async function confirmAction(msg) {
  return window.confirm(msg);
}

// ══ LOADING STATE HELPERS ════════════════════════════
function setLoading(containerId, msg) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<p class="empty-hint" style="color:var(--blue);opacity:0.7;">⏳ ${msg}</p>`;
}
function setError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<p class="empty-hint" style="color:#E03131;">❌ ${msg}<br/><small style="opacity:0.6;">Check your server is running and ADMIN_PASSWORD matches.</small></p>`;
}

// ══════════════════════════════════════════════════════
//  BASE64 HELPER — same pattern as your portfolio's
//  FileReader → readAsDataURL → send as JSON to MongoDB
// ══════════════════════════════════════════════════════

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result); // returns "data:image/jpeg;base64,..."
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ══ NAVIGATION ═══════════════════════════════════════
window.switchTab = function(name, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(t => t.classList.remove('active'));
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
    loadHeroPhotos();
  }, 800);
};

// ══════════════════════════════════════════════════════
//  WISHES
// ══════════════════════════════════════════════════════

window.submitWish = async function() {
  const name  = document.getElementById('wishName').value.trim();
  const roll  = document.getElementById('wishRoll').value.trim();
  const treat = document.getElementById('wishTreat').value.trim();
  const msg   = document.getElementById('wishMsg').value.trim();
  if (!name || !msg) { showToast('⚠️ Please enter your name and wish'); return; }
  try {
    const res = await fetch(`${API}/api/wishes`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, roll, treat, msg })
    });
    if (!res.ok) throw new Error(await res.text());
    ['wishName','wishRoll','wishTreat','wishMsg'].forEach(id => document.getElementById(id).value='');
    showToast('💌 Wish sent! Only Nirmal will see it 🎉', 'success');
    loadPublicWishes();
  } catch(e) { showToast('❌ Failed to send: ' + e.message, 'error'); }
};

async function loadPublicWishes() {
  try {
    const res  = await fetch(`${API}/api/wishes`);
    if (!res.ok) throw new Error('Server error ' + res.status);
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
  } catch(e) { console.error('loadPublicWishes:', e); }
}

async function loadAdminWishes() {
  setLoading('adminWishesList', 'Loading wishes...');
  try {
    const res  = await fetch(`${API}/api/wishes`);
    if (!res.ok) throw new Error('Server error ' + res.status);
    const data = await res.json();
    const list = document.getElementById('adminWishesList');

    if (!data.length) { list.innerHTML = '<p class="empty-hint">No wishes yet.</p>'; return; }
    list.innerHTML = '';

    data.forEach(d => {
      const div = document.createElement('div');
      div.className = 'admin-wish-card';
      div.id = 'wish-' + d._id;
      div.innerHTML = `
        <div class="awc-top">
          <div class="awc-info">
            <strong>👤 ${escHtml(d.name)} ${d.roll ? '<span class="awc-roll">Roll: '+escHtml(d.roll)+'</span>' : ''}</strong>
            ${d.treat ? `<div class="awc-treat">🍕 Treat: ${escHtml(d.treat)}</div>` : ''}
            <p>💬 ${escHtml(d.msg)}</p>
            <div class="meta">🕐 ${formatTime(d.createdAt)}</div>
          </div>
          <button class="del-btn" onclick="deleteWish('${d._id}')" title="Delete wish">🗑️</button>
        </div>`;
      list.appendChild(div);
    });

    if (data.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear-all-btn';
      clearBtn.textContent = '🗑️ Delete All Wishes';
      clearBtn.onclick = clearAllWishes;
      list.appendChild(clearBtn);
    }
  } catch(e) { setError('adminWishesList', 'Could not load wishes'); console.error(e); }
}

window.deleteWish = async function(id) {
  if (!await confirmAction('Delete this wish? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/api/wishes/${id}`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    document.getElementById('wish-' + id)?.remove();
    showToast('🗑️ Wish deleted', 'success');
    loadPublicWishes();
  } catch(e) { showToast('❌ Delete failed — check server & password', 'error'); console.error(e); }
};

async function clearAllWishes() {
  if (!await confirmAction('Delete ALL wishes permanently?')) return;
  try {
    const res = await fetch(`${API}/api/wishes`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    showToast('🗑️ All wishes cleared', 'success');
    loadAdminWishes(); loadPublicWishes();
  } catch(e) { showToast('❌ Failed — check server & password', 'error'); console.error(e); }
}

// ══════════════════════════════════════════════════════
//  ANONYMOUS MESSAGES
// ══════════════════════════════════════════════════════

window.submitAnon = async function() {
  const msgEl = document.getElementById('anonMsg');
  const msg = msgEl ? msgEl.value.trim() : '';
  if (!msg) { showToast('⚠️ Please type your message'); return; }
  try {
    const res = await fetch(`${API}/api/anon`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ msg })
    });
    if (!res.ok) throw new Error(await res.text());
    if (msgEl) msgEl.value = '';
    const charsEl = document.getElementById('anonChars');
    if (charsEl) charsEl.textContent = '500 characters remaining';
    showToast('🕵️ Sent anonymously!', 'success');
    loadAnon(); loadTopAnonHome();
  } catch(e) { showToast('❌ Failed to send: ' + e.message, 'error'); }
};

const _anonMsgEl = document.getElementById('anonMsg');
if (_anonMsgEl) {
  _anonMsgEl.addEventListener('input', function() {
    const charsEl = document.getElementById('anonChars');
    if (charsEl) charsEl.textContent = (500 - this.value.length) + ' characters remaining';
  });
}

window.likeAnon = async function(id, btn) {
  const liked = getLikedSet();
  if (liked.has(id)) { showToast('💛 Already liked!'); return; }
  try {
    const res = await fetch(`${API}/api/anon/${id}/like`, { method:'PATCH' });
    if (!res.ok) throw new Error();
    liked.add(id); saveLikedSet(liked);
    btn.classList.add('liked');
    const countEl = btn.querySelector('.like-count');
    countEl.textContent = parseInt(countEl.textContent||'0') + 1;
    showToast('❤️ Liked!', 'success');
    loadTopAnonHome();
  } catch(e) { console.error(e); }
};

async function loadAnon() {
  try {
    const res  = await fetch(`${API}/api/anon`);
    if (!res.ok) throw new Error('Server error ' + res.status);
    const data = await res.json();
    const list = document.getElementById('anonList');
    if (!data.length) { list.innerHTML = '<p class="empty-hint">No anonymous messages yet...</p>'; return; }
    const liked = getLikedSet();
    list.innerHTML = '';
    data.forEach(d => {
      const id = d._id;
      const div = document.createElement('div');
      div.className = 'anon-card';
      div.innerHTML = `
        <div class="anon-label">🕵️ Anonymous</div>
        <div class="anon-msg">"${escHtml(d.msg)}"</div>
        <div class="anon-card-footer">
          <button class="like-btn ${liked.has(id)?'liked':''}" onclick="likeAnon('${id}',this)">
            <span class="like-heart">❤️</span>
            <span class="like-count">${d.likes||0}</span>
          </button>
        </div>`;
      list.appendChild(div);
    });
  } catch(e) { console.error('loadAnon:', e); }
}

async function loadTopAnonHome() {
  try {
    const res = await fetch(`${API}/api/anon/top`);
    if (!res.ok) return;
    const d   = await res.json();
    if (!d) return;
    document.getElementById('topAnonMsg').textContent   = `"${d.msg}"`;
    document.getElementById('topAnonLikes').textContent = `❤️ ${d.likes} like${d.likes!==1?'s':''}`;
    document.getElementById('topAnonCard').style.display = 'block';
  } catch(e) {}
}

async function loadAdminAnon() {
  setLoading('adminAnonList', 'Loading anonymous messages...');
  try {
    const res  = await fetch(`${API}/api/anon`);
    if (!res.ok) throw new Error('Server error ' + res.status);
    const data = (await res.json()).sort((a,b) => b.likes - a.likes);
    const list = document.getElementById('adminAnonList');

    if (!data.length) { list.innerHTML = '<p class="empty-hint">No messages yet.</p>'; return; }
    list.innerHTML = '';

    data.forEach(d => {
      const div = document.createElement('div');
      div.className = 'admin-wish-card';
      div.id = 'anon-' + d._id;
      div.innerHTML = `
        <div class="awc-top">
          <div class="awc-info">
            <strong>🕵️ Anonymous</strong>
            <p>${escHtml(d.msg)}</p>
            <div class="meta">❤️ ${d.likes||0} likes · 🕐 ${formatTime(d.createdAt)}</div>
          </div>
          <button class="del-btn" onclick="deleteAnon('${d._id}')" title="Delete message">🗑️</button>
        </div>`;
      list.appendChild(div);
    });

    if (data.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear-all-btn';
      clearBtn.textContent = '🗑️ Delete All Anonymous Messages';
      clearBtn.onclick = clearAllAnon;
      list.appendChild(clearBtn);
    }
  } catch(e) { setError('adminAnonList', 'Could not load messages'); console.error(e); }
}

window.deleteAnon = async function(id) {
  if (!await confirmAction('Delete this anonymous message?')) return;
  try {
    const res = await fetch(`${API}/api/anon/${id}`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    document.getElementById('anon-' + id)?.remove();
    showToast('🗑️ Message deleted', 'success');
    loadAnon(); loadTopAnonHome();
  } catch(e) { showToast('❌ Delete failed — ' + e.message, 'error'); console.error(e); }
};

async function clearAllAnon() {
  if (!await confirmAction('Delete ALL anonymous messages permanently?')) return;
  try {
    const res = await fetch(`${API}/api/anon`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    showToast('🗑️ All messages cleared', 'success');
    loadAdminAnon(); loadAnon(); loadTopAnonHome();
    document.getElementById('topAnonCard').style.display = 'none';
  } catch(e) { showToast('❌ Failed — check server & password', 'error'); console.error(e); }
}

// ══════════════════════════════════════════════════════
//  QUIZ
// ══════════════════════════════════════════════════════

window.startQuiz = function() {
  quizName = document.getElementById('quizName').value.trim();
  quizRoll = document.getElementById('quizRoll').value.trim();
  if (!quizName || !quizRoll) { showToast('⚠️ Enter your name and register number'); return; }
  quizIdx = 0; quizScore = 0; selectedOpt = null;
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

  const optEl  = document.getElementById('qqOptions');
  const textEl = document.getElementById('qqTextAns');
  const nextEl = document.getElementById('quizNextBtn');
  optEl.innerHTML = ''; textEl.classList.add('hidden'); textEl.value=''; nextEl.classList.add('hidden');

  if (q.opts === null) {
    textEl.classList.remove('hidden'); nextEl.classList.remove('hidden'); textEl.focus();
  } else {
    const letters = ['A','B','C','D'];
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.innerHTML = `<span class="opt-letter">${letters[i]}</span><span>${escHtml(opt)}</span>`;
      btn.onclick = () => {
        document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOpt = i;
        nextEl.classList.remove('hidden');
      };
      optEl.appendChild(btn);
    });
  }
}

window.quizNext = function() {
  const q = QUIZ[quizIdx];
  if (q.opts === null) {
    const ans = document.getElementById('qqTextAns').value.trim().toLowerCase();
    if (ans === String(q.ans).toLowerCase()) quizScore++;
  } else {
    if (selectedOpt === q.ans) quizScore++;
  }
  quizIdx++;
  if (quizIdx < QUIZ.length) { renderQuestion(); }
  else { showQuizResult(); }
};

async function showQuizResult() {
  document.getElementById('quizGame').classList.add('hidden');
  document.getElementById('quizResult').classList.remove('hidden');
  const pct = Math.round((quizScore / QUIZ.length) * 100);
  document.getElementById('resultScore').textContent = quizScore;
  document.getElementById('resultTotal').textContent = '/' + QUIZ.length;
  const msgs = ['Keep learning about Nirmal! 📚', 'Not bad! 😊', 'Pretty good! 🎉', 'Wow, you know Nirmal well! 🌟', "Perfect score! You are Nirmal's biggest fan! 🏆"];
  const idx  = pct < 20 ? 0 : pct < 40 ? 1 : pct < 60 ? 2 : pct < 80 ? 3 : 4;
  document.getElementById('resultMsg').textContent = msgs[idx];
  try {
    await fetch(`${API}/api/quiz`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: quizName, roll: quizRoll, score: quizScore, total: QUIZ.length })
    });
    loadLeaderboardPreview(); loadChampion(); if(document.getElementById("adminPanel") && !document.getElementById("adminPanel").classList.contains("hidden")) loadAdminQuiz();
  } catch(e) { console.error(e); }
}

window.retryQuiz = function() {
  quizIdx=0; quizScore=0; selectedOpt=null;
  document.getElementById('quizResult').classList.add('hidden');
  document.getElementById('quizEntry').classList.remove('hidden');
};

async function loadLeaderboardPreview() {
  try {
    const res  = await fetch(`${API}/api/quiz`);
    if (!res.ok) return;
    const data = await res.json();
    const el   = document.getElementById('leaderPreview');
    if (!el) return;
    if (!data.length) { el.innerHTML = '<p class="empty-hint" style="font-size:.78rem">No scores yet — be the first!</p>'; return; }
    const top = data.slice(0, 5);
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
    el.innerHTML = '<h5>🏆 Leaderboard</h5>' + top.map((d,i) =>
      `<div class="leader-item"><span class="leader-rank">${medals[i]}</span><span class="leader-name">${escHtml(d.name)}</span><span class="leader-score">${d.score}/${d.total}</span></div>`
    ).join('');
  } catch(e) {}
}

async function loadChampion() {
  try {
    const res  = await fetch(`${API}/api/quiz`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.length) return;
    const best = new Map();
    data.forEach(d => { if (!best.has(d.name) || best.get(d.name).score < d.score) best.set(d.name, d); });
    const champion = [...best.values()].sort((a,b)=>b.score-a.score)[0];
    if (!champion) return;
    document.getElementById('qcName').textContent  = champion.name;
    document.getElementById('qcScore').textContent = `Score: ${champion.score}/10`;
    document.getElementById('quizChampion').style.display = 'block';
  } catch(e) {}
}

async function loadAdminQuiz() {
  setLoading('adminQuizList', 'Loading quiz scores...');
  try {
    const res  = await fetch(`${API}/api/quiz`);
    if (!res.ok) throw new Error('Server error ' + res.status);
    const data = await res.json();
    const list = document.getElementById('adminQuizList');

    if (!data.length) { list.innerHTML = '<p class="empty-hint">No quiz attempts yet.</p>'; return; }
    list.innerHTML = '';

    data.forEach((d, i) => {
      const div = document.createElement('div');
      div.className = 'admin-wish-card';
      div.id = 'quiz-' + d._id;
      div.innerHTML = `
        <div class="awc-top">
          <div class="awc-info">
            <strong>#${i+1} ${escHtml(d.name)} ${d.roll?'<span class="awc-roll">'+escHtml(d.roll)+'</span>':''}</strong>
            <p>Score: ${d.score}/${d.total}</p>
            <div class="meta">🕐 ${formatTime(d.createdAt)}</div>
          </div>
          <button class="del-btn" onclick="deleteQuizEntry('${d._id}')" title="Delete entry">🗑️</button>
        </div>`;
      list.appendChild(div);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-all-btn';
    clearBtn.textContent = '🗑️ Reset Full Leaderboard';
    clearBtn.onclick = clearAllQuiz;
    list.appendChild(clearBtn);
  } catch(e) { setError('adminQuizList', 'Could not load quiz scores'); console.error(e); }
}

window.deleteQuizEntry = async function(id) {
  if (!await confirmAction('Delete this quiz entry?')) return;
  try {
    const res = await fetch(`${API}/api/quiz/${id}`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    document.getElementById('quiz-' + id)?.remove();
    showToast('🗑️ Entry deleted', 'success');
    loadChampion(); loadLeaderboardPreview();
  } catch(e) { showToast('❌ Delete failed — check server & password', 'error'); console.error(e); }
};

async function clearAllQuiz() {
  if (!await confirmAction('Reset the ENTIRE quiz leaderboard?')) return;
  try {
    const res = await fetch(`${API}/api/quiz`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    showToast('🗑️ Leaderboard reset', 'success');
    loadAdminQuiz(); loadChampion(); loadLeaderboardPreview();
    document.getElementById('quizChampion').style.display = 'none';
  } catch(e) { showToast('❌ Failed — check server & password', 'error'); console.error(e); }
}

// ══════════════════════════════════════════════════════
//  GALLERY
//  ✅ Uses FileReader → base64 → JSON → MongoDB
//     Same exact pattern as portfolio's uploadProfileImage()
// ══════════════════════════════════════════════════════

window.uploadGalleryPhotos = async function() {
  const input = document.getElementById('galleryUpload');
  if (!input.files.length) { showToast('⚠️ Select at least one photo'); return; }

  showToast('⏳ Uploading photos...');

  try {
    // Convert all selected files to base64 (same as portfolio FileReader pattern)
    const photos = [];
    for (const file of input.files) {
      const data = await fileToBase64(file);
      photos.push({ data, filename: file.name });
    }

    // Send as JSON to MongoDB — no FormData, no multer, no disk!
    const res = await fetch(`${API}/api/uploads/gallery`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ photos })
    });

    if (!res.ok) throw new Error('Status: ' + res.status);

    input.value = '';
    document.getElementById('galleryFileLabel').textContent = '📁 Choose photos (multiple ok)';
    showToast('✅ Photos uploaded!', 'success');
    loadGallery();
    loadAdminGallery();
  } catch(e) {
    showToast('❌ Upload failed: ' + e.message, 'error');
    console.error(e);
  }
};

async function loadGallery() {
  try {
    const res  = await fetch(`${API}/api/uploads/gallery`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const grid = document.getElementById('galleryGrid');
    if (!data.length) { grid.innerHTML = '<p class="empty-hint">Photos coming soon! 📸</p>'; return; }
    grid.innerHTML = '';
    data.forEach(item => {
      const url = item.url; // this is the base64 data URL — works directly as img src
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.onclick   = () => openLightbox(url);
      div.innerHTML = `<img src="${url}" alt="Gallery" loading="lazy" />`;
      grid.appendChild(div);
    });
  } catch(e) { console.error(e); }
}

async function loadAdminGallery() {
  setLoading('adminGallery', 'Loading gallery...');
  try {
    const res  = await fetch(`${API}/api/uploads/gallery`);
    if (!res.ok) throw new Error('Server error ' + res.status);
    const data = await res.json();
    const grid = document.getElementById('adminGallery');
    grid.innerHTML = '';

    if (!data.length) {
      grid.innerHTML = '<p class="empty-hint" style="grid-column:1/-1">No photos yet.</p>';
      return;
    }

    data.forEach(item => {
      const wrap = document.createElement('div');
      wrap.className = 'admin-photo-wrap';
      // item._id is the MongoDB _id used for deletion
      wrap.innerHTML = `
        <img src="${item.url}" alt="photo" />
        <button class="photo-del-btn" onclick="deleteGalleryPhoto('${item._id}', this)" title="Delete photo">🗑️</button>`;
      grid.appendChild(wrap);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-all-btn';
    clearBtn.style.gridColumn = '1/-1';
    clearBtn.textContent = '🗑️ Delete All Gallery Photos';
    clearBtn.onclick = clearAllGallery;
    grid.appendChild(clearBtn);
  } catch(e) { setError('adminGallery', 'Could not load gallery: ' + e.message); console.error(e); }
}

window.deleteGalleryPhoto = async function(id, btn) {
  if (!await confirmAction('Delete this photo?')) return;
  try {
    // Delete by MongoDB _id
    const res = await fetch(`${API}/api/uploads/gallery/${id}`, {
      method:'DELETE', headers: adminHeaders()
    });
    if (!res.ok) throw new Error('Status: ' + res.status);
    btn.closest('.admin-photo-wrap').remove();
    showToast('🗑️ Photo deleted', 'success');
    loadGallery();
  } catch(e) { showToast('❌ Delete failed — check server & password', 'error'); console.error(e); }
};

async function clearAllGallery() {
  if (!await confirmAction('Delete ALL gallery photos permanently?')) return;
  try {
    const res = await fetch(`${API}/api/uploads/gallery`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    showToast('🗑️ Gallery cleared', 'success');
    loadAdminGallery(); loadGallery();
  } catch(e) { showToast('❌ Failed — check server & password', 'error'); console.error(e); }
}

// ══════════════════════════════════════════════════════
//  VIDEO
//  ✅ Uses FileReader → base64 → JSON → MongoDB
//  ⚠️  Videos are large — warn user, keep under ~40MB
// ══════════════════════════════════════════════════════

window.uploadVideo = async function() {
  const input  = document.getElementById('videoUpload');
  const status = document.getElementById('videoStatus');
  if (!input.files[0]) { showToast('⚠️ Select a video file'); return; }

  const file = input.files[0];

  // Warn if video is too large (base64 inflates size by ~33%)
  const maxMB = 30;
  if (file.size > maxMB * 1024 * 1024) {
    showToast(`⚠️ Video too large! Max ${maxMB}MB. Please compress it first.`, 'error');
    return;
  }

  status.textContent = '⏳ Converting video (may take a moment)...';

  try {
    const data = await fileToBase64(file);
    status.textContent = '⏳ Uploading to MongoDB...';

    const res = await fetch(`${API}/api/uploads/video`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ data, filename: file.name })
    });

    if (!res.ok) throw new Error('Status: ' + res.status);

    status.textContent = '✅ Video uploaded!';
    input.value = '';
    document.getElementById('videoFileLabel').textContent = '📁 Choose video file';
    loadVideo();
    loadAdminVideo();
  } catch(e) {
    status.textContent = '❌ Upload failed: ' + e.message;
    console.error(e);
  }
};

async function loadVideo() {
  try {
    const res  = await fetch(`${API}/api/uploads/video`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const wrap = document.getElementById('videoWrap');
    const vid  = document.getElementById('mainVideo');
    const ph   = wrap.querySelector('.video-placeholder');
    if (!data || !data.url) {
      if (ph) ph.style.display = 'flex';
      vid.classList.add('hidden'); vid.src = '';
      return;
    }
    if (ph) ph.style.display = 'none';
    vid.src = data.url; // base64 data URL works directly as video src
    vid.classList.remove('hidden');
  } catch(e) {}
}

async function loadAdminVideo() {
  try {
    const res  = await fetch(`${API}/api/uploads/video`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const container = document.getElementById('adminVideoPreview');
    if (!container) return;
    container.innerHTML = '';

    if (data && data.url) {
      container.innerHTML = `
        <div class="admin-video-item">
          <video src="${data.url}" controls style="width:100%;border-radius:8px;max-height:180px;background:#000;"></video>
          <p class="meta" style="margin:.3rem 0;">${escHtml(data.filename || 'video')}</p>
          <button class="del-btn-wide" onclick="deleteVideo()">🗑️ Delete This Video</button>
        </div>`;
    } else {
      container.innerHTML = '<p class="empty-hint">No video uploaded yet.</p>';
    }
  } catch(e) {}
}

window.deleteVideo = async function() {
  if (!await confirmAction('Delete the birthday video?')) return;
  try {
    const res = await fetch(`${API}/api/uploads/video`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    showToast('🗑️ Video deleted', 'success');
    loadVideo(); loadAdminVideo();
    document.getElementById('videoStatus').textContent = '';
  } catch(e) { showToast('❌ Delete failed — check server & password', 'error'); console.error(e); }
};

// ══════════════════════════════════════════════════════
//  HERO PHOTOS
//  ✅ Uses FileReader → base64 → JSON → MongoDB
// ══════════════════════════════════════════════════════

async function loadHeroPhotos() {
  try {
    const res  = await fetch(`${API}/api/uploads/hero`);
    if (!res.ok) return;
    const data = await res.json();
    [1,2].forEach(n => {
      if (data[n]) {
        const img = document.getElementById('heroImg' + n);
        if (img) img.src = data[n].url; // base64 data URL as src
      }
    });
  } catch(e) {}
}

window.uploadHeroPhoto = async function(num) {
  const input  = document.getElementById('heroUpload' + num);
  const status = document.getElementById('heroStatus');
  if (!input.files[0]) { showToast('⚠️ Select a photo'); return; }

  status.textContent = '⏳ Uploading photo ' + num + '...';

  try {
    // FileReader → base64 (same as portfolio uploadProfileImage)
    const data = await fileToBase64(input.files[0]);

    const res = await fetch(`${API}/api/uploads/hero/${num}`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ data, filename: input.files[0].name })
    });

    if (!res.ok) throw new Error('Status: ' + res.status);

    const result = await res.json();
    status.textContent = `✅ Photo ${num} updated!`;
    input.value = '';
    document.getElementById('heroFileLabel' + num).textContent = '📁 Choose new photo';

    // Update hero image on main page
    const img = document.getElementById('heroImg' + num);
    if (img) img.src = result.url;

    loadAdminHero();
  } catch(e) {
    status.textContent = '❌ Upload failed: ' + e.message;
    console.error(e);
  }
};

window.deleteHeroPhoto = async function(num) {
  if (!await confirmAction(`Delete Hero Photo ${num}?`)) return;
  try {
    const res = await fetch(`${API}/api/uploads/hero/${num}`, { method:'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Status: ' + res.status);
    showToast(`🗑️ Hero Photo ${num} deleted`, 'success');
    const img = document.getElementById('heroImg' + num);
    if (img) img.src = `assets/photo${num}.jpeg`;
    loadAdminHero();
    document.getElementById('heroStatus').textContent = `Photo ${num} removed — showing default.`;
  } catch(e) { showToast('❌ Delete failed — check server & password', 'error'); console.error(e); }
};

async function loadAdminHero() {
  try {
    const res  = await fetch(`${API}/api/uploads/hero`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    [1,2].forEach(n => {
      const previewEl = document.getElementById('heroPreview' + n);
      const delBtn    = document.getElementById('heroDelBtn' + n);
      if (!previewEl) return;
      if (data[n]) {
        previewEl.src = data[n].url; // base64 data URL
        previewEl.style.display = 'block';
        if (delBtn) delBtn.style.display = 'inline-flex';
      } else {
        previewEl.src = `assets/photo${n}.jpeg`;
        previewEl.style.display = 'block';
        if (delBtn) delBtn.style.display = 'none';
      }
    });
  } catch(e) {}
}

// ══════════════════════════════════════════════════════
//  ADMIN MODAL
// ══════════════════════════════════════════════════════

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
    loadAdminWishes();
    loadAdminAnon();
    loadAdminGallery();
    loadAdminQuiz();
    loadAdminVideo();
    loadAdminHero();
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
  if (name==='aVideo')  loadAdminVideo();
  if (name==='aHero')   loadAdminHero();
  if (name==='aPhotos') loadAdminGallery();
  if (name==='aQuiz')   loadAdminQuiz();
  if (name==='aAnon')   loadAdminAnon();
  if (name==='aWishes') loadAdminWishes();
};

// ══════════════════════════════════════════════════════
//  LIGHTBOX
// ══════════════════════════════════════════════════════

window.openLightbox = function(url) {
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.remove('hidden');
};
window.closeLightbox = function(e) {
  if (e) e.stopPropagation();
  document.getElementById('lightbox').classList.add('hidden');
};