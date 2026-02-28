/* ─── WARP SPEED — HYPERSPACE PARTICLE SYSTEM ────── */
(function () {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* Reduce partículas en móvil para no sobrecargar CPU */
    const STAR_COUNT = window.innerWidth < 640 ? 350 : 700;
    const MAX_Z = 1000;
    let W, H, CX, CY;

    function resize() {
        const hero = document.getElementById('hero');
        W = canvas.width = hero.offsetWidth;
        H = canvas.height = hero.offsetHeight;
        CX = W / 2;
        CY = H / 2;
    }

    /* ── Star class ─────────────────────────────────── */
    function Star() { this.reset(true); }

    Star.prototype.reset = function (init) {
        /* Random position in a disc around center */
        this.x = (Math.random() - 0.5) * W * 2;
        this.y = (Math.random() - 0.5) * H * 2;
        this.z = init ? Math.random() * MAX_Z : MAX_Z;
        this.pz = this.z;

        /* Color: mostly white, some cyan, rare gold */
        const r = Math.random();
        if (r < 0.70) this.rgb = '220,230,255';   /* cool white  */
        else if (r < 0.88) this.rgb = '58,240,224';    /* cyan        */
        else if (r < 0.96) this.rgb = '180,210,255';   /* blue-white  */
        else this.rgb = '245,197,66';    /* gold (rare) */
    };

    Star.prototype.update = function (speed) {
        this.pz = this.z;
        this.z -= speed;
        if (this.z <= 1) this.reset(false);
    };

    Star.prototype.draw = function () {
        /* Project from 3-D to 2-D ---------------------- */
        const sx = (this.x / this.z) * CX + CX;
        const sy = (this.y / this.z) * CY + CY;
        const psx = (this.x / this.pz) * CX + CX;
        const psy = (this.y / this.pz) * CY + CY;

        /* Skip stars that have left the screen */
        if (sx < 0 || sx > W || sy < 0 || sy > H) {
            this.reset(false);
            return;
        }

        const progress = 1 - this.z / MAX_Z;         /* 0 → far, 1 → close */
        const size = Math.max(0.3, progress * 2.4);
        const opacity = Math.min(1, progress * 1.5);

        /* Trail / streak */
        const dx = sx - psx;
        const dy = sy - psy;
        const trailLen = Math.sqrt(dx * dx + dy * dy);

        if (trailLen > 0.5) {
            ctx.beginPath();
            ctx.moveTo(psx, psy);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = `rgba(${this.rgb},${opacity * 0.55})`;
            ctx.lineWidth = size * 0.55;
            ctx.stroke();
        }

        /* Star dot */
        ctx.beginPath();
        ctx.arc(sx, sy, size * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${opacity})`;
        ctx.fill();
    };

    /* ── Init stars ─────────────────────────────────── */
    resize();
    const stars = Array.from({ length: STAR_COUNT }, () => new Star());

    /* ── Animation loop ─────────────────────────────── */
    let speed = 3.5;          /* base warp speed   */
    const TARGET_SPEED = 3.5;
    const BOOST_SPEED = 22;  /* scroll boost      */
    let lastScroll = 0;
    let rafId = null;
    let isVisible = true;

    /* Slight speed boost when scrolling */
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < 20) speed = TARGET_SPEED + (y / 20) * (BOOST_SPEED - TARGET_SPEED);
        else speed = TARGET_SPEED;
        lastScroll = y;
    }, { passive: true });

    window.addEventListener('resize', resize);

    function animate() {
        /* Fade trail — partially transparent fill so stars leave comet-tails */
        ctx.fillStyle = 'rgba(7,8,15,0.18)';
        ctx.fillRect(0, 0, W, H);

        /* Subtle cyan radial glow at center */
        const grd = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.min(W, H) * 0.35);
        grd.addColorStop(0, 'rgba(58,240,224,0.035)');
        grd.addColorStop(1, 'rgba(7,8,15,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        stars.forEach(s => {
            s.update(speed);
            s.draw();
        });

        rafId = requestAnimationFrame(animate);
    }

    /* Pausa el canvas cuando el hero sale del viewport */
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!rafId) rafId = requestAnimationFrame(animate);
                isVisible = true;
            } else {
                if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
                isVisible = false;
            }
        });
    }, { threshold: 0.01 });

    heroObserver.observe(document.getElementById('hero'));
    animate();
})();


/* ─── SCROLL REVEAL ──────────────────────────────── */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ─── FAQ ACCORDION ──────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
        const item = q.parentElement;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    });
});
