(() => {
  'use strict';

  const RECIPIENT_EMAIL = 'affinity.financeteam@gmail.com';
  const dialog = document.getElementById('project-inquiry');
  const form = document.getElementById('inquiry-form');
  if (!dialog || !form) return;
  const status = document.getElementById('inquiry-status');
  const send = form.querySelector('[type="submit"]');
  const services = form.querySelector('.inquiry-services');
  let returnFocus = null;
  let sending = false;

  const open = trigger => {
    if (dialog.open) return;
    returnFocus = trigger || document.activeElement;
    document.documentElement.classList.add('inquiry-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      dialog.setAttribute('open', '');
      document.documentElement.classList.add('dialog-fallback');
    }
    document.getElementById('inquiry-name').focus();
  };
  const onClose = () => {
    document.documentElement.classList.remove('inquiry-open', 'dialog-fallback');
    returnFocus?.focus();
  };
  const close = () => {
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      onClose();
    }
  };

  document.querySelectorAll('[data-inquiry-open]').forEach(trigger => {
    trigger.addEventListener('click', event => { event.preventDefault(); open(trigger); });
  });
  dialog.querySelector('.inquiry-close').addEventListener('click', close);
  dialog.addEventListener('close', onClose);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    // Native modal dialogs handle focus trapping. Keep it in the fallback too.
    if (event.key === 'Tab' && document.documentElement.classList.contains('dialog-fallback')) {
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input, textarea, a[href]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  form.addEventListener('input', event => {
    event.target.removeAttribute('aria-invalid');
    if (event.target.name === 'service') services.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const required = [...form.querySelectorAll('[required]')];
    const missing = required.filter(input => !input.value.trim() || !input.validity.valid);
    required.forEach(input => input.setAttribute('aria-invalid', String(missing.includes(input))));
    const selected = [...form.querySelectorAll('input[name="service"]:checked')].map(input => input.value);
    services.setAttribute('aria-invalid', String(!selected.length));
    if (missing.length || !selected.length) {
      status.textContent = 'Please complete all required fields and select at least one service.';
      (missing[0] || services.querySelector('input')).focus();
      return;
    }

    const value = name => form.elements.namedItem(name).value.trim();
    const payload = {
      'Industry / Company / Name': value('name'),
      'Phone number': value('phone'),
      'Preferred completion date': value('completion_date'),
      Budget: value('budget'),
      Services: selected.join(', '),
      'Project details': value('details') || '(Not provided)',
      'How did you hear about us?': value('source') || '(Not provided)',
      _subject: '[Project inquiry] ' + value('name'),
      _template: 'table',
      _captcha: 'false',
    };
    sending = true;
    send.disabled = true;
    send.textContent = 'Sending…';
    status.textContent = 'Sending your inquiry…';
    form.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(RECIPIENT_EMAIL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Request failed');
      const result = await response.json();
      if (result.success !== true && result.success !== 'true') throw new Error('Submission failed');
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
      status.textContent = 'Your inquiry has been sent. Thank you.';
    } catch {
      status.textContent = 'Your inquiry could not be sent. Please try again or email ' + RECIPIENT_EMAIL + '.';
    } finally {
      sending = false;
      send.disabled = false;
      send.textContent = 'Send inquiry ↗';
      form.removeAttribute('aria-busy');
    }
  });
})();
