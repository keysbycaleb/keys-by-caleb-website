/**
 * Main JavaScript for Keys by Caleb Website (V58 - Relative Mobile Scroll)
 * Handles scroll-to-top, active nav highlighting, GSAP smooth scroll (manual coords desktop, relative mobile),
 * contact form, tsParticles, footer year. Includes initial scroll offset per view.
 * Uses desktop coordinates, calculates mobile scroll position dynamically.
 * Arrow key navigation (desktop only) includes the footer.
 * Placeholder for mobile carousel logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb NEW JS Initialized (V58 - Relative Mobile Scroll).");

    // --- GSAP Plugin Registration ---
    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
        gsap.registerPlugin(ScrollToPlugin);
        // console.log("GSAP ScrollToPlugin registered.");
    } else {
        console.error("GSAP or ScrollToPlugin not loaded! Smooth scroll will not work.");
    }

    // --- State Variables ---
    let isPageScrolling = false; // Flag for page scroll animations

    // --- Configuration ---
    const sectionScrollDuration = 0.8; // For desktop arrow keys
    const sectionScrollEase = 'power2.inOut';
    const linkScrollDuration = 1.0;    // For nav link clicks (both views)
    const linkScrollEase = 'power2.inOut';
    const initialScrollDelay = 50;    // Small delay before initial scroll correction
    const mobileBreakpoint = 1024;    // Width threshold for mobile/desktop view
    const mobileScrollOffset = 15;    // Pixels below header to position section top on mobile

    // --- <<< MANUAL SCROLL TARGETS (DESKTOP ONLY) >>> ---
    const desktopScrollTargets = {
        'hero': 32, 'about': 878, 'packages': 1730, 'gallery': 2561,
        'testimonials': 3434, 'contact': 4317, 'main-footer': 4656
    };
    // console.log("Using UPDATED desktop scroll targets:", desktopScrollTargets);
    // --- ^^^ Mobile targets removed - will calculate dynamically ^^^ ---


    // --- Cache Elements ---
    const header = document.getElementById('main-header');
    const scrollToTopButton = document.getElementById('scroll-to-top');
    const internalLinks = document.querySelectorAll('a.internal-link[href^="#"], a.nav-link[href^="#"]:not([href="#"]), a.header-logo[href^="#"], #mobile-bottom-nav a.mobile-nav-item[href^="#"]');
    const desktopNavLinks = document.querySelectorAll('#desktop-nav-elements a.nav-link:not(.booking-nav-link):not(.follow-button):not([title="Email Me"])');
    const mobileNavItems = document.querySelectorAll('#mobile-bottom-nav .mobile-nav-item');
    const contactForm = document.getElementById('contact-form');
    const scrollSnapContainer = document.querySelector('.scroll-snap-container-home');
    const footerElement = document.getElementById('main-footer');

    // --- Create ordered list of scrollable elements based on DESKTOP targets ---
    // This defines the sequence primarily for keyboard navigation and consistent indexing
    const scrollableTargetIds = Object.keys(desktopScrollTargets);
    const scrollableElements = scrollableTargetIds
        .map(id => document.getElementById(id))
        .filter(el => el !== null)
        .sort((a, b) => (desktopScrollTargets[a.id] ?? 0) - (desktopScrollTargets[b.id] ?? 0));
    // console.log("Scrollable elements ordered (for desktop nav):", scrollableElements.map(el => el.id));


    const currentYearSpan = document.getElementById('current-year');
    const dateField = contactForm?.querySelector('#contact_event_date');
    const particleContainerId = 'tsparticles-hero';

    // --- Helper Functions ---
    const debounce = (func, wait) => { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func.apply(this, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; };
    const getHeaderHeight = () => { return header ? header.offsetHeight : (window.innerWidth < mobileBreakpoint ? 60 : 70); };
    const isMobileView = () => window.innerWidth < mobileBreakpoint;
    const isDesktopJsScrollActive = () => !isMobileView() && scrollSnapContainer;
    const getScrollTarget = () => isDesktopJsScrollActive() ? scrollSnapContainer : window;
    const getScrollContainerHeight = () => { return isDesktopJsScrollActive() ? scrollSnapContainer.clientHeight : window.innerHeight; };
    const scrollIntoViewIfNeeded = (element) => { if (!element) return; const rect = element.getBoundingClientRect(); const headerHeight = getHeaderHeight(); const isAbove = rect.top < headerHeight + 10; const isBelow = rect.bottom > window.innerHeight - 10; if (isAbove || isBelow) { const elementTopRelativeToDocument = window.pageYOffset + rect.top; const targetScrollY = elementTopRelativeToDocument - headerHeight - 30; window.scrollTo({ top: targetScrollY, behavior: 'smooth' }); } };

    // --- tsParticles Initialization ---
    const initParticles = () => { /* ... (no change) ... */ };

    // --- Event Logic ---

    const handleScrollToTopVisibility = () => { /* ... (no change) ... */ };

    // --- Animate Page Scroll ---
    const animatePageScroll = (target, duration, params) => {
        const ease = params.ease || linkScrollEase; // Default to link ease
        if (isPageScrolling) {
            // console.log("Page scroll animation blocked - already scrolling.");
            return;
        }
        isPageScrolling = true;
        const isDesktop = isDesktopJsScrollActive(); // Check view at animation start

        // Detach key listener ONLY if desktop scroll is active during animation
        if (isDesktop) { window.removeEventListener('keydown', handleKeyDown); }

        gsap.to(target, {
            duration: duration,
            scrollTo: params.scrollTo,
            ease: ease,
            overwrite: 'auto',
            onComplete: () => {
                isPageScrolling = false;
                // Re-attach key listener ONLY if desktop scroll is active
                if (isDesktop) { window.addEventListener('keydown', handleKeyDown); }
                handleActiveNav(); // Update nav AFTER animation completes
                params.onComplete?.();
            },
            onInterrupt: () => {
                isPageScrolling = false;
                // Re-attach key listener ONLY if desktop scroll is active
                if (isDesktop) { window.addEventListener('keydown', handleKeyDown); }
                handleActiveNav(); // Update nav immediately on interrupt
                params.onInterrupt?.();
            }
        });
    };

    // --- Get Target Scroll Y (Uses Desktop Map or Calculates for Mobile) ---
    const getTargetScrollY = (targetElement) => {
        if (!targetElement) return 0;
        const targetId = targetElement.id;
        const isDesktop = isDesktopJsScrollActive();
        const scrollTarget = getScrollTarget(); // window or container

        let targetY = 0;
        let maxScrollY;

        if (isDesktop) {
            // --- DESKTOP LOGIC ---
            if (desktopScrollTargets.hasOwnProperty(targetId)) {
                targetY = desktopScrollTargets[targetId];
            } else {
                // Fallback for desktop if ID not mapped (shouldn't happen for main nav)
                console.warn(`Target ID "${targetId}" not found in desktopScrollTargets. Using offsetTop fallback.`);
                targetY = Math.max(0, targetElement.offsetTop - getHeaderHeight());
            }
            maxScrollY = scrollTarget.scrollHeight - scrollTarget.clientHeight;

        } else {
            // --- MOBILE LOGIC ---
            const headerHeight = getHeaderHeight();
            if (targetId === 'hero') {
                targetY = 0; // Always scroll to top for hero on mobile
            } else {
                // Calculate position relative to document top
                const elementRect = targetElement.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                // Target position = element top - header height - small offset
                targetY = absoluteElementTop - headerHeight - mobileScrollOffset;
            }
            maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
            maxScrollY -= 10; // Mobile buffer at bottom
        }

        // Clamp target Y to valid scroll range [0, maxScrollY]
        return Math.max(0, Math.min(targetY, maxScrollY));
    };


    // --- Find Current Section Index for Highlighting ---
    // Determines which element in `scrollableElements` is currently active
    const getCurrentElementIndex = () => {
        const isDesktop = isDesktopJsScrollActive();
        const scrollTarget = getScrollTarget();
        const scrollPosition = (scrollTarget === window) ? window.pageYOffset : scrollTarget.scrollTop;
        const viewportHeight = getScrollContainerHeight();
        const headerHeight = getHeaderHeight();

        let bestMatchIndex = 0;

        // Iterate through the ordered elements (based on desktop coords)
        for (let i = scrollableElements.length - 1; i >= 0; i--) {
            const element = scrollableElements[i];
            let elementTop;

            if (isDesktop) {
                // Use the predefined desktop coordinate as the reference point
                elementTop = desktopScrollTargets[element.id] ?? element.offsetTop; // Fallback to offsetTop if somehow missing
            } else {
                // Use the element's actual position relative to the document
                elementTop = element.offsetTop;
            }

            // Consider active if the scroll position is at or below the element's top
            // minus a portion of the header height (so it activates as it comes into view)
            const activationPoint = elementTop - (headerHeight * 0.5); // Activate when halfway past header

            if (scrollPosition >= activationPoint) {
                bestMatchIndex = i;
                break; // Found the highest section meeting the criteria
            }
        }

        // --- Edge Case Handling ---
        // If very near the top, force the first element (hero)
        if (scrollPosition < headerHeight * 0.5) { // Adjust threshold if needed
             bestMatchIndex = 0;
        }
        // If scrolled to the absolute bottom, force the last element
        const scrollHeight = (scrollTarget === window) ? document.documentElement.scrollHeight : scrollTarget.scrollHeight;
        if (scrollPosition + viewportHeight >= scrollHeight - 10) { // Allow small tolerance
           bestMatchIndex = scrollableElements.length -1;
        }

        return bestMatchIndex;
    };


    // --- Internal Link Click Handler ---
    // Uses getTargetScrollY which handles desktop/mobile logic
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                 const targetId = href.substring(1);
                 const targetElement = scrollableElements.find(el => el.id === targetId); // Find in our master list

                 if (targetElement) {
                     e.preventDefault(); // Prevent default jump only if we handle it
                     const scrollTarget = getScrollTarget(); // window or container
                     const targetScrollY = getTargetScrollY(targetElement); // Gets correct coordinate/calculation

                     animatePageScroll(scrollTarget, linkScrollDuration, { scrollTo: { y: targetScrollY }, ease: linkScrollEase });
                 } else {
                     console.log(`Link target #${targetId} not in defined scroll targets or HTML. Allowing default behavior.`);
                 }
             }
        });
    });

    // --- Scroll-to-Top Button Click ---
    if (scrollToTopButton) {
        scrollToTopButton.addEventListener('click', () => {
            const scrollTarget = getScrollTarget();
            const heroElement = document.getElementById('hero');
            const heroTargetY = getTargetScrollY(heroElement); // Get correct hero Y for current view
            animatePageScroll(scrollTarget, linkScrollDuration, { scrollTo: { y: heroTargetY }, ease: linkScrollEase });
        });
    }

    // --- Active Navigation Link Highlighting ---
    const handleActiveNav = () => {
        const currentElementIndex = getCurrentElementIndex();
        let currentElementId = scrollableElements[currentElementIndex]?.id || 'hero';
        // Map footer scroll position to 'contact' link highlight ID
        let highlightId = (currentElementId === 'main-footer') ? 'contact' : currentElementId;

        // Map 'packages' section ID to 'services' link text/href if necessary
        if (highlightId === 'packages') {
             highlightId = 'services';
        }

        desktopNavLinks.forEach(link => { link.classList.remove('active'); const linkHref = link.getAttribute('href'); if (linkHref && linkHref.startsWith('#') && linkHref === `#${highlightId}`) { link.classList.add('active'); } });
        mobileNavItems.forEach(item => { item.classList.remove('active'); const itemHref = item.getAttribute('href'); if (itemHref && itemHref.startsWith('#') && itemHref === `#${highlightId}`) { item.classList.add('active'); } else if (itemHref && !itemHref.startsWith('#')) { const isBookingPage = window.location.pathname.includes('booking-'); const isVendorPage = window.location.pathname.includes('vendor-'); if (itemHref.includes('booking-') && isBookingPage) item.classList.add('active'); else if (itemHref.includes('vendor-') && isVendorPage) item.classList.add('active'); } });
        // console.log(`Active element: ${currentElementId}, Highlighted link ID: ${highlightId}`);
    };

    // --- Keyboard Navigation Logic (Desktop Only, Includes Footer) ---
    const handleKeyDown = (event) => {
        // Guard clause: Only run if desktop container scroll is active AND not currently page scrolling
        if (!isDesktopJsScrollActive() || isPageScrolling) return;

        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');
        if (isInputFocused && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) return;

        let direction = 0;
        if (event.key === 'ArrowDown') direction = 1;
        else if (event.key === 'ArrowUp') direction = -1;
        else return;

        event.preventDefault(); // Prevent default page scroll ONLY when hijacking

        const currentIndex = getCurrentElementIndex(); // Index within scrollableElements
        let targetIndex = currentIndex + direction;

        // Clamp target index within the bounds of scrollableElements
        targetIndex = Math.max(0, Math.min(targetIndex, scrollableElements.length - 1));

        if (targetIndex !== currentIndex) {
            const targetElement = scrollableElements[targetIndex];
            if (targetElement && targetElement.id) {
                // IMPORTANT: getTargetScrollY will fetch the DESKTOP coordinate here
                const targetScrollY = getTargetScrollY(targetElement);
                animatePageScroll(scrollSnapContainer, sectionScrollDuration, { scrollTo: { y: targetScrollY }, ease: sectionScrollEase });
            }
        }
    };

    // --- Contact Form Validation & Submission ---
    if (contactForm) { /* ... (no change) ... */ }

    // --- Footer Year ---
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

    // --- Mobile Carousel Logic (Placeholder) ---
    const manageCarousels = () => {
        // Placeholder - Carousel logic removed in this version
        if (isMobileView()) {
            // console.log("Mobile view: Carousel logic placeholder.");
        } else {
            // console.log("Desktop view: No carousel cleanup needed.");
        }
    };


    // --- Initial Scroll Correction ---
    // Sets initial scroll based on view (desktop coords or mobile calculation)
    const setInitialScroll = () => {
        const isDesktop = isDesktopJsScrollActive();
        const scrollTarget = getScrollTarget();
        const heroElement = document.getElementById('hero');
        if (!heroElement) return; // Exit if hero element doesn't exist

        // Get the correct hero coordinate/calculation for the current view
        const heroTargetY = getTargetScrollY(heroElement);

        setTimeout(() => {
            const currentScroll = isDesktop ? scrollTarget.scrollTop : window.pageYOffset;
            // Check if correction is needed (allow small tolerance)
            if (Math.abs(currentScroll - heroTargetY) > 5) {
                 // console.log(`Correcting initial scroll position for ${isDesktop ? 'desktop' : 'mobile'} to ${heroTargetY}`);
                // Use instant scroll for initial correction
                scrollTarget.scrollTo({ top: heroTargetY, behavior: 'instant' });
            }
            // Update nav highlight AFTER potential scroll correction
            handleActiveNav();
        }, initialScrollDelay);
    };

    // --- Initial Calls & Event Listeners Setup ---
    initParticles();
    const debouncedNavHandler = debounce(handleActiveNav, 50);
    const debouncedScrollToTopHandler = debounce(handleScrollToTopVisibility, 50);

    // Setup listeners based on the initial view
    const setupScrollListeners = () => {
        const isDesktop = isDesktopJsScrollActive();
        const scrollTarget = getScrollTarget();

        // Remove potentially old listeners first
        window.removeEventListener('scroll', debouncedNavHandler);
        window.removeEventListener('scroll', debouncedScrollToTopHandler);
        window.removeEventListener('keydown', handleKeyDown);
        scrollSnapContainer?.removeEventListener('scroll', debouncedNavHandler);
        scrollSnapContainer?.removeEventListener('scroll', debouncedScrollToTopHandler);

        // Add appropriate scroll listeners
        scrollTarget.addEventListener('scroll', debouncedNavHandler, { passive: true });
        scrollTarget.addEventListener('scroll', debouncedScrollToTopHandler, { passive: true });

        // Add key listener ONLY if desktop JS scroll is active
        if (isDesktop) {
            window.addEventListener('keydown', handleKeyDown);
            // console.log("Scroll listeners configured for: container (Desktop) - Key listener ACTIVE.");
        } else {
             // console.log("Scroll listeners configured for: window (Mobile/Tablet) - Key listener INACTIVE.");
        }
    };

    setupScrollListeners();
    handleScrollToTopVisibility();
    setInitialScroll(); // Call initial scroll correction
    manageCarousels(); // Initial check for carousels (currently does nothing)

    // Re-evaluate on resize
    window.addEventListener('resize', debounce(() => {
        // console.log("Window resized, re-evaluating listeners and carousels.");
        setupScrollListeners(); // Re-add/remove correct listeners
        setInitialScroll();     // Re-apply initial scroll for new view potentially
        manageCarousels();      // Re-check/setup/cleanup carousels (currently does nothing)
        handleActiveNav();      // Update nav highlight for new view/scroll pos
        handleScrollToTopVisibility(); // Update scroll button visibility
    }, 250));

}); // End DOMContentLoaded