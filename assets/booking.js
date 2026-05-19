// ════════ BOOKING FLOW ════════

const Booking = {
  state: {
    service: null,
    stylist: null,
    date: null,
    time: null,
    note: '',
    currentStep: 1,
    calMonth: new Date().getMonth(),
    calYear: new Date().getFullYear(),
  },

  init() {
    // Preselect service from query string
    const params = new URLSearchParams(location.search);
    const pre = params.get('service');

    this.renderServices(pre);
    this.bindNav();
    this.bindConfirm();
  },

  renderServices(preselect) {
    const grid = document.getElementById('step1-services');
    grid.innerHTML = SERVICES.map(s => `
      <div class="stylist-card svc-pick" data-id="${s.id}">
        <div class="stylist-avatar" style="background:linear-gradient(135deg,#5a3012,#1e0c04);color:var(--gold)">${App.cap(s.id.charAt(0))}</div>
        <h3>${s['name'+App.cap(App.lang)].toUpperCase()}</h3>
        <div class="role">${App.t('common.from')} ${s.price} $ · ${s.duration}h</div>
        <div class="specialty">${s['desc'+App.cap(App.lang)]}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.svc-pick').forEach(el => {
      el.addEventListener('click', () => {
        grid.querySelectorAll('.svc-pick').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        this.state.service = SERVICES.find(s => s.id === el.dataset.id);
        const btn = document.getElementById('btn-next-1');
        btn.disabled = false;
        btn.style.opacity = ''; btn.style.pointerEvents = '';
      });
    });

    if (preselect) {
      const el = grid.querySelector(`[data-id="${preselect}"]`);
      if (el) el.click();
    }
  },

  renderStylists() {
    const grid = document.getElementById('step2-stylists');
    const svcId = this.state.service.id;
    const eligible = STYLISTS.filter(st => st.services.includes(svcId));

    grid.innerHTML = eligible.map(st => `
      <div class="stylist-card st-pick" data-id="${st.id}">
        <div class="stylist-avatar">${st.initials}</div>
        <h3>${st['name'+App.cap(App.lang)].toUpperCase()}</h3>
        <div class="role">${st['role'+App.cap(App.lang)]}</div>
        <div class="specialty">${st['specialty'+App.cap(App.lang)]}</div>
        <div class="rating">★★★★★ ${st.rating.toFixed(1)}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.st-pick').forEach(el => {
      el.addEventListener('click', () => {
        grid.querySelectorAll('.st-pick').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        this.state.stylist = STYLISTS.find(s => s.id === el.dataset.id);
        const btn = document.getElementById('btn-next-2');
        btn.disabled = false;
        btn.style.opacity = ''; btn.style.pointerEvents = '';
        // Reset date/time on stylist change
        this.state.date = null; this.state.time = null;
      });
    });
  },

  renderCalendar() {
    const cal = document.getElementById('calendar');
    const m = this.state.calMonth, y = this.state.calYear;
    const monthName = App.t('month.' + m);
    const first = new Date(y, m, 1);
    const dim = new Date(y, m+1, 0).getDate();
    const firstDow = (first.getDay() + 6) % 7; // Monday = 0
    const today = new Date(); today.setHours(0,0,0,0);
    const todayMs = today.getTime();

    const dowKeys = ['mon','tue','wed','thu','fri','sat','sun'];
    let html = `
      <div class="cal-header">
        <button class="cal-nav" id="cal-prev">‹</button>
        <h3>${monthName.toUpperCase()} ${y}</h3>
        <button class="cal-nav" id="cal-next">›</button>
      </div>
      <div class="cal-grid">
        ${dowKeys.map(d => `<div class="cal-dow">${App.t('day.'+d)}</div>`).join('')}
        ${Array(firstDow).fill('<div class="cal-day empty"></div>').join('')}`;

    for (let d=1; d<=dim; d++) {
      const date = new Date(y, m, d);
      const dateMs = date.getTime();
      const dowKey = dowKeys[(date.getDay()+6)%7];
      const stylistWorks = this.state.stylist.schedule[dowKey] === 1;
      const isPast = dateMs < todayMs;
      const isToday = dateMs === todayMs;
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isSelected = this.state.date === dateStr;
      const disabled = isPast || !stylistWorks;

      html += `<div class="cal-day ${disabled?'disabled':''} ${isToday?'today':''} ${isSelected?'selected':''}"
                    ${disabled?'':`data-date="${dateStr}"`}>${d}</div>`;
    }
    html += '</div>';
    cal.innerHTML = html;

    document.getElementById('cal-prev').onclick = () => {
      if (this.state.calMonth === 0) { this.state.calMonth = 11; this.state.calYear--; }
      else this.state.calMonth--;
      // Don't go past current month
      const now = new Date();
      if (this.state.calYear < now.getFullYear() ||
          (this.state.calYear === now.getFullYear() && this.state.calMonth < now.getMonth())) {
        this.state.calMonth = now.getMonth();
        this.state.calYear = now.getFullYear();
      }
      this.renderCalendar();
    };
    document.getElementById('cal-next').onclick = () => {
      if (this.state.calMonth === 11) { this.state.calMonth = 0; this.state.calYear++; }
      else this.state.calMonth++;
      this.renderCalendar();
    };

    cal.querySelectorAll('.cal-day[data-date]').forEach(el => {
      el.addEventListener('click', () => {
        this.state.date = el.dataset.date;
        this.state.time = null;
        this.renderCalendar();
        this.renderSlots();
      });
    });

    // Reset slots if no date
    if (!this.state.date) {
      document.getElementById('slots-container').innerHTML =
        `<p class="empty">${App.t('booking.selectDate')}</p>`;
      document.getElementById('slots-title').textContent = '';
    }
  },

  renderSlots() {
    if (!this.state.date) return;
    const cont = document.getElementById('slots-container');
    const title = document.getElementById('slots-title');
    const svcDuration = this.state.service ? this.state.service.duration : 1;

    const [yy, mm, dd] = this.state.date.split('-').map(Number);
    const monthName = App.t('month.' + (mm-1));
    title.textContent = `${dd} ${monthName} ${yy}`.toUpperCase();

    const available = TIME_SLOTS
      .filter(t => parseInt(t.split(':')[0]) + svcDuration <= 22)
      .map(t => ({
        time: t,
        taken: App.isSlotTaken(this.state.stylist.id, this.state.date, t, svcDuration)
      }));

    cont.innerHTML = `
      <div class="slots-grid">
        ${available.map(s => `
          <div class="slot ${s.taken?'disabled':''} ${this.state.time===s.time?'selected':''}"
               ${s.taken?'':`data-time="${s.time}"`}>${s.time}</div>
        `).join('')}
      </div>`;

    cont.querySelectorAll('.slot[data-time]').forEach(el => {
      el.addEventListener('click', () => {
        cont.querySelectorAll('.slot').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        this.state.time = el.dataset.time;
        const btn = document.getElementById('btn-next-3');
        btn.disabled = false;
        btn.style.opacity = ''; btn.style.pointerEvents = '';
      });
    });
  },

  renderSummary() {
    const s = this.state.service;
    const st = this.state.stylist;
    const [yy, mm, dd] = this.state.date.split('-').map(Number);
    const dateDisplay = `${dd} ${App.t('month.'+(mm-1))} ${yy}`;

    const disc = App.earlyDiscount(this.state.date);
    const base = s.price;
    const discAmt = Math.round(base * disc.pct / 100);
    const final = base - discAmt;

    document.getElementById('summary').innerHTML = `
      <div class="summary-row">
        <span class="k">${App.t('booking.service')}</span>
        <span class="v">${s['name'+App.cap(App.lang)]}</span>
      </div>
      <div class="summary-row">
        <span class="k">${App.t('booking.stylist')}</span>
        <span class="v">${st['name'+App.cap(App.lang)]}</span>
      </div>
      <div class="summary-row">
        <span class="k">${App.t('booking.date')}</span>
        <span class="v">${dateDisplay}</span>
      </div>
      <div class="summary-row">
        <span class="k">${App.t('booking.time')}</span>
        <span class="v">${this.state.time}</span>
      </div>
      <div class="summary-row">
        <span class="k">${App.t('booking.duration')}</span>
        <span class="v">${s.durationMin}–${s.duration}h</span>
      </div>
      <div class="summary-row">
        <span class="k">${App.t('booking.price')}</span>
        <span class="v">${App.t('common.from')} ${s.price} $${s.priceMax ? ' — '+s.priceMax+' $' : ''}</span>
      </div>
      ${disc.pct > 0 ? `
      <div class="summary-row discount-row">
        <span class="k">🏷️ ${App.t('booking.discount')}</span>
        <span class="v disc-badge">${disc.label}</span>
      </div>
      <div class="summary-row discount-row">
        <span class="k">${App.t('booking.originalPrice')}</span>
        <span class="v" style="text-decoration:line-through;color:var(--muted)">${base} $</span>
      </div>
      <div class="summary-row discount-row">
        <span class="k">${App.t('booking.finalPrice')}</span>
        <span class="v" style="color:#4caf50;font-weight:600">${final} $ ✓</span>
      </div>` : ''}
      <div class="summary-total">
        <span class="k">${App.t('booking.deposit')}</span>
        <span class="v">50 $</span>
      </div>
      <div class="summary-info-box">
        <div class="summary-info-item">
          <span class="info-icon">⚠️</span>
          <div><strong>${App.t('booking.policy')}</strong><br>${App.t('booking.policyText')}</div>
        </div>
        <div class="summary-info-item">
          <span class="info-icon">💆</span>
          <div><strong>${App.t('booking.hairPrep')}</strong><br>${App.t('booking.hairPrepText')}</div>
        </div>
      </div>
    `;

    // Payment modalities card
    document.getElementById('payment-card').innerHTML = `
      <div class="payment-card">
        <div class="payment-card-title">
          <span style="font-size:1.1rem">💳</span>
          ${App.t('payment.title')}
        </div>
        <div class="payment-row">
          <span class="payment-key">${App.t('payment.deposit')}</span>
          <span class="payment-val"><strong>50 $</strong> — ${App.lang==='fr'?'non remboursable':'non-refundable'}</span>
        </div>
        <div class="payment-row" style="font-size:.82rem;color:var(--muted);padding-top:.2rem">
          <span></span>
          <span>${App.t('payment.depositNote')}</span>
        </div>
        <div class="payment-row">
          <span class="payment-key">${App.t('payment.balance')}</span>
          <span class="payment-val">${App.t('payment.balanceText')}</span>
        </div>
        <div class="payment-divider"></div>
        <div class="payment-methods-label">${App.t('payment.methods')}</div>
        <div class="payment-methods">
          <div class="payment-method">💵 ${App.t('payment.cash')}</div>
          <div class="payment-method">🏦 ${App.t('payment.etransfer')}</div>
          <div class="payment-method">💳 ${App.t('payment.card')}</div>
        </div>
        <div class="payment-etransfer">✉️ ${App.t('payment.etransferTo')}</div>
        <p class="payment-note">${App.t('payment.note')}</p>
      </div>`;

    // Guest form or logged-in display
    const cu = App.currentUser;
    const guestSection = document.getElementById('guest-section');
    const authNeeded = document.getElementById('auth-needed');
    const confirmBtn = document.getElementById('btn-confirm');

    if (cu) {
      guestSection.classList.add('hidden');
      authNeeded.classList.add('hidden');
      confirmBtn.disabled = false; confirmBtn.style.opacity = ''; confirmBtn.style.pointerEvents = '';
    } else {
      guestSection.classList.remove('hidden');
      authNeeded.classList.add('hidden');
      confirmBtn.disabled = false; confirmBtn.style.opacity = ''; confirmBtn.style.pointerEvents = '';
      this._updateGuestConfirmBtn();
    }
  },

  _updateGuestConfirmBtn() {
    const fn = (document.getElementById('g-firstname') || {}).value || '';
    const ph = (document.getElementById('g-phone') || {}).value || '';
    const btn = document.getElementById('btn-confirm');
    if (btn) {
      const ok = fn.trim().length > 0 && ph.trim().length >= 7;
      btn.disabled = !ok;
      btn.style.opacity = ok ? '' : '.4';
      btn.style.pointerEvents = ok ? '' : 'none';
    }
  },

  goToStep(n) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-content="${n}"]`).classList.add('active');
    document.querySelectorAll('.step').forEach(el => {
      el.classList.remove('active','done');
      const stepNum = parseInt(el.dataset.step);
      if (stepNum < n) el.classList.add('done');
      if (stepNum === n) el.classList.add('active');
    });
    this.state.currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (n === 2) this.renderStylists();
    if (n === 3) { this.renderCalendar(); this.renderSlots(); }
    if (n === 4) this.renderSummary();
  },

  bindNav() {
    document.getElementById('btn-next-1').onclick = () => this.goToStep(2);
    document.getElementById('btn-next-2').onclick = () => this.goToStep(3);
    document.getElementById('btn-next-3').onclick = () => this.goToStep(4);
    document.querySelectorAll('[data-prev]').forEach(b => {
      b.onclick = () => this.goToStep(parseInt(b.dataset.prev) - 1);
    });
  },

  bindConfirm() {
    document.getElementById('btn-confirm').onclick = () => {
      const cu = App.currentUser;
      let userInfo, profileRef, isNew = false;

      if (cu) {
        // Logged-in: use account data
        userInfo = { firstname: cu.firstname, lastname: cu.lastname, phone: cu.phone || '', email: cu.email };
      } else {
        // Guest: use form fields
        const fn = (document.getElementById('g-firstname') || {}).value || '';
        const ln = (document.getElementById('g-lastname') || {}).value || '';
        const ph = (document.getElementById('g-phone') || {}).value || '';
        const em = (document.getElementById('g-email') || {}).value || '';
        if (!fn.trim() || ph.trim().length < 7) {
          App.toast(App.t('booking.guestFill'), 'error'); return;
        }
        userInfo = { firstname: fn, lastname: ln, phone: ph, email: em };
      }

      // Find or create guest profile
      const profile = App.findOrCreateProfile(userInfo);
      profileRef = profile ? profile.ref : null;
      isNew = profile ? !!profile.isNew : false;
      if (profile) delete profile.isNew; // reset flag

      const note = (document.getElementById('booking-note') || {}).value || '';
      const disc = App.earlyDiscount(this.state.date);

      const booking = App.createBooking({
        userId: cu ? cu.id : null,
        profileRef,
        guestInfo: cu ? null : userInfo,
        serviceId: this.state.service.id,
        stylistId: this.state.stylist.id,
        date: this.state.date,
        time: this.state.time,
        price: this.state.service.price,
        duration: this.state.service.duration,
        discountPct: disc.pct,
        note,
      });

      window._lastBooking = booking;
      window._lastProfile = profile;
      window._isNewProfile = isNew;

      const displayUser = cu || { ...userInfo };
      this.renderConfirmation(booking, displayUser, profile);

      document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
      document.querySelector('[data-content="5"]').classList.add('active');
      document.querySelector('.steps-nav').style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      App.toast(App.t('booking.success'), 'success');
    };
  },

  renderConfirmation(booking, user, profile) {
    const s = SERVICES.find(sv => sv.id === booking.serviceId);
    const st = STYLISTS.find(sv => sv.id === booking.stylistId);
    const [yy,mm,dd] = booking.date.split('-').map(Number);
    const dateDisp = `${dd} ${App.t('month.'+(mm-1))} ${yy}`;
    const disc = booking.discountPct || 0;
    const base = booking.price;
    const final = base - Math.round(base * disc / 100);

    const sumEl = document.getElementById('confirm-mini-summary');
    if (sumEl) {
      sumEl.innerHTML = `
        ${booking.ref ? `
        <div class="booking-ref-hero">
          <div class="booking-ref-label">${App.t('booking.bookingRef')}</div>
          <div class="booking-ref-code">${booking.ref}</div>
          ${profile ? `<div class="booking-ref-label" style="margin-top:.8rem">${App.t('booking.profileRef')}</div>
          <div class="booking-ref-code" style="font-size:1.1rem;opacity:.8">${profile.ref}</div>` : ''}
          <p style="font-family:'Cormorant Garamond',serif;font-size:.85rem;color:rgba(255,255,255,.5);margin-top:.6rem">
            ${App.lang==='fr'?'Notez ces codes — ils vous permettent de retrouver vos commandes sur':'Save these codes — use them to track your orders at'}
            <a href="mes-commandes.html" style="color:var(--gold)">mes-commandes.html</a>
          </p>
        </div>` : ''}
        <div class="confirm-receipt">
          <div class="confirm-receipt-header">
            <span>HALO BRAIDS</span>
            <span style="font-size:.75rem">${booking.ref || booking.id.slice(-8).toUpperCase()}</span>
          </div>
          <div class="cr-row"><span>${App.t('booking.service')}</span><span>${s ? s['name'+App.cap(App.lang)] : booking.serviceId}</span></div>
          <div class="cr-row"><span>${App.t('booking.stylist')}</span><span>${st ? st['name'+App.cap(App.lang)] : booking.stylistId}</span></div>
          <div class="cr-row"><span>${App.t('booking.date')}</span><span>${dateDisp}</span></div>
          <div class="cr-row"><span>${App.t('booking.time')}</span><span>${booking.time}</span></div>
          ${disc > 0 ? `<div class="cr-row" style="color:#4caf50"><span>${App.t('booking.discount')}</span><span>−${Math.round(base*disc/100)} $</span></div>` : ''}
          <div class="cr-row cr-total"><span>${App.t('booking.finalPrice')}</span><span>${final} $</span></div>
          <div class="cr-row" style="font-size:.8rem;color:var(--muted)"><span>${App.t('booking.deposit')}</span><span>50 $</span></div>
        </div>`;
    }

    const btnEmail = document.getElementById('btn-email-confirm');
    if (btnEmail) btnEmail.href = App.buildConfirmEmail(booking, user);

    const btnSms = document.getElementById('btn-sms-confirm');
    if (btnSms) btnSms.href = App.buildSmsLink(booking, user);

    const btnInv = document.getElementById('btn-invoice');
    if (btnInv) btnInv.onclick = () => App.printInvoice(booking, user);

    const btnCal = document.getElementById('btn-add-cal');
    if (btnCal) btnCal.onclick = () => App.buildICS(booking);

    const btnOrders = document.getElementById('btn-view-orders');
    if (btnOrders) btnOrders.href = 'mes-commandes.html';
  }
};

function onLangChange() {
  Booking.renderServices();
  if (Booking.state.currentStep >= 2 && Booking.state.stylist) Booking.renderStylists();
  if (Booking.state.currentStep >= 3 && Booking.state.stylist) Booking.renderCalendar();
  if (Booking.state.currentStep === 3 && Booking.state.date) Booking.renderSlots();
  if (Booking.state.currentStep === 4) Booking.renderSummary();
}

document.addEventListener('DOMContentLoaded', () => Booking.init());
