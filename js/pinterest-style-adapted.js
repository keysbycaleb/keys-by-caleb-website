/**
 * JavaScript for Keys by Caleb Pinterest-Style Layout (V1.33 - Added Header/Footer Particles)
 * Handles:
 * - tsParticles initialization for Hero, Testimonials, Header, and Footer sections.
 * - Intersection Observer entrance animations.
 * - Enhanced keyboard scroll navigation (Arrow Keys) for desktop.
 * - Dynamic hero text (Keyframe animation).
 * - Multiple carousels (drag+button) (Gallery excluded).
 * - Scroll-to-top button.
 * - Mobile viewport adjustments.
 * - Mobile bottom nav interaction/highlighting.
 * - Simple contact form submission.
 * - Mobile menu toggle.
 * - Multi-level header dropdown click toggle (Vertical L3, Animated).
 * - Footer icon flash effect on scroll-to-footer.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb - Adapted Pinterest Style JS Initialized (V1.33 - Header/Footer Particles)");

    // --- Configuration ---
    const HERO_TEXT_INTERVAL = 3500;
    const FADE_OUT_DURATION = 400;
    const FADE_IN_DURATION = 400;
    const TEXT_CHANGE_DELAY = 300;
    const PARTICLE_HERO_ID = 'tsparticles-hero';
    const PARTICLE_TESTIMONIALS_ID = 'tsparticles-testimonials';
    const PARTICLE_HEADER_ID = 'tsparticles-header'; // New
    const PARTICLE_FOOTER_ID = 'tsparticles-footer'; // New
    const SCROLL_DEBOUNCE_MS = 50;
    const MOBILE_BREAKPOINT = 1024;
    const KEYBOARD_SCROLL_TIMEOUT_DURATION = 700;
    const FOOTER_SCROLL_DURATION_ESTIMATE = 700;
    const FOOTER_FLASH_ANIMATION_DURATION = 1000;

    // --- Element Cache ---
    const scrollContainer = document.getElementById('scroll-container');
    const dynamicTextElement = document.querySelector('.dynamic-idea');
    const scrollToTopButton = document.getElementById('scroll-to-top');
    const currentYearSpan = document.getElementById('current-year');
    const header = document.getElementById('main-header');
    const scrollArrow = document.querySelector('.scroll-arrow');
    const mobileBottomNav = document.getElementById('mobile-bottom-nav');
    const mobileNavItems = mobileBottomNav ? mobileBottomNav.querySelectorAll('.mobile-nav-item') : [];
    const allSections = scrollContainer ? Array.from(scrollContainer.querySelectorAll(':scope > .scroll-section, :scope > footer.scroll-section')) : [];
    const animatedElements = document.querySelectorAll('[data-animate]');
    const simpleContactForm = document.getElementById('contact-form-simple');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const desktopNavElements = document.getElementById('desktop-nav-elements');
    const moreDropdownTrigger = document.querySelector('.more-dropdown-trigger');
    const moreDropdownContainer = document.querySelector('.nav-item-dropdown.more-nav-item');
    const submenuExpandButtons = document.querySelectorAll('.submenu-expand-button');

    // Particle Containers
    const heroParticleContainer = document.getElementById(PARTICLE_HERO_ID);
    const testimonialsParticleContainer = document.getElementById(PARTICLE_TESTIMONIALS_ID);
    const headerParticleContainer = document.getElementById(PARTICLE_HEADER_ID); // New
    const footerParticleContainer = document.getElementById(PARTICLE_FOOTER_ID); // New


    // --- State ---
    let isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    let isKeyboardScrolling = false;
    let currentIdeaIndex = 0;
    const ideas = [ 'Elegant Wedding Music', 'Sophisticated Soundtracks', 'Live Piano Ambiance', 'Creating Lasting Memories', 'Riverside\'s Premier Pianist', 'Expert Keyboard Artistry' ];

    // --- Helper Functions ---
    const getHeaderHeight = () => header?.offsetHeight || 70;
    const debounce = (func, wait) => { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func.apply(this, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; };
    const getScrollTarget = () => !isMobile && scrollContainer ? scrollContainer : window;

    // --- tsParticles Initialization ---
    const initParticles = () => {
        if (typeof tsParticles === 'undefined') {
            console.error("tsParticles library not loaded.");
            return;
        }

        const heroParticlesConfig = {
            particles: { number: { value: 50, density: { enable: true, value_area: 800 } }, color: { value: "#FFF8DC" }, shape: { type: "circle" }, opacity: { value: 0.9, random: true, anim: { enable: false } }, size: { value: { min: 1, max: 3 }, random: true, anim: { enable: false } }, links: { enable: false }, move: { enable: true, speed: 1.5, direction: "none", random: true, straight: true, out_mode: "out", bounce: false, attract: { enable: false } } }, interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }, }, detectRetina: true, fullScreen: { enable: false }, smooth: true
        };
        const testimonialsParticlesConfig = {
             particles: { number: { value: 20, density: { enable: true, value_area: 900 } }, color: { value: "#FFF8DC" }, shape: { type: "circle" }, opacity: { value: 0.4, random: true, anim: { enable: false } }, size: { value: { min: 1.5, max: 4 }, random: true, anim: { enable: false } }, links: { enable: false }, move: { enable: true, speed: 1.5, direction: "none", random: true, straight: true, out_mode: "out", bounce: false, attract: { enable: false } } }, interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }, }, detectRetina: true, fullScreen: { enable: false }, smooth: true
        };

        // New Config for Header & Footer (Subtle) - Now with updated speed
        const headerFooterParticlesConfig = {
            particles: {
                number: { value: 20 }, // Fewer particles for smaller areas
                color: { value: "#FFF8DC" }, // Soft Ivory, same as hero for consistency on dark bg
                shape: { type: "circle" },
                opacity: { value: 0.25, random: true, anim: { enable: false, speed: 0.1, opacity_min: 0.9, sync: false } },
                size: { value: {min: 0.5, max: 1.5}, random: true, anim: { enable: false } },
                links: { enable: false },
                move: {
                    enable: true,
                    speed: 1.5, // Updated speed
                    direction: "none",
                    random: true,
                    straight: true,
                    out_mode: "out",
                    bounce: false,
                    attract: { enable: false }
                }
            },
            interactivity: {
                detect_on: "canvas", // or "window" if preferred
                events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
            },
            detectRetina: true,
            fullScreen: { enable: false }, // CRITICAL: Must be false for container-bound particles
            smooth: true
        };


        if (heroParticleContainer) {
            tsParticles.load({ id: PARTICLE_HERO_ID, options: heroParticlesConfig })
                .then(container => { console.log(`tsParticles loaded for #${PARTICLE_HERO_ID}`); })
                .catch(error => { console.error(`Error loading tsParticles for #${PARTICLE_HERO_ID}:`, error); });
        }
        if (testimonialsParticleContainer) {
            tsParticles.load({ id: PARTICLE_TESTIMONIALS_ID, options: testimonialsParticlesConfig })
                 .then(container => { console.log(`tsParticles loaded for #${PARTICLE_TESTIMONIALS_ID}`); })
                 .catch(error => { console.error(`Error loading tsParticles for #${PARTICLE_TESTIMONIALS_ID}:`, error); });
        }
        // Load for Header
        if (headerParticleContainer) {
            tsParticles.load({ id: PARTICLE_HEADER_ID, options: headerFooterParticlesConfig })
                .then(container => { console.log(`tsParticles loaded for #${PARTICLE_HEADER_ID}`); })
                .catch(error => { console.error(`Error loading tsParticles for #${PARTICLE_HEADER_ID}:`, error); });
        } else {
            console.log(`#${PARTICLE_HEADER_ID} container not found, skipping particles.`);
        }
        // Load for Footer
        if (footerParticleContainer) {
            tsParticles.load({ id: PARTICLE_FOOTER_ID, options: headerFooterParticlesConfig }) // Re-use same config
                .then(container => { console.log(`tsParticles loaded for #${PARTICLE_FOOTER_ID}`); })
                .catch(error => { console.error(`Error loading tsParticles for #${PARTICLE_FOOTER_ID}:`, error); });
        } else {
            console.log(`#${PARTICLE_FOOTER_ID} container not found, skipping particles.`);
        }
     };

    // --- Dynamic Hero Text ---
    function onAnimationEnd() { if (dynamicTextElement) dynamicTextElement.classList.remove('is-animating'); }
    function updateDynamicText() { if (!dynamicTextElement || dynamicTextElement.classList.contains('is-animating')) return; dynamicTextElement.classList.add('is-animating'); dynamicTextElement.style.animation = `fadeOutUp ${FADE_OUT_DURATION / 1000}s ease-out forwards`; setTimeout(() => { if (!dynamicTextElement) { if (dynamicTextElement) dynamicTextElement.classList.remove('is-animating'); return; } currentIdeaIndex = (currentIdeaIndex + 1) % ideas.length; dynamicTextElement.textContent = ideas[currentIdeaIndex]; dynamicTextElement.style.animation = `fadeInDown ${FADE_IN_DURATION / 1000}s ease-out forwards`; dynamicTextElement.removeEventListener('animationend', onAnimationEnd); dynamicTextElement.addEventListener('animationend', onAnimationEnd, { once: true }); }, TEXT_CHANGE_DELAY); }
    if (dynamicTextElement) { const initialText = dynamicTextElement.textContent.trim(); const initialIndex = ideas.indexOf(initialText); if (initialIndex !== -1) currentIdeaIndex = initialIndex; else currentIdeaIndex = 0; dynamicTextElement.textContent = ideas[currentIdeaIndex]; setInterval(updateDynamicText, HERO_TEXT_INTERVAL); } else { console.warn("Dynamic text element (.dynamic-idea) not found."); }

    // --- Intersection Observer ---
    if (animatedElements.length > 0 && 'IntersectionObserver' in window) { const observerOptions = { root: null, rootMargin: '0px', threshold: 0.2 }; const intersectionCallback = (entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('active'); observer.unobserve(entry.target); } }); }; const observer = new IntersectionObserver(intersectionCallback, observerOptions); animatedElements.forEach(element => observer.observe(element)); console.log("IntersectionObserver initialized."); } else { animatedElements.forEach(el => el.classList.add('active')); if (!('IntersectionObserver' in window)) console.warn("IntersectionObserver not supported."); }

    // --- Universal Carousel Initialization ---
    function initCarousel(containerSelector) { const carouselContainer = document.querySelector(containerSelector); if (!carouselContainer || containerSelector === '#gallery-container') { if (containerSelector === '#gallery-container') console.log("Skipping carousel init for #gallery-container."); return; } const trackId = containerSelector === '#services-carousel' ? 'services-carousel-track' : containerSelector === '#testimonials-carousel' ? 'testimonials-carousel-track' : null; if (!trackId) { console.warn(`Could not determine track ID for carousel: ${containerSelector}`); return; } const track = document.getElementById(trackId); const items = track ? Array.from(track.children) : []; const nextButton = carouselContainer.querySelector('.next-btn'); const prevButton = carouselContainer.querySelector('.prev-btn'); if (!track || items.length === 0 || !nextButton || !prevButton) { console.warn(`Required elements missing or no items in carousel: ${containerSelector}`); if(prevButton) prevButton.style.display = 'none'; if(nextButton) nextButton.style.display = 'none'; return; } let scrollStep = 0; const calculateMetricsAndStep = () => { if (items.length === 0 || !items[0].offsetWidth) return 0; const itemWidth = items[0].offsetWidth; const trackStyle = window.getComputedStyle(track); const gridGap = parseFloat(trackStyle.gap) || 24; scrollStep = itemWidth + gridGap; }; const updateButtons = debounce(() => { if (!track || !prevButton || !nextButton) return; const tolerance = 10; const currentScrollLeft = Math.round(track.scrollLeft); const maxScrollLeft = Math.round(track.scrollWidth - track.clientWidth); prevButton.disabled = currentScrollLeft <= tolerance; nextButton.disabled = currentScrollLeft >= maxScrollLeft - tolerance; }, 50); nextButton.addEventListener('click', () => { if (track && scrollStep) track.scrollBy({ left: scrollStep, behavior: 'smooth' }); }); prevButton.addEventListener('click', () => { if (track && scrollStep) track.scrollBy({ left: -scrollStep, behavior: 'smooth' }); }); let isDown = false, startX, scrollLeftStart, dragMoved = false; track.addEventListener('mousedown', (e) => { if (e.target.closest('a.testimonial-read-more, button, a.btn')) return; isDown = true; dragMoved = false; track.classList.add('grabbing'); startX = e.pageX - track.offsetLeft; scrollLeftStart = track.scrollLeft; track.style.scrollBehavior = 'auto'; track.style.scrollSnapType = 'none'; }); track.addEventListener('mouseleave', () => { if (!isDown) return; isDown = false; track.classList.remove('grabbing'); track.style.scrollBehavior = 'smooth'; track.style.scrollSnapType = 'x mandatory'; setTimeout(updateButtons, 200); }); track.addEventListener('mouseup', (e) => { if (!isDown) return; isDown = false; track.classList.remove('grabbing'); track.style.scrollBehavior = 'smooth'; track.style.scrollSnapType = 'x mandatory'; if (dragMoved) setTimeout(updateButtons, 200); }); track.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - track.offsetLeft; const walk = x - startX; if (Math.abs(walk) > 5) dragMoved = true; track.scrollLeft = scrollLeftStart - walk * 1.5; }); track.addEventListener('click', (e) => { const link = e.target.closest('a.testimonial-read-more'); if (link && dragMoved) { e.preventDefault(); e.stopPropagation(); console.log("Link navigation prevented due to drag."); } dragMoved = false; }, true); let scrollEndTimer; track.addEventListener('scroll', () => { clearTimeout(scrollEndTimer); scrollEndTimer = setTimeout(updateButtons, 150); }, { passive: true }); calculateMetricsAndStep(); updateButtons(); window.addEventListener('resize', debounce(() => { calculateMetricsAndStep(); updateButtons(); }, 250)); console.log(`Carousel initialized for: ${containerSelector}`); }
    initCarousel('#services-carousel'); initCarousel('#gallery-container'); initCarousel('#testimonials-carousel');

    // --- Scroll-to-Top Logic ---
    const handleScrollToTopVisibility = debounce(() => { if (!scrollToTopButton) return; const currentScrollTarget = getScrollTarget(); const scrollY = (currentScrollTarget === window) ? window.pageYOffset : currentScrollTarget.scrollTop; if (scrollY > 300) { if (!scrollToTopButton.classList.contains('visible')) { scrollToTopButton.classList.remove('hidden'); requestAnimationFrame(() => scrollToTopButton.classList.add('visible')); } } else { if (scrollToTopButton.classList.contains('visible')) { scrollToTopButton.classList.remove('visible'); setTimeout(() => { const currentScrollYCheck = (getScrollTarget() === window) ? window.pageYOffset : getScrollTarget()?.scrollTop ?? 0; if (currentScrollYCheck <= 300) scrollToTopButton.classList.add('hidden'); }, 300); } else { scrollToTopButton.classList.add('hidden'); } } }, SCROLL_DEBOUNCE_MS);
    const scrollToTopHandler = () => { getScrollTarget()?.scrollTo({ top: 0, behavior: 'smooth' }); };

    // --- Scroll Arrow Click Handling ---
    const scrollToNextSectionDesktop = () => { const nextSection = document.getElementById('about'); if (nextSection && scrollContainer) scrollContainer.scrollTo({ top: nextSection.offsetTop - getHeaderHeight(), behavior: 'smooth' }); };
    const scrollToNextSectionMobile = () => { const nextSection = document.getElementById('about'); if (nextSection) window.scrollTo({ top: nextSection.offsetTop - getHeaderHeight(), behavior: 'smooth' }); };
    const setupScrollArrowListener = () => { if (scrollArrow) { scrollArrow.removeEventListener('click', scrollToNextSectionDesktop); scrollArrow.removeEventListener('click', scrollToNextSectionMobile); if (!isMobile && scrollContainer) scrollArrow.addEventListener('click', scrollToNextSectionDesktop); else if (isMobile) scrollArrow.addEventListener('click', scrollToNextSectionMobile); } };

    // --- Active Section Highlighting ---
    const desktopNavLinks = document.querySelectorAll('#desktop-nav-elements > .main-nav-links > a.nav-link.internal-link');
    const handleActiveNavHighlight = debounce(() => { const currentScrollTarget = getScrollTarget(); let scrollPosition = (currentScrollTarget === window) ? window.pageYOffset : currentScrollTarget.scrollTop; let currentSectionId = 'hero'; const offset = getHeaderHeight() + 50; allSections.forEach(section => { if (typeof section.offsetTop === 'number') { const sectionTop = section.offsetTop - (isMobile ? 0 : getHeaderHeight()); if (scrollPosition >= sectionTop - offset) { currentSectionId = section.id || section.tagName.toLowerCase(); } } else { console.warn("Element considered a section lacks offsetTop:", section); } }); let highlightId = currentSectionId; desktopNavLinks.forEach(link => link.classList.remove('active')); mobileNavItems.forEach(item => item.classList.remove('active')); desktopNavLinks.forEach(link => { if (link.getAttribute('href') === `#${highlightId}`) { link.classList.add('active'); } }); mobileNavItems.forEach(item => { if (item.getAttribute('href') === `#${highlightId}`) { item.classList.add('active'); } }); }, 100);

    // --- Mobile Bottom Nav Click Handling ---
    mobileNavItems.forEach(link => { link.addEventListener('click', (e) => { const href = link.getAttribute('href'); if (href && href.startsWith('#')) { e.preventDefault(); const targetId = href.substring(1); const targetElement = document.getElementById(targetId); if (targetElement) { const targetScrollY = targetElement.offsetTop - getHeaderHeight(); window.scrollTo({ top: targetScrollY, behavior: 'smooth' }); mobileNavItems.forEach(i => i.classList.remove('active')); link.classList.add('active'); } } }); });

    // --- Enhanced Keyboard Navigation ---
    const handleKeyboardScroll = (event) => { if (isMobile || !scrollContainer || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') || isKeyboardScrolling) return; event.preventDefault(); const currentScrollTop = scrollContainer.scrollTop; let currentIndex = 0; let minDiff = Infinity; allSections.forEach((section, index) => { const sectionTopInContainer = section.offsetTop - getHeaderHeight(); const diff = Math.abs(sectionTopInContainer - currentScrollTop); if (diff < minDiff) { minDiff = diff; currentIndex = index; } }); let targetIndex = currentIndex; if (event.key === 'ArrowDown') targetIndex = Math.min(currentIndex + 1, allSections.length - 1); else if (event.key === 'ArrowUp') targetIndex = Math.max(currentIndex - 1, 0); if (targetIndex !== currentIndex || minDiff > 10) { const targetSection = allSections[targetIndex]; if (targetSection) { isKeyboardScrolling = true; const targetScrollTop = targetSection.offsetTop - getHeaderHeight(); scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' }); setTimeout(() => { isKeyboardScrolling = false; }, KEYBOARD_SCROLL_TIMEOUT_DURATION); } } else isKeyboardScrolling = false; };

    // --- Footer Year ---
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

    // --- Event Listeners Setup ---
    const setupScrollListeners = () => { const currentScrollTarget = getScrollTarget(); window.removeEventListener('scroll', handleScroll); if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll); currentScrollTarget.addEventListener('scroll', handleScroll, { passive: true }); window.removeEventListener('keydown', handleKeyboardScroll); window.addEventListener('keydown', handleKeyboardScroll); };
    const handleScroll = () => { handleScrollToTopVisibility(); handleActiveNavHighlight(); };
    const handleResize = debounce(() => { const wasMobile = isMobile; isMobile = window.innerWidth < MOBILE_BREAKPOINT; if (wasMobile !== isMobile) { console.log(`Viewport changed. Is mobile: ${isMobile}`); setupScrollListeners(); handleScrollToTopVisibility(); handleActiveNavHighlight(); setupScrollArrowListener(); if (!isMobile && desktopNavElements && desktopNavElements.classList.contains('active')) { desktopNavElements.classList.remove('active'); const icon = mobileMenuToggle?.querySelector('i'); if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); mobileMenuToggle.setAttribute('aria-expanded', 'false'); } } } }, 250);

    // --- Simple Contact Form Handler ---
    if (simpleContactForm) { const formMessage = simpleContactForm.querySelector('#contact-form-message-simple'); const submitButton = simpleContactForm.querySelector('button[type="submit"]'); simpleContactForm.addEventListener('submit', (e) => { e.preventDefault(); const formData = new FormData(simpleContactForm); const submitButtonInitialText = submitButton.innerHTML; let isValid = true; simpleContactForm.querySelectorAll('[required]').forEach(field => { field.style.borderColor = ''; if (!field.value.trim()) { isValid = false; field.style.borderColor = 'red'; } }); if (!isValid) { formMessage.textContent = 'Please fill out all required fields.'; formMessage.className = 'form-message-area error'; return; } submitButton.disabled = true; submitButton.innerHTML = 'Sending...'; formMessage.className = 'form-message-area'; formMessage.textContent = ''; fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(formData).toString(), }).then(response => { if (response.ok) { formMessage.textContent = "Thank you! Your message has been sent."; formMessage.className = 'form-message-area success'; simpleContactForm.reset(); simpleContactForm.querySelectorAll('[required]').forEach(field => field.style.borderColor = ''); } else { throw new Error('Network response was not ok.'); } }).catch((error) => { console.error("Simple contact form submission error:", error); formMessage.textContent = "Sorry, there was an error. Please try again or email directly."; formMessage.className = 'form-message-area error'; }).finally(() => { submitButton.disabled = false; submitButton.innerHTML = submitButtonInitialText; }); }); simpleContactForm.querySelectorAll('[required]').forEach(field => { field.addEventListener('input', () => { if (field.value.trim()) field.style.borderColor = ''; }); }); }

    // --- Mobile Menu Toggle ---
    if (mobileMenuToggle && desktopNavElements) {
        mobileMenuToggle.addEventListener('click', () => {
            const isOpen = desktopNavElements.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            const icon = mobileMenuToggle.querySelector('i');
            if (isOpen) {
                icon.classList.remove('fa-bars'); icon.classList.add('fa-times');
                closeL1Dropdown();
            } else {
                icon.classList.remove('fa-times'); icon.classList.add('fa-bars');
            }
        });
     }

     const closeAllSubmenus = (container = document) => {
         container.querySelectorAll('.l3-submenu.is-open').forEach(submenu => {
             submenu.classList.remove('is-open');
             const parentItem = submenu.previousElementSibling;
             if (parentItem && parentItem.classList.contains('main-dropdown-item')) {
                parentItem.classList.remove('is-open');
                parentItem.setAttribute('aria-expanded', 'false');
             }
         });
     };
     const closeL1Dropdown = () => {
         if (moreDropdownContainer?.classList.contains('dropdown-open')) {
             moreDropdownContainer.classList.remove('dropdown-open');
             moreDropdownTrigger?.setAttribute('aria-expanded', 'false');
             closeAllSubmenus(moreDropdownContainer);
         }
     };

     if (moreDropdownTrigger && moreDropdownContainer) {
         moreDropdownTrigger.addEventListener('click', (e) => {
             e.stopPropagation();
             const isOpen = moreDropdownContainer.classList.toggle('dropdown-open');
             moreDropdownTrigger.setAttribute('aria-expanded', isOpen);
             if (!isOpen) { closeAllSubmenus(moreDropdownContainer); }
             if (isMobile && isOpen && desktopNavElements?.classList.contains('active')) {
                 mobileMenuToggle.click();
             }
         });
         document.addEventListener('click', (e) => { if (moreDropdownContainer && !moreDropdownContainer.contains(e.target) && !moreDropdownTrigger.contains(e.target)) { closeL1Dropdown(); } });
         document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && moreDropdownContainer?.classList.contains('dropdown-open')) { closeL1Dropdown(); moreDropdownTrigger?.focus(); } });
     }

     submenuExpandButtons.forEach(button => {
         button.addEventListener('click', (e) => {
             e.preventDefault();
             e.stopPropagation();
             const parentItem = button.closest('.main-dropdown-item');
             if (!parentItem) return;
             const targetId = parentItem.getAttribute('aria-controls');
             const targetSubmenu = document.getElementById(targetId);
             if (!targetSubmenu) { console.error("Could not find target L3 submenu for", parentItem); return; }
             const isOpening = !parentItem.classList.contains('is-open');
             parentItem.classList.toggle('is-open');
             parentItem.setAttribute('aria-expanded', isOpening);
             targetSubmenu.classList.toggle('is-open');
             if (isOpening) {
                 const parentMenu = parentItem.closest('.nav-dropdown');
                 parentMenu.querySelectorAll('.main-dropdown-item.is-open').forEach(otherItem => {
                     if (otherItem !== parentItem) {
                         otherItem.classList.remove('is-open');
                         otherItem.setAttribute('aria-expanded', 'false');
                         const otherSubmenuId = otherItem.getAttribute('aria-controls');
                         const otherSubmenu = document.getElementById(otherSubmenuId);
                         otherSubmenu?.classList.remove('is-open');
                     }
                 });
             }
         });
     });

    // --- Smooth Scroll for Internal Links (Updated with Footer Flash) ---
    const smoothScrollHandler = function (e) {
        const link = e.currentTarget;
        const href = link.getAttribute('href');

        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerOffset = getHeaderHeight();
                const scrollTarget = getScrollTarget();
                let elementPosition;
                let offsetPosition;

                if (scrollTarget === window) {
                    elementPosition = targetElement.getBoundingClientRect().top;
                    offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                } else {
                     elementPosition = targetElement.offsetTop;
                     offsetPosition = elementPosition - headerOffset;
                     scrollTarget.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }

                if (targetId === 'main-footer') {
                    setTimeout(() => {
                        const footerIcons = document.querySelectorAll('#main-footer .footer-social-icon');
                        if (footerIcons.length > 0) {
                            footerIcons.forEach(icon => { icon.classList.add('flash-effect'); });
                            setTimeout(() => { footerIcons.forEach(icon => { icon.classList.remove('flash-effect'); }); }, FOOTER_FLASH_ANIMATION_DURATION);
                        }
                    }, FOOTER_SCROLL_DURATION_ESTIMATE);
                }
                if (link.closest('.more-dropdown-menu')) {
                     setTimeout(closeL1Dropdown, 50);
                }
                if (isMobile && desktopNavElements?.classList.contains('active')) {
                    setTimeout(() => {
                        desktopNavElements.classList.remove('active');
                        const icon = mobileMenuToggle?.querySelector('i');
                        if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
                        mobileMenuToggle?.setAttribute('aria-expanded', 'false');
                    }, 100);
                }
            } else {
                 console.warn(`Smooth scroll target element not found: #${targetId}`);
            }
        }
        else if (link.closest('.more-dropdown-menu')) {
             setTimeout(closeL1Dropdown, 50);
        }
    };

    document.querySelectorAll('a.internal-link, .dropdown-item-link.internal-link').forEach(anchor => {
        anchor.removeEventListener('click', smoothScrollHandler);
        anchor.addEventListener('click', smoothScrollHandler);
    });
    document.querySelectorAll('.more-dropdown-menu a:not(.internal-link)').forEach(anchor => {
         anchor.removeEventListener('click', smoothScrollHandler);
         anchor.addEventListener('click', smoothScrollHandler);
    });

    // --- Initializations ---
    isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    initParticles();
    setupScrollListeners();
    handleScroll();
    if(scrollToTopButton) {
        scrollToTopButton.addEventListener('click', scrollToTopHandler);
    }
    window.addEventListener('resize', handleResize);
    setupScrollArrowListener();

}); // End DOMContentLoaded