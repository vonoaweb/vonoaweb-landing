(() => {
  // ── Hero starfield + cursor spotlight ──
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('stars');
  const spot = document.getElementById('spot');
  const ring = document.getElementById('ring');
  const content = document.getElementById('hero-content');
  if (canvas && hero) {
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    function resize() {
      const r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    new ResizeObserver(resize).observe(hero);

    const COLORS = ['#ffffff','#ffffff','#ffffff','#2EE9B9','#1CA0F4'];
    const STARS = Array.from({length:110},()=>({
      x:Math.random(), y:Math.random(),
      r:Math.random()*1.4+0.3,
      depth:Math.random()*0.8+0.2,
      color:COLORS[Math.floor(Math.random()*COLORS.length)],
      tw:Math.random()*Math.PI*2,
      twSpeed:0.006+Math.random()*0.015,
      vx:(Math.random()-0.5)*0.00008,
      vy:(Math.random()-0.5)*0.00008
    }));
    const PLUS = Array.from({length:10},()=>({
      x:Math.random(), y:Math.random(),
      s:5+Math.random()*6,
      depth:Math.random()*0.6+0.3,
      color:Math.random()<0.4?'rgba(46,233,185,.4)':'rgba(148,163,184,.28)',
      tw:Math.random()*Math.PI*2,
      twSpeed:0.005+Math.random()*0.012
    }));

    const mouse = { x:0.5, y:0.5, sx:0.5, sy:0.5 };
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
    });
    hero.addEventListener('mouseleave', () => { mouse.x = 0.5; mouse.y = 0.4; });
    if (window.innerWidth >= 768) {
      hero.addEventListener('touchmove', e => {
        if (!e.touches[0]) return;
        const r = hero.getBoundingClientRect();
        mouse.x = (e.touches[0].clientX - r.left) / r.width;
        mouse.y = (e.touches[0].clientY - r.top) / r.height;
      }, { passive: true });
    }

    function frame() {
      mouse.sx += (mouse.x - mouse.sx) * 0.06;
      mouse.sy += (mouse.y - mouse.sy) * 0.06;
      if (spot) {
        spot.style.setProperty('--mx', (mouse.sx * 100).toFixed(2) + '%');
        spot.style.setProperty('--my', (mouse.sy * 100).toFixed(2) + '%');
      }
      if (ring) {
        ring.style.setProperty('--rx', ((0.5 - mouse.sx) * 24).toFixed(1) + 'px');
        ring.style.setProperty('--ry', ((0.5 - mouse.sy) * 16).toFixed(1) + 'px');
      }
      if (content && window.innerWidth >= 768) {
        content.style.transform = `translate3d(${((mouse.sx-0.5)*4).toFixed(2)}px, ${((mouse.sy-0.5)*2).toFixed(2)}px, 0)`;
      }
      ctx.clearRect(0, 0, W, H);
      const paraX = (mouse.sx - 0.5);
      const paraY = (mouse.sy - 0.5);
      for (const s of STARS) {
        s.x += s.vx; s.y += s.vy; s.tw += s.twSpeed;
        if (s.x < -0.02) s.x = 1.02; if (s.x > 1.02) s.x = -0.02;
        if (s.y < -0.02) s.y = 1.02; if (s.y > 1.02) s.y = -0.02;
        const px = s.x*W - paraX*28*s.depth;
        const py = s.y*H - paraY*18*s.depth;
        const twinkle = 0.5 + Math.sin(s.tw) * 0.45;
        const r = s.r * (0.85 + s.depth * 0.5);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI*2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.min(1, 0.3 + twinkle * 0.6 * s.depth);
        ctx.fill();
        if (s.depth > 0.75 && r > 1.1) {
          ctx.globalAlpha = 0.12 * twinkle;
          ctx.beginPath();
          ctx.arc(px, py, r*3.5, 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.lineCap = 'round';
      for (const p of PLUS) {
        p.tw += p.twSpeed;
        const a = 0.2 + (Math.sin(p.tw) * 0.5 + 0.5) * 0.45;
        const px = p.x*W - paraX*48*p.depth;
        const py = p.y*H - paraY*32*p.depth;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = a;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(px-p.s/2, py); ctx.lineTo(px+p.s/2, py);
        ctx.moveTo(px, py-p.s/2); ctx.lineTo(px, py+p.s/2);
        ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  // ── Nav active section tracking ──
  const navLinks = document.querySelectorAll('.site-nav .links a');
  const sections = ['top','servicios','portafolio','precios','contacto']
    .map(id => document.getElementById(id)).filter(Boolean);
  function updateActive() {
    const y = window.scrollY + 120;
    let active = 'top';
    for (const s of sections) {
      if (s.offsetTop <= y) active = s.id;
    }
    navLinks.forEach(a => {
      const href = a.getAttribute('href').replace('#','');
      a.classList.toggle('active', href === active);
    });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();

  // ── Nav scroll effect ──
  const siteNav = document.querySelector('.site-nav');
  if (siteNav) {
    window.addEventListener('scroll', () => {
      siteNav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ── Mobile Menu ──
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      burger.classList.toggle('active', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Scroll Reveal ──
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => revealObs.observe(el));
  }

  // ── Counter Animation ──
  const statNums = document.querySelectorAll('.stat .num');
  if (statNums.length) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const text = el.textContent.trim();
        // Extract number from text like "+80", "98", "<18d" — skip if number is embedded mid-text
        const match = text.match(/[\+<]?(\d+)/);
        if (!match || match.index > 1) return;
        const target = parseInt(match[1], 10);
        const sign = match[0].match(/^[\+<]/) ? match[0][0] : '';
        const prefix = text.slice(0, match.index) + sign;
        const suffix = text.slice(match.index + match[0].length);
        let current = 0;
        const duration = 1200;
        const start = performance.now();
        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          current = Math.round(target * ease);
          el.innerHTML = prefix + current + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    statNums.forEach(el => counterObs.observe(el));
  }

  // ── Captcha checkbox ──
  let captchaOk = false;
  const captchaBtn = document.getElementById('captcha-btn');
  const captchaBox = document.getElementById('captcha-box');
  if (captchaBtn) {
    captchaBtn.addEventListener('click', () => {
      captchaOk = true;
      captchaBox.classList.add('verified');
      captchaBtn.innerHTML = `
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="26" height="26">
          <rect width="20" height="20" rx="4" fill="#2EE9B9"/>
          <path d="M5 10.5l3.5 3.5 6.5-7" stroke="#07102a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      captchaBtn.disabled = true;
    });
  }

  // ── Form ──
  const WEB3_KEY = 'd020189e-7d19-48ea-a42f-d911acc2ff72';
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!captchaOk) {
        captchaBox && captchaBox.style.setProperty('border-color', '#F87171');
        captchaBtn && captchaBtn.focus();
        return;
      }
      if (form.querySelector('[name=_honey]')?.value) return;
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      const payload = {
        access_key: WEB3_KEY,
        subject: 'Nueva solicitud desde VonoaWeb',
        from_name: 'VonoaWeb Contacto',
        replyto: form.querySelector('[name=email]').value,
        name:    form.querySelector('[name=name]').value,
        email:   form.querySelector('[name=email]').value,
        negocio: form.querySelector('[name=biz]').value,
        servicio:form.querySelector('[name=service]').value,
        presupuesto: form.querySelector('[name=budget]')?.value || '',
        mensaje: form.querySelector('[name=msg]').value
      };

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          const name = payload.name || 'amigo';
          form.classList.add('sent');
          form.innerHTML = `
            <div class="check">✓</div>
            <h3 style="font-family:var(--font-display);font-size:24px;margin-bottom:10px;">¡Gracias, ${name}!</h3>
            <p style="color:var(--fg-muted);font-size:14px;">Recibimos tu mensaje. Te escribimos en menos de 24 horas.</p>
          `;
        } else {
          btn.disabled = false;
          btn.textContent = 'Enviar solicitud →';
          alert('Hubo un problema al enviar. Intenta de nuevo.');
        }
      } catch {
        btn.disabled = false;
        btn.textContent = 'Enviar solicitud →';
        alert('Error de conexión. Intenta de nuevo.');
      }
    });
  }
})();
