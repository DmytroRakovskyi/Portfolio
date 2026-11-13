/* Motion layer: GSAP + ScrollTrigger (+ Lenis). Pure enhancement: without the
   libraries, or with reduced motion, the page stays fully visible and usable. */
(() => {
	const root = document.documentElement;
	const { gsap, ScrollTrigger } = window;
	if (!gsap || !ScrollTrigger) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const $ = (s, c = document) => c.querySelector(s);
	const $$ = (s, c = document) => [...c.querySelectorAll(s)];
	const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	const narrow = () => innerWidth < 700;

	gsap.registerPlugin(ScrollTrigger);
	root.classList.add('gsap-on');

	let lenis = null;
	const heads = [];

	try {
		/* ---------- smooth scroll (optional) ---------- */
		if (window.Lenis) {
			lenis = new window.Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
			lenis.on('scroll', ScrollTrigger.update);
			gsap.ticker.add((t) => lenis.raf(t * 1000));
			gsap.ticker.lagSmoothing(0);
			$$('a[href^="#"]').forEach((a) => {
				a.addEventListener('click', (e) => {
					const id = a.getAttribute('href');
					const target = id.length > 1 ? $(id) : null;
					if (id === '#top') { e.preventDefault(); lenis.scrollTo(0); }
					else if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -76 }); history.replaceState(null, '', id); }
				});
			});
		}

		/* ---------- initial hidden states (set before first frame) ---------- */
		const h1Lines = $$('.hero h1 > span');
		h1Lines.forEach((s) => {
			const txt = s.textContent;
			s.innerHTML = '';
			const inner = document.createElement('span');
			inner.className = 'l';
			inner.textContent = txt;
			s.appendChild(inner);
		});
		const lines = $$('.hero h1 .l');
		const tiles = $$('.bento .tile');
		const photoImg = $('.photo__media');
		const heroBits = [$('.eyebrow'), $('.hero__role'), $('.hero__lead'), ...$$('.hero__cta .btn')];

		gsap.set(lines, { yPercent: 115 });
		gsap.set(tiles, { autoAlpha: 0, y: 44, scale: .96 });
		gsap.set(heroBits, { autoAlpha: 0, y: 20 });
		gsap.set(photoImg, { scale: 1.4, yPercent: -4 });
		gsap.set('.nav', { autoAlpha: 0, y: -24 });

		const countEl = $('[data-count]');
		const countTo = countEl ? parseInt(countEl.textContent, 10) : NaN;
		if (!isNaN(countTo)) countEl.textContent = '0+';

		// Reveal blocks (replaces the CSS class-based reveal)
		const reveals = $$('.reveal');
		gsap.set(reveals, { autoAlpha: 0, y: 40 });
		const kickers = $$('.section__head .kicker');
		gsap.set(kickers, { autoAlpha: 0, x: -18 });

		// Timeline line drawing
		const jobs = $$('.job');
		jobs.forEach((j) => j.style.setProperty('--d', '0'));
		jobs.forEach((j) => j.style.setProperty('--dot', '0'));

		/* ---------- hero intro ---------- */
		const intro = () => {
			const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
			tl.to('.nav', { autoAlpha: 1, y: 0, duration: .9, clearProps: 'transform,opacity,visibility' }, 0)
				.to(tiles, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, stagger: .09, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, .05)
				.to(photoImg, { scale: 1.12, duration: 2, ease: 'expo.out' }, .15)
				.to(lines, { yPercent: 0, duration: 1.2, stagger: .13, ease: 'expo.out', clearProps: 'transform' }, .35)
				.to(heroBits, { autoAlpha: 1, y: 0, duration: .8, stagger: .08, clearProps: 'transform,opacity,visibility' }, .55);
			if (!isNaN(countTo)) {
				const o = { v: 0 };
				tl.to(o, { v: countTo, duration: 1.6, ease: 'power2.out',
					onUpdate: () => { countEl.textContent = Math.round(o.v) + '+'; },
					onComplete: () => { countEl.textContent = countTo + '+'; } }, .7);
			}
			return tl;
		};
		const start = () => { intro(); ScrollTrigger.refresh(); };
		if (document.fonts && document.fonts.ready) {
			Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(start);
		} else start();

		/* ---------- parallax ---------- */
		gsap.fromTo(photoImg, { yPercent: -4 }, { yPercent: 5, ease: 'none', immediateRender: false,
			scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
		setTimeout(() => { if (countEl && !isNaN(countTo)) countEl.textContent = countTo + '+'; }, 9000);

		/* ---------- section headings: word mask reveal ---------- */
		const split = (h) => {
			const words = h.textContent.trim().split(/\s+/);
			h.innerHTML = words.map((w) => `<span class="w"><span class="wi">${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></span>`).join(' ');
			if (!h._shown) gsap.set($$('.wi', h), { yPercent: 115 });
		};
		$$('.section__head h2, .cta h2').forEach((h) => {
			heads.push(h);
			split(h);
			ScrollTrigger.create({
				trigger: h, start: 'top 88%', once: true,
				onEnter: () => {
					h._shown = true;
					gsap.to($$('.wi', h), { yPercent: 0, duration: 1, stagger: .07, ease: 'expo.out', clearProps: 'transform' });
				}
			});
		});
		kickers.forEach((k) => ScrollTrigger.create({
			trigger: k, start: 'top 92%', once: true,
			onEnter: () => gsap.to(k, { autoAlpha: 1, x: 0, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity,visibility' })
		}));

		/* ---------- staggered block reveals ---------- */
		ScrollTrigger.batch(reveals, {
			start: 'top 90%', once: true,
			onEnter: (els) => {
				gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, stagger: .12, ease: 'power3.out', overwrite: true,
					clearProps: 'transform,opacity,visibility' });
				els.forEach((el, i) => {
					const kids = $$('.chips li, .job__body li', el);
					if (kids.length) gsap.from(kids, { autoAlpha: 0, y: 12, x: el.classList.contains('job') ? -10 : 0, scale: el.classList.contains('job') ? 1 : .92,
						duration: .6, stagger: .03, delay: .25 + i * .12, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
				});
			}
		});

		/* ---------- timeline line draws on scroll ---------- */
		jobs.forEach((j) => {
			gsap.to(j, { '--d': 1, ease: 'none',
				scrollTrigger: { trigger: j, start: 'top 72%', end: 'bottom 72%', scrub: .4 } });
			ScrollTrigger.create({ trigger: j, start: 'top 78%', once: true,
				onEnter: () => gsap.to(j, { '--dot': 1, duration: .6, ease: 'back.out(3)' }) });
		});

		/* ---------- marquee: speed follows scroll velocity ---------- */
		const track = $('.marquee__track');
		if (track) {
			const mt = gsap.to(track, { xPercent: -50, duration: 46, ease: 'none', repeat: -1 });
			ScrollTrigger.create({
				onUpdate: (self) => {
					const v = self.getVelocity();
					const dir = v < 0 ? -1 : 1;
					const ts = Math.abs(v) < 30 ? 1 : dir * (1 + Math.min(Math.abs(v) / 160, 9));
					gsap.to(mt, { timeScale: ts, duration: .5, overwrite: true });
				}
			});
		}

		/* ---------- pointer effects (mouse only) ---------- */
		if (fine) {
			// magnetic LinkedIn buttons
			$$('.btn--li').forEach((b) => {
				const qx = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' });
				const qy = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
				b.addEventListener('pointermove', (e) => {
					const r = b.getBoundingClientRect();
					qx((e.clientX - (r.left + r.width / 2)) * .28);
					qy((e.clientY - (r.top + r.height / 2)) * .4);
				});
				b.addEventListener('pointerleave', () => { qx(0); qy(0); });
			});

			// photo parallax: the picture drifts against the cursor
			const ph = $('.tile--photo');
			if (ph && photoImg) {
				const mx = gsap.quickTo(photoImg, 'x', { duration: .8, ease: 'power3' });
				const my = gsap.quickTo(photoImg, 'y', { duration: .8, ease: 'power3' });
				ph.addEventListener('pointermove', (e) => {
					const r = ph.getBoundingClientRect();
					mx(-((e.clientX - r.left) / r.width - .5) * 22);
					my(-((e.clientY - r.top) / r.height - .5) * 22);
				});
				ph.addEventListener('pointerleave', () => { mx(0); my(0); });
			}

			// card tilt
			$$('.skill, .edu__card').forEach((c) => {
				const rx = gsap.quickTo(c, 'rotationX', { duration: .6, ease: 'power3' });
				const ry = gsap.quickTo(c, 'rotationY', { duration: .6, ease: 'power3' });
				c.addEventListener('pointerenter', () => gsap.to(c, { transformPerspective: 900, y: -4, duration: .35, ease: 'power2.out', overwrite: 'auto' }));
				c.addEventListener('pointermove', (e) => {
					const r = c.getBoundingClientRect();
					ry(((e.clientX - r.left) / r.width - .5) * 6);
					rx(-((e.clientY - r.top) / r.height - .5) * 5);
				});
				c.addEventListener('pointerleave', () => { rx(0); ry(0); gsap.to(c, { y: 0, duration: .5, ease: 'power3.out' }); });
			});

			// cursor glow on the LinkedIn CTA card
			const card = $('.cta__card');
			if (card) {
				const glow = document.createElement('div');
				glow.className = 'cta__glow';
				glow.setAttribute('aria-hidden', 'true');
				card.prepend(glow);
				gsap.set(glow, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
				const gx = gsap.quickTo(glow, 'x', { duration: .6, ease: 'power3' });
				const gy = gsap.quickTo(glow, 'y', { duration: .6, ease: 'power3' });
				card.addEventListener('pointerenter', (e) => {
					const r = card.getBoundingClientRect();
					gsap.set(glow, { x: e.clientX - r.left, y: e.clientY - r.top });
					gsap.to(glow, { autoAlpha: 1, duration: .5 });
				});
				card.addEventListener('pointermove', (e) => {
					const r = card.getBoundingClientRect();
					gx(e.clientX - r.left); gy(e.clientY - r.top);
				});
				card.addEventListener('pointerleave', () => gsap.to(glow, { autoAlpha: 0, duration: .6 }));
			}
		}

		/* ---------- language change: texts were replaced, rebuild splits ---------- */
		document.addEventListener('langchange', () => {
			heads.forEach(split);
			requestAnimationFrame(() => ScrollTrigger.refresh());
		});
		window.addEventListener('load', () => ScrollTrigger.refresh());
	} catch (err) {
		// Fail safe: drop the enhancement and show everything
		root.classList.remove('gsap-on');
		try { ScrollTrigger.getAll().forEach((s) => s.kill()); gsap.killTweensOf('*'); } catch { /* ignore */ }
		$$('*').forEach((el) => { if (el.style && el.style.cssText && el !== root) { el.style.opacity = ''; el.style.visibility = ''; el.style.transform = ''; el.style.clipPath = ''; } });
		$$('.job').forEach((j) => { j.style.removeProperty('--d'); j.style.removeProperty('--dot'); });
		if (lenis) lenis.destroy();
		console.warn('motion disabled', err);
	}
})();
