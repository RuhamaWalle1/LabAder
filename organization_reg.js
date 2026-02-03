// frontend/js/organization_reg.js
document.addEventListener('DOMContentLoaded', () => {
  const companyLogo = document.getElementById('companyLogo');
  const logoPreview = document.getElementById('logoPreview');
  const saveBtn = document.getElementById('saveOrgDraft');
  const loadBtn = document.getElementById('loadOrgDraft');
  const submitBtn = document.getElementById('submitOrg');

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

  // add near top (after helper functions pasted above)
let logoDataUrl = null;

companyLogo?.addEventListener('change', async () => {
  const file = companyLogo.files[0];
  if (!file) { logoPreview.innerHTML = ''; logoDataUrl = null; return; }
  if (!file.type.startsWith('image/')) { alert('Choose an image file'); return; }

  // optional: you could resize here before converting to dataURL (not implemented)
  try {
    logoDataUrl = await readFileAsDataURL(file); // data:image/..;base64,...
    logoPreview.innerHTML = `<img src="${logoDataUrl}" alt="Logo preview">`;
  } catch (err) {
    console.error(err);
    alert('Could not read image');
  }
});


  function showError(id, msg){ const el = document.getElementById(id); if (el) el.textContent = msg; }
  function clearErrors(){ ['err-companyName','err-industry','err-orgEmail'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=''; });}
  function validate(){
    clearErrors();
    let ok = true;
    if (!document.getElementById('companyName').value.trim()){ showError('err-companyName','Company name required'); ok=false; }
    if (!document.getElementById('industry').value){ showError('err-industry','Industry required'); ok=false; }
    const email = document.getElementById('orgEmail').value.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)){ showError('err-orgEmail','Valid contact email required'); ok=false; }
    return ok;
  }

  saveBtn.addEventListener('click', () => {
    const data = {
      companyName: document.getElementById('companyName').value,
      industry: document.getElementById('industry').value,
      description: document.getElementById('description').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      country: document.getElementById('country').value,
      orgEmail: document.getElementById('orgEmail').value,
      orgPhone: document.getElementById('orgPhone').value,
      website: document.getElementById('website').value,
      hrName: document.getElementById('hrName').value,
      hrRole: document.getElementById('hrRole').value,
      hrEmail: document.getElementById('hrEmail').value,
      linkedinCompany: document.getElementById('linkedinCompany').value
    };
    localStorage.setItem('orgDraft', JSON.stringify(data));
    alert('Draft saved locally.');
  });

  loadBtn.addEventListener('click', () => {
    const raw = localStorage.getItem('orgDraft');
    if (!raw) { alert('No draft'); return; }
    const d = JSON.parse(raw);
    document.getElementById('companyName').value = d.companyName || '';
    document.getElementById('industry').value = d.industry || '';
    document.getElementById('description').value = d.description || '';
    document.getElementById('city').value = d.city || '';
    document.getElementById('state').value = d.state || '';
    document.getElementById('country').value = d.country || '';
    document.getElementById('orgEmail').value = d.orgEmail || '';
    document.getElementById('orgPhone').value = d.orgPhone || '';
    document.getElementById('website').value = d.website || '';
    document.getElementById('hrName').value = d.hrName || '';
    document.getElementById('hrRole').value = d.hrRole || '';
    document.getElementById('hrEmail').value = d.hrEmail || '';
    document.getElementById('linkedinCompany').value = d.linkedinCompany || '';
    alert('Loaded draft');
  });

  submitBtn.addEventListener('click', async () => {
    if (!validate()) { const first = document.querySelector('.error:not(:empty)'); if (first) first.scrollIntoView({behavior:'smooth',block:'center'}); return; }
    const userId = parseInt(localStorage.getItem('userId'), 10);
    if (!userId) { alert('Please sign up / login first'); return; }

        // determine logoUrl: use chosen image dataURL OR generate initials SVG data URL
        let finalLogo = logoDataUrl || null;
        if (!finalLogo) {
          // generate initials from companyName or HR name - prefer companyName
          const cName = (document.getElementById('companyName').value || '').trim();
          const hrName = (document.getElementById('hrName').value || '').trim();
          // if company name available, use first two words; else use hr name words
          const parts = cName || hrName || 'Co';
          const p = parts.split(/\s+/);
          const a = p[0] || '';
          const b = p[1] || p[0] || '';
          finalLogo = generateInitialsDataUrl(a, b, 120, '#1f6feb');
        }
    
        const payload = {
          userId,
          companyName: document.getElementById('companyName').value.trim(),
          industry: document.getElementById('industry').value || null,
          description: document.getElementById('description').value || null,
          logoUrl: finalLogo, // send data URL (or svg data URL) to server
          city: document.getElementById('city').value || null,
          stateRegion: document.getElementById('state').value || null,
          country: document.getElementById('country').value || null,
          contactEmail: document.getElementById('orgEmail').value.trim(),
          contactPhone: document.getElementById('orgPhone').value || null,
          website: document.getElementById('website').value || null,
          hrName: document.getElementById('hrName').value || null,
          hrRole: document.getElementById('hrRole').value || null,
          hrEmail: document.getElementById('hrEmail').value || null
        };
    

    try {
      const res = await fetch('http://localhost:3000/api/users/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      alert('Company profile created.');
      // optionally fetch companyID and store
      // try to fetch company profile to get CompanyID
      const cp = await fetch(`http://localhost:3000/api/users/company/${userId}`);
      const cpjson = await cp.json();
      if (cpok(cpjson)) localStorage.setItem('companyID', cpjson.CompanyID || cpjson.companyID || '');
      window.location.href = 'company_home.html';
    } catch (err) {
      alert('Error: ' + err.message);
    }

    function cpok(j){ return j && (j.CompanyID || j.companyID); }
  });
});
