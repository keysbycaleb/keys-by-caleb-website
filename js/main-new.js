/**
 * Main JavaScript for Keys by Caleb Website (V44 - Consistent Scroll Handling)
 * Handles scroll-to-top, active nav highlighting, GSAP smooth scroll (links),
 * contact form (default HTML handling), tsParticles hero animation (Float Effect), footer copyright year.
 * Implements JS-driven section scrolling for Wheel/Trackpad and Keyboard on desktop.
 * **Restored internal link click handler to use animateScroll wrapper for consistency.**
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb NEW JS Initialized (V44 - Consistent Scroll Handling).");

    // --- GSAP Plugin Registration ---
    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
        gsap.registerPlugin(ScrollToPlugin);
        console.log("GSAP ScrollToPlugin registered.");
    } else {
        console.error("GSAP or ScrollToPlugin not loaded! Smooth scroll will not work.");
    }


    // --- State Variables ---
    let isAnimating = false;
    let wheelTimeout;
    let accumulatedDeltaY = 0;

    // --- Configuration ---
    const wheelScrollEndDelay = 40;
    const sectionScrollDuration = 0.7;
    const sectionScrollEase = 'power2.inOut';
    const linkScrollDuration = 1.0; // Duration for link clicks
    const linkScrollEase = 'power2.inOut'; // Ease for link clicks (can differ from wheel/key)
    const headerOffsetFactor = 0.05;

    // --- Cache Elements ---
    const header = document.getElementById('main-header');
    const scrollToTopButton = document.getElementById('scroll-to-top');
    const internalLinks = document.querySelectorAll('a.internal-link[href^="#"], a.nav-link[href^="#"]:not([href="#"]), a.header-logo[href^="#"]');
    const headerNavLinks = document.querySelectorAll('#main-header nav a.nav-link:not(.booking-nav-link):not(.follow-button):not([title="Email Me"])');
    const bookingNavLink = document.querySelector('#main-header nav .booking-nav-link');
    const contactForm = document.getElementById('contact-form');
    const contactFormMessage = contactForm?.querySelector('#form-message');
    const contactSubmitButton = contactForm?.querySelector('#submit-button');
    const mainSections = Array.from(document.querySelectorAll('.scroll-snap-container-home > main > section[id]'));
    const footerElement = document.getElementById('main-footer');
    const allNavTargets = [...mainSections, ...(footerElement ? [footerElement] : [])].filter(el => el.id);
    const scrollSnapContainer = document.querySelector('.scroll-snap-container-home');
    const currentYearSpan = document.getElementById('current-year');
    const dateField = contactForm?.querySelector('#contact_event_date');
    const particleContainerId = 'tsparticles-hero';


    // --- Helper Functions ---
    const debounce = (func, wait) => { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func.apply(this, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; };
    const getHeaderHeight = () => header?.offsetHeight || 70;
    const isDesktopJsScrollActive = () => window.innerWidth >= 1024 && scrollSnapContainer;
    const getScrollTarget = () => isDesktopJsScrollActive() ? scrollSnapContainer : window;
    const scrollIntoViewIfNeeded = (element) => { if (!element) return; const rect = element.getBoundingClientRect(); const headerHeight = getHeaderHeight(); const isAbove = rect.top < headerHeight + 10; const isBelow = rect.bottom > window.innerHeight - 10; if (isAbove || isBelow) { const elementTopRelativeToDocument = window.scrollY + rect.top; const targetScrollY = elementTopRelativeToDocument - headerHeight - 30; window.scrollTo({ top: targetScrollY, behavior: 'smooth' }); } };


    // --- tsParticles Initialization --- (Includes Float Effect Config)
    const initParticles = () => { if (typeof tsParticles === 'undefined') { console.warn("tsParticles library not loaded."); return; } const particleContainer = document.getElementById(particleContainerId); if (particleContainer) { console.log("Initializing tsParticles for hero free float effect..."); tsParticles.load(particleContainerId, { fullScreen: { enable: false }, background: { color: { value: "transparent" } }, particles: { number: { value: 60, density: { enable: true, area: 800 } }, color: { value: "#ffffff" }, shape: { type: "circle" }, opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 0.8, minimumValue: 0.1, sync: false } }, size: { value: { min: 1, max: 3 } }, links: { enable: false }, move: { enable: true, speed: 1, direction: "none", random: true, straight: false, outModes: { default: "bounce" }, attract: { enable: false }, trail: { enable: false } } }, interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true, } }, detectRetina: true, }).then(c => console.log("tsParticles loaded.")).catch(e => console.error("tsParticles load error:", e)); } else { console.warn("Particle container #" + particleContainerId + " not found."); } };

    // --- Event Logic ---

    const handleScrollToTopVisibility = () => { /* ... same ... */ const scrollTarget = getScrollTarget(); const scrollY = (scrollTarget === window) ? window.scrollY : scrollTarget.scrollTop; if (!scrollToTopButton) return; if (scrollY > 300) { scrollToTopButton?.classList.remove('hidden'); requestAnimationFrame(() => { scrollToTopButton?.classList.add('visible'); }); } else { if (scrollToTopButton?.classList.contains('visible')) { scrollToTopButton.classList.remove('visible'); setTimeout(() => { const currentScrollYCheck = (scrollTarget === window) ? window.scrollY : scrollTarget.scrollTop; if (currentScrollYCheck <= 300 && !scrollToTopButton.classList.contains('visible')) { scrollToTopButton.classList.add('hidden'); } }, 300); } else if (!scrollToTopButton?.classList.contains('hidden')) { scrollToTopButton.classList.add('hidden'); } } };

    // Animate scroll with GSAP (Wrapper function used by all programmatic scrolls)
    const animateScroll = (target, duration, params) => {
        console.log(`%cAnimateScroll START: Target:`, 'color: blue; font-weight: bold;', target, `Duration: ${duration}s, ScrollTo Y: ${params?.scrollTo?.y?.toFixed(0)}, Ease: ${params.ease || 'default'}`);
        if (isAnimating) { console.warn("%cAnimateScroll BLOCKED - animation already in progress.", 'color: orange;'); return; }
        isAnimating = true;
        if (isDesktopJsScrollActive()) { console.log("AnimateScroll: Removing wheel/keydown listeners."); scrollSnapContainer?.removeEventListener('wheel', handleWheel); window.removeEventListener('keydown', handleKeyDown); }
        gsap.to(target, {
            duration: duration,
            scrollTo: params.scrollTo,
            ease: params.ease || "power2.inOut", // Default ease used if none provided
            overwrite: 'auto',
            onComplete: () => {
                console.log("%cAnimateScroll COMPLETE.", 'color: green; font-weight: bold;');
                isAnimating = false;
                if (isDesktopJsScrollActive()) { console.log("AnimateScroll: Re-attaching wheel/keydown listeners."); setTimeout(() => { scrollSnapContainer?.addEventListener('wheel', handleWheel, { passive: false }); window.addEventListener('keydown', handleKeyDown); }, 100); }
                params.onComplete?.();
            },
            onInterrupt: () => {
                console.error("%c>>> GSAP AnimateScroll INTERRUPTED.", 'color: red; font-weight: bold;');
                isAnimating = false;
                 if (isDesktopJsScrollActive()) { console.log("AnimateScroll: Re-attaching wheel/keydown listeners after interrupt."); scrollSnapContainer?.addEventListener('wheel', handleWheel, { passive: false }); window.addEventListener('keydown', handleKeyDown); }
                params.onInterrupt?.();
            }
        });
    };

     // Helper to calculate the consistent target Y
     const calculateConsistentTargetY = (targetElement) => { /* ... same ... */ if (!targetElement) return 0; if (targetElement.id === 'hero') return 0; const headerHeight = getHeaderHeight(); let targetScrollY = targetElement.offsetTop - (headerHeight * headerOffsetFactor); return Math.max(0, targetScrollY); };

     // Helper to find the currently 'active' section index
     const getCurrentSectionIndex = () => { /* ... same ... */ if (!scrollSnapContainer) return 0; const scrollPosition = scrollSnapContainer.scrollTop; const viewportHeight = scrollSnapContainer.clientHeight; let bestMatchIndex = 0; let minDistance = Infinity; allNavTargets.forEach((section, index) => { const targetPos = calculateConsistentTargetY(section); const distance = Math.abs(scrollPosition - targetPos); if (distance < minDistance) { minDistance = distance; bestMatchIndex = index; } }); if (scrollPosition + viewportHeight >= scrollSnapContainer.scrollHeight - 20) { bestMatchIndex = allNavTargets.length - 1; } return bestMatchIndex; };

    // *** RESTORED: GSAP Smooth Scrolling for Internal Links using animateScroll wrapper ***
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            console.log(`Clicked internal link: ${href}`);
            if (href && href.startsWith('#') && href.length > 1) {
                 const targetId = href.substring(1);
                 const targetElement = document.getElementById(targetId);
                 if (!targetElement) { console.warn(`Target element not found for ID: ${targetId}`); return; }
                 console.log(`Target element found:`, targetElement);

                 e.preventDefault(); // Prevent default jump
                 console.log("Default navigation PREVENTED for link:", href);

                 const scrollTarget = getScrollTarget();
                 const desktopScroll = isDesktopJsScrollActive();
                 let targetScrollY;

                 console.log(`Scroll target element: ${desktopScroll ? 'Container DIV' : 'Window object'}`);

                 if (desktopScroll) {
                     targetScrollY = calculateConsistentTargetY(targetElement);
                 } else {
                     // Mobile/Window scroll: simple offset from top
                     targetScrollY = Math.max(0, targetElement.offsetTop - getHeaderHeight());
                 }
                 console.log(`Calculated target scroll Y position: ${targetScrollY.toFixed(0)}`);

                 // *** Use the animateScroll wrapper function ***
                 animateScroll(scrollTarget, linkScrollDuration, {
                     scrollTo: { y: targetScrollY },
                     ease: linkScrollEase // Use the specific ease defined for link clicks
                 });
                 console.log("Called animateScroll wrapper function for link click.");

             } else {
                 console.log(`Link not processed for smooth scroll: ${href}`);
             }
        });
    });


    // Scroll-to-Top Button Click (Uses animateScroll wrapper)
    scrollToTopButton?.addEventListener('click', () => {
        console.log("Scroll-to-top button clicked.");
        const scrollTarget = getScrollTarget();
        animateScroll(scrollTarget, linkScrollDuration, { // Use link duration/ease for consistency?
            scrollTo: 0,
            ease: linkScrollEase
        });
     });

    // Active Navigation Link Highlighting
    const handleActiveNav = () => { /* ... same logic ... */ let currentSectionId = 'hero'; const headerHeight = getHeaderHeight(); const scrollTarget = getScrollTarget(); const scrollPosition = (scrollTarget === window) ? window.scrollY : scrollTarget.scrollTop; const scrollTargetElement = (scrollTarget === window) ? document.documentElement : scrollTarget; if (!scrollTargetElement) return; const viewportHeight = scrollTargetElement.clientHeight || window.innerHeight; const scrollHeight = scrollTargetElement.scrollHeight || document.body.scrollHeight; let bestMatch = { id: 'hero', distance: Infinity }; allNavTargets.forEach((section) => { const activationPoint = calculateConsistentTargetY(section); const distance = Math.abs(scrollPosition - activationPoint); if (scrollPosition >= activationPoint - viewportHeight * 0.7 && scrollPosition < activationPoint + viewportHeight * 0.3) { if (distance < bestMatch.distance) { bestMatch = { id: section.id, distance: distance }; } } else { const idealAlignmentPoint = calculateConsistentTargetY(section); const distance = Math.abs(scrollPosition - idealAlignmentPoint); if (distance < bestMatch.distance) { bestMatch = { id: section.id, distance: distance }; } } }); currentSectionId = bestMatch.id; if (scrollPosition + viewportHeight >= scrollHeight - 50) { const lastElement = allNavTargets[allNavTargets.length - 1]; if (lastElement && lastElement.id) { currentSectionId = lastElement.id; if (currentSectionId === 'main-footer') currentSectionId = 'contact'; } } else if (scrollPosition < headerHeight * 0.5) { currentSectionId = 'hero'; } headerNavLinks.forEach(link => { link.classList.remove('active'); const linkHref = link.getAttribute('href'); if (linkHref === `#${currentSectionId}`) { link.classList.add('active'); } }); };


    // --- JS Wheel & Keyboard Navigation Logic --- (Uses animateScroll wrapper)
    const handleWheelScrollEnd = () => { /* ... same logic ... */ if (isAnimating) { accumulatedDeltaY = 0; return; } const direction = accumulatedDeltaY > 0 ? 1 : -1; accumulatedDeltaY = 0; const currentIndex = getCurrentSectionIndex(); let targetIndex = currentIndex + direction; targetIndex = Math.max(0, Math.min(targetIndex, allNavTargets.length - 1)); if (targetIndex !== currentIndex) { const targetSection = allNavTargets[targetIndex]; if (targetSection && targetSection.id) { const targetScrollY = calculateConsistentTargetY(targetSection); animateScroll(scrollSnapContainer, sectionScrollDuration, { scrollTo: { y: targetScrollY }, ease: sectionScrollEase }); } } };
    const handleWheel = (event) => { /* ... same logic ... */ if (!isDesktopJsScrollActive()) return; if (Math.abs(event.deltaY) > 0) { if (!isAnimating) { event.preventDefault(); accumulatedDeltaY += event.deltaY; } else { event.preventDefault(); } } else { return; } clearTimeout(wheelTimeout); if (!isAnimating) { wheelTimeout = setTimeout(handleWheelScrollEnd, wheelScrollEndDelay); } else { accumulatedDeltaY = 0; } };
    const handleKeyDown = (event) => { /* ... same logic ... */ if (!isDesktopJsScrollActive()) return; const activeElement = document.activeElement; const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT'); if (isInputFocused && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) return; if (isAnimating) return; let targetIndex = -1; const currentIndex = getCurrentSectionIndex(); if (event.key === 'ArrowDown') targetIndex = Math.min(currentIndex + 1, allNavTargets.length - 1); else if (event.key === 'ArrowUp') targetIndex = Math.max(currentIndex - 1, 0); else { return; } if (targetIndex !== currentIndex) { event.preventDefault(); const targetSection = allNavTargets[targetIndex]; if (targetSection && targetSection.id) { const targetScrollY = calculateConsistentTargetY(targetSection); animateScroll(scrollSnapContainer, sectionScrollDuration, { scrollTo: { y: targetScrollY }, ease: sectionScrollEase }); } } };


    // --- Contact Form Validation & Submission --- (Reverted to V38 default handling)
     const validateContactField = (field) => { /* ... V38 basic validation ... */ let isValid = true; const errorElement = contactForm?.querySelector(`.error-message[data-for="${field.name}"]`); const value = field.value.trim(); field.classList.remove('input-error'); if (errorElement) errorElement.style.display = 'none'; if (field.required && !value) { isValid = false; } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { isValid = false; if(errorElement) errorElement.textContent = "A valid email is required."; } else if (field.type === 'date' && value) { try { const d = new Date(value + 'T00:00:00'), t = new Date(); t.setHours(0,0,0,0); if (isNaN(d.getTime()) || d < t) isValid = false; if(errorElement && !isValid) errorElement.textContent = "Date must be today or later"; } catch { isValid = false; if(errorElement) errorElement.textContent = "Invalid date";} } if (!isValid && errorElement) { if(!errorElement.textContent) errorElement.textContent = "Required"; errorElement.style.display = 'block'; field.classList.add('input-error'); } return isValid; };
    contactForm?.addEventListener('submit', (e) => { console.log("Contact form submit triggered (V38 Handling)."); let isFormValid = true; const formMsgElement = contactForm?.querySelector('#form-message'); if (formMsgElement) formMsgElement.classList.add('hidden'); contactForm.querySelectorAll('[required]').forEach(field => { if (!validateContactField(field)) { isFormValid = false; } }); if (!isFormValid) { console.log("Contact form validation failed. Preventing default submission."); e.preventDefault(); alert("Please fill out all required fields correctly."); const firstError = contactForm.querySelector('.input-error'); firstError?.focus(); scrollIntoViewIfNeeded(firstError); } else { console.log("Contact form valid. Allowing default HTML/Netlify submission."); const submitBtn = contactForm.querySelector('#submit-button'); if(submitBtn) submitBtn.disabled = true; } });
     contactForm?.querySelectorAll('input[required], textarea[required]').forEach(field => { field.addEventListener('blur', () => validateContactField(field)); });


    // --- Footer Year & Min Date ---
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }
    if (dateField) { try { const today = new Date(); const year = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0'); dateField.min = `${year}-${mm}-${dd}`; } catch (e) { console.error("Error setting min date for contact form:", e); } }


    // --- Initial Calls & Event Listeners Setup ---
    initParticles(); // Initialize particles!

    const debouncedNavHandler = debounce(handleActiveNav, 50);
    const debouncedScrollToTopHandler = debounce(handleScrollToTopVisibility, 50);
    const setupScrollListeners = () => { const currentScrollTarget = getScrollTarget(); window.removeEventListener('scroll', debouncedNavHandler); window.removeEventListener('scroll', debouncedScrollToTopHandler); window.removeEventListener('keydown', handleKeyDown); scrollSnapContainer?.removeEventListener('scroll', debouncedNavHandler); scrollSnapContainer?.removeEventListener('scroll', debouncedScrollToTopHandler); scrollSnapContainer?.removeEventListener('wheel', handleWheel); if (currentScrollTarget === window) { window.addEventListener('scroll', debouncedNavHandler, { passive: true }); window.addEventListener('scroll', debouncedScrollToTopHandler, { passive: true }); } else { scrollSnapContainer.addEventListener('scroll', debouncedNavHandler, { passive: true }); scrollSnapContainer.addEventListener('scroll', debouncedScrollToTopHandler, { passive: true }); scrollSnapContainer.addEventListener('wheel', handleWheel, { passive: false }); window.addEventListener('keydown', handleKeyDown); } };
    setupScrollListeners();
    handleScrollToTopVisibility();
    setTimeout(handleActiveNav, 150);
    window.addEventListener('resize', debounce(() => { setupScrollListeners(); handleActiveNav(); handleScrollToTopVisibility(); }, 250));
    // Listener for scroll-to-top uses animateScroll wrapper now
    scrollToTopButton?.addEventListener('click', () => {
        const scrollTarget = getScrollTarget();
        animateScroll(scrollTarget, linkScrollDuration, { scrollTo: 0, ease: linkScrollEase });
     });

}); // End DOMContentLoaded