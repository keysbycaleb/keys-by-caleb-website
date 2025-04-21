/**
 * JavaScript for Keys by Caleb - Multi-Step Booking Pages (V2.11 - Netlify Submission Re-enabled)
 *
 * Handles:
 * - Dynamic detection of 5 or 6 steps.
 * - Multi-step form navigation (Next/Previous/Edit Links)
 * - Robust input validation per step (triggered correctly, enhanced logging)
 * - Step transition animations
 * - Dynamic update of enhanced booking summary
 * - *** Netlify form submission ENABLED ***
 * - Final step disclaimer/checkbox validation & button enabling (REFINED)
 * - Redirect to Stripe payment link on final step
 * - Displaying loading/confirmation messages + error scrolling
 * - Scroll-to-top button visibility and action (using GSAP)
 * - Footer copyright year update
 * - Minimum date setting for date input
 * - ARIA attribute updates for accessibility
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb - Booking Page JS Initialized (V2.11 - Netlify Submission Re-enabled)");

    // --- GSAP Plugin Registration ---
    gsap.registerPlugin(ScrollToPlugin);

    // --- Configuration ---
    const CSS_TRANSITION_DURATION = 400;
    const NETLIFY_SUBMIT_TIMEOUT = 10000; // Timeout for Netlify submission
    const PHONE_PATTERN = /^(\+?1\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/;
    // --- !! Netlify Submission ENABLED !! ---
    const SUBMIT_DATA_TO_NETLIFY = true;
    console.log(`Netlify Submission Enabled: ${SUBMIT_DATA_TO_NETLIFY}`);
    // --- !! ----------------------------- !! ---


    // --- Element Cache & Step Config ---
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) { console.error("Booking form not found. Aborting script."); return; } // Guard clause

    const formSteps = Array.from(bookingForm.querySelectorAll('.booking-step') || []);
    const TOTAL_STEPS = formSteps.length;
    if (TOTAL_STEPS < 5 || TOTAL_STEPS > 6) { console.error(`Incorrect number of steps found (${TOTAL_STEPS}). Expected 5 or 6. Aborting.`); return; }

    const stepIndicators = Array.from(bookingForm.querySelectorAll('.step-indicator') || []);
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');
    const proceedToDisclaimersButton = document.getElementById('proceed-to-disclaimers-button'); // Used only in 6-step
    const paymentButton = document.getElementById('payment-button'); // Final button for BOTH 5 & 6 steps
    const formMessage = document.getElementById('form-message'); // General message area (often below summary)
    const finalStepElement = formSteps[TOTAL_STEPS - 1]; // Get the actual last step element
    const finalStepErrorMessage = finalStepElement?.querySelector('.form-message-area'); // Look for message area within final step

    const confirmationMessage = document.getElementById('confirmation-message');
    const bookingCard = document.querySelector('.booking-card');
    const loaderOverlay = document.getElementById('booking-loader-overlay');
    const loaderText = document.getElementById('loader-text');
    const stepsContainer = document.querySelector('.steps-container');
    const summaryFields = { date: document.getElementById('summary-date'), time: document.getElementById('summary-time'), event_type: document.getElementById('summary-event_type'), event_type_hourly: document.getElementById('summary-event_type_hourly'), estimated_duration: document.getElementById('summary-estimated_duration'), venue_name: document.getElementById('summary-venue_name'), venue_address: document.getElementById('summary-venue_address'), piano_availability: document.getElementById('summary-piano_availability'), name: document.getElementById('summary-name'), email: document.getElementById('summary-email'), phone: document.getElementById('summary-phone'), referral: document.getElementById('summary-referral'), message: document.getElementById('summary-message'), };
    const confirmName = document.getElementById('confirm-name'); const confirmEmail = document.getElementById('confirm-email');
    const header = document.getElementById('main-header'); const scrollToTopButton = document.getElementById('scroll-to-top'); const currentYearSpan = document.getElementById('current-year'); const dateField = document.getElementById('event_date');

    // Step Indices based on detected number of steps
    const HAS_SEPARATE_DISCLAIMER_STEP = TOTAL_STEPS === 6;
    const PENULTIMATE_VISIBLE_STEP_INDEX = TOTAL_STEPS - 2; // Index 4 for 6-step, Index 3 for 5-step
    const PAYMENT_STEP_INDEX = TOTAL_STEPS - 1; // Final Step Index (index 5 for 6-step, index 4 for 5-step)

    console.log(`Detected ${TOTAL_STEPS} steps. Has separate disclaimer: ${HAS_SEPARATE_DISCLAIMER_STEP}. Penultimate Visible Step Index: ${PENULTIMATE_VISIBLE_STEP_INDEX}. Payment Step Index (final): ${PAYMENT_STEP_INDEX}.`);

    // --- State Variables ---
    let currentStepIndex = 0; let isTransitioning = false; let formAttemptedSubmit = false;

    // --- Helper Functions --- (Same basic helpers)
    const getElement = (selector) => document.querySelector(selector); const getAllElements = (selector) => Array.from(document.querySelectorAll(selector)); const showElement = (el) => el?.classList.remove('hidden'); const hideElement = (el) => el?.classList.add('hidden'); const addClass = (el, className) => el?.classList.add(className); const removeClass = (el, className) => el?.classList.remove(className); const hasClass = (el, className) => el?.classList.contains(className); const setAriaAttribute = (el, attr, value) => el?.setAttribute(attr, value); const setVisibility = (el, visible) => { if (el) el.style.visibility = visible ? 'visible' : 'hidden'; }; const debounce = (func, wait) => { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; };
    const getHeaderHeight = () => header?.offsetHeight || 70; const scrollIntoViewIfNeeded = (element) => { if (!element) return; const rect = element.getBoundingClientRect(); const headerHeight = getHeaderHeight(); const isAbove = rect.top < headerHeight + 10; const isBelow = rect.bottom > window.innerHeight - 10; if (isAbove || isBelow) { const elementTopRelativeToDocument = window.scrollY + rect.top; const targetScrollY = elementTopRelativeToDocument - headerHeight - 30; const cardRect = bookingCard?.getBoundingClientRect(); const elementIsInsideCard = element.closest('.booking-card') === bookingCard; if (elementIsInsideCard && cardRect && cardRect.top < headerHeight) { window.scrollTo({ top: window.scrollY + cardRect.top - headerHeight - 20, behavior: 'smooth' }); setTimeout(() => { window.scrollTo({ top: targetScrollY, behavior: 'smooth' }); }, 350); } else { window.scrollTo({ top: targetScrollY, behavior: 'smooth' }); } } };
    const disableButton = (button) => { if (button) { button.disabled = true; addClass(button, 'btn-disabled'); } }; const enableButton = (button) => { if (button) { button.disabled = false; removeClass(button, 'btn-disabled'); } };
    const setButtonLoading = (button, isLoading, loadingText = "Processing...") => { if (!button) return; if (isLoading) { button.disabled = true; addClass(button, 'loading'); setAriaAttribute(button, 'aria-busy', 'true'); setAriaAttribute(button, 'aria-live', 'assertive'); if (!button.dataset.originalText) { button.dataset.originalText = button.textContent.trim(); } button.innerHTML = `${loadingText}`; } else { if (hasClass(button, 'loading')) { button.disabled = false; removeClass(button, 'loading'); setAriaAttribute(button, 'aria-busy', 'false'); if(button.dataset.originalText) { button.textContent = button.dataset.originalText; } } } };
    const showFormMessage = (message, type = 'error', targetElement = formMessage) => { console.log(`Showing message (${type}) in ${targetElement?.id || 'default area'}: ${message}`); if (targetElement) { targetElement.textContent = message; targetElement.className = `form-message-area visible ${type}`; setAriaAttribute(targetElement, 'role', 'alert'); scrollIntoViewIfNeeded(targetElement); } };
    const hideFormMessage = (targetElement = formMessage) => { if (targetElement && hasClass(targetElement, 'visible')) { removeClass(targetElement, 'visible'); removeClass(targetElement, 'success'); removeClass(targetElement, 'error'); targetElement.textContent = ''; } };

    // --- Data Formatting --- (Same)
    const getValue = (formData, key, defaultValue = '-') => formData.get(key)?.trim() || defaultValue; const formatDate = (dateStr) => { /* ... */ if (!dateStr) return '-'; try { const parts = dateStr.split('-'); if (parts.length !== 3) throw new Error("Invalid date format"); const year = parseInt(parts[0]); const month = parseInt(parts[1]) - 1; const day = parseInt(parts[2]); const date = new Date(Date.UTC(year, month, day)); if (isNaN(date.getTime())) throw new Error("Invalid date"); return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); } catch { return '-'; } }; const formatTime = (timeStr) => { /* ... */ if (!timeStr) return '-'; try { const [hours, minutes] = timeStr.split(':'); if (hours === undefined || minutes === undefined) throw new Error("Invalid time format"); const date = new Date(); date.setHours(parseInt(hours), parseInt(minutes), 0, 0); if (isNaN(date.getTime())) throw new Error("Invalid time"); return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); } catch { return '-'; } }; const formatPhone = (phoneStr) => { /* ... */ const rawValue = phoneStr?.trim(); if (!rawValue) return 'Not provided'; const cleaned = rawValue.replace(/\D/g, ''); const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/); if (match) { return `(${match[1]}) ${match[2]}-${match[3]}`; } return rawValue !== '-' ? rawValue : 'Not provided'; }; const formatSelection = (selectValue, defaultValue = '-') => { /* ... */ const value = selectValue?.trim(); if (!value || value === "Unknown") return defaultValue; return value.replace(/_/g, ' '); }; const formatNotes = (notesValue) => { /* ... */ const value = notesValue?.trim(); return value || 'No additional notes.'; }; const formatDuration = (durationStr) => { const val = durationStr?.trim(); return val ? `${val}` : '-'; };


    // --- Core Multi-Step Logic ---

    // updateStepIndicators (Same)
    const updateStepIndicators = (index) => { /* ... same logic ... */ stepIndicators.forEach((indicator, i) => { const stepNumber = parseInt(indicator.dataset.step || '0', 10) - 1; const connector = indicator.previousElementSibling; removeClass(indicator, 'active'); removeClass(indicator, 'completed'); setAriaAttribute(indicator, 'aria-selected', 'false'); if (stepNumber === index) { addClass(indicator, 'active'); setAriaAttribute(indicator, 'aria-selected', 'true'); if (connector && hasClass(indicator.previousElementSibling?.previousElementSibling, 'completed')) { addClass(connector, 'completed'); } else if (connector) { removeClass(connector, 'completed'); } } else if (stepNumber < index) { addClass(indicator, 'completed'); const nextConnector = indicator.nextElementSibling; if (nextConnector && hasClass(nextConnector, 'step-connector')) { addClass(nextConnector, 'completed'); } } else { if (connector && hasClass(connector, 'step-connector')) { if (!hasClass(indicator.previousElementSibling?.previousElementSibling, 'completed')) { removeClass(connector, 'completed'); } } const nextConnector = indicator.nextElementSibling; if (nextConnector && hasClass(nextConnector, 'step-connector')) { removeClass(nextConnector, 'completed'); } } }); };

    // updateNavigationButtons (Same logic as V2.9/V2.10)
     const updateNavigationButtons = (index) => {
         console.log(`Updating buttons for step index: ${index}`);
         setVisibility(prevButton, index > 0);
         hideElement(nextButton);
         hideElement(proceedToDisclaimersButton);
         hideElement(paymentButton);
         enableButton(prevButton); // Always enable prev if visible

         if (index < PENULTIMATE_VISIBLE_STEP_INDEX) { // Steps BEFORE the penultimate visible step
             console.log("Showing 'Next' button");
             showElement(nextButton);
             enableButton(nextButton);
         } else if (index === PENULTIMATE_VISIBLE_STEP_INDEX) { // On the Penultimate VISIBLE step
             if (HAS_SEPARATE_DISCLAIMER_STEP) { // 6-step form: This is the Review Step
                 console.log("Showing 'Proceed to Disclaimers' button");
                 showElement(proceedToDisclaimersButton);
                 enableButton(proceedToDisclaimersButton);
             } else { // 5-step form: This is the FINAL Step
                 console.log("Showing 'Payment' button (5-step final)");
                 showElement(paymentButton);
                 validateCheckboxesForPaymentButton(); // Check boxes to set initial enabled state
             }
         } else if (index === PAYMENT_STEP_INDEX) { // On the FINAL step
             console.log("Showing 'Payment' button (Final Step)");
             showElement(paymentButton);
             validateCheckboxesForPaymentButton(); // Check boxes to set initial enabled state
         }
     };


    // updateBookingSummary (Same logic as V2.10)
    const updateBookingSummary = () => { /* ... same logic ... */ if (!bookingForm) return; const formData = new FormData(bookingForm); if (summaryFields.date) summaryFields.date.textContent = formatDate(formData.get('event_date')); if (summaryFields.time) summaryFields.time.textContent = formatTime(formData.get('event_time')); if (summaryFields.venue_name) summaryFields.venue_name.textContent = getValue(formData, 'venue_name', 'Not specified'); if (summaryFields.venue_address) summaryFields.venue_address.textContent = getValue(formData, 'venue_address'); if (summaryFields.piano_availability) summaryFields.piano_availability.textContent = formatSelection(formData.get('piano_availability'), 'Unknown'); if (summaryFields.name) summaryFields.name.textContent = getValue(formData, 'name'); if (summaryFields.email) summaryFields.email.textContent = getValue(formData, 'email'); if (summaryFields.phone) summaryFields.phone.textContent = formatPhone(formData.get('phone')); if (summaryFields.referral) summaryFields.referral.textContent = formatSelection(formData.get('referral'), 'Not specified'); if (summaryFields.event_type) summaryFields.event_type.textContent = formatSelection(formData.get('event_type'), 'Not selected'); if (summaryFields.event_type_hourly) summaryFields.event_type_hourly.textContent = formatSelection(formData.get('event_type_hourly'), 'Not selected'); if (summaryFields.estimated_duration) summaryFields.estimated_duration.textContent = formatDuration(formData.get('estimated_duration')); if (summaryFields.message) summaryFields.message.textContent = formatNotes(formData.get('message') || formData.get('message_hourly')); const nameValue = getValue(formData, 'name', 'there'); const emailValue = getValue(formData, 'email', 'your email address'); if (confirmName) confirmName.textContent = nameValue; if (confirmEmail) confirmEmail.textContent = emailValue; };

    // navigateToStep (Same logic as V2.10 - checks PENULTIMATE_VISIBLE_STEP_INDEX)
    const navigateToStep = (targetIndex, isMovingForward = true) => {
         console.log(`MapsToStep: current=${currentStepIndex}, target=${targetIndex}, forward=${isMovingForward}`);
         if (isTransitioning || targetIndex < 0 || targetIndex >= TOTAL_STEPS || targetIndex === currentStepIndex) { console.log(`MapsToStep blocked: transitioning=${isTransitioning}, target valid=${targetIndex >= 0 && targetIndex < TOTAL_STEPS}, target same=${targetIndex === currentStepIndex}`); return; }
         isTransitioning = true;

         // Update summary when navigating TO the PENULTIMATE VISIBLE step (Review Step visually)
         if (targetIndex === PENULTIMATE_VISIBLE_STEP_INDEX) {
             console.log("Navigating to Review Step (visually) - updating summary.");
             updateBookingSummary();
         }
         if (currentStepIndex === PAYMENT_STEP_INDEX) { hideFormMessage(finalStepErrorMessage); } // Clear Final Step errors when leaving it

         const currentStepElement = formSteps[currentStepIndex]; const targetStepElement = formSteps[targetIndex];
         disableButton(prevButton); disableButton(nextButton); disableButton(proceedToDisclaimersButton); disableButton(paymentButton);

         if (currentStepElement) { addClass(currentStepElement, 'exiting'); setAriaAttribute(currentStepElement, 'aria-hidden', 'true'); }
         if (targetStepElement) { removeClass(targetStepElement, 'exiting'); addClass(targetStepElement, 'active'); setAriaAttribute(targetStepElement, 'aria-hidden', 'false'); }

         updateStepIndicators(targetIndex); updateNavigationButtons(targetIndex); // Show correct buttons, still disabled

         setTimeout(() => {
             if (currentStepElement) { removeClass(currentStepElement, 'active'); removeClass(currentStepElement, 'exiting'); }
             currentStepIndex = targetIndex; isTransitioning = false;
             console.log(`MapsToStep complete. New currentStepIndex: ${currentStepIndex}`);
             updateNavigationButtons(currentStepIndex); // Re-enable correct buttons based on new index
             if (bookingCard) { const stepTitle = targetStepElement?.querySelector('.step-title'); scrollIntoViewIfNeeded(stepTitle || targetStepElement || bookingCard); }
         }, CSS_TRANSITION_DURATION);
     };


    // --- Validation Logic ---

    // validateField (Same logic as V2.10)
    const validateField = (field) => { /* ... same logic ... */ if (!field) return true; let isValid = true; const value = field.value.trim(); const type = field.type; const name = field.name; const isRequired = field.required; const errorElement = bookingForm?.querySelector(`.error-message[data-for="${name}"]`); let defaultErrorMessage = "Required"; if(type === 'email') defaultErrorMessage = "Valid Email Required"; else if(type === 'date') defaultErrorMessage = "Future Date Required"; else if(type === 'time') defaultErrorMessage = "Required"; else if(type === 'tel') defaultErrorMessage = "Invalid Format"; else if(type === 'number' && field.min) defaultErrorMessage = `Min ${field.min} required`; else if(type === 'checkbox') defaultErrorMessage = "Required"; if (isRequired) { if (type === 'checkbox' && !field.checked) isValid = false; else if (type !== 'checkbox' && value === '') isValid = false; } if (isValid && value !== '') { switch (type) { case 'email': if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) isValid = false; break; case 'date': try { const d = new Date(value + 'T00:00:00'), t = new Date(); t.setHours(0,0,0,0); if (isNaN(d.getTime()) || d < t) isValid = false; } catch { isValid = false; } break; case 'tel': if (!PHONE_PATTERN.test(value)) isValid = false; break; case 'number': if (field.min && parseFloat(value) < parseFloat(field.min)) isValid = false; break; } } const label = field.closest('label'); if (!isValid) { addClass(field, 'input-error'); if (label && type === 'checkbox') addClass(label, 'label-error'); setAriaAttribute(field, 'aria-invalid', 'true'); if (errorElement) { errorElement.textContent = defaultErrorMessage; showElement(errorElement); setAriaAttribute(field, 'aria-describedby', errorElement.id); } } else { removeClass(field, 'input-error'); if (label && type === 'checkbox') removeClass(label, 'label-error'); setAriaAttribute(field, 'aria-invalid', 'false'); if (errorElement) { hideElement(errorElement); const desc = field.getAttribute('aria-describedby'); if(desc && desc.includes(errorElement.id)) { const newDesc = desc.replace(errorElement.id, '').trim(); if(newDesc) setAriaAttribute(field, 'aria-describedby', newDesc); else field.removeAttribute('aria-describedby');}} } return isValid; };

    // validateStep (Same logic as V2.10 - includes logging)
    const validateStep = (stepIndex) => { /* ... same logic ... */ let isStepValid = true; const stepElement = formSteps[stepIndex]; if (!stepElement) return false; console.log(`--- Validating Step ${stepIndex + 1} ---`); stepElement.querySelectorAll('input, select, textarea').forEach(field => { const isRequired = field.required; const needsFormatCheck = ['email', 'tel', 'date', 'number', 'time'].includes(field.type); const hasValue = field.value.trim() !== ''; if (isRequired || (needsFormatCheck && hasValue)) { if (!validateField(field)) { console.warn(`   Field validation FAILED for: ${field.name || field.id}`); isStepValid = false; } } else if (!isRequired && !hasValue && hasClass(field, 'input-error')){ validateField(field); } }); console.log(`--- Step ${stepIndex + 1} validation result: ${isStepValid} ---`); return isStepValid; };


    // validateCheckboxesForPaymentButton (Same logic as V2.10 - includes logging)
    const validateCheckboxesForPaymentButton = () => { /* ... same logic ... */ const finalStepElement = formSteps[PAYMENT_STEP_INDEX]; if (!finalStepElement) { console.error("Final step element not found!"); disableButton(paymentButton); return false; } const checkboxes = finalStepElement.querySelectorAll('input[type="checkbox"][required]'); if (currentStepIndex === PAYMENT_STEP_INDEX && checkboxes.length === 0) { console.log("No required checkboxes found on final step, enabling button by default."); enableButton(paymentButton); return true; } console.log(`Validating ${checkboxes.length} required checkboxes for payment button on step ${PAYMENT_STEP_INDEX+1}`); let allChecked = true; checkboxes.forEach(checkbox => { const isBoxChecked = checkbox.checked; console.log(`   Checkbox ${checkbox.name || checkbox.id}: checked=${isBoxChecked}`); if (!isBoxChecked) { allChecked = false; } validateField(checkbox); }); if (allChecked) { console.log("All required checkboxes checked, ENABLING payment button."); enableButton(paymentButton); hideFormMessage(finalStepErrorMessage); } else { console.log("Not all required checkboxes checked, DISABLING payment button."); disableButton(paymentButton); } return allChecked; };

    // --- Form Submission & Navigation Logic ---

    // submitToNetlify (ENABLES submission based on flag)
    const submitToNetlify = async (triggeringButton) => {
        if (!SUBMIT_DATA_TO_NETLIFY) {
             console.warn("!!! Netlify submission bypassed via SUBMIT_DATA_TO_NETLIFY flag. Returning true.");
             return true; // Treat as success if bypassed
         }
        // Actual submission logic from V2.10
        console.log("Attempting Netlify submission..."); let success = false; hideFormMessage();
        setButtonLoading(triggeringButton, true, "Submitting..."); // Use passed button
        showElement(loaderOverlay); addClass(loaderOverlay, 'visible'); if(loaderText) loaderText.textContent = "Submitting Request...";
        const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), NETLIFY_SUBMIT_TIMEOUT);
        try {
            const formData = new FormData(bookingForm);
            formSteps[PAYMENT_STEP_INDEX]?.querySelectorAll('input[type="checkbox"][required]').forEach(cb => formData.append(cb.name, cb.checked)); // Include checkbox state
            const formBody = new URLSearchParams(formData).toString();
            const response = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody, signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                console.log("Netlify submission successful."); success = true;
                // Optionally show a success message before redirecting, though usually redirect is fast
                 // showFormMessage("Request submitted successfully!", "success");
            } else {
                const errorText = await response.text();
                console.error(`Netlify submission failed: Status ${response.status}`, errorText);
                showFormMessage(`Submission failed (Status: ${response.status}). Please check details or contact us.`, "error"); // Show error on page
                success = false;
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Error during Netlify submission fetch:", error);
            if (error.name === 'AbortError') { showFormMessage("Submission timed out. Check connection.", "error"); }
            else { showFormMessage("Network error during submission. Please try again.", "error"); } success = false;
        } finally {
            console.log("Netlify submission attempt finished.");
            removeClass(loaderOverlay, 'visible');
            // Short delay before hiding overlay completely
            await new Promise(resolve => setTimeout(resolve, CSS_TRANSITION_DURATION / 2));
            hideElement(loaderOverlay);
            // Restore button ONLY if submission failed (if success, page redirects anyway)
            if (!success) {
                setButtonLoading(triggeringButton, false);
            }
            console.log(`submitToNetlify returning: ${success}`);
            return success;
        }
    };

    // handleFullFormValidation (Same logic as V2.10)
    const handleFullFormValidation = (lastStepToIndex) => { /* ... same logic ... */ console.log(`--- Running full validation up to step index ${lastStepToIndex} ---`); let isAllValid = true; for (let i = 0; i <= lastStepToIndex; i++) { if (!validateStep(i)) { isAllValid = false; console.log(`Full validation failed on step ${i + 1}`); if (currentStepIndex !== i) { console.log(`Navigating back to failed step ${i+1}`); navigateToStep(i, false); } setTimeout(() => { showFormMessage("Please correct the errors highlighted above.", "error"); const firstError = formSteps[i]?.querySelector('.input-error'); if (firstError) { console.log(`Scrolling to first error in step ${i+1}:`, firstError); firstError.focus({preventScroll: true}); scrollIntoViewIfNeeded(firstError.closest('.input-group') || firstError); } }, currentStepIndex !== i ? CSS_TRANSITION_DURATION + 50 : 0); break; } } console.log(`--- Full validation result up to step ${lastStepToIndex + 1}: ${isAllValid} ---`); return isAllValid; };

    // initiateRedirect (Same logic as V2.10)
    const initiateRedirect = () => { /* ... same logic ... */ console.log("--- initiateRedirect called ---"); const stripeLink = paymentButton?.dataset.stripeLink; if (!stripeLink || stripeLink === '#') { console.error("Stripe link is missing or invalid for the payment button. Value:", stripeLink); showFormMessage("Payment link is currently unavailable. Please contact us.", "error", finalStepErrorMessage); scrollIntoViewIfNeeded(finalStepErrorMessage); setButtonLoading(paymentButton, false); return; } console.log("Checkboxes validated. Redirecting to Stripe:", stripeLink); setButtonLoading(paymentButton, true, "Redirecting..."); showElement(loaderOverlay); addClass(loaderOverlay, 'visible'); if(loaderText) loaderText.textContent = "Redirecting to Secure Payment..."; setTimeout(() => { window.location.href = stripeLink; }, 150); };

    // --- Event Listeners ---

    // Next Button Click (Same logic as V2.10)
    nextButton?.addEventListener('click', () => { /* ... same logic ... */ console.log("Next button clicked."); hideFormMessage(); if (validateStep(currentStepIndex)) { formAttemptedSubmit = true; navigateToStep(currentStepIndex + 1, true); } else { console.warn(`Next button: Validation failed for step ${currentStepIndex + 1}`); showFormMessage("Please correct the errors highlighted above.", "error"); const firstError = formSteps[currentStepIndex]?.querySelector('.input-error'); if (firstError) { firstError.focus({preventScroll: true}); scrollIntoViewIfNeeded(firstError.closest('.input-group') || firstError); } } });

    // Previous Button Click (Same)
    prevButton?.addEventListener('click', () => { console.log("Prev button clicked."); hideFormMessage(); hideFormMessage(finalStepErrorMessage); navigateToStep(currentStepIndex - 1, false); });

    // Edit Link Click (Same logic as V2.10)
    bookingForm.addEventListener('click', (e) => { /* ... same logic ... */ const target = e.target.closest('.summary-edit-link'); if (target && target.dataset.targetStep && (currentStepIndex === PENULTIMATE_VISIBLE_STEP_INDEX || currentStepIndex === PAYMENT_STEP_INDEX)) { const targetStepIndex = parseInt(target.dataset.targetStep, 10) - 1; if (!isNaN(targetStepIndex) && targetStepIndex < currentStepIndex) { console.log(`Edit link clicked, navigating to step ${targetStepIndex + 1}`); hideFormMessage(); hideFormMessage(finalStepErrorMessage); navigateToStep(targetStepIndex, false); } } });

    // Proceed to Disclaimers Button Click (Step BEFORE payment step on 6-step form)
     proceedToDisclaimersButton?.addEventListener('click', async () => {
         console.log("Proceed to Disclaimers button clicked.");
         if (!HAS_SEPARATE_DISCLAIMER_STEP || currentStepIndex !== PENULTIMATE_VISIBLE_STEP_INDEX) { console.warn("Proceed button clicked on wrong step/form type, ignoring."); return; }
         formAttemptedSubmit = true;
         setButtonLoading(proceedToDisclaimersButton, true, "Checking...");

         if (!handleFullFormValidation(PENULTIMATE_VISIBLE_STEP_INDEX)) { // Validate steps 0-4
            setButtonLoading(proceedToDisclaimersButton, false); return;
         }
         console.log("Proceed button: Full validation passed.");

         const submissionSuccess = await submitToNetlify(proceedToDisclaimersButton); // Submit or bypass
         if (submissionSuccess) {
            console.log("Proceed button: Submission OK. Navigating to final step.");
             navigateToStep(PAYMENT_STEP_INDEX, true); // Navigate to Step 6
         } else {
            console.warn("Proceed button: Submission failed. Staying on current step.");
            // Error shown by submitToNetlify
         }
     });

     // Final Payment Button Click (On PAYMENT_STEP_INDEX for EITHER 5 or 6 steps)
     paymentButton?.addEventListener('click', async () => {
         console.log("Final Payment button clicked.");
         if (currentStepIndex !== PAYMENT_STEP_INDEX) { console.warn("Payment button clicked on wrong step, ignoring."); return; }

         formAttemptedSubmit = true;
         setButtonLoading(paymentButton, true, "Checking...");
         hideFormMessage(finalStepErrorMessage);

         // 1. Validate checkboxes on this final step
         if (!validateCheckboxesForPaymentButton()) {
             console.warn("Payment button: Checkbox validation failed.");
             showFormMessage("Please agree to the terms above to proceed.", "error", finalStepErrorMessage);
             scrollIntoViewIfNeeded(finalStepErrorMessage || formSteps[PAYMENT_STEP_INDEX].querySelector('.agreement-checkboxes'));
             setButtonLoading(paymentButton, false); return;
         }
         console.log("Payment button: Checkbox validation passed.");

         // 2. Validate ALL previous steps before submitting/redirecting
         if (!handleFullFormValidation(PENULTIMATE_VISIBLE_STEP_INDEX)) {
             console.warn("Payment button: Validation of previous steps failed.");
             setButtonLoading(paymentButton, false); return;
         }
         console.log("Payment button: Full form validation passed.");

         // 3. Submit data (if enabled)
         const submissionSuccess = await submitToNetlify(paymentButton);
         if (submissionSuccess) {
             console.log("Payment button: Submission OK (or bypassed). Initiating redirect.");
             initiateRedirect(); // Redirect to Stripe
         } else {
             console.warn("Payment button: Submission failed. Redirect aborted.");
             // Error shown by submitToNetlify
         }
     });


    // Prevent Enter Key Submission (Same logic as V2.10)
     bookingForm.addEventListener('keydown', (e) => { /* ... same logic ... */ if (e.key === 'Enter') { const targetElement = e.target; if (targetElement.tagName === 'TEXTAREA') { return; } e.preventDefault(); if (!isAnimating) { console.log(`Enter key pressed on step index ${currentStepIndex}. Triggering action...`); const buttonToClick = (currentStepIndex < PENULTIMATE_VISIBLE_STEP_INDEX) ? nextButton : (currentStepIndex === PENULTIMATE_VISIBLE_STEP_INDEX && HAS_SEPARATE_DISCLAIMER_STEP) ? proceedToDisclaimersButton : paymentButton; buttonToClick?.click(); } } });

    // setupRealtimeValidation (Same logic as V2.10)
    const setupRealtimeValidation = () => { /* ... same logic ... */ console.log("Setting up realtime validation listeners..."); bookingForm?.querySelectorAll('input:not([type=checkbox]), select, textarea').forEach(field => { field.addEventListener('blur', () => { if (formAttemptedSubmit || hasClass(field, 'input-error')) { validateField(field); } }); const eventType = (field.tagName === 'SELECT' || ['date', 'time', 'number', 'checkbox'].includes(field.type)) ? 'change' : 'input'; field.addEventListener(eventType, () => { if(hasClass(field, 'input-error')) { validateField(field); } }); }); const finalStepCheckboxes = formSteps[PAYMENT_STEP_INDEX]?.querySelectorAll('input[type="checkbox"][required]'); if (finalStepCheckboxes && finalStepCheckboxes.length > 0) { finalStepCheckboxes.forEach(cb => { cb.addEventListener('change', () => { console.log(`Checkbox ${cb.name || cb.id} changed on final step.`); validateCheckboxesForPaymentButton(); }); }); console.log(`Attached change listeners to ${finalStepCheckboxes.length} checkboxes in final step.`); } else { console.log("No required checkboxes found in the final step to attach listeners to."); } console.log("Realtime validation setup complete."); };


    // --- Scroll-to-Top Logic --- (Same)
    const handleScrollToTopVisibility = () => { /* ... */ if (!scrollToTopButton) return; if (window.scrollY > 300) { if (!hasClass(scrollToTopButton, 'visible')) { showElement(scrollToTopButton); requestAnimationFrame(() => { addClass(scrollToTopButton, 'visible'); }); } } else { if (hasClass(scrollToTopButton, 'visible')) { removeClass(scrollToTopButton, 'visible'); setTimeout(() => { if (window.scrollY <= 300) hideElement(scrollToTopButton); }, 300); } } }; const scrollToTopHandler = () => { /* ... */ gsap.to(window, { duration: 1.0, scrollTo: 0, ease: 'power2.inOut' }); };

    // --- Footer Year & Min Date --- (Same)
    const setFooterYear = () => { /* ... */ if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); } }; const setMinDate = () => { /* ... */ if (dateField) { try { const today = new Date(); const yyyy = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0'); dateField.min = `${yyyy}-${mm}-${dd}`; } catch (e) { console.error("Error setting min date:", e); } } };


    // --- Initialization Function ---
    const initializeBookingForm = () => {
        formSteps.forEach((step, index) => { if (index === 0) { addClass(step, 'active'); setAriaAttribute(step, 'aria-hidden', 'false'); } else { removeClass(step, 'active'); setAriaAttribute(step, 'aria-hidden', 'true'); } removeClass(step, 'exiting'); });
        updateStepIndicators(currentStepIndex); updateNavigationButtons(currentStepIndex);
        setupRealtimeValidation(); setFooterYear(); setMinDate(); handleScrollToTopVisibility();
        const debouncedScrollHandler = debounce(handleScrollToTopVisibility, 100); window.addEventListener('scroll', debouncedScrollHandler); scrollToTopButton?.addEventListener('click', scrollToTopHandler);
        console.log("Booking form initialization complete.");
    };

    // --- Run Initialization ---
    initializeBookingForm();

}); // End DOMContentLoaded