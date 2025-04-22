/**
 * Main JavaScript for Keys by Caleb Website (V46 - Aggressive Scroll Delay + Debug Logs)
 * Handles scroll-to-top, active nav highlighting, GSAP smooth scroll (links),
 * contact form (default HTML handling), tsParticles hero animation (Float Effect), footer copyright year.
 * Implements JS-driven section scrolling for Wheel/Trackpad and Keyboard on desktop.
 * **Further reduced wheelScrollEndDelay and added console logs for trackpad debugging.**
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb NEW JS Initialized (V46 - Aggressive Scroll Delay + Debug Logs).");

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
    // *** AGGRESSIVE DELAY HERE FOR TESTING ***
    const wheelScrollEndDelay = 20; // Reduced further from 50
    console.log(`wheelScrollEndDelay set to: ${wheelScrollEndDelay}ms`); // Log the value
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
        const now = performance.now().toFixed(2);
        console.log(`%c[${now}ms] AnimateScroll START: Target:`, 'color: blue; font-weight: bold;', target, `Duration: ${duration}s, ScrollTo Y: ${params?.scrollTo?.y?.toFixed(0)}, Ease: ${params.ease || 'default'}`);
        if (isAnimating) {
            console.warn(`%c[${now}ms] AnimateScroll BLOCKED - animation already in progress.`, 'color: orange;');
            return;
        }
        isAnimating = true;
        // Debug log: Removing listeners
        if (isDesktopJsScrollActive()) {
            console.log(`%c[${now}ms] AnimateScroll: Removing wheel/keydown listeners.`, 'color: blue;');
            scrollSnapContainer?.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
        }

        gsap.to(target, {
            duration: duration,
            scrollTo: params.scrollTo,
            ease: params.ease || "power2.inOut", // Default ease used if none provided
            overwrite: 'auto',
            onComplete: () => {
                const completeTime = performance.now().toFixed(2);
                console.log(`%c[${completeTime}ms] AnimateScroll COMPLETE. Setting isAnimating = false.`, 'color: green; font-weight: bold;');
                isAnimating = false;
                // Debug log: Re-attaching listeners
                if (isDesktopJsScrollActive()) {
                    console.log(`%c[${completeTime}ms] AnimateScroll Complete: Re-attaching wheel/keydown listeners after timeout.`, 'color: green;');
                    // Increase timeout slightly to ensure state is fully settled
                    setTimeout(() => {
                        const reattachTime = performance.now().toFixed(2);
                        console.log(`%c[${reattachTime}ms] Re-attaching listeners now.`, 'color: green;');
                        scrollSnapContainer?.addEventListener('wheel', handleWheel, { passive: false });
                        window.addEventListener('keydown', handleKeyDown);
                    }, 150); // Increased from 100ms
                }
                params.onComplete?.();
            },
            onInterrupt: () => {
                const interruptTime = performance.now().toFixed(2);
                console.error(`%c[${interruptTime}ms] >>> GSAP AnimateScroll INTERRUPTED. Setting isAnimating = false.`, 'color: red; font-weight: bold;');
                isAnimating = false;
                 // Debug log: Re-attaching listeners after interrupt
                 if (isDesktopJsScrollActive()) {
                     console.log(`%c[${interruptTime}ms] AnimateScroll Interrupt: Re-attaching wheel/keydown listeners immediately.`, 'color: red;');
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
            // console.log(`Clicked internal link: ${href}`); // Less verbose log
            if (href && href.startsWith('#') && href.length > 1) {
                 const targetId = href.substring(1);
                 const targetElement = document.getElementById(targetId);
                 if (!targetElement) { console.warn(`Target element not found for ID: ${targetId}`); return; }
                 // console.log(`Target element found:`, targetElement);

                 e.preventDefault(); // Prevent default jump
                 // console.log("Default navigation PREVENTED for link:", href);

                 const scrollTarget = getScrollTarget();
                 const desktopScroll = isDesktopJsScrollActive();
                 let targetScrollY;

                 // console.log(`Scroll target element: ${desktopScroll ? 'Container DIV' : 'Window object'}`);

                 if (desktopScroll) {
                     targetScrollY = calculateConsistentTargetY(targetElement);
                 } else {
                     // Mobile/Window scroll: simple offset from top
                     targetScrollY = Math.max(0, targetElement.offsetTop - getHeaderHeight());
                 }
                 // console.log(`Calculated target scroll Y position: ${targetScrollY.toFixed(0)}`);

                 // *** Use the animateScroll wrapper function ***
                 animateScroll(scrollTarget, linkScrollDuration, {
                     scrollTo: { y: targetScrollY },
                     ease: linkScrollEase // Use the specific ease defined for link clicks
                 });
                 // console.log("Called animateScroll wrapper function for link click.");

             } else {
                 // console.log(`Link not processed for smooth scroll: ${href}`);
             }
        });
    });


    // Scroll-to-Top Button Click (Uses animateScroll wrapper)
    scrollToTopButton?.addEventListener('click', () => {
        // console.log("Scroll-to-top button clicked.");
        const scrollTarget = getScrollTarget();
        animateScroll(scrollTarget, linkScrollDuration, { // Use link duration/ease for consistency
            scrollTo: 0,
            ease: linkScrollEase
        });
     });

    // Active Navigation Link Highlighting
    const handleActiveNav = () => { /* ... same logic ... */ let currentSectionId = 'hero'; const headerHeight = getHeaderHeight(); const scrollTarget = getScrollTarget(); const scrollPosition = (scrollTarget === window) ? window.scrollY : scrollTarget.scrollTop; const scrollTargetElement = (scrollTarget === window) ? document.documentElement : scrollTarget; if (!scrollTargetElement) return; const viewportHeight = scrollTargetElement.clientHeight || window.innerHeight; const scrollHeight = scrollTargetElement.scrollHeight || document.body.scrollHeight; let bestMatch = { id: 'hero', distance: Infinity }; allNavTargets.forEach((section) => { const activationPoint = calculateConsistentTargetY(section); const distance = Math.abs(scrollPosition - activationPoint); if (scrollPosition >= activationPoint - viewportHeight * 0.7 && scrollPosition < activationPoint + viewportHeight * 0.3) { if (distance < bestMatch.distance) { bestMatch = { id: section.id, distance: distance }; } } else { const idealAlignmentPoint = calculateConsistentTargetY(section); const distance = Math.abs(scrollPosition - idealAlignmentPoint); if (distance < bestMatch.distance) { bestMatch = { id: section.id, distance: distance }; } } }); currentSectionId = bestMatch.id; if (scrollPosition + viewportHeight >= scrollHeight - 50) { const lastElement = allNavTargets[allNavTargets.length - 1]; if (lastElement && lastElement.id) { currentSectionId = lastElement.id; if (currentSectionId === 'main-footer') currentSectionId = 'contact'; } } else if (scrollPosition < headerHeight * 0.5) { currentSectionId = 'hero'; } headerNavLinks.forEach(link => { link.classList.remove('active'); const linkHref = link.getAttribute('href'); if (linkHref === `#${currentSectionId}`) { link.classList.add('active'); } }); };


    // --- JS Wheel & Keyboard Navigation Logic --- (Uses animateScroll wrapper)
    const handleWheelScrollEnd = () => {
        const now = performance.now().toFixed(2);
        console.log(`%c[${now}ms] handleWheelScrollEnd triggered. isAnimating: ${isAnimating}`, 'color: purple;');
        if (isAnimating) {
             console.log(`%c[${now}ms] handleWheelScrollEnd: Aborting because isAnimating is true.`, 'color: purple;');
             accumulatedDeltaY = 0; return;
        }
        const direction = accumulatedDeltaY > 0 ? 1 : -1;
        console.log(`%c[${now}ms] handleWheelScrollEnd: AccumulatedDelta: ${accumulatedDeltaY.toFixed(0)}, Direction: ${direction}`, 'color: purple;');
        accumulatedDeltaY = 0; // Reset accumulator

        const currentIndex = getCurrentSectionIndex();
        let targetIndex = currentIndex + direction;
        targetIndex = Math.max(0, Math.min(targetIndex, allNavTargets.length - 1));

        console.log(`%c[${now}ms] handleWheelScrollEnd: Current Index: ${currentIndex}, Target Index: ${targetIndex}`, 'color: purple;');

        if (targetIndex !== currentIndex) {
            const targetSection = allNavTargets[targetIndex];
            if (targetSection && targetSection.id) {
                const targetScrollY = calculateConsistentTargetY(targetSection);
                console.log(`%c[${now}ms] handleWheelScrollEnd: Animating to Section: ${targetSection.id} (Y: ${targetScrollY.toFixed(0)})`, 'color: purple; font-weight: bold;');
                animateScroll(scrollSnapContainer, sectionScrollDuration, { scrollTo: { y: targetScrollY }, ease: sectionScrollEase });
            }
        } else {
             console.log(`%c[${now}ms] handleWheelScrollEnd: Target index is same as current index. No scroll triggered.`, 'color: purple;');
        }
    };

    const handleWheel = (event) => {
        if (!isDesktopJsScrollActive()) return;
        const now = performance.now().toFixed(2);

        if (Math.abs(event.deltaY) > 0) {
            console.log(`%c[${now}ms] handleWheel: deltaY=${event.deltaY.toFixed(0)}, isAnimating=${isAnimating}`, 'color: #666;');
            if (!isAnimating) {
                event.preventDefault();
                accumulatedDeltaY += event.deltaY;
                 // Only reset timer if we are NOT animating
                clearTimeout(wheelTimeout);
                wheelTimeout = setTimeout(handleWheelScrollEnd, wheelScrollEndDelay);
            } else {
                // If animating, still prevent default browser scroll but don't accumulate or reset timer
                event.preventDefault();
                console.log(`%c[${now}ms] handleWheel: Preventing default scroll during animation.`, 'color: #999;');
            }
        } else {
            // Ignore events with no vertical delta
            return;
        }
        // We clear the timeout on every significant wheel event when not animating,
        // effectively waiting for the specified delay *after the last event*.
        // Removed the old logic block that cleared timeout even when animating.
    };


    const handleKeyDown = (event) => {
        if (!isDesktopJsScrollActive()) return;
        const now = performance.now().toFixed(2);
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');

        if (isInputFocused && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            console.log(`%c[${now}ms] handleKeyDown: Ignoring arrow key in input field.`, 'color: #666;');
            return;
        }

        if (isAnimating) {
            console.log(`%c[${now}ms] handleKeyDown: Ignoring key press (${event.key}) during animation.`, 'color: orange;');
            return;
        }

        let direction = 0;
        if (event.key === 'ArrowDown') direction = 1;
        else if (event.key === 'ArrowUp') direction = -1;
        else { return; } // Only handle Arrow keys

        const currentIndex = getCurrentSectionIndex();
        let targetIndex = currentIndex + direction;
        targetIndex = Math.max(0, Math.min(targetIndex, allNavTargets.length - 1));

         console.log(`%c[${now}ms] handleKeyDown: Key=${event.key}, Current Index: ${currentIndex}, Target Index: ${targetIndex}`, 'color: #666;');

        if (targetIndex !== currentIndex) {
            event.preventDefault();
            const targetSection = allNavTargets[targetIndex];
            if (targetSection && targetSection.id) {
                const targetScrollY = calculateConsistentTargetY(targetSection);
                 console.log(`%c[${now}ms] handleKeyDown: Animating to Section: ${targetSection.id} (Y: ${targetScrollY.toFixed(0)})`, 'color: #666; font-weight: bold;');
                animateScroll(scrollSnapContainer, sectionScrollDuration, { scrollTo: { y: targetScrollY }, ease: sectionScrollEase });
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
        console.log(`%c[${performance.now().toFixed(2)}ms] setupScrollListeners: Setting up for ${currentScrollTarget === window ? 'window' : 'container'}`, 'color: teal');
        // Remove potentially old listeners first
        window.removeEventListener('scroll', debouncedNavHandler);
        window.removeEventListener('scroll', debouncedScrollToTopHandler);
        window.removeEventListener('keydown', handleKeyDown);
        scrollSnapContainer?.removeEventListener('scroll', debouncedNavHandler);
        scrollSnapContainer?.removeEventListener('scroll', debouncedScrollToTopHandler);
        scrollSnapContainer?.removeEventListener('wheel', handleWheel);
        // Add appropriate listeners
        if (currentScrollTarget === window) {
            console.log(`%c[${performance.now().toFixed(2)}ms] setupScrollListeners: Adding listeners to window`, 'color: teal');
            window.addEventListener('scroll', debouncedNavHandler, { passive: true });
            window.addEventListener('scroll', debouncedScrollToTopHandler, { passive: true });
            // Keyboard listener might still be useful globally, but wheel is not needed
             window.addEventListener('keydown', handleKeyDown);
        } else {
             console.log(`%c[${performance.now().toFixed(2)}ms] setupScrollListeners: Adding listeners to scrollSnapContainer & window(keydown)`, 'color: teal');
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
         console.log(`%c[${performance.now().toFixed(2)}ms] Window resized. Re-running setupScrollListeners.`, 'color: orange;');
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