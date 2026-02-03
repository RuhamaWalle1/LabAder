// frontend/js/company_home.js
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const jobsList = document.getElementById('jobsList');
  const postJobBtn = document.getElementById('postJobBtnC');
  const jobTitle = document.getElementById('jobTitle');
  const jobLocation = document.getElementById('jobLocation');
  const jobType = document.getElementById('jobType');
  const jobDesc = document.getElementById('jobDesc');
  const candidateSuggestions = document.getElementById('candidateSuggestions');
  const saveJobDraftBtn = document.getElementById('saveJobDraft');

  // State
  let jobs = [];
  let companyProfile = null;
  let companyLogoUrl = null;
  const token = localStorage.getItem('token') || '';

  // Small sample candidates (demo). You may replace with server-side suggestions later.
  const candidates = [
    {name:'Hannah M', title:'React Dev', skills:['React','JS']},
    {name:'Kebede S', title:'Backend Engineer', skills:['Node','SQL']},
    {name:'Lina R', title:'Data Scientist', skills:['Python','ML']}
  ];

  // ---------- Helpers ----------
  function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function generateInitialsDataUrl(a = '', b = '', size = 64, bg = '#1f6feb', fg = '#fff') {
    const initials = ((a||'').charAt(0) + (b||'').charAt(0)).toUpperCase() || 'U';
    const fontSize = Math.round(size * 0.45);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='${bg}' rx='10' ry='10'/><text x='50%' y='50%' dy='0.36em' text-anchor='middle' font-family='Segoe UI, Roboto, Arial' font-size='${fontSize}' fill='${fg}'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // ---------- Load company profile ----------
  async function loadCompanyProfile() {
    try {
      const companyID = parseInt(localStorage.getItem('companyID'), 10) || null;
      const userId = parseInt(localStorage.getItem('userId'), 10) || null;

      let res;
      if (companyID) {
        res = await fetch(`http://localhost:3000/api/users/company/${companyID}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      } else if (userId) {
        // some backends provide company by userId; this is a fallback
        res = await fetch(`http://localhost:3000/api/users/company/${userId}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      } else {
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load company profile');

      // Accept multiple possible key casings
      companyProfile = data;
      companyLogoUrl = data.LogoUrl || data.logoUrl || data.logo || null;

      if (!companyLogoUrl) {
        const cName = data.CompanyName || data.companyName || data.Company || 'Company';
        const parts = (cName + '').split(/\s+/);
        companyLogoUrl = generateInitialsDataUrl(parts[0] || 'C', parts[1] || parts[0] || '', 64, '#1f6feb');
      }

      // update any header image if present
      const headerImg = document.getElementById('companyLogoImg');
      if (headerImg) headerImg.src = companyLogoUrl;
    } catch (err) {
      console.warn('loadCompanyProfile:', err.message || err);
    }
  }

  // ---------- Jobs API ----------
  async function loadJobsFromServer() {
    try {
      const res = await fetch('http://localhost:3000/api/jobs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load jobs');
      // Filter jobs belonging to this company if companyProfile exists
      const companyID = (companyProfile && (companyProfile.CompanyID || companyProfile.companyID || companyProfile.CompanyID)) || parseInt(localStorage.getItem('companyID'), 10) || null;
      jobs = Array.isArray(data) ? data : [];
      if (companyID) {
        // job record may use CompanyID or companyID
        jobs = jobs.filter(j => (j.CompanyID || j.companyID) == companyID);
      }
      renderJobs();
      const openCount = jobs.filter(x => (x.IsOpen || x.open) === 1 || (x.IsOpen || x.open) === true).length;
      const insJobsEl = document.getElementById('insJobs');
      if (insJobsEl) insJobsEl.textContent = openCount;
    } catch (err) {
      console.error(err);
      alert('Could not load jobs: ' + (err.message || err));
    }
  }

  // ---------- Render UI ----------
  function renderCandidates() {
    if (!candidateSuggestions) return;
    candidateSuggestions.innerHTML = '';
    candidates.forEach((c, idx) => {
      const el = document.createElement('div');
      el.className = 'suggest-item';
      const logoSrc = companyLogoUrl || generateInitialsDataUrl('C','O',42,'#1f6feb');
      el.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
        <img src="${logoSrc}" style="width:42px;height:42px;border-radius:8px;object-fit:cover">
        <div><div style="font-weight:700">${escapeHtml(c.name)}</div><div style="font-size:13px;color:var(--muted)">${escapeHtml(c.title)}</div></div>
      </div>
      <div><button class="btn primary" data-idx="${idx}">Invite</button></div>`;
      candidateSuggestions.appendChild(el);
      el.querySelector('button')?.addEventListener('click', () => { alert('Invite sent to ' + c.name); });
    });
  }

  function renderJobs() {
    if (!jobsList) return;
    jobsList.innerHTML = '';
    jobs.slice().reverse().forEach(job => {
      const id = job.JobID || job.jobID || job.id || job.JobId;
      const title = job.Title || job.title || '';
      const location = job.Location || job.location || 'Remote';
      const type = job.JobType || job.jobType || job.type || '';
      const desc = job.Description || job.description || job.desc || '';
      const isOpen = (job.IsOpen || job.open) ? true : false;

      const card = document.createElement('div');
      card.className = 'feed-card card job-card';
      card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:800">${escapeHtml(title)}</div>
            <div style="font-size:13px;color:var(--muted)">${escapeHtml(location)} · ${escapeHtml(type)}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn ghost" data-id="${id}">${isOpen ? 'Close' : 'Open'}</button>
            <button class="btn ghost" data-id-app="${id}">Applicants</button>
            <button class="btn ghost" data-id-del="${id}">Delete</button>
          </div>
        </div>
        <div style="margin-top:8px;color:var(--muted)">${escapeHtml(desc)}</div>
        <div style="margin-top:8px;font-size:13px;color:var(--muted)">Status: <strong>${isOpen ? 'Open' : 'Closed'}</strong></div>`;
      jobsList.appendChild(card);

      // attach handlers
      card.querySelector('button[data-id]')?.addEventListener('click', async (ev) => {
        const jobId = ev.currentTarget.dataset.id;
        await toggleJob(jobId);
      });
      card.querySelector('button[data-id-app]')?.addEventListener('click', (ev) => {
        const jobId = ev.currentTarget.dataset.idApp;
        alert('View applicants for ' + jobId + ' (implement modal).');
      });
      card.querySelector('button[data-id-del]')?.addEventListener('click', async (ev) => {
        const jobId = ev.currentTarget.dataset.idDel;
        if (!confirm('Delete job?')) return;
        // fallback: call close endpoint then reload
        try {
          await toggleJob(jobId, true);
        } catch (err) {
          alert('Delete error: ' + (err.message || err));
        }
      });
    });
  }

  // toggle job open/close (and optionally delete)
  async function toggleJob(id, deleteMode = false) {
    try {
      const url = `http://localhost:3000/api/jobs/${id}/close`;
      const res = await fetch(url, { method: 'PUT', headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await loadJobsFromServer();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  }

  // ---------- Posting new job ----------
  postJobBtn?.addEventListener('click', async () => {
    const title = jobTitle.value.trim();
    if (!title) { alert('Provide a job title.'); jobTitle.focus(); return; }
    const companyID = parseInt(localStorage.getItem('companyID'), 10) || (companyProfile && (companyProfile.CompanyID || companyProfile.companyID)) || null;
    if (!companyID) { alert('Company not identified. Please complete registration or login as company.'); return; }

    const payload = {
      companyID,
      title,
      location: jobLocation.value.trim() || 'Remote',
      jobType: jobType.value || '',
      description: jobDesc.value.trim() || ''
    };

    try {
      const res = await fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post job');
      jobTitle.value = ''; jobLocation.value = ''; jobDesc.value = '';
      await loadJobsFromServer();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  });

  // save job draft locally
  saveJobDraftBtn?.addEventListener('click', () => {
    const draft = { title: jobTitle.value, location: jobLocation.value, type: jobType.value, desc: jobDesc.value };
    localStorage.setItem('companyJobDraft', JSON.stringify(draft));
    alert('Job draft saved locally.');
  });

  // ---------- Init ----------
  (async function init() {
    renderCandidates();
    await loadCompanyProfile();
    await loadJobsFromServer();
  })();
});
