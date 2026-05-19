// ════════ HALO BRAIDS — APP CORE ════════

const App = {
  // ── i18n ──
  lang: localStorage.getItem('hb_lang') || 'fr',
  t(key) { return (I18N[this.lang] && I18N[this.lang][key]) || key; },
  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('hb_lang', lang);
    document.documentElement.lang = lang;
    this.applyTranslations();
    this.renderHeader();
    this.renderFooter();
    if (typeof onLangChange === 'function') onLangChange();
  },
  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      const v = this.t(k);
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = v;
      else el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-ph'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.getAttribute('data-i18n-title'));
    });
    // Update <html lang>
    document.title = this.t(document.title.includes('|') ?
      document.title.split('|')[0].trim() : document.title) || document.title;
  },

  // ── Auth ──
  get users() { return JSON.parse(localStorage.getItem('hb_users') || '[]'); },
  set users(v) { localStorage.setItem('hb_users', JSON.stringify(v)); },
  get currentUser() {
    const id = localStorage.getItem('hb_currentUser');
    if (!id) return null;
    return this.users.find(u => u.id === id) || null;
  },
  setCurrentUser(id) {
    if (id) localStorage.setItem('hb_currentUser', id);
    else localStorage.removeItem('hb_currentUser');
  },
  register({ firstname, lastname, email, phone, password }) {
    if (this.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok:false, error:'exists' };
    }
    const user = {
      id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      firstname, lastname, email, phone,
      password: this.hash(password),
      created: Date.now(),
    };
    const users = this.users; users.push(user); this.users = users;
    this.setCurrentUser(user.id);
    return { ok:true, user };
  },
  login(email, password) {
    const user = this.users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === this.hash(password));
    if (!user) return { ok:false, error:'login' };
    this.setCurrentUser(user.id);
    return { ok:true, user };
  },
  logout() { this.setCurrentUser(null); window.location.href = 'index.html'; },
  updateProfile(updates) {
    const cu = this.currentUser; if (!cu) return false;
    const users = this.users;
    const i = users.findIndex(u => u.id === cu.id);
    users[i] = { ...users[i], ...updates };
    this.users = users;
    return true;
  },
  hash(s) { // tiny non-secure hash — for demo only
    let h = 0; for (let i=0; i<s.length; i++) {
      h = ((h<<5)-h) + s.charCodeAt(i); h |= 0;
    } return 'h_' + Math.abs(h).toString(36);
  },

  // ── Bookings ──
  get bookings() { return JSON.parse(localStorage.getItem('hb_bookings') || '[]'); },
  set bookings(v) { localStorage.setItem('hb_bookings', JSON.stringify(v)); },
  createBooking(data) {
    const b = {
      id: 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      ...data, created: Date.now(), status:'confirmed',
    };
    const bookings = this.bookings; bookings.push(b); this.bookings = bookings;
    return b;
  },
  userBookings(userId) {
    return this.bookings.filter(b => b.userId === userId)
      .sort((a,b) => new Date(b.date+'T'+b.time) - new Date(a.date+'T'+a.time));
  },
  isSlotTaken(stylistId, date, time, duration) {
    const [th] = time.split(':').map(Number);
    const tStart = th * 60;
    const tEnd = tStart + ((duration || 1) * 60);
    return this.bookings.some(b => {
      if (b.stylistId !== stylistId || b.date !== date) return false;
      const [bh] = b.time.split(':').map(Number);
      const bStart = bh * 60;
      const bEnd = bStart + ((b.duration || 1) * 60);
      return tStart < bEnd && tEnd > bStart;
    });
  },

  // ── UI HELPERS ──
  toast(msg, type='') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 400);
    }, 3000);
  },

  // ── NAV / FOOTER ──
  renderHeader() {
    const nav = document.getElementById('app-nav');
    if (!nav) return;
    const cu = this.currentUser;
    const page = document.body.dataset.page || '';
    const link = (href, key, page2) => `<a href="${href}" ${page===page2?'class="active"':''} data-i18n="${key}">${this.t(key)}</a>`;

    nav.innerHTML = `
      <a href="index.html" class="nav-logo">
        <small>✦ LUXURY BRAIDING ✦</small>
        HALOBRAIDS
      </a>
      <div class="nav-links" id="navLinks">
        ${link('index.html','nav.home','home')}
        ${link('services.html','nav.services','services')}
        ${link('gallery.html','nav.gallery','gallery')}
        ${link('booking.html','nav.booking','booking')}
        ${link('promos.html','nav.promos','promos')}
        ${link('faq.html','nav.faq','faq')}
        ${link('contact.html','nav.contact','contact')}
      </div>
      <div class="nav-right">
        <div class="lang-toggle">
          <button id="lang-fr" class="${this.lang==='fr'?'active':''}">FR</button>
          <span>·</span>
          <button id="lang-en" class="${this.lang==='en'?'active':''}">EN</button>
        </div>
        ${cu
          ? `<a href="dashboard.html" class="user-chip">
               <span class="user-avatar">${cu.firstname.charAt(0).toUpperCase()}</span>
               ${cu.firstname}
             </a>`
          : `<a href="account.html" class="btn btn-outline btn-sm" data-i18n="nav.login">${this.t('nav.login')}</a>`
        }
        <a href="booking.html" class="btn btn-sm" data-i18n="nav.book">${this.t('nav.book')}</a>
        <button class="menu-toggle" id="menuToggle">☰</button>
      </div>`;

    document.getElementById('lang-fr').onclick = () => this.setLang('fr');
    document.getElementById('lang-en').onclick = () => this.setLang('en');
    const mt = document.getElementById('menuToggle');
    if (mt) mt.onclick = () => document.getElementById('navLinks').classList.toggle('open');
  },

  renderFooter() {
    const f = document.getElementById('app-footer');
    if (!f) return;
    f.innerHTML = `
      <div class="footer-top">
        <div class="footer-brand">
          <h4>HALOBRAIDS</h4>
          <div class="sub">Hair Braiding Salon</div>
          <p data-i18n="footer.tagline">${this.t('footer.tagline')}</p>
        </div>
        <div class="footer-col">
          <h5 data-i18n="footer.nav">${this.t('footer.nav')}</h5>
          <a href="index.html" data-i18n="nav.home">${this.t('nav.home')}</a>
          <a href="services.html" data-i18n="nav.services">${this.t('nav.services')}</a>
          <a href="gallery.html" data-i18n="nav.gallery">${this.t('nav.gallery')}</a>
          <a href="booking.html" data-i18n="nav.booking">${this.t('nav.booking')}</a>
          <a href="promos.html" data-i18n="nav.promos">${this.t('nav.promos')}</a>
          <a href="faq.html" data-i18n="nav.faq">${this.t('nav.faq')}</a>
          <a href="contact.html" data-i18n="nav.contact">${this.t('nav.contact')}</a>
        </div>
        <div class="footer-col">
          <h5 data-i18n="footer.services">${this.t('footer.services')}</h5>
          ${SERVICES.map(s => `<a href="services.html">${s['name'+this.cap(this.lang)]}</a>`).join('')}
        </div>
        <div class="footer-col">
          <h5 data-i18n="footer.contact">${this.t('footer.contact')}</h5>
          <p data-i18n-html data-i18n="footer.address">${this.t('footer.address')}</p>
          <p><a href="mailto:hello@halobraids.ca" style="color:inherit">hello@halobraids.ca</a></p>
          <p><a href="https://wa.me/16135550199" target="_blank" rel="noopener" style="color:var(--gold)">WhatsApp</a></p>
          <p data-i18n="footer.hours">${this.t('footer.hours')}</p>
          <p style="font-size:.78rem;color:var(--muted);margin-top:.3rem">${this.t('footer.apptOnly')}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p data-i18n="footer.rights">${this.t('footer.rights')}</p>
        <div class="footer-socials">
          <a href="#">INSTAGRAM</a>
          <a href="#">TIKTOK</a>
          <a href="#">FACEBOOK</a>
        </div>
      </div>`;
  },

  cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); },

  // ── Early booking discount ──
  earlyDiscount(dateStr) {
    const bDate = new Date(dateStr);
    const today = new Date(); today.setHours(0,0,0,0);
    const days = Math.round((bDate - today) / 864e5);
    if (days >= 30) return { pct:10, days, label: this.lang==='fr' ? '1 mois à l\'avance (−10%)' : '1 month advance (−10%)' };
    if (days >= 14) return { pct:5,  days, label: this.lang==='fr' ? '2 semaines à l\'avance (−5%)' : '2 weeks advance (−5%)' };
    return { pct:0, days, label:'' };
  },

  // ── Email confirmation (mailto) ──
  buildConfirmEmail(booking, user) {
    if (!user) return '#';
    const svc = SERVICES.find(s => s.id === booking.serviceId);
    const st  = STYLISTS.find(s => s.id === booking.stylistId);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const months = {
      fr:['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
      en:['January','February','March','April','May','June','July','August','September','October','November','December']
    };
    const [yy,mm,dd] = booking.date.split('-').map(Number);
    const dateDisp = `${dd} ${months[this.lang][mm-1]} ${yy}`;
    const svcName = svc ? svc['name'+cap(this.lang)] : booking.serviceId;
    const stName  = st  ? st['name'+cap(this.lang)]  : booking.stylistId;
    const disc = booking.discountPct || 0;
    const base = booking.price;
    const final = base - Math.round(base * disc / 100);

    const subFr = `✨ Confirmation RDV — Halo Braids — ${dateDisp}`;
    const subEn = `✨ Appointment Confirmed — Halo Braids — ${dateDisp}`;
    const bodyFr = `Bonjour ${user.firstname},

Votre rendez-vous chez Halo Braids est confirmé !

━━━━━━━━━━━━━━━━━━━━
N° de confirmation : ${booking.id.toUpperCase()}
Service  : ${svcName}
Styliste : ${stName}
Date     : ${dateDisp}
Heure    : ${booking.time}
Durée    : ${svc ? svc.duration : booking.duration}h
Prix estimé : à partir de ${final} $${disc > 0 ? ` (inclus ${disc}% de réduction anticipée)` : ''}
Acompte  : 50 $ (requis le jour du rendez-vous)
━━━━━━━━━━━━━━━━━━━━

📍 Studio Halo Braids — Ottawa, ON & Gatineau, QC

⚠️ Politique d'annulation : tout report ou annulation doit être effectué au moins 48h à l'avance. L'acompte n'est pas remboursable.

💆 Préparez vos cheveux : lavés, démêlés et complètement secs le jour du rendez-vous.

Merci de votre confiance — nous avons hâte de vous accueillir !

Halo Braids · hello@halobraids.ca
Studio de tressage de luxe · Ottawa · Gatineau`;

    const bodyEn = `Hello ${user.firstname},

Your appointment at Halo Braids is confirmed!

━━━━━━━━━━━━━━━━━━━━
Confirmation #: ${booking.id.toUpperCase()}
Service  : ${svcName}
Stylist  : ${stName}
Date     : ${dateDisp}
Time     : ${booking.time}
Duration : ${svc ? svc.duration : booking.duration}h
Est. price: from $${final}${disc > 0 ? ` (includes ${disc}% advance booking discount)` : ''}
Deposit  : $50 (required on the day)
━━━━━━━━━━━━━━━━━━━━

📍 Halo Braids Studio — Ottawa, ON & Gatineau, QC

⚠️ Cancellation policy: any reschedule or cancellation must be done at least 48 hours in advance. Deposit is non-refundable.

💆 Hair prep: washed, detangled, and completely dry on the day.

Thank you for your trust — we look forward to welcoming you!

Halo Braids · hello@halobraids.ca
Luxury Braiding Studio · Ottawa · Gatineau`;

    const subj = encodeURIComponent(this.lang==='fr' ? subFr : subEn);
    const body = encodeURIComponent(this.lang==='fr' ? bodyFr : bodyEn);
    return `mailto:${user.email}?subject=${subj}&body=${body}`;
  },

  // ── SMS link ──
  buildSmsLink(booking, user) {
    if (!user) return '#';
    const svc = SERVICES.find(s => s.id === booking.serviceId);
    const [yy,mm,dd] = booking.date.split('-').map(Number);
    const msgFr = `✨ Halo Braids — RDV confirmé ! ${svc ? svc.nameFr : ''} · ${dd}/${mm}/${yy} à ${booking.time}. Questions ? hello@halobraids.ca`;
    const msgEn = `✨ Halo Braids — Appointment confirmed! ${svc ? svc.nameEn : ''} · ${mm}/${dd}/${yy} at ${booking.time}. Questions? hello@halobraids.ca`;
    const phone = (user.phone || '').replace(/\D/g,'');
    const msg = encodeURIComponent(this.lang==='fr' ? msgFr : msgEn);
    return `sms:${phone}?body=${msg}`;
  },

  // ── ICS calendar link ──
  buildICS(booking) {
    const svc = SERVICES.find(s => s.id === booking.serviceId);
    const st  = STYLISTS.find(s => s.id === booking.stylistId);
    const [yy,mm,dd] = booking.date.split('-').map(Number);
    const [hh,min] = booking.time.split(':').map(Number);
    const dur = svc ? svc.duration : booking.duration;
    const pad = n => String(n).padStart(2,'0');
    const dtStart = `${yy}${pad(mm)}${pad(dd)}T${pad(hh)}${pad(min||0)}00`;
    const endH = hh + dur;
    const dtEnd   = `${yy}${pad(mm)}${pad(dd)}T${pad(endH)}${pad(min||0)}00`;
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HaloBraids//EN',
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`,`DTEND:${dtEnd}`,
      `SUMMARY:Halo Braids — ${svc ? svc.nameEn : booking.serviceId}`,
      `DESCRIPTION:Stylist: ${st ? st.nameEn : booking.stylistId}\\nRef: ${booking.id}`,
      'LOCATION:Ottawa, ON & Gatineau, QC',
      `UID:${booking.id}@halobraids.ca`,
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type:'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'halobraids-rdv.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // ── Print invoice ──
  printInvoice(booking, user) {
    if (!booking || !user) return;
    const svc = SERVICES.find(s => s.id === booking.serviceId);
    const st  = STYLISTS.find(s => s.id === booking.stylistId);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const months = {
      fr:['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
      en:['January','February','March','April','May','June','July','August','September','October','November','December']
    };
    const [yy,mm,dd] = booking.date.split('-').map(Number);
    const dateDisp = `${dd} ${months[this.lang][mm-1]} ${yy}`;
    const disc = booking.discountPct || 0;
    const base = booking.price;
    const discAmt = Math.round(base * disc / 100);
    const final = base - discAmt;
    const issued = new Date().toLocaleDateString(this.lang==='fr'?'fr-CA':'en-CA');
    const w = window.open('','_blank','width=700,height=900');
    w.document.write(`<!DOCTYPE html><html lang="${this.lang}"><head><meta charset="UTF-8">
<title>Facture Halo Braids #${booking.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Georgia',serif;color:#1a1208;background:#fff;max-width:640px;margin:40px auto;padding:0 24px}
  .logo{font-size:1.5rem;letter-spacing:.35em;font-weight:bold;color:#1a1208}
  .sub{font-size:.7rem;letter-spacing:.2em;color:#888;margin-bottom:4px}
  .gold{color:#c9a96e}
  hr{border:none;border-top:1.5px solid #c9a96e;margin:18px 0}
  .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f5ede0;font-size:.95rem}
  .row .k{color:#666}
  .row.total{font-weight:bold;font-size:1.05rem;color:#1a1208;border-bottom:none}
  .badge{display:inline-block;background:#c9a96e;color:#fff;padding:2px 8px;border-radius:2px;font-size:.7rem;letter-spacing:.1em}
  .note{font-size:.78rem;color:#999;line-height:1.7;margin-top:12px}
  .footer-inv{text-align:center;margin-top:36px;padding-top:18px;border-top:1px solid #f0e8d8;font-size:.75rem;color:#aaa;line-height:1.8}
  .print-btn{display:block;margin:28px auto 0;padding:12px 28px;background:#c9a96e;color:#fff;border:none;cursor:pointer;font-size:.9rem;letter-spacing:.15em;font-family:Georgia,serif}
  @media print{.print-btn{display:none}}
</style></head><body>
<div class="sub">STUDIO DE TRESSAGE DE LUXE · OTTAWA & GATINEAU</div>
<div class="logo">HALO BRAIDS</div>
<hr>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin:16px 0">
  <div>
    <div style="font-size:.7rem;letter-spacing:.2em;color:#888;margin-bottom:6px">${this.lang==='fr'?'FACTURE / REÇU':'INVOICE / RECEIPT'}</div>
    <div style="font-size:.85rem"><strong>#${booking.id.toUpperCase()}</strong></div>
    <div style="font-size:.78rem;color:#888;margin-top:4px">${this.lang==='fr'?'Émise le':'Issued':'Issued'} ${issued}</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:.78rem;color:#888">${user.firstname} ${user.lastname}</div>
    <div style="font-size:.78rem;color:#888">${user.email}</div>
    ${user.phone ? `<div style="font-size:.78rem;color:#888">${user.phone}</div>` : ''}
  </div>
</div>
<hr>
<div class="row"><span class="k">${this.lang==='fr'?'Service':'Service'}</span><span>${svc ? svc['name'+cap(this.lang)] : booking.serviceId}</span></div>
<div class="row"><span class="k">${this.lang==='fr'?'Styliste':'Stylist'}</span><span>${st ? st['name'+cap(this.lang)] : booking.stylistId}</span></div>
<div class="row"><span class="k">${this.lang==='fr'?'Date':'Date'}</span><span>${dateDisp}</span></div>
<div class="row"><span class="k">${this.lang==='fr'?'Heure':'Time'}</span><span>${booking.time}</span></div>
<div class="row"><span class="k">${this.lang==='fr'?'Durée estimée':'Est. duration'}</span><span>${svc ? svc.duration : booking.duration}h</span></div>
<hr>
<div class="row"><span class="k">${this.lang==='fr'?'Prix de base':'Base price'}</span><span>${base} $</span></div>
${disc > 0 ? `<div class="row" style="color:#4caf50"><span class="k">${this.lang==='fr'?`Réduction anticipée (${disc}%)`:`Advance discount (${disc}%)`}</span><span>− ${discAmt} $</span></div>` : ''}
<div class="row total"><span>${this.lang==='fr'?'TOTAL ESTIMÉ':'ESTIMATED TOTAL'}</span><span class="gold">${final} $</span></div>
<div class="row"><span class="k">${this.lang==='fr'?'Acompte (non remboursable)':'Deposit (non-refundable)'}</span><span>50 $</span></div>
<p class="note">* ${this.lang==='fr'?'Le prix final peut varier selon la longueur, la densité et les options choisies.':'Final price may vary based on length, density, and chosen options.'}</p>
<div class="footer-inv">
  <strong>Halo Braids</strong><br>
  hello@halobraids.ca · Ottawa, ON & Gatineau, QC<br>
  ${this.lang==='fr'?'Lun–Dim · 9h–22h · Sur rendez-vous':'Mon–Sun · 9am–10pm · By appointment'}<br><br>
  ${this.lang==='fr'?'Politique d\'annulation : 48h de préavis requis · Acompte non remboursable':'Cancellation policy: 48h notice required · Deposit non-refundable'}
</div>
<button class="print-btn" onclick="window.print()">${this.lang==='fr'?'🖨️ IMPRIMER / ENREGISTRER PDF':'🖨️ PRINT / SAVE PDF'}</button>
</body></html>`);
    w.document.close();
  },

  // ── INIT ──
  init() {
    document.documentElement.lang = this.lang;
    this.renderHeader();
    this.renderFooter();
    this.applyTranslations();

    // Sticky nav scroll
    const navEl = document.getElementById('app-nav');
    if (navEl) {
      const isHome = document.body.dataset.page === 'home';
      if (!isHome) navEl.classList.add('solid');
      window.addEventListener('scroll', () => {
        navEl.classList.toggle('scrolled', window.scrollY > 60);
      }, { passive:true });
    }

    // Fade-up observer
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
