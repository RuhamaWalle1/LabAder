// frontend/js/individual_home.js
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const feedEl = document.getElementById('feed');
  const publishBtn = document.getElementById('publishBtn');
  const postText = document.getElementById('postText');
  const attachBtn = document.getElementById('attachBtn');
  const fileAttach = document.getElementById('fileAttach');
  const suggestionsEl = document.getElementById('suggestions');

  // State
  let feed = [];
  let currentProfile = null;
  let avatarUrl = null;
  const profileCache = new Map();
  const token = localStorage.getItem('token') || '';

  const suggestions = [
    {name:'Samuel T', role:'Data Analyst'},
    {name:'Aminah K', role:'UX Designer'},
    {name:'Getachew D', role:'Electrical Engineer'}
  ];

  // ---------- Helpers ----------
  function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function generateInitialsDataUrl(a = '', b = '', size = 64, bg = '#4caf50', fg = '#fff') {
    const initials = ((a||'').charAt(0) + (b||'').charAt(0)).toUpperCase() || 'U';
    const fontSize = Math.round(size * 0.45);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='${bg}' rx='10' ry='10'/><text x='50%' y='50%' dy='0.36em' text-anchor='middle' font-family='Segoe UI, Roboto, Arial' font-size='${fontSize}' fill='${fg}'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // ---------- Load current user profile ----------
  async function loadCurrentProfile() {
    try {
      const userId = parseInt(localStorage.getItem('userId'), 10);
      if (!userId) return;
      const res = await fetch(`http://localhost:3000/api/users/individual/${userId}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load profile');
      currentProfile = data;
      avatarUrl = data.ProfilePicUrl || data.profilePicUrl || null;
      if (!avatarUrl) {
        const name = (data.FullName || data.fullName || data.Email || '').trim() || 'User';
        const parts = name.split(/\s+/);
        avatarUrl = generateInitialsDataUrl(parts[0] || 'U', parts[1] || parts[0] || '', 64, '#4caf50');
      }
      // update any header avatar element
      const headerAvatar = document.getElementById('userAvatarImg');
      if (headerAvatar) headerAvatar.src = avatarUrl;
    } catch (err) {
      console.warn('loadCurrentProfile:', err.message || err);
    }
  }

  // ---------- Profile cache for other users ----------
  async function getProfileFor(userId) {
    if (!userId) return null;
    if (profileCache.has(userId)) return profileCache.get(userId);
    try {
      const res = await fetch(`http://localhost:3000/api/users/individual/${userId}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No profile');
      const pic = data.ProfilePicUrl || data.profilePicUrl || generateInitialsDataUrl((data.FullName||'').split(/\s+/)[0] || '', (data.FullName||'').split(/\s+/)[1] || '', 64, '#4caf50');
      const out = { ...data, avatar: pic };
      profileCache.set(userId, out);
      return out;
    } catch (err) {
      const fallback = { UserID: userId, avatar: generateInitialsDataUrl('U','?',64,'#777') };
      profileCache.set(userId, fallback);
      return fallback;
    }
  }

  // ---------- Render suggestions ----------
  function renderSuggestions() {
    if (!suggestionsEl) return;
    suggestionsEl.innerHTML = '';
    suggestions.forEach((s, idx) => {
      const el = document.createElement('div');
      el.className = 'suggest-item';
      const imgSrc = avatarUrl || generateInitialsDataUrl(s.name.split(/\s+/)[0] || 'U', s.name.split(/\s+/)[1] || '', 42, '#4caf50');
      el.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
        <img src="${imgSrc}" style="width:42px;height:42px;border-radius:8px;object-fit:cover">
        <div><div style="font-weight:700">${escapeHtml(s.name)}</div><div style="font-size:13px;color:var(--muted)">${escapeHtml(s.role)}</div></div>
      </div>
      <div><button class="btn ghost" data-idx="${idx}">Connect</button></div>`;
      suggestionsEl.appendChild(el);
      el.querySelector('button')?.addEventListener('click', (ev) => {
        ev.currentTarget.textContent = 'Pending'; ev.currentTarget.disabled = true;
        alert('Connection request sent to ' + s.name);
      });
    });
    // expose connect for legacy code if used
    window.connect = (btn) => {
      const idx = parseInt(btn.dataset.idx, 10);
      alert('Connect to ' + suggestions[idx].name);
      btn.textContent = 'Pending'; btn.disabled = true;
    };
  }

  // ---------- Render feed ----------
  function renderFeed() {
    if (!feedEl) return;
    feedEl.innerHTML = '';
    feed.slice().reverse().forEach(item => {
      // Job posts in same feed may appear; handle both
      if (item.PostID && item.Content) {
        // Post by a user
        const card = document.createElement('div');
        card.className = 'feed-card card';
        // start with placeholder avatar, update later
        card.innerHTML = `<div class="meta" style="display:flex;gap:10px;align-items:center">
          <img src="avatar-placeholder.png" class="post-avatar" style="width:42px;height:42px;border-radius:8px;object-fit:cover">
          <div><div class="post-author" style="font-weight:700">${escapeHtml(item.Email || 'User')}</div><div style="font-size:13px;color:var(--muted)">shared</div></div>
        </div>
        <p>${escapeHtml(item.Content)}</p>
        <div class="actions">
          <button class="btn ghost" onclick="likePost(${item.PostID})">👍</button>
          <button class="btn ghost" onclick="savePost(${item.PostID})">Save</button>
        </div>`;
        feedEl.appendChild(card);

        // async update with real author profile
        (async () => {
          const authorId = item.UserID || item.userId || null;
          if (!authorId) return;
          const p = await getProfileFor(authorId);
          const imgEl = card.querySelector('.post-avatar');
          const authorEl = card.querySelector('.post-author');
          if (imgEl && p && p.avatar) imgEl.src = p.avatar;
          if (authorEl && (p.FullName || p.fullName)) authorEl.textContent = p.FullName || p.fullName;
        })();
      } else if (item.Title && item.CompanyName) {
        // Job card in feed
        const card = document.createElement('div');
        card.className = 'feed-card card job-card';
        card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:800">${escapeHtml(item.Title)}</div>
              <div style="font-size:13px;color:var(--muted)">${escapeHtml(item.CompanyName)} · ${escapeHtml(item.Location || 'Remote')}</div>
            </div>
            <div>
              <button class="btn ghost" onclick="saveJob(${item.JobID})">Save</button>
            </div>
          </div>
          <div style="margin-top:8px;font-size:13px;color:var(--muted)">${escapeHtml(item.CreatedAt || '')}</div>`;
        feedEl.appendChild(card);
      }
    });

    // expose handlers (demo)
    window.likePost = (id) => { alert('Like (demo).'); };
    window.savePost = (id) => { alert('Saved (demo).'); };
    window.saveJob = (id) => { alert('Saved job (demo).'); };
  }

  // ---------- Load feed ----------
  async function loadFeed() {
    try {
      const res = await fetch('http://localhost:3000/api/posts');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid feed response');
      feed = data;
      renderFeed();
    } catch (err) {
      console.error(err);
      alert('Could not load feed: ' + (err.message || err));
    }
  }

  // ---------- Publish post ----------
  publishBtn?.addEventListener('click', async () => {
    const text = (postText.value || '').trim();
    if (!text) { alert('Write something'); return; }
    const userId = parseInt(localStorage.getItem('userId'), 10);
    if (!userId) { alert('Please login'); return; }
    try {
      const res = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
        body: JSON.stringify({ userId, content: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Post failed');
      postText.value = '';
      await loadFeed();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  });

  // file attachment demo
  attachBtn?.addEventListener('click', () => fileAttach?.click());
  fileAttach?.addEventListener('change', () => {
    const f = fileAttach.files && fileAttach.files[0];
    if (f) alert('Attachment demo only: ' + f.name);
  });

  // publish quick button (mobile)
  document.getElementById('bnPost')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    postText.focus();
  });

  // ---------- Init ----------
  (async function init() {
    await loadCurrentProfile();
    renderSuggestions();
    await loadFeed();
  })();

  // expose some functions for dev console if needed
  window.getProfileFor = getProfileFor;
});
