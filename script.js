(() => {
	const root = document.documentElement;

	const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
	const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

	// Theme: follows the visitor's local time (dark 20:00-07:00) until they pick one
	const toggle = document.querySelector('.theme-toggle');
	const byClock = () => { const h = new Date().getHours(); return h >= 20 || h < 7 ? 'dark' : 'light'; };
	const apply = (t) => root.setAttribute('data-theme', t);
	apply(read('theme') || byClock());
	setInterval(() => { if (!read('theme')) apply(byClock()); }, 60000);
	toggle?.addEventListener('click', () => {
		const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
		apply(next);
		write('theme', next);
	});

	// Language: EN is in the markup; UK/PL come from i18n.js
	const dict = window.I18N || {};
	const nodes = [...document.querySelectorAll('[data-i18n]')];
	const metaNodes = [...document.querySelectorAll('[data-i18n-content]')];
	const ariaNodes = [...document.querySelectorAll('[data-i18n-aria]')];
	nodes.forEach((n) => { n.dataset.en = n.innerHTML; });
	metaNodes.forEach((n) => { n.dataset.en = n.content; });
	ariaNodes.forEach((n) => { n.dataset.en = n.getAttribute('aria-label'); });
	const langBtns = [...document.querySelectorAll('[data-lang]')];
	const setLang = (lang, save) => {
		if (lang !== 'en' && !dict[lang]) lang = 'en';
		const t = dict[lang] || {};
		nodes.forEach((n) => { n.innerHTML = t[n.dataset.i18n] ?? n.dataset.en; });
		metaNodes.forEach((n) => { n.content = t[n.dataset.i18nContent] ?? n.dataset.en; });
		ariaNodes.forEach((n) => { n.setAttribute('aria-label', t[n.dataset.i18nAria] ?? n.dataset.en); });
		root.lang = lang;
		langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
		if (save) {
			write('lang', lang);
			const u = new URL(location.href);
			u.searchParams.set('lang', lang);
			history.replaceState(null, '', u);
		}
		document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
	};
	setLang(root.lang || 'en', false);
	langBtns.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang, true)));

	// Nav border on scroll
	const nav = document.querySelector('.nav');
	const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });

	// Reveal on scroll
	const items = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
			});
		}, { rootMargin: '0px 0px -8% 0px' });
		items.forEach((el) => io.observe(el));
	} else {
		items.forEach((el) => el.classList.add('is-in'));
	}

	// Reading progress bar
	const bar = document.querySelector('.progress');
	const prog = () => {
		const max = document.documentElement.scrollHeight - innerHeight;
		bar?.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
	};
	prog();
	window.addEventListener('scroll', prog, { passive: true });
	window.addEventListener('resize', prog);

	// Active section in nav
	const links = [...document.querySelectorAll('.nav__links a')];
	const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
	if ('IntersectionObserver' in window) {
		const spy = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (!e.isIntersecting) return;
				links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
			});
		}, { rootMargin: '-45% 0px -50% 0px' });
		sections.forEach((s) => spy.observe(s));
	}

	document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

// Live Warsaw clock in the hero
(() => {
	const els = document.querySelectorAll('[data-clock]');
	if (!els.length) return;
	let fmt;
	try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' }); } catch { return; }
	const tick = () => els.forEach((el) => { el.textContent = fmt.format(new Date()); });
	tick();
	setInterval(tick, 15000);
})();
