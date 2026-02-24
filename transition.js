document.addEventListener('DOMContentLoaded', () => {
    const transitionEl = document.querySelector('.page-transition');

    // Check if the transition element exists
    if (!transitionEl) return;

    // 1. Reveal the new page (Curtain Rise)
    // The HTML starts with the panels covering the screen (active class).
    // We remove it to trigger the CSS transition that slides them away.
    setTimeout(() => {
        transitionEl.classList.remove('active');
    }, 100);

    // 2. Intercept internal links (Curtain Fall)
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            const target = link.getAttribute('target');
            const isSelfPageAnchor = href.startsWith('#');

            // Allow default behavior for external links, new tabs, and anchor links
            if (target === '_blank' || isSelfPageAnchor || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return;
            }

            // Exclude current page anchors (e.g., speisekarte.html#vorspeisen when on speisekarte)
            const currentPath = window.location.pathname;
            const hrefPath = href.split('#')[0];
            if (hrefPath && currentPath.endsWith(hrefPath)) {
                return; // Let smooth scroll handle it
            }

            e.preventDefault(); // Stop immediate navigation

            // Trigger the "curtain fall" animation
            transitionEl.classList.add('active');

            // Wait for the animation to finish (e.g., 1200ms) before navigating
            setTimeout(() => {
                window.location.href = href;
            }, 1200);
        });
    });

    // Handle Safari/iOS back button caching issues
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            transitionEl.classList.remove('active');
        }
    });
});
