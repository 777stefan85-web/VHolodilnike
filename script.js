/* ВХолодильнике — общий скрипт */
(function () {
  document.documentElement.classList.add('js');

  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>';
  var LAUNCH_THANKS = 'Спасибо! Мы напишем, когда запустимся.';

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
      var done = document.createElement('div');
      done.className = 'form-done';
      done.setAttribute('role', 'status');
      done.innerHTML = CHECK_ICON + '<span>' + LAUNCH_THANKS + '</span>';
      form.replaceWith(done);
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
    '  <img class="icon" src="assets/logo-icon.png" alt="">' +
    '  <h2 id="modal-title">Скоро в сторах</h2>' +
    '  <p>Приложение выйдет 1 апреля 2027 года. Оставь email — напишем в день запуска.</p>' +
    '  <div class="stores" aria-label="Магазины приложений">' +
    '    <span class="store"><span><small>Скоро в</small><b>App Store</b></span></span>' +
    '    <span class="store"><span><small>Скоро в</small><b>Google Play</b></span></span>' +
    '    <span class="store"><span><small>Скоро в</small><b>RuStore</b></span></span>' +
    '  </div>' +
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
      var inp = slot.querySelector('input');
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
      var done = document.createElement('div');
      done.className = 'form-done';
      done.setAttribute('role', 'status');
      done.innerHTML = CHECK_ICON + '<span>Спасибо! Мы ответим в ближайшее время.</span>';
      contact.replaceWith(done);
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
