/**
 * JavaScript for Keys by Caleb - Vendor Pages (V2 - No Header Logic)
 * Handles basic interactions for vendor pages: scroll-to-top, footer year.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb - Vendor Hub JS Initialized (V2 - No Header Logic)");

    // --- Cache Elements ---
    const scrollToTopButton = document.getElementById('scroll-to-top-vendor'); // Vendor scroll button ID
    const currentYearSpan = document.getElementById('current-year'); // Footer year span

    // --- Helper Functions ---
    // Debounce function to limit how often a function executes
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

    // --- Scroll-to-Top Logic ---
    // Function to show/hide the scroll-to-top button based on window scroll position
    const handleScrollToTopVisibility = () => {
        const scrollY = window.pageYOffset; // Get vertical scroll position of the window
        if (!scrollToTopButton) return; // Exit if button element not found

        if (scrollY > 300) { // If scrolled down more than 300 pixels
            scrollToTopButton.classList.remove('hidden'); // Make button potentially visible
            requestAnimationFrame(() => { // Use rAF for smooth transition start
                scrollToTopButton.classList.add('visible'); // Add class to trigger fade-in/transform
            });
        } else { // If scrolled near the top
            if (scrollToTopButton.classList.contains('visible')) {
                scrollToTopButton.classList.remove('visible'); // Remove visible class to start fade-out
                // Delay adding 'hidden' to allow CSS transition to complete
                setTimeout(() => {
                    const currentScrollYCheck = window.pageYOffset;
                    // Double-check scroll position before hiding completely
                    if (currentScrollYCheck <= 300 && !scrollToTopButton.classList.contains('visible')) {
                        scrollToTopButton.classList.add('hidden'); // Hide element after transition
                    }
                }, 300); // Should match CSS transition duration
            } else if (!scrollToTopButton.classList.contains('hidden')) {
                 // If button wasn't hidden yet (e.g., initial load near top), hide it
                scrollToTopButton.classList.add('hidden');
            }
        }
     };

    // Function to smoothly scroll the window back to the top
    const scrollToTopHandler = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Initial Calls & Event Listeners Setup ---
    // Scroll-to-top listeners
    const debouncedScrollHandler = debounce(handleScrollToTopVisibility, 50);
    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });
    if (scrollToTopButton) {
        scrollToTopButton.addEventListener('click', scrollToTopHandler);
        // Initial check for button visibility
        handleScrollToTopVisibility();
    }

    // Add current year to footer
     if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
     }
     console.log("Vendor Hub basic JS setup complete.");

}); // End DOMContentLoaded
