/* ВХолодильнике — общий скрипт */
(function () {
  document.documentElement.classList.add('js');

  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>';
  var LAUNCH_THANKS = 'Спасибо! Мы напишем, когда запустимся.';
  var SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSesLIS_T1SYirxcd_MxeFPEUbNu2eVaSeOzcXVq6qU7Opqa2A/viewform';

  /* ---------- Отправка заявок на почту через FormSubmit ---------- */
  var MAIL_ENDPOINT = 'https://formsubmit.co/ajax/fedotpoi01@gmail.com';
  var SEND_ERROR = 'Не получилось отправить. Проверь интернет и попробуй ещё раз.';

  function sendMail(subject, fields) {
    var payload = {
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
      'Страница': location.href,
      'Время': new Date().toLocaleString('ru-RU')
    };
    for (var k in fields) payload[k] = fields[k];
    return fetch(MAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok || data.success === false || data.success === 'false') throw new Error(data.message || 'send failed');
        return data;
      });
    });
  }

  // Понятный текст ошибки по ответу FormSubmit
  function errorText(err) {
    var m = (err && err.message) || '';
    if (/activat/i.test(m)) return 'Форма ещё не активирована: владельцу сайта нужно подтвердить её по письму от FormSubmit.';
    if (/web server|file/i.test(m)) return 'Форма работает только на сайте в интернете, а не из файла на компьютере.';
    if (m && m !== 'send failed' && !/fetch/i.test(m)) return 'Не получилось отправить: ' + m;
    return SEND_ERROR;
  }

  function setBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.dataset.label = btn.textContent; btn.textContent = label; }
    else if (btn.dataset.label) { btn.textContent = btn.dataset.label; }
    btn.disabled = busy;
  }

  /* ---------- Шапка: бургер и тень при скролле ---------- */
  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');

  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
      menu.classList.toggle('is-open', !open);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Открыть меню');
        menu.classList.remove('is-open');
      }
    });
  }

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Форма «Узнать о запуске» ---------- */
  function launchFormHTML(btnText) {
    return '' +
      '<form class="launch-form" data-launch-form novalidate>' +
      '  <div class="row">' +
      '    <label class="sr-only" for="__ID__">Твой email</label>' +
      '    <input id="__ID__" type="email" name="email" placeholder="твой@email.ru" autocomplete="email" required>' +
      '    <button class="btn btn-green" type="submit">' + (btnText || 'Узнать о запуске') + '</button>' +
      '  </div>' +
      '  <input class="hp" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '  <p class="form-msg" role="alert"></p>' +
      '</form>';
  }

  var uid = 0;
  function bindLaunchForm(form) {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    var input = form.querySelector('input[type="email"]');
    var msg = form.querySelector('.form-msg');
    if (input && input.id.indexOf('__ID__') !== -1) {
      uid += 1;
      var id = 'email-' + uid;
      input.id = id;
      form.querySelector('label').setAttribute('for', id);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = (input.value || '').trim();
      if (!value || !input.checkValidity() || value.indexOf('.') === -1) {
        msg.textContent = 'Проверь email: нужен адрес вида name@mail.ru';
        input.focus();
        return;
      }
      var honey = form.querySelector('.hp');
      var btn = form.querySelector('button[type="submit"]');
      function showDone() {
        var done = document.createElement('div');
        done.className = 'form-done';
        done.setAttribute('role', 'status');
        done.innerHTML = CHECK_ICON + '<span>' + LAUNCH_THANKS + '</span>';
        form.replaceWith(done);
      }
      if (honey && honey.value) { showDone(); return; }
      setBusy(btn, true, 'Отправляем…');
      sendMail('ВХолодильнике: уведомить о запуске', { 'Тип заявки': 'Узнать о запуске', 'Email': value })
        .then(showDone)
        .catch(function (err) { setBusy(btn, false); msg.textContent = errorText(err); });
    });
    input.addEventListener('input', function () { msg.textContent = ''; });
  }

  /* ---------- Модальное окно «Скоро в сторах» ---------- */
  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'launch-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = '' +
    '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
    '  <button class="modal-close" type="button" aria-label="Закрыть окно">' +
    '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
    '  </button>' +
    '  <img class="icon" src="logo-icon.png" alt="">' +
    '  <h2 id="modal-title">Скоро в сторах</h2>' +
    '  <p>Приложение выйдет 1 апреля 2027 года. Помоги нам сделать его удобнее — пройди наш опрос.</p>' +
    '  <a class="btn btn-accent modal-survey" href="' + SURVEY_URL + '" target="_blank" rel="noopener">Пройти опрос и помочь проекту</a>' +
    '  <div class="stores" aria-label="Магазины приложений">' +
    '    <span class="store"><span><small>Скоро в</small><b>App Store</b></span></span>' +
    '    <span class="store"><span><small>Скоро в</small><b>Google Play</b></span></span>' +
    '    <span class="store"><span><small>Скоро в</small><b>RuStore</b></span></span>' +
    '  </div>' +
    '  <p class="modal-or">А ещё можешь оставить email — напишем в день запуска:</p>' +
    '  <div class="modal-form-slot"></div>' +
    '</div>';
  document.body.appendChild(modal);

  var lastFocus = null;
  var slot = modal.querySelector('.modal-form-slot');

  function openModal(trigger) {
    lastFocus = trigger || document.activeElement;
    slot.innerHTML = launchFormHTML();
    bindLaunchForm(slot.querySelector('form'));
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(function () {
      var inp = modal.querySelector('.modal-survey');
      if (inp) inp.focus();
    }, 60);
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open-modal]');
    if (t) { e.preventDefault(); openModal(t); }
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.closest('.modal-close')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      var f = modal.querySelectorAll('button, input, a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Встроенные формы на страницах */
  document.querySelectorAll('[data-launch-slot]').forEach(function (el) {
    el.innerHTML = launchFormHTML(el.getAttribute('data-btn'));
    bindLaunchForm(el.querySelector('form'));
  });
  document.querySelectorAll('form[data-launch-form]').forEach(bindLaunchForm);

  /* ---------- Форма «Напиши нам» ---------- */
  var contact = document.querySelector('[data-contact-form]');
  if (contact) {
    var cmsg = contact.querySelector('.form-msg');
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contact.elements.name, email = contact.elements.email, text = contact.elements.message;
      var problem = null;
      if (!name.value.trim()) problem = [name, 'Напиши, как к тебе обращаться'];
      else if (!email.value.trim() || !email.checkValidity() || email.value.indexOf('.') === -1) problem = [email, 'Проверь email: нужен адрес вида name@mail.ru'];
      else if (!text.value.trim()) problem = [text, 'Напиши сообщение — хотя бы пару слов'];
      if (problem) { cmsg.textContent = problem[1]; problem[0].focus(); return; }
      var cbtn = contact.querySelector('button[type="submit"]');
      function showSent() {
        var done = document.createElement('div');
        done.className = 'form-done';
        done.setAttribute('role', 'status');
        done.innerHTML = CHECK_ICON + '<span>Спасибо! Мы ответим в ближайшее время.</span>';
        contact.replaceWith(done);
      }
      var chp = contact.querySelector('.hp');
      if (chp && chp.value) { showSent(); return; }
      setBusy(cbtn, true, 'Отправляем…');
      sendMail('ВХолодильнике: вопрос с сайта', {
        'Тип заявки': 'Вопрос',
        'Имя': name.value.trim(),
        'Email': email.value.trim(),
        'Сообщение': text.value.trim(),
        _replyto: email.value.trim()
      })
        .then(showSent)
        .catch(function (err) { setBusy(cbtn, false); cmsg.textContent = errorText(err); });
    });
    contact.addEventListener('input', function () { cmsg.textContent = ''; });
  }

  /* ---------- Тост для соцсетей-заглушек ---------- */
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  var toastTimer;
  document.querySelectorAll('[data-toast]').forEach(function (b) {
    b.addEventListener('click', function () {
      toast.textContent = b.getAttribute('data-toast');
      toast.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
    });
  });

  /* ---------- Карусель экранов ---------- */
  var track = document.querySelector('.screens');
  if (track) {
    document.querySelectorAll('[data-scroll]').forEach(function (b) {
      b.addEventListener('click', function () {
        var shot = track.querySelector('.shot');
        var step = shot ? shot.getBoundingClientRect().width + 36 : 320;
        track.scrollBy({ left: step * Number(b.getAttribute('data-scroll')), behavior: 'smooth' });
      });
    });
  }

  /* ---------- Счётчики ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fmt(n, dec) { return n.toFixed(dec).replace('.', ','); }
  function runCounter(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    if (reduce) { el.textContent = fmt(to, dec); return; }
    var start = null, dur = 1400;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * eased, dec);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Появление блоков ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (en.target.hasAttribute('data-count')) runCounter(en.target);
        else en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) {
      if (!reduce) el.textContent = fmt(0, parseInt(el.getAttribute('data-dec') || '0', 10));
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();

/* ---------- Летающие продукты и пузырьки на всех страницах ---------- */
(function () {
  var A = 'viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var FOODS = [
    // морковка
    '<svg ' + A + '><path d="M14 38c-2-2-1-5 2-9l12-14c2-2 5-2 7 0s2 5 0 7L21 34c-4 3-5 6-7 4z"/><path d="M33 14l3-6M34 15l6-2M31 13l1-6M22 22l3 3M18 27l3 3"/></svg>',
    // яблоко
    '<svg ' + A + '><path d="M24 15c-3-3-12-3-14 6-2 8 4 19 9 19 2 0 3-1 5-1s3 1 5 1c5 0 11-11 9-19-2-9-11-9-14-6z"/><path d="M24 15c0-4 2-7 5-8M24 13c-3-3-6-3-8-2 2 3 5 3 8 2z"/></svg>',
    // молоко
    '<svg ' + A + '><path d="M18 6h12v6l4 6v22a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V18l4-6z"/><path d="M18 12h12M14 24h20"/></svg>',
    // яйцо
    '<svg ' + A + '><path d="M24 7c7 0 13 11 13 20a13 13 0 0 1-26 0c0-9 6-20 13-20z"/></svg>',
    // листик
    '<svg ' + A + '><path d="M10 38C10 22 20 12 38 10c-2 18-12 28-28 28z"/><path d="M10 38l16-16"/></svg>',
    // сыр
    '<svg ' + A + '><path d="M6 32l26-18 10 8v14H6z"/><path d="M6 32h36"/><circle cx="18" cy="27" r="2"/><circle cx="30" cy="25" r="2.5"/><circle cx="34" cy="31" r="1.5"/></svg>',
    // брокколи
    '<svg ' + A + '><path d="M20 26v14h8V26"/><path d="M16 27a6 6 0 0 1-1-11 7 7 0 0 1 13-5 6 6 0 0 1 6 9 5 5 0 0 1-3 7z"/></svg>',
    // рыба
    '<svg ' + A + '><path d="M6 24c6-8 16-10 26-4l8-6v20l-8-6c-10 6-20 4-26-4z"/><circle cx="14" cy="22" r="1.2"/></svg>'
  ];

  var layer = document.createElement('div');
  layer.className = 'ambient';
  layer.setAttribute('aria-hidden', 'true');

  var html = '';
  // Продукты: 12 штук, разные полосы, скорость и размер
  for (var i = 0; i < 8; i++) {
    var x = (i * 8.3 + (i % 3) * 3) % 96;
    var dur = 28 + (i * 7) % 18;
    var delay = -((i * 37) % dur);
    var size = 34 + (i * 11) % 26;
    var rot = (i % 2 ? 1 : -1) * (40 + (i * 13) % 80);
    html += '<span class="amb-food" style="--x:' + x + '%;--d:' + dur + 's;--s:' + delay + 's;--z:' + size + 'px;--r:' + rot + 'deg">' + FOODS[i % FOODS.length] + '</span>';
  }
  // Пузырьки: 22 штуки
  for (var j = 0; j < 12; j++) {
    var bx = (j * 4.7 + (j % 4) * 2) % 98;
    var bd = 14 + (j * 5) % 14;
    var bs = -((j * 23) % bd);
    var bz = 4 + (j * 3) % 10;
    html += '<i class="amb-bubble" style="--x:' + bx + '%;--d:' + bd + 's;--s:' + bs + 's;--z:' + bz + 'px"></i>';
  }
  layer.innerHTML = html;
  document.body.prepend(layer);
})();
