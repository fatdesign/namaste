document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('js-enabled');
    const navbar = document.getElementById('navbar');
    const reveals = document.querySelectorAll('.reveal-on-scroll');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileToggle && mobileOverlay) {
        function toggleMenu() {
            mobileToggle.classList.toggle('active');
            mobileOverlay.classList.toggle('open');
            navbar.classList.toggle('nav-open');
            document.body.style.overflow = mobileOverlay.classList.contains('open') ? 'hidden' : '';
        }

        mobileToggle.addEventListener('click', toggleMenu);

        mobileLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });

        // Ensure reserve button also closes menu
        const reserveBtnMobile = mobileOverlay.querySelector('.btn-reserve');
        if (reserveBtnMobile) {
            reserveBtnMobile.addEventListener('click', toggleMenu);
        }
    }

    // Reveal animations on scroll (Professional Agency Logic)
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');

                // Parallax depth effect for background text
                const parent = entry.target.closest('.editorial-container');
                if (parent) {
                    const bgText = parent.querySelector('.text-bg-luxury');
                    if (bgText) {
                        window.addEventListener('scroll', () => {
                            const speed = 0.15;
                            const rect = parent.getBoundingClientRect();
                            if (rect.top < window.innerHeight && rect.bottom > 0) {
                                bgText.style.transform = `translateX(${(rect.top) * speed}px)`;
                            }
                        });
                    }
                }
            }
        });
    }, revealOptions);

    reveals.forEach(reveal => {
        revealObserver.observe(reveal);
    });

    // Smooth scroll for nav links (handled by CSS, but good to have JS fallback or enhancements)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80, // Offset for sticky nav
                    behavior: 'smooth'
                });
            }
        });
    });

    // Additional luxury Polish: Parallax effect for hero
    window.addEventListener('scroll', () => {
        const heroBg = document.getElementById('hero-bg');
        if (heroBg) {
            const scroll = window.scrollY;
            heroBg.style.transform = `translateY(${scroll * 0.4}px)`;
        }
    });

    // --- Phase 2: Atmospheric Steam Layer (Canvas Grain) ---
    const canvas = document.getElementById('atmosphere-layer');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        function noise() {
            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const val = Math.random() * 255;
                data[i] = data[i + 1] = data[i + 2] = val;
                data[i + 3] = 25; // Constant alpha
            }
            ctx.putImageData(imageData, 0, 0);
        }

        function loop() {
            noise();
            requestAnimationFrame(loop);
        }
        loop();
    }

    // --- Phase 2: Variable Focus (Dynamic Blur) ---
    const focusElements = document.querySelectorAll('.variable-focus');

    function updateFocus() {
        const viewportCenter = window.innerHeight / 2;
        focusElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            const distFromCenter = Math.abs(viewportCenter - elementCenter);

            // If element is near center of viewport, clear blur
            if (distFromCenter < 200) {
                el.classList.add('in-focus');
            } else {
                el.classList.remove('in-focus');
            }
        });
    }

    // --- Architectural Glide Nav Logic ---
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-link-boss');
    const glideLine = document.querySelector('.nav-underline-glide');

    if (navLinks && navItems && glideLine) {
        // 1. Split text into spans for character stagger
        navItems.forEach(item => {
            const text = item.textContent;
            item.innerHTML = '';
            [...text].forEach((char, i) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.className = 'char';
                span.style.transitionDelay = `${i * 30}ms`;
                item.appendChild(span);
            });

            // 2. Magnetic Underline Tracking
            item.addEventListener('mouseenter', () => {
                const rect = item.getBoundingClientRect();
                const containerRect = navLinks.getBoundingClientRect();

                glideLine.style.width = `${rect.width}px`;
                glideLine.style.transform = `translateX(${rect.left - containerRect.left}px)`;

                // Extra highlight for characters on specific link
                item.querySelectorAll('.char').forEach(span => {
                    span.style.opacity = '1';
                    span.style.transform = 'translateY(-3px)';
                    span.style.color = 'var(--accent)';
                });
            });

            item.addEventListener('mouseleave', () => {
                item.querySelectorAll('.char').forEach(span => {
                    span.style.opacity = '';
                    span.style.transform = '';
                    span.style.color = '';
                });
            });
        });

        navLinks.addEventListener('mouseleave', () => {
            glideLine.style.width = '0';
        });
    }

    // --- Liquid Gallery Master Effect ---
    const perspectiveItems = document.querySelectorAll('.perspective-item');

    if (perspectiveItems.length > 0) {
        // 1. Internal Parallax Drift (Fluid Mouse Interaction)
        perspectiveItems.forEach(item => {
            item.addEventListener('mousemove', (e) => {
                const rect = item.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Subtle drift: +/- 15px
                const moveX = ((x - centerX) / centerX) * 15;
                const moveY = ((y - centerY) / centerY) * 15;

                item.style.setProperty('--mx', `${moveX}px`);
                item.style.setProperty('--my', `${moveY}px`);
            });

            item.addEventListener('mouseleave', () => {
                // Return smoothly to center
                item.style.setProperty('--mx', '0px');
                item.style.setProperty('--my', '0px');
            });
        });
    }

});
