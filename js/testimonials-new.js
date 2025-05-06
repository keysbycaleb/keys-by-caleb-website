// --- testimonials-new.js ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Testimonials New JS Initialized - V7 (Glow Timeout Fix)");

    const carouselTrack = document.getElementById('tm-carousel-track');
    const slides = carouselTrack ? Array.from(carouselTrack.children) : [];
    const nextButton = document.getElementById('tm-next-btn');
    const prevButton = document.getElementById('tm-prev-btn');
    const carouselContainer = document.getElementById('tm-carousel-container');
    const scrollContainer = document.getElementById('tm-scroll-container');
    const header = document.getElementById('main-header');

    if (!carouselTrack || slides.length === 0 || !nextButton || !prevButton || !carouselContainer || !scrollContainer) {
        console.warn("Essential carousel or page elements not found. Testimonial script terminating.");
        if(prevButton) prevButton.style.display = 'none';
        if(nextButton) nextButton.style.display = 'none';
        return;
    }

    let currentIndex = 0;
    let isScriptUpdatingHash = false;
    let isAnimating = false;
    const ANIMATION_DURATION = 500; // ms
    const INITIAL_LOAD_PAUSE = 700; // ms
    const HIDE_CLASS = 'slide-initially-hidden';

    // CSS animation for glow is 0.6s and runs 2 times. Total = 1.2s = 1200ms
    const GLOW_ANIMATION_TOTAL_DURATION = 1200;


    const getHeaderHeight = () => header ? header.offsetHeight : 70;

    const updateCarousel = (targetIndex, smooth = true, instant = false) => {
        if (isAnimating && !instant && smooth) return;
        if (targetIndex < 0 || targetIndex >= slides.length) {
            console.warn(`Attempted to navigate to invalid slide index: ${targetIndex}`);
            return;
        }
        isAnimating = true;
        slides.forEach(slide => slide.classList.remove(HIDE_CLASS));

        const slideWidth = slides[0].offsetWidth;
        const newTransformValue = -targetIndex * slideWidth;

        carouselTrack.style.transition = instant ? 'none' : `transform ${ANIMATION_DURATION / 1000}s cubic-bezier(0.645, 0.045, 0.355, 1)`;
        carouselTrack.style.transform = `translateX(${newTransformValue}px)`;
        
        currentIndex = targetIndex;
        updateNavButtons();

        setTimeout(() => {
            isAnimating = false;
            if (instant) {
                 carouselTrack.style.transition = `transform ${ANIMATION_DURATION / 1000}s cubic-bezier(0.645, 0.045, 0.355, 1)`;
            }
        }, instant ? 50 : ANIMATION_DURATION);
    };

    const updateNavButtons = () => {
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === slides.length - 1;
    };

    const updateURLHash = (slideId, fromQueryParam = false) => {
        if (slideId) {
            isScriptUpdatingHash = true;
            const newHash = `#${slideId}`;
            
            if (window.location.hash === newHash && !fromQueryParam) {
                isScriptUpdatingHash = false;
                return;
            }
            
            if (fromQueryParam && window.history.replaceState) {
                window.history.replaceState(null, '', newHash);
            } else if (window.location.hash !== newHash && window.history.pushState) {
                window.history.pushState(null, '', newHash);
            } else if (window.location.hash !== newHash) {
                window.location.hash = newHash;
            }
            setTimeout(() => { isScriptUpdatingHash = false; }, 200);
        }
    };
    
    const applyGoldenGlow = () => {
        carouselContainer.classList.remove('golden-glow-active');
        void carouselContainer.offsetWidth; 
        carouselContainer.classList.add('golden-glow-active');
        setTimeout(() => {
            carouselContainer.classList.remove('golden-glow-active');
        }, GLOW_ANIMATION_TOTAL_DURATION + 50); // Added 50ms buffer
    };

    const handleHashChange = () => {
        if (isScriptUpdatingHash) return;
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetIndex = slides.findIndex(slide => slide.id === hash);
            if (targetIndex !== -1 && targetIndex !== currentIndex) {
                slides.forEach(s => s.classList.remove(HIDE_CLASS)); 
                updateCarousel(targetIndex, true);
                applyGoldenGlow();
            }
        } else if (slides.length > 0 && currentIndex !== 0) {
            slides.forEach(s => s.classList.remove(HIDE_CLASS));
            updateCarousel(0, true);
            updateURLHash(slides[0].id);
        }
    };

    const processInitialLoad = () => {
        scrollContainer.style.scrollPaddingTop = `${getHeaderHeight()}px`;
        scrollContainer.scrollTo({ top: 0, behavior: 'instant' });

        slides.forEach((slide, index) => {
            if (index === 0) slide.classList.remove(HIDE_CLASS);
            else slide.classList.add(HIDE_CLASS);
        });
        carouselTrack.style.transition = 'none';
        carouselTrack.style.transform = 'translateX(0px)';
        currentIndex = 0;
        updateNavButtons();
        console.log("V7: Initial forced display of slide 0.");
        
        requestAnimationFrame(() => {
            carouselTrack.style.transition = `transform ${ANIMATION_DURATION / 1000}s cubic-bezier(0.645, 0.045, 0.355, 1)`;
        });

        const urlParams = new URLSearchParams(window.location.search);
        const targetIdFromQuery = urlParams.get('testimonialTarget');
        const initialHash = window.location.hash.substring(1);
        
        let finalTargetId = null;
        let fromQuery = false;
        let explicitlyTargetedOnLoad = false;

        if (targetIdFromQuery) {
            finalTargetId = targetIdFromQuery;
            fromQuery = true;
            explicitlyTargetedOnLoad = true;
        } else if (initialHash) {
            finalTargetId = initialHash;
            explicitlyTargetedOnLoad = true; 
        } else if (slides.length > 0) {
            finalTargetId = slides[0].id; 
        }
        console.log(`V7: Target ID: ${finalTargetId}, From Query: ${fromQuery}, Explicitly Targeted: ${explicitlyTargetedOnLoad}`);

        let targetIndex = 0; 
        if (finalTargetId) {
            const foundIdx = slides.findIndex(slide => slide.id === finalTargetId);
            if (foundIdx !== -1) {
                targetIndex = foundIdx;
            } else { 
                console.warn(`V7: Invalid target ID '${finalTargetId}' found. Defaulting to slide 0.`);
                finalTargetId = slides.length > 0 ? slides[0].id : null;
                targetIndex = 0;
                explicitlyTargetedOnLoad = false; 
                fromQuery = false; 
            }
        }
        
        setTimeout(() => {
            slides.forEach(slide => slide.classList.remove(HIDE_CLASS)); 
            
            if (targetIndex === 0) {
                if (explicitlyTargetedOnLoad) { 
                    console.log("V7: Target is slide 0 (explicitly). Applying glow.");
                    applyGoldenGlow();
                } else {
                    console.log("V7: Target is slide 0 (default/clean URL). No glow from initial load process.");
                }
                updateURLHash(slides[0].id, fromQuery);
            } else { 
                console.log(`V7: Target is slide ${targetIndex}. Swiping from current (0).`);
                updateCarousel(targetIndex, true);
                
                setTimeout(() => {
                    console.log(`V7: Swipe to ${targetIndex} complete.`);
                    if (explicitlyTargetedOnLoad) { 
                         applyGoldenGlow();
                    }
                    updateURLHash(slides[targetIndex].id, fromQuery);
                }, ANIMATION_DURATION + 50);
            }
        }, INITIAL_LOAD_PAUSE);
    };
        
    nextButton.addEventListener('click', () => {
        slides.forEach(s => s.classList.remove(HIDE_CLASS));
        if (currentIndex < slides.length - 1) {
            const newIndex = currentIndex + 1;
            updateCarousel(newIndex);
            updateURLHash(slides[newIndex].id, false);
        }
    });

    prevButton.addEventListener('click', () => {
        slides.forEach(s => s.classList.remove(HIDE_CLASS));
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            updateCarousel(newIndex);
            updateURLHash(slides[newIndex].id, false);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return;
        }
        if (isAnimating) return;
        slides.forEach(s => s.classList.remove(HIDE_CLASS));
        let newIndex = currentIndex;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentIndex < slides.length - 1) newIndex = currentIndex + 1;
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentIndex > 0) newIndex = currentIndex - 1;
        }
        if (newIndex !== currentIndex) {
            updateCarousel(newIndex);
            updateURLHash(slides[newIndex].id, false);
        }
    });

    window.addEventListener('hashchange', handleHashChange);
    
    requestAnimationFrame(() => {
         processInitialLoad();
    });

    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const desktopNavElements = document.getElementById('desktop-nav-elements');
    const moreDropdownTriggers = document.querySelectorAll('.more-dropdown-trigger');

    if (mobileMenuToggle && desktopNavElements) {
        mobileMenuToggle.addEventListener('click', () => {
            const isOpen = desktopNavElements.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !isOpen);
                icon.classList.toggle('fa-times', isOpen);
            }
            if (isOpen) {
                moreDropdownTriggers.forEach(trigger => {
                    const parentItem = trigger.closest('.nav-item-dropdown');
                    if (parentItem && parentItem.classList.contains('dropdown-open')) {
                        parentItem.classList.remove('dropdown-open');
                        trigger.setAttribute('aria-expanded', 'false');
                        parentItem.querySelectorAll('.main-dropdown-item.is-open').forEach(l2Item => {
                            l2Item.classList.remove('is-open');
                            l2Item.setAttribute('aria-expanded', 'false');
                            const l3SubmenuId = l2Item.getAttribute('aria-controls');
                            if (l3SubmenuId) document.getElementById(l3SubmenuId)?.classList.remove('is-open');
                        });
                    }
                });
            }
        });
    }
    moreDropdownTriggers.forEach(trigger => {
        const parentItem = trigger.closest('.nav-item-dropdown');
        const dropdownMenu = parentItem ? parentItem.querySelector('.nav-dropdown') : null;
        if (parentItem && dropdownMenu) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = parentItem.classList.toggle('dropdown-open');
                trigger.setAttribute('aria-expanded', String(isOpen));
                if (!isOpen) {
                    parentItem.querySelectorAll('.main-dropdown-item.is-open').forEach(l2Item => {
                        l2Item.classList.remove('is-open');
                        l2Item.setAttribute('aria-expanded', 'false');
                        const l3SubmenuId = l2Item.getAttribute('aria-controls');
                        if (l3SubmenuId) document.getElementById(l3SubmenuId)?.classList.remove('is-open');
                    });
                }
            });
        }
    });
    document.querySelectorAll('.submenu-expand-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const parentL2Item = button.closest('.main-dropdown-item');
            if (!parentL2Item) return;
            const targetL3Id = parentL2Item.getAttribute('aria-controls');
            const targetL3Submenu = document.getElementById(targetL3Id);
            if (!targetL3Submenu) return;
            const isOpening = !parentL2Item.classList.contains('is-open');
            if (isOpening) {
                const grandParentDropdown = parentL2Item.closest('.nav-dropdown');
                if (grandParentDropdown) {
                    grandParentDropdown.querySelectorAll('.main-dropdown-item.is-open').forEach(otherL2Item => {
                        if (otherL2Item !== parentL2Item) {
                            otherL2Item.classList.remove('is-open');
                            otherL2Item.setAttribute('aria-expanded', 'false');
                            const otherL3Id = otherL2Item.getAttribute('aria-controls');
                            if (otherL3Id) document.getElementById(otherL3Id)?.classList.remove('is-open');
                        }
                    });
                }
            }
            parentL2Item.classList.toggle('is-open', isOpening);
            parentL2Item.setAttribute('aria-expanded', String(isOpening));
            targetL3Submenu.classList.toggle('is-open', isOpening);
        });
    });
    document.addEventListener('click', (e) => {
        if (desktopNavElements && desktopNavElements.classList.contains('active')) {
             if (!desktopNavElements.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                desktopNavElements.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
            }
        }
        document.querySelectorAll('.nav-item-dropdown.dropdown-open').forEach(openDropdown => {
            if (!openDropdown.contains(e.target)) {
                openDropdown.classList.remove('dropdown-open');
                openDropdown.querySelector('.more-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
                 openDropdown.querySelectorAll('.main-dropdown-item.is-open').forEach(l2Item => {
                    l2Item.classList.remove('is-open');
                    l2Item.setAttribute('aria-expanded', 'false');
                    const l3SubmenuId = l2Item.getAttribute('aria-controls');
                    if (l3SubmenuId) document.getElementById(l3SubmenuId)?.classList.remove('is-open');
                });
            }
        });
    });
     const currentYearSpan = document.getElementById('current-year');
     if (currentYearSpan) {
         currentYearSpan.textContent = new Date().getFullYear();
     }
});