// frontend/js/individual_reg.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('individualForm');
  if (!form) return;
// --- helper functions (paste near top of the file)
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// returns a data:image/svg+xml URL containing two-letter initials
function generateInitialsDataUrl(a = '', b = '', size = 120, bg = '#2b9cff', fg = '#ffffff') {
  const initials = (String(a || '').trim().split(/\s+/)[0] || '').charAt(0).toUpperCase()
                 + (String(b || '').trim().split(/\s+/)[0] || '').charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.45);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
    <rect width='100%' height='100%' fill='${bg}' rx='14' ry='14'/>
    <text x='50%' y='50%' dy='0.36em' text-anchor='middle' font-family='Segoe UI, Roboto, Arial' font-size='${fontSize}' fill='${fg}'>${initials}</text>
  </svg>`;
  // encode and return inline data URL (URI-encoded to avoid base64 bloat)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

  
  // tag/skill UI (keep your logic)
  const skillInput = document.getElementById('skillInput');
  const skillsBox = document.getElementById('skillsInput');
  let skills = [];
  function renderSkills(){
    skillsBox.innerHTML = '';
    skills.forEach((s, idx) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.innerHTML = `${s} <span class="remove" data-idx="${idx}">×</span>`;
      skillsBox.appendChild(tag);
    });
    skillsBox.appendChild(skillInput);
    skillInput.value = '';
    skillInput.focus();
  }
  skillsBox.addEventListener('click', () => skillInput.focus());
  skillInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = skillInput.value.trim().replace(/,$/,'');
      if (v && !skills.includes(v)) { skills.push(v); renderSkills(); } else skillInput.value = '';
    } else if (e.key === 'Backspace' && skillInput.value === '') {
      skills.pop(); renderSkills();
    }
  });
  skillsBox.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove')) {
      skills.splice(parseInt(e.target.dataset.idx,10),1);
      renderSkills();
    }
  });

  // preview image optional - we won't upload image to server in this version.
  const profilePic = document.getElementById('profilePic');
  const profilePreview = document.getElementById('profilePreview');
  let profileDataUrl = null;

profilePic?.addEventListener('change', async () => {
  const file = profilePic.files[0];
  if (!file) { profilePreview.innerHTML = ''; profileDataUrl = null; return; }
  if (!file.type.startsWith('image/')) { alert('Choose an image file'); return; }

  try {
    profileDataUrl = await readFileAsDataURL(file);
    profilePreview.innerHTML = `<img src="${profileDataUrl}" alt="Profile preview">`;
  } catch (err) {
    console.error(err);
    alert('Could not read image');
  }
});


  // validation
  function showError(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
  function clearErrors(){ ['err-fullName','err-primaryField','err-skills','err-email'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=''; });}
  function validate(){
    clearErrors();
    let ok = true;
    if (!document.getElementById('fullName').value.trim()){ showError('err-fullName','Full name is required'); ok=false; }
    if (!document.getElementById('primaryField').value){ showError('err-primaryField','Select a field'); ok=false; }
    if (skills.length === 0){ showError('err-skills','Add at least one skill'); ok=false; }
    const email = document.getElementById('email').value.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)){ showError('err-email','Valid email is required'); ok=false; }
    return ok;
  }

  // save/load draft (localStorage) - keep as convenience
  document.getElementById('saveDraftBtn').addEventListener('click', () => {
    const data = {
      fullName: document.getElementById('fullName').value,
      dob: document.getElementById('dob').value,
      gender: document.getElementById('gender').value,
      primaryField: document.getElementById('primaryField').value,
      subField: document.getElementById('subField').value,
      skills,
      experience: document.getElementById('experience').value,
      degree: document.getElementById('degree').value,
      institution: document.getElementById('institution').value,
      gradYear: document.getElementById('gradYear').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      linkedin: document.getElementById('linkedin').value,
      bio: document.getElementById('bio') ? document.getElementById('bio').value : ''
    };
    localStorage.setItem('individualDraft', JSON.stringify(data));
    alert('Draft saved locally.');
  });

  document.getElementById('loadDraftBtn').addEventListener('click', () => {
    const raw = localStorage.getItem('individualDraft');
    if (!raw) { alert('No draft found'); return; }
    const d = JSON.parse(raw);
    document.getElementById('fullName').value = d.fullName || '';
    document.getElementById('dob').value = d.dob || '';
    document.getElementById('gender').value = d.gender || '';
    document.getElementById('primaryField').value = d.primaryField || '';
    document.getElementById('subField').value = d.subField || '';
    skills = d.skills || [];
    renderSkills();
    document.getElementById('experience').value = d.experience || '';
    document.getElementById('degree').value = d.degree || '';
    document.getElementById('institution').value = d.institution || '';
    document.getElementById('gradYear').value = d.gradYear || '';
    document.getElementById('email').value = d.email || '';
    document.getElementById('phone').value = d.phone || '';
    document.getElementById('linkedin').value = d.linkedin || '';
    if (document.getElementById('bio')) document.getElementById('bio').value = d.bio || '';
    alert('Draft loaded.');
  });

  // submit to backend
  document.getElementById('nextBtn').addEventListener('click', async () => {
    if (!validate()) { const first = document.querySelector('.error:not(:empty)'); if (first) first.scrollIntoView({behavior:'smooth', block:'center'}); return; }
    const userId = parseInt(localStorage.getItem('userId'), 10);
    if (!userId) { alert('Please sign up / login first'); return; }

        // determine profile pic URL or generate initials
        let finalProfile = profileDataUrl || null;
        if (!finalProfile) {
          const fullName = (document.getElementById('fullName').value || '').trim();
          // get first and father's name initials (first two words)
          const parts = fullName.split(/\s+/);
          const a = parts[0] || '';
          const b = parts[1] || parts[0] || '';
          finalProfile = generateInitialsDataUrl(a, b, 120, '#4caf50');
        }
    
        const payload = {
          userId,
          fullName: document.getElementById('fullName').value.trim(),
          dob: document.getElementById('dob').value || null,
          gender: document.getElementById('gender').value || null,
          primaryField: document.getElementById('primaryField').value || null,
          subField: document.getElementById('subField').value || null,
          yearsExperience: parseInt(document.getElementById('experience').value || 0, 10),
          degree: document.getElementById('degree').value || null,
          institution: document.getElementById('institution').value || null,
          gradYear: parseInt(document.getElementById('gradYear').value || 0, 10),
          email: document.getElementById('email').value.trim(),
          phone: document.getElementById('phone').value || null,
          linkedin: document.getElementById('linkedin').value || null,
          bio: document.getElementById('bio') ? document.getElementById('bio').value : null,
          skills,
          profilePicUrl: finalProfile
        };
    

    try {
      const res = await fetch('http://localhost:3000/api/users/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      alert('Profile saved.');
      window.location.href = 'individual_home.html';
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  // initial render skills if any
  const draft = localStorage.getItem('individualDraft');
  if (draft) {
    // don't auto-load, but you could: renderSkills();
  }
});
