/**
 * Main JavaScript for Keys by Caleb Website (V49 - Smoother Scroll Animation)
 * Handles scroll-to-top, active nav highlighting, GSAP smooth scroll (links),
 * contact form (default HTML handling), tsParticles hero animation (Float Effect), footer copyright year.
 * Implements JS-driven section scrolling for Wheel/Trackpad and Keyboard on desktop.
 * **Changed scroll ease to expo.out and reset accumulator immediately on trigger.**
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb NEW JS Initialized (V49 - Smoother Scroll Animation).");

    // --- GSAP Plugin Registration ---
    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
        gsap.registerPlugin(ScrollToPlugin);
        console.log("GSAP ScrollToPlugin registered.");
    } else {
        console.error("GSAP or ScrollToPlugin not loaded! Smooth scroll will not work.");
    }


    // --- State Variables ---
    let isAnimating = false;
    let accumulatedDeltaY = 0;

    // --- Configuration ---
    const WHEEL_SCROLL_THRESHOLD = 150; // Pixels: Trigger animation after accumulating this much deltaY (Adjust sensitivity here)
    console.log(`WHEEL_SCROLL_THRESHOLD set to: ${WHEEL_SCROLL_THRESHOLD}`);
    const sectionScrollDuration = 0.8; // Slightly increased duration for smoother ease
    const sectionScrollEase = 'expo.out'; // Changed ease for potentially smoother feel
    console.log(`sectionScrollEase set to: ${sectionScrollEase}`);
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
        // Use the ease provided in params, or default to the globally defined sectionScrollEase
        const ease = params.ease || sectionScrollEase;
        // console.log(`AnimateScroll START - Target Y: ${params?.scrollTo?.y?.toFixed(0)}, Duration: ${duration}s, Ease: ${ease}`);

        if (isAnimating) {
            // console.warn(`AnimateScroll BLOCKED - animation already in progress.`);
            return;
        }
        isAnimating = true;

        // Remove listeners temporarily
        if (isDesktopJsScrollActive()) {
             scrollSnapContainer?.removeEventListener('wheel', handleWheel);
             window.removeEventListener('keydown', handleKeyDown);
        }

        gsap.to(target, {
            duration: duration,
            scrollTo: params.scrollTo,
            ease: ease, // Use determined ease
            overwrite: 'auto',
            onComplete: () => {
                // console.log(`AnimateScroll COMPLETE. Setting isAnimating = false.`);
                isAnimating = false;
                // Reset accumulator only AFTER animation completes successfully
                // accumulatedDeltaY = 0; // Keep reset here for safety after completion
                // Re-attach listeners after a short delay
                if (isDesktopJsScrollActive()) {
                    setTimeout(() => {
                        scrollSnapContainer?.addEventListener('wheel', handleWheel, { passive: false });
                        window.addEventListener('keydown', handleKeyDown);
                    }, 50);
                }
                params.onComplete?.();
            },
            onInterrupt: () => {
                // console.error(`>>> GSAP AnimateScroll INTERRUPTED. Setting isAnimating = false.`);
                isAnimating = false;
                // Reset accumulator on interrupt too
                accumulatedDeltaY = 0;
                 // Re-attach listeners immediately on interrupt
                 if (isDesktopJsScrollActive()) {
                     scrollSnapContainer?.addEventListener('wheel', handleWheel, { passive: false });
                     window.addEventListener('keydown', handleKeyDown);
                 }
                params.onInterrupt?.();
            }
        });
    };

     // Helper to calculate the consistent target Y
     const calculateConsistentTargetY = (targetElement) => { /* ... same ... */ if (!targetElement) return 0; if (targetElement.id === 'hero') return 0; const headerHeight = getHeaderHeight(); let targetScrollY = targetElement.offsetTop - (headerHeight * headerOffsetFactor); return Math.max(0, targetScrollY); };

     // Helper to find the currently 'active' section index
     const getCurrentSectionIndex = () => { /* ... same ... */ if (!scrollSnapContainer) return 0; const scrollPosition = scrollSnapContainer.scrollTop; const viewportHeight = scrollSnapContainer.clientHeight; let bestMatchIndex = 0; let minDistance = Infinity; allNavTargets.forEach((section, index) => { const targetPos = calculateConsistentTargetY(section); const distance = Math.abs(scrollPosition - targetPos); if (distance < minDistance) { minDistance = distance; bestMatchIndex = index; } }); if (scrollPosition + viewportHeight >= scrollSnapContainer.scrollHeight - 20) { bestMatchIndex = allNavTargets.length - 1; } return bestMatchIndex; };

    // GSAP Smooth Scrolling for Internal Links using animateScroll wrapper
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                 const targetId = href.substring(1);
                 const targetElement = document.getElementById(targetId);
                 if (!targetElement) { console.warn(`Target element not found for ID: ${targetId}`); return; }
                 e.preventDefault();
                 const scrollTarget = getScrollTarget();
                 const desktopScroll = isDesktopJsScrollActive();
                 let targetScrollY = desktopScroll ? calculateConsistentTargetY(targetElement) : Math.max(0, targetElement.offsetTop - getHeaderHeight());
                 // Use specific link ease for links
                 animateScroll(scrollTarget, linkScrollDuration, { scrollTo: { y: targetScrollY }, ease: linkScrollEase });
             }
        });
    });


    // Scroll-to-Top Button Click (Uses animateScroll wrapper)
    scrollToTopButton?.addEventListener('click', () => {
        const scrollTarget = getScrollTarget();
        // Use link ease for scroll-to-top as well
        animateScroll(scrollTarget, linkScrollDuration, { scrollTo: 0, ease: linkScrollEase });
     });

    // Active Navigation Link Highlighting
    const handleActiveNav = () => { /* ... same logic ... */ let currentSectionId = 'hero'; const headerHeight = getHeaderHeight(); const scrollTarget = getScrollTarget(); const scrollPosition = (scrollTarget === window) ? window.scrollY : scrollTarget.scrollTop; const scrollTargetElement = (scrollTarget === window) ? document.documentElement : scrollTarget; if (!scrollTargetElement) return; const viewportHeight = scrollTargetElement.clientHeight || window.innerHeight; const scrollHeight = scrollTargetElement.scrollHeight || document.body.scrollHeight; let bestMatch = { id: 'hero', distance: Infinity }; allNavTargets.forEach((section) => { const activationPoint = calculateConsistentTargetY(section); const distance = Math.abs(scrollPosition - activationPoint); if (scrollPosition >= activationPoint - viewportHeight * 0.7 && scrollPosition < activationPoint + viewportHeight * 0.3) { if (distance < bestMatch.distance) { bestMatch = { id: section.id, distance: distance }; } } else { const idealAlignmentPoint = calculateConsistentTargetY(section); const distance = Math.abs(scrollPosition - idealAlignmentPoint); if (distance < bestMatch.distance) { bestMatch = { id: section.id, distance: distance }; } } }); currentSectionId = bestMatch.id; if (scrollPosition + viewportHeight >= scrollHeight - 50) { const lastElement = allNavTargets[allNavTargets.length - 1]; if (lastElement && lastElement.id) { currentSectionId = lastElement.id; if (currentSectionId === 'main-footer') currentSectionId = 'contact'; } } else if (scrollPosition < headerHeight * 0.5) { currentSectionId = 'hero'; } headerNavLinks.forEach(link => { link.classList.remove('active'); const linkHref = link.getAttribute('href'); if (linkHref === `#${currentSectionId}`) { link.classList.add('active'); } }); };


    // --- JS Wheel & Keyboard Navigation Logic --- (Threshold Trigger V2)

    // ** MODIFIED handleWheel function **
    const handleWheel = (event) => {
        if (!isDesktopJsScrollActive()) return;
        // const now = performance.now().toFixed(2);

        // Prevent default scroll behavior if we are handling it via JS
        event.preventDefault();

        if (isAnimating) {
             // console.log(`%c[${now}ms] handleWheel: Ignoring deltaY=${event.deltaY.toFixed(0)} during animation.`, 'color: #999;');
             return; // Do nothing if an animation is already in progress
        }

        if (Math.abs(event.deltaY) > 0) {
            // console.log(`%c[${now}ms] handleWheel: deltaY=${event.deltaY.toFixed(0)}, accumulatedDeltaY=${accumulatedDeltaY.toFixed(0)}`, 'color: #666;');
            accumulatedDeltaY += event.deltaY;

            // Check if accumulated delta crosses the threshold
            if (Math.abs(accumulatedDeltaY) >= WHEEL_SCROLL_THRESHOLD) {
                const direction = accumulatedDeltaY > 0 ? 1 : -1;
                const currentIndex = getCurrentSectionIndex();
                let targetIndex = currentIndex + direction;
                targetIndex = Math.max(0, Math.min(targetIndex, allNavTargets.length - 1));

                 // console.log(`%c[${now}ms] handleWheel: Threshold crossed! Direction: ${direction}, Current: ${currentIndex}, Target: ${targetIndex}`, 'color: purple;');

                if (targetIndex !== currentIndex) {
                    const targetSection = allNavTargets[targetIndex];
                    if (targetSection && targetSection.id) {
                        const targetScrollY = calculateConsistentTargetY(targetSection);
                        // console.log(`%c[${now}ms] handleWheel: Animating to Section: ${targetSection.id} (Y: ${targetScrollY.toFixed(0)})`, 'color: purple; font-weight: bold;');

                        // *** RESET ACCUMULATOR IMMEDIATELY ***
                        accumulatedDeltaY = 0;
                        // console.log(`%c[${now}ms] handleWheel: Reset accumulator BEFORE starting animation.`, 'color: purple;');

                        // Call animateScroll, using the section-specific duration and ease
                        animateScroll(scrollSnapContainer, sectionScrollDuration, {
                            scrollTo: { y: targetScrollY }
                            // Ease is now handled within animateScroll using sectionScrollEase by default
                        });
                    }
                } else {
                    // If target is the same, maybe don't need to reset here?
                    // Resetting prevents buildup if scrolling against boundary.
                     accumulatedDeltaY = 0;
                }
            }
        }
    };


    const handleKeyDown = (event) => { // Keyboard logic remains largely the same
        if (!isDesktopJsScrollActive()) return;
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');

        if (isInputFocused && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            return;
        }
        if (isAnimating) {
            return; // Ignore key presses during animation
        }

        let direction = 0;
        if (event.key === 'ArrowDown') direction = 1;
        else if (event.key === 'ArrowUp') direction = -1;
        else { return; }

        const currentIndex = getCurrentSectionIndex();
        let targetIndex = currentIndex + direction;
        targetIndex = Math.max(0, Math.min(targetIndex, allNavTargets.length - 1));

        if (targetIndex !== currentIndex) {
            event.preventDefault();
            const targetSection = allNavTargets[targetIndex];
            if (targetSection && targetSection.id) {
                const targetScrollY = calculateConsistentTargetY(targetSection);
                // Use section ease for keyboard nav too
                animateScroll(scrollSnapContainer, sectionScrollDuration, { scrollTo: { y: targetScrollY } });
            }
        }
    };


    // --- Contact Form Validation & Submission --- (Default handling)
     const validateContactField = (field) => { /* ... V38 basic validation ... */ let isValid = true; const errorElement = contactForm?.querySelector(`.error-message[data-for="${field.name}"]`); const value = field.value.trim(); field.classList.remove('input-error'); if (errorElement) errorElement.style.display = 'none'; if (field.required && !value) { isValid = false; } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { isValid = false; if(errorElement) errorElement.textContent = "A valid email is required."; } else if (field.type === 'date' && value) { try { const d = new Date(value + 'T00:00:00'), t = new Date(); t.setHours(0,0,0,0); if (isNaN(d.getTime()) || d < t) isValid = false; if(errorElement && !isValid) errorElement.textContent = "Date must be today or later"; } catch { isValid = false; if(errorElement) errorElement.textContent = "Invalid date";} } if (!isValid && errorElement) { if(!errorElement.textContent) errorElement.textContent = "Required"; errorElement.style.display = 'block'; field.classList.add('input-error'); } return isValid; };
    contactForm?.addEventListener('submit', (e) => { console.log("Contact form submit triggered (Default Handling)."); let isFormValid = true; const formMsgElement = contactForm?.querySelector('#form-message'); if (formMsgElement) formMsgElement.classList.add('hidden'); contactForm.querySelectorAll('[required]').forEach(field => { if (!validateContactField(field)) { isFormValid = false; } }); if (!isFormValid) { console.log("Contact form validation failed. Preventing default submission."); e.preventDefault(); // Keep preventDefault for invalid forms
         // Show general error message or alert
         alert("Please fill out all required fields correctly.");
         const firstError = contactForm.querySelector('.input-error');
         firstError?.focus();
         scrollIntoViewIfNeeded(firstError?.closest('.input-group') || firstError); } else { console.log("Contact form valid. Allowing default HTML/Netlify submission."); const submitBtn = contactForm.querySelector('#submit-button'); if(submitBtn) submitBtn.disabled = true; /* Let Netlify handle it */ } });
     contactForm?.querySelectorAll('input[required], textarea[required]').forEach(field => { field.addEventListener('blur', () => validateContactField(field)); });


    // --- Footer Year & Min Date ---
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }
    if (dateField) { try { const today = new Date(); const year = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0'); dateField.min = `${year}-${mm}-${dd}`; } catch (e) { console.error("Error setting min date for contact form:", e); } }


    // --- Initial Calls & Event Listeners Setup ---
    initParticles(); // Initialize particles!

    const debouncedNavHandler = debounce(handleActiveNav, 50);
    const debouncedScrollToTopHandler = debounce(handleScrollToTopVisibility, 50);
    const setupScrollListeners = () => {
        const currentScrollTarget = getScrollTarget();
        // Remove potentially old listeners first
        window.removeEventListener('scroll', debouncedNavHandler);
        window.removeEventListener('scroll', debouncedScrollToTopHandler);
        window.removeEventListener('keydown', handleKeyDown);
        scrollSnapContainer?.removeEventListener('scroll', debouncedNavHandler);
        scrollSnapContainer?.removeEventListener('scroll', debouncedScrollToTopHandler);
        scrollSnapContainer?.removeEventListener('wheel', handleWheel);
        // Add appropriate listeners
        if (currentScrollTarget === window) {
            window.addEventListener('scroll', debouncedNavHandler, { passive: true });
            window.addEventListener('scroll', debouncedScrollToTopHandler, { passive: true });
            window.addEventListener('keydown', handleKeyDown);
        } else {
            scrollSnapContainer.addEventListener('scroll', debouncedNavHandler, { passive: true });
            scrollSnapContainer.addEventListener('scroll', debouncedScrollToTopHandler, { passive: true });
            scrollSnapContainer.addEventListener('wheel', handleWheel, { passive: false });
            window.addEventListener('keydown', handleKeyDown);
        }
    };
    setupScrollListeners();
    handleScrollToTopVisibility();
    setTimeout(handleActiveNav, 150); // Initial nav check
    window.addEventListener('resize', debounce(() => {
         setupScrollListeners();
         handleActiveNav();
         handleScrollToTopVisibility();
     }, 250));
    // Listener for scroll-to-top uses animateScroll wrapper now
    scrollToTopButton?.addEventListener('click', () => {
        const scrollTarget = getScrollTarget();
        animateScroll(scrollTarget, linkScrollDuration, { scrollTo: 0, ease: linkScrollEase });
     });

}); // End DOMContentLoaded