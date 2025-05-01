/**
 * Main JavaScript for Keys by Caleb Website (V53 - MODIFIED v3 for Mobile Nav Highlight)
 * Handles scroll-to-top, active nav highlighting (desktop & scrollable mobile bottom nav),
 * GSAP smooth scroll (links), contact form (default HTML handling),
 * tsParticles hero animation (Float Effect), footer copyright year.
 * Implements JS-driven section scrolling ONLY for Keyboard and Link Clicks on desktop index page.
 * Desktop header nav is preserved, mobile uses scrollable bottom nav.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Log script initialization with version
    // *** MODIFIED: Updated log message ***
    console.log("Keys by Caleb NEW JS Initialized (V53 - MODIFIED v3 for Mobile Nav Highlight).");

    // --- GSAP Plugin Registration ---
    // Ensure GSAP and ScrollToPlugin are loaded before registering
    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
        gsap.registerPlugin(ScrollToPlugin);
        console.log("GSAP ScrollToPlugin registered.");
    } else {
        console.error("GSAP or ScrollToPlugin not loaded! Smooth scroll will not work.");
    }


    // --- State Variables ---
    let isAnimating = false; // Flag to prevent concurrent scroll animations for keyboard/links

    // --- Configuration ---
    const sectionScrollDuration = 0.7; // Duration of the section scroll animation (Keyboard/Links)
    const sectionScrollEase = 'power2.inOut'; // Easing function for section scroll (Keyboard/Links)
    const linkScrollDuration = 1.0; // Duration for link click scroll animation
    const linkScrollEase = 'power2.inOut'; // Ease for link clicks
    const headerOffsetFactor = 0.05; // Adjusts scroll target position relative to header height

    // --- Cache Elements ---
    // Store frequently accessed DOM elements for performance
    const header = document.getElementById('main-header');
    const scrollToTopButton = document.getElementById('scroll-to-top'); // Scroll button for index
    // *** MODIFIED: Include mobile nav items in internal links selector ***
    const internalLinks = document.querySelectorAll('a.internal-link[href^="#"], a.nav-link[href^="#"]:not([href="#"]), a.header-logo[href^="#"], #mobile-bottom-nav a.mobile-nav-item[href^="#"]');
    // *** MODIFIED: Target specific desktop links for desktop highlighting ***
    const desktopNavLinks = document.querySelectorAll('#desktop-nav-elements a.nav-link:not(.booking-nav-link):not(.follow-button):not([title="Email Me"])');
    // *** ADDED: Cache mobile nav items ***
    const mobileNavItems = document.querySelectorAll('#mobile-bottom-nav .mobile-nav-item');
    const bookingNavLink = document.querySelector('#main-header nav .booking-nav-link'); // Kept original V53 selector
    const contactForm = document.getElementById('contact-form'); // Contact form on index
    const contactFormMessage = contactForm?.querySelector('#form-message');
    const contactSubmitButton = contactForm?.querySelector('#submit-button');
    const scrollSnapContainer = document.querySelector('.scroll-snap-container-home'); // Desktop scroll container - MIGHT BE NULL
    // Adjust section selector based on whether the container exists
    const mainSections = Array.from(document.querySelectorAll(scrollSnapContainer ? '.scroll-snap-container-home > main > section[id]' : 'main > section[id]'));
    const footerElement = document.getElementById('main-footer');
    // Combine main sections and footer into a single array for navigation targets
    const allNavTargets = [...mainSections, ...(footerElement ? [footerElement] : [])].filter(el => el.id);
    const currentYearSpan = document.getElementById('current-year'); // Footer year
    const dateField = contactForm?.querySelector('#contact_event_date'); // Contact form date field
    const particleContainerId = 'tsparticles-hero'; // ID for particle animation container


    // --- Helper Functions ---
    // Debounce function to limit the rate at which a function can fire
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    // *** MODIFIED: Get header height based on screen size ***
    const getHeaderHeight = () => {
        return window.innerWidth < 1024 ? 60 : 70; // 60px mobile, 70px desktop
    };
    // Check if desktop JS-driven scrolling should be active (REQUIRES the container)
    const isDesktopJsScrollActive = () => window.innerWidth >= 1024 && scrollSnapContainer;
    // Determine the scroll target (window or the container) based on screen size AND container presence
    const getScrollTarget = () => isDesktopJsScrollActive() ? scrollSnapContainer : window;
    // Scrolls an element into view if it's outside the viewport, considering the header
    const scrollIntoViewIfNeeded = (element) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const headerHeight = getHeaderHeight();
        const isAbove = rect.top < headerHeight + 10; // Check if top is above header
        const isBelow = rect.bottom > window.innerHeight - 10; // Check if bottom is below viewport
        if (isAbove || isBelow) {
            // Use window.scrollY because this function is likely for forms, not the main container scroll
            const elementTopRelativeToDocument = window.pageYOffset + rect.top;
            const targetScrollY = elementTopRelativeToDocument - headerHeight - 30; // Target position with offset
            window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
        }
     };


    // --- tsParticles Initialization --- (Includes Float Effect Config)
    // Initializes the particle animation in the hero section if the library is loaded and container exists
    const initParticles = () => {
        const particleContainer = document.getElementById(particleContainerId);
        if (typeof tsParticles === 'undefined' || !particleContainer) {
            if (!particleContainer) console.log("Particle container not found, skipping init.");
            else console.warn("tsParticles library not loaded.");
            return;
        }

        console.log("Initializing tsParticles for hero free float effect...");
        tsParticles.load(particleContainerId, {
            fullScreen: { enable: false }, // Don't cover the whole screen
            background: { color: { value: "transparent" } },
            particles: {
                number: { value: 60, density: { enable: true, area: 800 } }, // Particle density
                color: { value: "#ffffff" }, // Particle color
                shape: { type: "circle" }, // Particle shape
                opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 0.8, minimumValue: 0.1, sync: false } }, // Fading opacity
                size: { value: { min: 1, max: 3 } }, // Particle size range
                links: { enable: false }, // No lines connecting particles
                move: {
                    enable: true, speed: 1, direction: "none", // Movement speed and direction
                    random: true, straight: false, outModes: { default: "bounce" }, // Random movement, bounce off edges
                    attract: { enable: false }, trail: { enable: false }
                }
            },
            interactivity: {
                detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true, } // No interaction on hover/click
            },
            detectRetina: true, // Adjust for high-DPI screens
        }).then(c => console.log("tsParticles loaded.")).catch(e => console.error("tsParticles load error:", e));
     };

    // --- Event Logic ---

    // Shows/hides the scroll-to-top button based on scroll position
    const handleScrollToTopVisibility = () => {
        const scrollTarget = getScrollTarget();
        // Use pageYOffset for window, scrollTop for container
        const scrollY = (scrollTarget === window) ? window.pageYOffset : scrollTarget.scrollTop;
        if (!scrollToTopButton) return; // Only proceed if the button exists on this page

        if (scrollY > 300) { // Show button if scrolled down > 300px
            scrollToTopButton.classList.remove('hidden');
            requestAnimationFrame(() => { // Ensure visibility transition works
                scrollToTopButton.classList.add('visible');
            });
        } else { // Hide button if near the top
            if (scrollToTopButton.classList.contains('visible')) {
                scrollToTopButton.classList.remove('visible');
                // Add a delay before adding 'hidden' to allow fade-out transition
                setTimeout(() => {
                    const currentScrollYCheck = (scrollTarget === window) ? window.pageYOffset : scrollTarget.scrollTop;
                    if (currentScrollYCheck <= 300 && !scrollToTopButton.classList.contains('visible')) {
                        scrollToTopButton.classList.add('hidden');
                    }
                }, 300); // Match transition duration
            } else if (!scrollToTopButton.classList.contains('hidden')) {
                 // Ensure it's hidden initially or if scrolled up quickly
                scrollToTopButton.classList.add('hidden');
            }
        }
     };

    // Animate scroll with GSAP (Wrapper function used by programmatic scrolls like keyboard/links)
    // Handles the actual scrolling animation and manages the isAnimating flag
    // *** MODIFIED: Calls handleActiveNav onComplete/onInterrupt ***
    const animateScroll = (target, duration, params) => {
        const ease = params.ease || sectionScrollEase; // Use provided ease or default
        // console.log(`AnimateScroll START - Y: ${params?.scrollTo?.y?.toFixed(0)}, Ease: ${ease}`);
        if (isAnimating) {
             // console.warn("AnimateScroll BLOCKED - already animating.");
             return; // Prevent starting a new animation if one is running
        }
        isAnimating = true; // Set animating flag immediately

        // Temporarily remove key listener during animation to prevent interference
        // Only remove if desktop JS scroll is active (where key listener is added)
        if (isDesktopJsScrollActive()) {
             window.removeEventListener('keydown', handleKeyDown);
        }

        // GSAP animation
        gsap.to(target, {
            duration: duration,
            scrollTo: params.scrollTo, // Scroll target position
            ease: ease,
            overwrite: 'auto', // Automatically handle conflicting animations
            onComplete: () => { // When animation finishes
                // console.log("AnimateScroll COMPLETE.");
                isAnimating = false; // Reset animation flag
                // Re-attach key listener after animation completes
                 if (isDesktopJsScrollActive()) {
                     window.addEventListener('keydown', handleKeyDown);
                 }
                handleActiveNav(); // Update nav after animation completes
                params.onComplete?.(); // Call any provided callback
            },
            onInterrupt: () => { // If animation is interrupted (e.g., by user scroll)
                // console.error(">>> GSAP AnimateScroll INTERRUPTED.");
                 isAnimating = false; // Reset animation flag immediately
                 // Re-attach key listener immediately on interrupt
                 if (isDesktopJsScrollActive()) {
                     window.addEventListener('keydown', handleKeyDown);
                 }
                 handleActiveNav(); // Update nav immediately on interrupt
                params.onInterrupt?.(); // Call any provided callback
            }
        });
    };

     // Helper to calculate the consistent target Y position for a section, accounting for header
     // Only relevant for desktop container scrolling
     const calculateConsistentTargetY = (targetElement) => {
         if (!targetElement || !scrollSnapContainer) return 0; // Need container for offsetTop
         if (targetElement.id === 'hero') return 0; // Hero section is always at the top
         const headerHeight = getHeaderHeight(); // Use dynamic height
         // Calculate target position slightly above the element's top relative to the container
         let targetScrollY = targetElement.offsetTop - (headerHeight * headerOffsetFactor);
         return Math.max(0, targetScrollY); // Ensure target isn't negative
     };

     // Helper to find the index of the section currently considered 'active' based on scroll position
     // This needs to work for BOTH window and container scrolling for nav highlighting
     const getCurrentSectionIndex = () => {
        const scrollTarget = getScrollTarget();
        const scrollPosition = (scrollTarget === window) ? window.pageYOffset : scrollTarget.scrollTop;
        const viewportHeight = (scrollTarget === window) ? window.innerHeight : scrollTarget.clientHeight;
        const scrollHeight = (scrollTarget === window) ? document.body.scrollHeight : scrollTarget.scrollHeight;
        const headerHeight = getHeaderHeight(); // Use dynamic height

        let bestMatchIndex = 0; // Default to hero

        // Iterate through sections to find the one currently in view
        for (let i = allNavTargets.length - 1; i >= 0; i--) {
            const section = allNavTargets[i];
            let sectionTop;
            const activationOffset = headerHeight * 0.6; // Activate when section is about 60% down the header

            if (isDesktopJsScrollActive()) {
                sectionTop = section.offsetTop - activationOffset;
            } else {
                 sectionTop = section.offsetTop - activationOffset;
            }

            // If the scroll position is below the activation point of this section, it's the active one (or further down)
            if (scrollPosition >= sectionTop) {
                bestMatchIndex = i;
                break; // Found the highest section that meets the criteria
            }
        }
        // Check edge case: scrolled very close to the bottom
        if (scrollPosition + viewportHeight >= scrollHeight - 50) {
            if (allNavTargets.length > 0) {
                 bestMatchIndex = allNavTargets.length - 1; // Force last section active
            }
        }
        // Top edge case (being near top) is handled by the loop default/logic implicitly

        return bestMatchIndex;
     };


    // GSAP Smooth Scrolling for Internal Links (e.g., nav links, buttons, mobile nav)
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Check if it's an internal hash link
            if (href && href.startsWith('#') && href.length > 1) {
                 const targetId = href.substring(1);
                 const targetElement = document.getElementById(targetId);
                 if (!targetElement) { console.warn(`Target element not found for ID: ${targetId}`); return; }

                 e.preventDefault(); // Prevent default jump link behavior
                 const scrollTarget = getScrollTarget(); // Get window or container
                 const desktopScroll = isDesktopJsScrollActive();

                 // Calculate target Y position differently for desktop container vs window scroll
                 let targetScrollY;
                 if (desktopScroll) {
                     targetScrollY = calculateConsistentTargetY(targetElement);
                 } else {
                     // Calculate offset relative to the document for window scrolling
                     const elementRect = targetElement.getBoundingClientRect();
                     const absoluteElementTop = elementRect.top + window.pageYOffset;
                     // Adjust offset to land slightly below the mobile header
                     targetScrollY = Math.max(0, absoluteElementTop - getHeaderHeight() - 10);
                 }

                 // Use the animateScroll wrapper with specific link settings
                 animateScroll(scrollTarget, linkScrollDuration, { scrollTo: { y: targetScrollY }, ease: linkScrollEase });
             }
        });
    });


    // Scroll-to-Top Button Click (Uses animateScroll wrapper)
    // Only add listener if the button actually exists on this page
    if (scrollToTopButton) {
        scrollToTopButton.addEventListener('click', () => {
            const scrollTarget = getScrollTarget();
            // Use link animation settings for scroll-to-top
            animateScroll(scrollTarget, linkScrollDuration, { scrollTo: 0, ease: linkScrollEase });
         });
    }


    // *** MODIFIED: Active Navigation Link Highlighting (Desktop Header + Mobile Bottom Nav) ***
    const handleActiveNav = () => {
        const currentSectionIndex = getCurrentSectionIndex();
        let currentSectionId = allNavTargets[currentSectionIndex]?.id || 'hero';
        if (currentSectionId === 'main-footer') { currentSectionId = 'contact'; } // Map footer to contact

        // Update desktop header links (uses `desktopNavLinks` selector)
        desktopNavLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            // Ensure it's an internal link before checking ID
            if (linkHref && linkHref.startsWith('#') && linkHref === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });

        // Update mobile bottom nav items
        mobileNavItems.forEach(item => {
            item.classList.remove('active');
            const itemHref = item.getAttribute('href');
            // Highlight based on matching internal section ID
            if (itemHref && itemHref.startsWith('#') && itemHref === `#${currentSectionId}`) {
                item.classList.add('active');
            }
            // Highlight 'Booking' or 'Partners' based on current page URL if not an internal link
            else if (itemHref && !itemHref.startsWith('#')) {
                const isBookingPage = window.location.pathname.includes('booking-');
                const isVendorPage = window.location.pathname.includes('vendor-');
                if (itemHref.includes('booking-') && isBookingPage) {
                    item.classList.add('active');
                } else if (itemHref.includes('vendor-') && isVendorPage) {
                     item.classList.add('active');
                }
            }
        });
        // console.log(`Active section: ${currentSectionId}`); // For debugging
     };


    // --- JS Keyboard Navigation Logic --- (Wheel logic removed)

    // Handles keyboard navigation (ArrowUp/ArrowDown) - Snaps to sections ONLY ON DESKTOP VIEW
    const handleKeyDown = (event) => {
        // Only run if desktop scrolling is active (container exists) and not currently animating
        if (!isDesktopJsScrollActive() || isAnimating) {
            return;
        }
        const activeElement = document.activeElement;
        // Ignore arrow keys if focus is within a form input/textarea/select
        const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');

        if (isInputFocused && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            return; // Allow default arrow key behavior in form fields
        }

        let direction = 0;
        if (event.key === 'ArrowDown') direction = 1; // Down arrow means scroll down
        else if (event.key === 'ArrowUp') direction = -1; // Up arrow means scroll up
        else { return; } // Ignore other keys

        event.preventDefault(); // Prevent default page scroll from arrow keys ONLY when hijacking

        const currentIndex = getCurrentSectionIndex();
        let targetIndex = currentIndex + direction;
        // Clamp target index within bounds
        targetIndex = Math.max(0, Math.min(targetIndex, allNavTargets.length - 1));

        // Only animate if the target section is different
        if (targetIndex !== currentIndex) {
            const targetSection = allNavTargets[targetIndex];
            if (targetSection && targetSection.id) {
                const targetScrollY = calculateConsistentTargetY(targetSection);
                // Use animateScroll for keyboard navigation to snap (targets the container)
                animateScroll(scrollSnapContainer, sectionScrollDuration, { scrollTo: { y: targetScrollY } });
            }
        }
    };


    // --- Contact Form Validation & Submission --- (Default handling)
    // Only add listeners if the contact form exists on this page
    if (contactForm) {
        const validateContactField = (field) => {
             let isValid = true;
             const errorElement = contactForm.querySelector(`.error-message[data-for="${field.name}"]`);
             const value = field.value.trim();
             field.classList.remove('input-error'); // Clear previous error state
             if (errorElement) errorElement.style.display = 'none'; // Hide error message

             if (field.required && !value) { // Check required fields
                 isValid = false;
             } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { // Check email format
                 isValid = false;
                 if(errorElement) errorElement.textContent = "A valid email is required.";
             } else if (field.type === 'date' && value) { // Check if date is valid and not in the past
                 try {
                     const d = new Date(value + 'T00:00:00'), t = new Date();
                     t.setHours(0,0,0,0); // Set time to midnight for comparison
                     if (isNaN(d.getTime()) || d < t) isValid = false;
                     if(errorElement && !isValid) errorElement.textContent = "Date must be today or later";
                 } catch {
                     isValid = false;
                     if(errorElement) errorElement.textContent = "Invalid date";
                 }
             }

             // Show error message and style if field is invalid
             if (!isValid && errorElement) {
                 if(!errorElement.textContent || errorElement.textContent === "Date must be today or later" || errorElement.textContent === "A valid email is required.") {
                     // Use default "Required" unless a specific message was set
                     if (!errorElement.textContent) errorElement.textContent = "Required";
                 } else {
                     errorElement.textContent = "Required"; // Fallback required message
                 }
                 errorElement.style.display = 'block';
                 field.classList.add('input-error');
             }
             return isValid;
          };
        // Add submit listener to the contact form
        contactForm.addEventListener('submit', (e) => {
            console.log("Contact form submit triggered (Default Handling).");
            let isFormValid = true;
            const formMsgElement = contactForm.querySelector('#form-message');
            if (formMsgElement) formMsgElement.classList.add('hidden'); // Hide general message area

            // Validate all required fields
            contactForm.querySelectorAll('[required]').forEach(field => {
                if (!validateContactField(field)) {
                    isFormValid = false;
                }
            });

            if (!isFormValid) {
                console.log("Contact form validation failed. Preventing default submission.");
                e.preventDefault(); // Stop form submission if invalid
                alert("Please fill out all required fields correctly."); // Simple alert for user
                const firstError = contactForm.querySelector('.input-error');
                firstError?.focus(); // Focus the first invalid field
                scrollIntoViewIfNeeded(firstError?.closest('.input-group') || firstError); // Scroll error into view
            } else {
                // Allow default form submission (handled by Netlify)
                console.log("Contact form valid. Allowing default HTML/Netlify submission.");
                const submitBtn = contactForm.querySelector('#submit-button');
                if(submitBtn) submitBtn.disabled = true; // Disable button to prevent double submit
            }
         });
         // Add blur listener for real-time validation feedback after user leaves a field
         contactForm.querySelectorAll('input[required], textarea[required]').forEach(field => {
             field.addEventListener('blur', () => validateContactField(field));
         });

         // Set the minimum date for the contact form date input to today
        if (dateField) {
            try {
                const today = new Date();
                const year = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                const dd = String(today.getDate()).padStart(2, '0');
                dateField.min = `${year}-${mm}-${dd}`; // Set min attribute in<x_bin_880>-MM-DD format
            } catch (e) {
                console.error("Error setting min date for contact form:", e);
            }
         }
    } // End if(contactForm)


    // --- Footer Year ---
    // Set the current year in the footer
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }


    // --- Gallery Video Autoplay Logic (No JS needed) ---
    // Hover logic removed


    // --- Initial Calls & Event Listeners Setup ---
    initParticles(); // Initialize hero particles (will only run if container exists)

    // Debounced handlers for scroll events to improve performance
    const debouncedNavHandler = debounce(handleActiveNav, 50);
    const debouncedScrollToTopHandler = debounce(handleScrollToTopVisibility, 50);

    // Function to set up appropriate scroll listeners based on screen size
    const setupScrollListeners = () => {
        const currentScrollTarget = getScrollTarget(); // Determine if scrolling window or container
        const isDesktop = isDesktopJsScrollActive(); // Check if desktop container exists

        // Remove potentially old listeners first to avoid duplicates
        window.removeEventListener('scroll', debouncedNavHandler);
        window.removeEventListener('scroll', debouncedScrollToTopHandler);
        window.removeEventListener('keydown', handleKeyDown); // Remove global key listener initially
        scrollSnapContainer?.removeEventListener('scroll', debouncedNavHandler);
        scrollSnapContainer?.removeEventListener('scroll', debouncedScrollToTopHandler);
        // REMOVED: scrollSnapContainer?.removeEventListener('wheel', handleWheel);

        // Add appropriate listeners based on the scroll target
        if (isDesktop) { // Desktop view (scrolling container)
            // Listen for regular scroll events on the container for nav/button updates
            scrollSnapContainer.addEventListener('scroll', debouncedNavHandler, { passive: true });
            scrollSnapContainer.addEventListener('scroll', debouncedScrollToTopHandler, { passive: true });
            // Add keyboard listener ONLY for desktop container view
            window.addEventListener('keydown', handleKeyDown);
            console.log("Scroll listeners configured for: container (Desktop) - Key listener ACTIVE.");
        } else { // Mobile/Tablet view (scrolling window)
            window.addEventListener('scroll', debouncedNavHandler, { passive: true });
            window.addEventListener('scroll', debouncedScrollToTopHandler, { passive: true });
            // DO NOT add keyboard listener for mobile/tablet
             console.log("Scroll listeners configured for: window (Mobile/Tablet) - Key listener INACTIVE.");
        }
    };

    // Initial setup
    setupScrollListeners(); // Set up listeners on page load
    handleScrollToTopVisibility(); // Check initial visibility of scroll-to-top button
    setTimeout(handleActiveNav, 150); // Check initial active nav link shortly after load

    // Re-setup listeners on window resize to handle switch between desktop/mobile views
    window.addEventListener('resize', debounce(() => {
         console.log("Window resized, re-evaluating scroll listeners.");
         setupScrollListeners(); // Re-run setup to attach/detach listeners correctly
         handleActiveNav(); // Update nav state immediately after resize
         handleScrollToTopVisibility(); // Update button visibility
     }, 250)); // Debounce resize handler

    // Attach click listener to scroll-to-top button (already cached)
    // No changes needed here, it uses getScrollTarget()

}); // End DOMContentLoaded