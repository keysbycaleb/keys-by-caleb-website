/**
 * Main JavaScript for Keys by Caleb Website (V56.3 - User Coordinates Update)
 * Handles scroll-to-top, active nav highlighting, GSAP smooth scroll (manual coords per view),
 * contact form, tsParticles, footer year. Includes initial scroll offset per view.
 * Implements mobile-only carousels for Packages and Testimonials.
 * Uses latest user-provided coordinates for desktop and mobile scrolling.
 * Arrow key navigation (desktop only) includes the footer.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb NEW JS Initialized (V56.3 - User Coordinates Update).");

    // --- GSAP Plugin Registration ---
    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
        gsap.registerPlugin(ScrollToPlugin);
        // console.log("GSAP ScrollToPlugin registered.");
    } else {
        console.error("GSAP or ScrollToPlugin not loaded! Smooth scroll will not work.");
    }

    // --- State Variables ---
    let isAnimating = false;
    let activeCarousels = []; // Keep track of active carousel listeners

    // --- Configuration ---
    const sectionScrollDuration = 0.8; // For desktop arrow keys
    const sectionScrollEase = 'power2.inOut';
    const linkScrollDuration = 1.0;    // For nav link clicks (both views)
    const linkScrollEase = 'power2.inOut';
    const initialScrollDelay = 50;    // Small delay before initial scroll correction
    const mobileBreakpoint = 1024;    // Width threshold for mobile/desktop view

    // --- <<< MANUAL SCROLL TARGETS (DESKTOP) >>> ---
    // Updated Desktop Coordinates
    const desktopScrollTargets = {
        'hero': 32,
        'about': 878,
        'packages': 1730,
        'gallery': 2561,
        'testimonials': 3434,
        'contact': 4317,
        'main-footer': 4656
    };
    console.log("Using UPDATED desktop scroll targets:", desktopScrollTargets);

    // --- <<< MANUAL SCROLL TARGETS (MOBILE) >>> ---
    // Updated Mobile Coordinates (Footer coordinate not provided, will map to contact)
    const mobileScrollTargets = {
        'hero': 60.5,
        'about': 732.5,
        'packages': 2219, // Note: HTML ID is 'packages', nav link text is 'Services'
        'gallery': 2884,
        'testimonials': 3498,
        'contact': 4354.5
        // 'main-footer': ??? // Footer coordinate omitted by user for mobile
    };
    console.log("Using UPDATED mobile scroll targets:", mobileScrollTargets);
    // --- ^^^ END MANUAL SCROLL TARGETS ^^^ ---


    // --- Cache Elements ---
    const header = document.getElementById('main-header');
    const scrollToTopButton = document.getElementById('scroll-to-top');
    const internalLinks = document.querySelectorAll('a.internal-link[href^="#"], a.nav-link[href^="#"]:not([href="#"]), a.header-logo[href^="#"], #mobile-bottom-nav a.mobile-nav-item[href^="#"]');
    const desktopNavLinks = document.querySelectorAll('#desktop-nav-elements a.nav-link:not(.booking-nav-link):not(.follow-button):not([title="Email Me"])');
    const mobileNavItems = document.querySelectorAll('#mobile-bottom-nav .mobile-nav-item');
    const contactForm = document.getElementById('contact-form');
    const scrollSnapContainer = document.querySelector('.scroll-snap-container-home');
    const footerElement = document.getElementById('main-footer');

    // Carousel Elements
    const packagesContainer = document.querySelector('.packages-carousel-container');
    const packagesTrack = packagesContainer?.querySelector('.packages-carousel-track');
    const packagesPrevBtn = packagesContainer?.querySelector('.carousel-button.prev');
    const packagesNextBtn = packagesContainer?.querySelector('.carousel-button.next');

    const testimonialsContainer = document.querySelector('.testimonials-carousel-container');
    const testimonialsTrack = testimonialsContainer?.querySelector('.testimonials-carousel-track');
    const testimonialsPrevBtn = testimonialsContainer?.querySelector('.carousel-button.prev');
    const testimonialsNextBtn = testimonialsContainer?.querySelector('.carousel-button.next');


    // --- Create ordered list of scrollable elements based on DESKTOP targets ---
    // This defines the sequence primarily for keyboard navigation and consistent indexing
    const scrollableTargetIds = Object.keys(desktopScrollTargets);
    const scrollableElements = scrollableTargetIds
        .map(id => document.getElementById(id))
        .filter(el => el !== null)
        .sort((a, b) => {
            const yA = desktopScrollTargets[a.id] ?? 0;
            const yB = desktopScrollTargets[b.id] ?? 0;
            return yA - yB;
        });
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
    const scrollIntoViewIfNeeded = (element) => { /* ... (no change) ... */ };

    // --- tsParticles Initialization ---
    const initParticles = () => { /* ... (no change) ... */ };

    // --- Event Logic ---

    const handleScrollToTopVisibility = () => { /* ... (no change) ... */ };

    // --- Animate Scroll ---
    const animateScroll = (target, duration, params) => { /* ... (no change from V56.2) ... */ const ease = params.ease || sectionScrollEase; if (isAnimating) { return; } isAnimating = true; const isDesktop = isDesktopJsScrollActive(); if (isDesktop) { window.removeEventListener('keydown', handleKeyDown); } gsap.to(target, { duration: duration, scrollTo: params.scrollTo, ease: ease, overwrite: 'auto', onComplete: () => { isAnimating = false; if (isDesktop) { window.addEventListener('keydown', handleKeyDown); } handleActiveNav(); params.onComplete?.(); }, onInterrupt: () => { isAnimating = false; if (isDesktop) { window.addEventListener('keydown', handleKeyDown); } handleActiveNav(); params.onInterrupt?.(); } }); };

    // --- Get Target Scroll Y (Uses Correct Map Based on View) ---
    const getTargetScrollY = (targetElement) => {
        if (!targetElement) return 0;
        let targetId = targetElement.id; // Use let as it might change for mobile footer
        const isDesktop = isDesktopJsScrollActive();
        const targetMap = isDesktop ? desktopScrollTargets : mobileScrollTargets;
        const scrollTarget = getScrollTarget();

        // Handle mobile footer case: If target is footer and no mobile coord exists, use contact coord
        if (!isDesktop && targetId === 'main-footer' && !targetMap.hasOwnProperty(targetId)) {
            console.log("Mobile footer target: mapping to 'contact' coordinate.");
            targetId = 'contact'; // Remap ID to get the contact coordinate
        }

        if (targetMap.hasOwnProperty(targetId)) {
            let targetY = targetMap[targetId];
            // Clamp target Y to valid scroll range
            let maxScrollY;
            if (isDesktop) {
                maxScrollY = scrollTarget.scrollHeight - scrollTarget.clientHeight;
            } else {
                maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
            }
            // Add a small buffer at the bottom for mobile to prevent overscrolling
            if (!isDesktop) maxScrollY -= 10;
            return Math.max(0, Math.min(targetY, maxScrollY));
        } else {
            // Fallback (should ideally not be needed for main nav/keys)
            console.warn(`Target ID "${targetId}" not found in ${isDesktop ? 'desktop' : 'mobile'}ScrollTargets. Using fallback.`);
            let fallbackY = 0;
            let maxScrollY;
            if (isDesktop) {
                fallbackY = Math.max(0, targetElement.offsetTop - getHeaderHeight());
                maxScrollY = scrollTarget.scrollHeight - scrollTarget.clientHeight;
            } else {
                const elementRect = targetElement.getBoundingClientRect();
                fallbackY = Math.max(0, elementRect.top + window.pageYOffset - getHeaderHeight() - 10);
                maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
            }
            return Math.max(0, Math.min(fallbackY, maxScrollY));
        }
    };


    // --- Find Current Section Index for Highlighting ---
    const getCurrentElementIndex = () => {
        const isDesktop = isDesktopJsScrollActive();
        const scrollTarget = getScrollTarget();
        const scrollPosition = (scrollTarget === window) ? window.pageYOffset : scrollTarget.scrollTop;
        const viewportHeight = getScrollContainerHeight();
        const headerHeight = getHeaderHeight();
        const targetMap = isDesktop ? desktopScrollTargets : mobileScrollTargets;

        let bestMatchIndex = 0;

        // Use scrollableElements (ordered by desktop targets) but check against the *current view's* target map
        const sortedTargets = scrollableElements
            .map(el => ({ id: el.id, y: targetMap[el.id] })) // Get Y from the correct map
            .filter(item => item.y !== undefined) // Only consider elements present in the current view's map
            .sort((a, b) => a.y - b.y);

        if (sortedTargets.length === 0) return 0;

        for (let i = sortedTargets.length - 1; i >= 0; i--) {
            // Activate slightly before reaching the exact target
            const activationOffset = viewportHeight * 0.1;
            if (scrollPosition >= sortedTargets[i].y - activationOffset) {
                // Find the index in the *original* scrollableElements array
                const foundIndex = scrollableElements.findIndex(el => el.id === sortedTargets[i].id);
                if (foundIndex !== -1) {
                    bestMatchIndex = foundIndex;
                    break;
                }
            }
        }

        // --- Edge Case Handling ---
        // If very near the top, force the first element (hero)
        const heroTargetY = targetMap['hero'] ?? 50; // Use hero target from current map
        if (scrollPosition < heroTargetY / 2) {
             bestMatchIndex = 0;
        }
        // If scrolled to the absolute bottom, force the last element *that has a coordinate in the current map*
        const scrollHeight = (scrollTarget === window) ? document.documentElement.scrollHeight : scrollTarget.scrollHeight;
        if (scrollPosition + viewportHeight >= scrollHeight - 10) {
            if (sortedTargets.length > 0) {
                const lastMappedElementId = sortedTargets[sortedTargets.length - 1].id;
                const lastMappedIndex = scrollableElements.findIndex(el => el.id === lastMappedElementId);
                 if (lastMappedIndex !== -1) {
                     bestMatchIndex = lastMappedIndex;
                 } else { // Fallback if something weird happens
                     bestMatchIndex = scrollableElements.length -1;
                 }
            } else {
                bestMatchIndex = scrollableElements.length -1; // Fallback if no targets for view
            }
        }

        return bestMatchIndex;
    };


    // --- Internal Link Click Handler ---
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                 let targetId = href.substring(1);
                 // Special handling for mobile footer link if footer coord isn't defined
                 if (isMobileView() && targetId === 'main-footer' && !mobileScrollTargets.hasOwnProperty('main-footer')) {
                     targetId = 'contact'; // Target contact instead on mobile
                     console.log("Mobile footer link clicked, targeting 'contact' section.");
                 }

                 const targetElement = scrollableElements.find(el => el.id === targetId);

                 if (targetElement) {
                     e.preventDefault();
                     const scrollTarget = getScrollTarget();
                     const targetScrollY = getTargetScrollY(targetElement); // Gets coord based on view/remapping

                     animateScroll(scrollTarget, linkScrollDuration, { scrollTo: { y: targetScrollY }, ease: linkScrollEase });
                 } else {
                     console.log(`Link target #${targetId} not in defined scroll targets or HTML. Allowing default behavior.`);
                 }
             }
        });
    });

    // --- Scroll-to-Top Button Click ---
    if (scrollToTopButton) { /* ... (no change from V56.2) ... */ }

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
    const handleKeyDown = (event) => { /* ... (no change from V56.2) ... */ if (!isDesktopJsScrollActive() || isAnimating) return; const activeElement = document.activeElement; const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT'); if (isInputFocused && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) return; let direction = 0; if (event.key === 'ArrowDown') direction = 1; else if (event.key === 'ArrowUp') direction = -1; else return; event.preventDefault(); const currentIndex = getCurrentElementIndex(); let targetIndex = currentIndex + direction; targetIndex = Math.max(0, Math.min(targetIndex, scrollableElements.length - 1)); if (targetIndex !== currentIndex) { const targetElement = scrollableElements[targetIndex]; if (targetElement && targetElement.id) { const targetScrollY = getTargetScrollY(targetElement); animateScroll(scrollSnapContainer, sectionScrollDuration, { scrollTo: { y: targetScrollY }, ease: sectionScrollEase }); } } };

    // --- Contact Form Validation & Submission ---
    if (contactForm) { /* ... (no change) ... */ }

    // --- Footer Year ---
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

    // --- Mobile Carousel Logic ---
    const updateCarouselButtons = (trackElement, prevButton, nextButton) => { /* ... (no change) ... */ };
    const setupCarousel = (trackElement, prevButton, nextButton) => { /* ... (no change - returns cleanup function) ... */ };
    const manageCarousels = () => { /* ... (no change from V56.1) ... */ };


    // --- Initial Scroll Correction (Applies correct coordinate based on view) ---
    const setInitialScroll = () => { /* ... (no change from V56.2) ... */ };

    // --- Initial Calls & Event Listeners Setup ---
    initParticles();
    const debouncedNavHandler = debounce(handleActiveNav, 50);
    const debouncedScrollToTopHandler = debounce(handleScrollToTopVisibility, 50);
    const setupScrollListeners = () => { /* ... (no change from V56.2) ... */ };

    setupScrollListeners();
    handleScrollToTopVisibility();
    setInitialScroll(); // Call initial scroll correction
    manageCarousels(); // Initial check for carousels

    // Re-evaluate on resize
    window.addEventListener('resize', debounce(() => { /* ... (no change from V56.2) ... */ console.log("Window resized, re-evaluating listeners and carousels."); setupScrollListeners(); setInitialScroll(); manageCarousels(); handleActiveNav(); handleScrollToTopVisibility(); }, 250));

}); // End DOMContentLoaded
