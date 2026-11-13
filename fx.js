// Hero overlay: a dot field that lights up under the cursor, with a scan wave passing through
(() => {
	const tile = document.querySelector('.tile--name');
	if (!tile || !tile.getContext && !document.createElement('canvas').getContext) return;

	const canvas = document.createElement('canvas');
	canvas.className = 'tile__fx';
	canvas.setAttribute('aria-hidden', 'true');
	tile.prepend(canvas);
	const ctx = canvas.getContext('2d');
	const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const GAP = 26;
	const REACH = 150;
	let w = 0, h = 0, dpr = 1, dots = [];
	const pointer = { x: -9999, y: -9999, on: false };

	const build = () => {
		const r = tile.getBoundingClientRect();
		w = r.width; h = r.height;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		dots = [];
		for (let y = GAP / 2; y < h; y += GAP) {
			for (let x = GAP / 2; x < w; x += GAP) dots.push({ x, y, glow: 0 });
		}
		if (still) draw(0);
	};

	const draw = (t) => {
		ctx.clearRect(0, 0, w, h);
		// the scan wave crosses the tile diagonally every few seconds
		const span = w + h * 0.5 + 400;
		const wave = still ? -9999 : ((t / 1000) * 190) % span - 200;
		for (const d of dots) {
			let target = 0, px = 0, py = 0;
			if (pointer.on) {
				const dx = d.x - pointer.x, dy = d.y - pointer.y;
				const dist = Math.hypot(dx, dy);
				if (dist < REACH) {
					const k = 1 - dist / REACH;
					target = k;
					const push = k * k * 9;
					px = (dx / (dist || 1)) * push;
					py = (dy / (dist || 1)) * push;
				}
			}
			const wd = Math.abs(d.x + d.y * 0.5 - wave);
			if (wd < 90) target = Math.max(target, (1 - wd / 90) * 0.75);
			d.glow += (target - d.glow) * 0.14;
			const g = d.glow;
			ctx.beginPath();
			ctx.arc(d.x + px, d.y + py, 1 + g * 1.9, 0, 6.283);
			ctx.fillStyle = g > 0.04
				? `rgba(201, 247, 58, ${0.14 + g * 0.8})`
				: 'rgba(255, 255, 255, 0.09)';
			ctx.fill();
		}
	};

	let raf = 0, visible = true;
	const loop = (t) => { draw(t); raf = visible ? requestAnimationFrame(loop) : 0; };
	const start = () => { if (!raf && !still) raf = requestAnimationFrame(loop); };

	tile.addEventListener('pointermove', (e) => {
		const r = tile.getBoundingClientRect();
		pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true;
	});
	tile.addEventListener('pointerleave', () => { pointer.on = false; });

	if ('ResizeObserver' in window) new ResizeObserver(build).observe(tile);
	else window.addEventListener('resize', build);
	if ('IntersectionObserver' in window) {
		new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(tile);
	}
	document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) start(); });

	build();
	start();
})();
