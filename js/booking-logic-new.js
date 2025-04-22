/**
 * JavaScript for Keys by Caleb - Multi-Step Booking Pages (V2.15 - Fixed Hourly Button Logic)
 *
 * Handles:
 * - Google Places Autocomplete for venue address input.
 * - Dynamic detection of 5 or 6 steps.
 * - Multi-step form navigation.
 * - Input validation per step (Errors show on Next/Submit).
 * - Final step checkbox validation ONLY on final submit attempt.
 * - Netlify form submission ONLY on final submit attempt.
 * - Redirect to Stripe on final submit attempt.
 * - Step transitions, summary updates, messages, scroll-to-top, etc.
 */

// --- Google Places Autocomplete Initialization ---
function initMapAutocomplete() {
    console.log("Attempting to initialize Google Places Autocomplete...");
    const addressInput = document.getElementById('venue_address');

    if (addressInput) {
        console.log("Venue address input found, attaching Autocomplete.");
        const autocomplete = new google.maps.places.Autocomplete(addressInput, {
            // Bias results towards North America / US
             componentRestrictions: { country: "us" },
             // Request specific data fields
            fields: ["address_components", "geometry", "icon", "name", "formatted_address"],
            // Types can be 'geocode', 'address', 'establishment', '(regions)', '(cities)'
            types: ["geocode"], // 'geocode' is general, 'address' for specific street addresses
        });

        // Optional: Add listener for when a place is selected
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log("Place selected:", place);
            // You could potentially do more here, like filling other fields
            // or validating the address type if needed.
             // Ensure the input value reflects the selection correctly
             if (place && place.formatted_address) {
                addressInput.value = place.formatted_address;
                // Trigger validation clearance if needed after selection
                // Ensure clearFieldError is accessible or handle error state differently
                 if (typeof clearFieldError === 'function') {
                    clearFieldError(addressInput);
                 }
             }
        });
        console.log("Autocomplete attached to #venue_address.");
    } else {
        console.warn("#venue_address input not found on this page for Autocomplete.");
    }
}
// --- End Google Places Autocomplete ---


document.addEventListener('DOMContentLoaded', () => {
    console.log("Keys by Caleb - Booking Page JS Initialized (V2.15 - Fixed Hourly Button Logic)");

    gsap.registerPlugin(ScrollToPlugin);

    // --- Configuration ---
    const CSS_TRANSITION_DURATION = 400;
    const NETLIFY_SUBMIT_TIMEOUT = 10000;
    const PHONE_PATTERN = /^(\+?1\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/;
    const SUBMIT_DATA_TO_NETLIFY = true; // Keep enabled
    console.log(`Netlify Submission Enabled: ${SUBMIT_DATA_TO_NETLIFY}`);

    // --- Element Cache & Step Config ---
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) { console.error("Booking form not found."); return; }
    const formSteps = Array.from(bookingForm.querySelectorAll('.booking-step'));
    const TOTAL_STEPS = formSteps.length;
    if (TOTAL_STEPS < 5 || TOTAL_STEPS > 6) { console.error(`Incorrect steps found (${TOTAL_STEPS}). Expecting 5 or 6.`); return; }
    const stepIndicators = Array.from(bookingForm.querySelectorAll('.step-indicator'));
    const nextButton = document.getElementById('next-button'); const prevButton = document.getElementById('prev-button'); const proceedToDisclaimersButton = document.getElementById('proceed-to-disclaimers-button'); const paymentButton = document.getElementById('payment-button'); const formMessage = document.getElementById('form-message'); const finalStepElement = formSteps[TOTAL_STEPS - 1]; const finalStepErrorMessage = finalStepElement?.querySelector('#final-step-error');
    const confirmationMessage = document.getElementById('confirmation-message'); const bookingCard = document.querySelector('.booking-card'); const loaderOverlay = document.getElementById('booking-loader-overlay'); const loaderText = document.getElementById('loader-text'); const stepsContainer = document.querySelector('.steps-container'); const summaryFields = { date: document.getElementById('summary-date'), time: document.getElementById('summary-time'), event_type: document.getElementById('summary-event_type'), event_type_hourly: document.getElementById('summary-event_type_hourly'), estimated_duration: document.getElementById('summary-estimated_duration'), venue_name: document.getElementById('summary-venue_name'), venue_address: document.getElementById('summary-venue_address'), piano_availability: document.getElementById('summary-piano_availability'), name: document.getElementById('summary-name'), email: document.getElementById('summary-email'), phone: document.getElementById('summary-phone'), referral: document.getElementById('summary-referral'), message: document.getElementById('summary-message'), }; const confirmName = document.getElementById('confirm-name'); const confirmEmail = document.getElementById('confirm-email'); const header = document.getElementById('main-header'); const scrollToTopButton = document.getElementById('scroll-to-top'); const currentYearSpan = document.getElementById('current-year'); const dateField = document.getElementById('event_date');
    const HAS_SEPARATE_DISCLAIMER_STEP = TOTAL_STEPS === 6;
    // Index of the step VISUALLY BEFORE the final step (where summary is reviewed)
    const PENULTIMATE_VISIBLE_STEP_INDEX = TOTAL_STEPS - 2;
    // Index of the FINAL step (where payment button resides)
    const PAYMENT_STEP_INDEX = TOTAL_STEPS - 1;
    console.log(`Detected ${TOTAL_STEPS} steps. Penultimate Visible Idx: ${PENULTIMATE_VISIBLE_STEP_INDEX}. Payment Step Idx (Final): ${PAYMENT_STEP_INDEX}. Separate Disclaimer Step: ${HAS_SEPARATE_DISCLAIMER_STEP}`);
    let currentStepIndex = 0; let isTransitioning = false; let formAttemptedSubmit = false;

    // --- Helper Functions ---
    // NOTE: Added clearFieldError definition *before* it's used in initMapAutocomplete listener
    const clearFieldError = (field) => { if (!field) return; const name = field.name; const type = field.type; const errorElement = bookingForm?.querySelector(`.error-message[data-for="${name}"]`); removeClass(field, 'input-error'); setAriaAttribute(field, 'aria-invalid', 'false'); if (errorElement) { hideElement(errorElement); errorElement.textContent = ''; const desc = field.getAttribute('aria-describedby'); if(desc && desc.includes(errorElement.id)) { const newDesc = desc.replace(errorElement.id, '').trim(); if(newDesc) setAriaAttribute(field, 'aria-describedby', newDesc); else field.removeAttribute('aria-describedby');}} const label = field.closest('label'); if (label && type === 'checkbox') removeClass(label, 'label-error'); };
    const getElement = (selector) => document.querySelector(selector); const getAllElements = (selector) => Array.from(document.querySelectorAll(selector)); const showElement = (el) => el?.classList.remove('hidden'); const hideElement = (el) => el?.classList.add('hidden'); const addClass = (el, className) => el?.classList.add(className); const removeClass = (el, className) => el?.classList.remove(className); const hasClass = (el, className) => el?.classList.contains(className); const setAriaAttribute = (el, attr, value) => el?.setAttribute(attr, value); const setVisibility = (el, visible) => { if (el) el.style.visibility = visible ? 'visible' : 'hidden'; }; const debounce = (func, wait) => { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func.apply(this, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; };
    const getHeaderHeight = () => header?.offsetHeight || 70; const scrollIntoViewIfNeeded = (element) => { if (!element) return; const rect = element.getBoundingClientRect(); const headerHeight = getHeaderHeight(); const isAbove = rect.top < headerHeight + 10; const isBelow = rect.bottom > window.innerHeight - 10; if (isAbove || isBelow) { const elementTopRelativeToDocument = window.scrollY + rect.top; const targetScrollY = elementTopRelativeToDocument - headerHeight - 30; window.scrollTo({ top: targetScrollY, behavior: 'smooth' }); } };
    const disableButton = (button) => { if (button) { button.disabled = true; addClass(button, 'btn-disabled'); } }; const enableButton = (button) => { if (button) { button.disabled = false; removeClass(button, 'btn-disabled'); } };
    const setButtonLoading = (button, isLoading, loadingText = "Processing...") => { if (!button) return; if (isLoading) { button.disabled = true; addClass(button, 'loading'); setAriaAttribute(button, 'aria-busy', 'true'); setAriaAttribute(button, 'aria-live', 'assertive'); if (!button.dataset.originalText) { button.dataset.originalText = button.textContent.trim(); } button.innerHTML = `${loadingText}`; } else { if (hasClass(button, 'loading')) { button.disabled = false; removeClass(button, 'loading'); setAriaAttribute(button, 'aria-busy', 'false'); if(button.dataset.originalText) { button.textContent = button.dataset.originalText; } } } };
    const showFormMessage = (message, type = 'error', targetElement = formMessage) => { console.log(`Showing message (${type}) in ${targetElement?.id || 'default area'}: ${message}`); if (targetElement) { targetElement.textContent = message; targetElement.className = `form-message-area visible ${type}`; setAriaAttribute(targetElement, 'role', 'alert'); scrollIntoViewIfNeeded(targetElement); } };
    const hideFormMessage = (targetElement = formMessage) => { if (targetElement && hasClass(targetElement, 'visible')) { removeClass(targetElement, 'visible'); removeClass(targetElement, 'success'); removeClass(targetElement, 'error'); targetElement.textContent = ''; } };

    // --- Data Formatting ---
    const getValue = (formData, key, defaultValue = '-') => formData.get(key)?.trim() || defaultValue; const formatDate = (dateStr) => { /* ... */ if (!dateStr) return '-'; try { const parts = dateStr.split('-'); if (parts.length !== 3) throw new Error("Invalid date format"); const year = parseInt(parts[0]); const month = parseInt(parts[1]) - 1; const day = parseInt(parts[2]); const date = new Date(Date.UTC(year, month, day)); if (isNaN(date.getTime())) throw new Error("Invalid date"); return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); } catch { return '-'; } }; const formatTime = (timeStr) => { /* ... */ if (!timeStr) return '-'; try { const [hours, minutes] = timeStr.split(':'); if (hours === undefined || minutes === undefined) throw new Error("Invalid time format"); const date = new Date(); date.setHours(parseInt(hours), parseInt(minutes), 0, 0); if (isNaN(date.getTime())) throw new Error("Invalid time"); return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); } catch { return '-'; } }; const formatPhone = (phoneStr) => { /* ... */ const rawValue = phoneStr?.trim(); if (!rawValue) return 'Not provided'; const cleaned = rawValue.replace(/\D/g, ''); const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/); if (match) { return `(${match[1]}) ${match[2]}-${match[3]}`; } return rawValue !== '-' ? rawValue : 'Not provided'; }; const formatSelection = (selectValue, defaultValue = '-') => { /* ... */ const value = selectValue?.trim(); if (!value || value === "Unknown") return defaultValue; return value.replace(/_/g, ' '); }; const formatNotes = (notesValue) => { /* ... */ const value = notesValue?.trim(); return value || 'No additional notes.'; }; const formatDuration = (durationStr) => { const val = durationStr?.trim(); return val ? `${val}` : '-'; };

    // --- Core Multi-Step Logic ---
    const updateStepIndicators = (index) => { /* ... same logic ... */ stepIndicators.forEach((indicator, i) => { const stepNumber = parseInt(indicator.dataset.step || '0', 10) - 1; const connector = indicator.previousElementSibling; removeClass(indicator, 'active'); removeClass(indicator, 'completed'); setAriaAttribute(indicator, 'aria-selected', 'false'); if (stepNumber === index) { addClass(indicator, 'active'); setAriaAttribute(indicator, 'aria-selected', 'true'); if (connector && hasClass(indicator.previousElementSibling?.previousElementSibling, 'completed')) { addClass(connector, 'completed'); } else if (connector) { removeClass(connector, 'completed'); } } else if (stepNumber < index) { addClass(indicator, 'completed'); const nextConnector = indicator.nextElementSibling; if (nextConnector && hasClass(nextConnector, 'step-connector')) { addClass(nextConnector, 'completed'); } } else { if (connector && hasClass(connector, 'step-connector')) { if (!hasClass(indicator.previousElementSibling?.previousElementSibling, 'completed')) { removeClass(connector, 'completed'); } } const nextConnector = indicator.nextElementSibling; if (nextConnector && hasClass(nextConnector, 'step-connector')) { removeClass(nextConnector, 'completed'); } } }); };

    // *** CORRECTED Button Logic (V2.15) ***
    const updateNavigationButtons = (index) => {
        console.log(`Updating buttons for step index: ${index}`);
        setVisibility(prevButton, index > 0);
        hideElement(nextButton);
        hideElement(proceedToDisclaimersButton);
        hideElement(paymentButton);
        enableButton(prevButton); // Ensure prev is enabled if visible

        if (index < PAYMENT_STEP_INDEX) {
            // If NOT the final step
            if (index === PENULTIMATE_VISIBLE_STEP_INDEX && HAS_SEPARATE_DISCLAIMER_STEP) {
                // Special case: 6-step form, step before final -> Show "Proceed"
                console.log("Showing 'Proceed to Disclaimers' button");
                showElement(proceedToDisclaimersButton);
                enableButton(proceedToDisclaimersButton);
            } else {
                // All other steps before final (including penultimate on 5-step) -> Show "Next"
                console.log("Showing 'Next' button");
                showElement(nextButton);
                enableButton(nextButton);
            }
        } else if (index === PAYMENT_STEP_INDEX) {
            // If it IS the final step -> Show "Payment"
            console.log("Showing 'Payment' button (Final Step)");
            showElement(paymentButton);
            updatePaymentButtonState(); // Enable/disable based on checkboxes
        }
    };
    // *** End CORRECTED Button Logic ***

    const updateBookingSummary = () => { /* ... same logic V2.10 ... */ if (!bookingForm) return; const formData = new FormData(bookingForm); if (summaryFields.date) summaryFields.date.textContent = formatDate(formData.get('event_date')); if (summaryFields.time) summaryFields.time.textContent = formatTime(formData.get('event_time')); if (summaryFields.venue_name) summaryFields.venue_name.textContent = getValue(formData, 'venue_name', 'Not specified'); if (summaryFields.venue_address) summaryFields.venue_address.textContent = getValue(formData, 'venue_address'); if (summaryFields.piano_availability) summaryFields.piano_availability.textContent = formatSelection(formData.get('piano_availability'), 'Unknown'); if (summaryFields.name) summaryFields.name.textContent = getValue(formData, 'name'); if (summaryFields.email) summaryFields.email.textContent = getValue(formData, 'email'); if (summaryFields.phone) summaryFields.phone.textContent = formatPhone(formData.get('phone')); if (summaryFields.referral) summaryFields.referral.textContent = formatSelection(formData.get('referral'), 'Not specified'); if (summaryFields.event_type) summaryFields.event_type.textContent = formatSelection(formData.get('event_type'), 'Not selected'); if (summaryFields.event_type_hourly) summaryFields.event_type_hourly.textContent = formatSelection(formData.get('event_type_hourly'), 'Not selected'); if (summaryFields.estimated_duration) summaryFields.estimated_duration.textContent = formatDuration(formData.get('estimated_duration')); if (summaryFields.message) summaryFields.message.textContent = formatNotes(formData.get('message') || formData.get('message_hourly')); const nameValue = getValue(formData, 'name', 'there'); const emailValue = getValue(formData, 'email', 'your email address'); if (confirmName) confirmName.textContent = nameValue; if (confirmEmail) confirmEmail.textContent = emailValue; };
    const navigateToStep = (targetIndex, isMovingForward = true) => { /* ... same logic V2.10 ... */ console.log(`MapsToStep: current=${currentStepIndex}, target=${targetIndex}, forward=${isMovingForward}`); if (isTransitioning || targetIndex < 0 || targetIndex >= TOTAL_STEPS || targetIndex === currentStepIndex) { console.log(`MapsToStep blocked: transitioning=${isTransitioning}, target valid=${targetIndex >= 0 && targetIndex < TOTAL_STEPS}, target same=${targetIndex === currentStepIndex}`); return; } isTransitioning = true; if (targetIndex === PENULTIMATE_VISIBLE_STEP_INDEX) { console.log("Navigating to Review Step (visually) - updating summary."); updateBookingSummary(); } if (currentStepIndex === PAYMENT_STEP_INDEX) { hideFormMessage(finalStepErrorMessage); } const currentStepElement = formSteps[currentStepIndex]; const targetStepElement = formSteps[targetIndex]; disableButton(prevButton); disableButton(nextButton); disableButton(proceedToDisclaimersButton); disableButton(paymentButton); if (currentStepElement) { addClass(currentStepElement, 'exiting'); setAriaAttribute(currentStepElement, 'aria-hidden', 'true'); } if (targetStepElement) { removeClass(targetStepElement, 'exiting'); addClass(targetStepElement, 'active'); setAriaAttribute(targetStepElement, 'aria-hidden', 'false'); } updateStepIndicators(targetIndex); updateNavigationButtons(targetIndex); setTimeout(() => { if (currentStepElement) { removeClass(currentStepElement, 'active'); removeClass(currentStepElement, 'exiting'); } currentStepIndex = targetIndex; isTransitioning = false; console.log(`MapsToStep complete. New currentStepIndex: ${currentStepIndex}`); updateNavigationButtons(currentStepIndex); if (bookingCard) { const stepTitle = targetStepElement?.querySelector('.step-title'); scrollIntoViewIfNeeded(stepTitle || targetStepElement || bookingCard); } }, CSS_TRANSITION_DURATION); };


    // --- Validation Logic ---
    // *** validateField: Returns true/false, does NOT handle UI ***
    const validateField = (field) => {
        if (!field) return true; let isValid = true; const value = field.value.trim(); const type = field.type; const isRequired = field.required;
        if (isRequired) { if (type === 'checkbox' && !field.checked) isValid = false; else if (type !== 'checkbox' && value === '') isValid = false; }
        if (isValid && value !== '') { switch (type) { case 'email': if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) isValid = false; break; case 'date': try { const d = new Date(value + 'T00:00:00'), t = new Date(); t.setHours(0,0,0,0); if (isNaN(d.getTime()) || d < t) isValid = false; } catch { isValid = false; } break; case 'tel': if (!PHONE_PATTERN.test(value)) isValid = false; break; case 'number': if (field.min && parseFloat(value) < parseFloat(field.min)) isValid = false; break; } }
        return isValid;
    };
    // *** showFieldError / clearFieldError: Handle UI updates ***
    const showFieldError = (field) => { if (!field) return; const name = field.name; const type = field.type; const errorElement = bookingForm?.querySelector(`.error-message[data-for="${name}"]`); let defaultErrorMessage = "Required"; if(type === 'email') defaultErrorMessage = "Valid Email Required"; else if(type === 'date') defaultErrorMessage = "Future Date Required"; else if(type === 'time') defaultErrorMessage = "Required"; else if(type === 'tel') defaultErrorMessage = "Invalid Format"; else if(type === 'number' && field.min) defaultErrorMessage = `Min ${field.min} required`; else if(type === 'checkbox') defaultErrorMessage = "Required"; addClass(field, 'input-error'); setAriaAttribute(field, 'aria-invalid', 'true'); if (errorElement) { errorElement.textContent = defaultErrorMessage; showElement(errorElement); const desc = field.getAttribute('aria-describedby') || ''; if (!desc.includes(errorElement.id)){field.setAttribute('aria-describedby', (desc + ' ' + errorElement.id).trim());} } const label = field.closest('label'); if (label && type === 'checkbox') addClass(label, 'label-error'); };
    // Clear field error definition moved up for initMapAutocomplete

    // *** validateStep: Uses validateField for logic, calls show/clearFieldError for UI ***
    const validateStep = (stepIndex, showUIErrors = true) => {
         let isStepValid = true;
         const stepElement = formSteps[stepIndex];
         if (!stepElement) return false;
         console.log(`--- Validating Step ${stepIndex + 1} (Show Errors: ${showUIErrors}) ---`);

         stepElement.querySelectorAll('input, select, textarea').forEach(field => {
             const isRequired = field.required;
             const needsFormatCheck = ['email', 'tel', 'date', 'number', 'time'].includes(field.type);
             const hasValue = field.value.trim() !== '';
             let fieldIsValid = true;

             if (isRequired || (needsFormatCheck && hasValue)) {
                 fieldIsValid = validateField(field); // Check logic only
                 if (!fieldIsValid) {
                     isStepValid = false;
                     console.warn(`   Field validation FAILED for: ${field.name || field.id}`);
                     if (showUIErrors) { showFieldError(field); } // Show UI error only if requested
                 } else {
                     clearFieldError(field); // Clear UI error if now valid
                 }
             } else if (!isRequired && !hasValue) {
                 clearFieldError(field); // Clear errors from optional empty fields
             }
         });
         console.log(`--- Step ${stepIndex + 1} validation result: ${isStepValid} ---`);
         return isStepValid;
     };

    // *** updatePaymentButtonState: Only enables/disables button based on checked state ***
    const updatePaymentButtonState = () => {
        const finalStepElement = formSteps[PAYMENT_STEP_INDEX]; if (!finalStepElement) return;
        const checkboxes = finalStepElement.querySelectorAll('input[type="checkbox"][required]');
        if (checkboxes.length === 0) { enableButton(paymentButton); return; } // Enable if no checkboxes
        let allChecked = true;
        checkboxes.forEach(checkbox => { if (!checkbox.checked) { allChecked = false; } });
        if (allChecked) { enableButton(paymentButton); } else { disableButton(paymentButton); }
        console.log(`Payment button state updated based on checkboxes. Enabled: ${allChecked}`);
    };

    // --- Form Submission & Navigation Logic ---
    const submitToNetlify = async (triggeringButton) => { /* ... same V2.11 logic ... */ if (!SUBMIT_DATA_TO_NETLIFY) { console.warn("!!! Netlify submission bypassed. Returning true."); return true; } console.log("Attempting Netlify submission..."); let success = false; hideFormMessage(formMessage); setButtonLoading(triggeringButton, true, "Submitting..."); showElement(loaderOverlay); addClass(loaderOverlay, 'visible'); if(loaderText) loaderText.textContent = "Submitting Request..."; const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), NETLIFY_SUBMIT_TIMEOUT); try { const formData = new FormData(bookingForm); const formName = bookingForm.getAttribute('name'); if (!formData.has('form-name') && formName) { formData.append('form-name', formName); } formSteps[PAYMENT_STEP_INDEX]?.querySelectorAll('input[type="checkbox"][required]').forEach(cb => {formData.append(cb.name, cb.checked);}); const formBody = new URLSearchParams(formData).toString(); console.log("Submitting to Netlify:", formBody); const response = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody, signal: controller.signal }); clearTimeout(timeoutId); if (response.ok) { console.log("Netlify submission successful."); success = true; } else { const errorText = await response.text(); console.error(`Netlify submission failed: Status ${response.status}`, errorText); showFormMessage(`Submission failed (Check Console). Please try again or contact us.`, "error", formMessage); success = false; } } catch (error) { clearTimeout(timeoutId); console.error("Error during Netlify submission fetch:", error); if (error.name === 'AbortError') { showFormMessage("Submission timed out. Check connection.", "error", formMessage); } else { showFormMessage("Network error during submission. Please try again.", "error", formMessage); } success = false; } finally { console.log("Netlify submission attempt finished."); removeClass(loaderOverlay, 'visible'); await new Promise(resolve => setTimeout(resolve, CSS_TRANSITION_DURATION)); hideElement(loaderOverlay); setButtonLoading(triggeringButton, false); console.log(`submitToNetlify returning: ${success}`); return success; }};
    // handleFullFormValidation: Validates steps UP TO a certain index, shows errors
    const handleFullFormValidation = (lastStepToIndex) => { console.log(`--- Running full validation up to step index ${lastStepToIndex}, showing errors ---`); let isAllValid = true; for (let i = 0; i <= lastStepToIndex; i++) { if (!validateStep(i, true)) { isAllValid = false; console.log(`Full validation failed on step ${i + 1}`); if (currentStepIndex !== i) { console.log(`Navigating back to failed step ${i+1}`); navigateToStep(i, false); } setTimeout(() => { showFormMessage("Please correct the errors highlighted above.", "error"); const firstError = formSteps[i]?.querySelector('.input-error'); if (firstError) { console.log(`Scrolling to first error in step ${i+1}:`, firstError); firstError.focus({preventScroll: true}); scrollIntoViewIfNeeded(firstError.closest('.input-group') || firstError); } }, currentStepIndex !== i ? CSS_TRANSITION_DURATION + 50 : 0); break; } } console.log(`--- Full validation result up to step ${lastStepToIndex + 1}: ${isAllValid} ---`); return isAllValid; };
    const initiateRedirect = () => { /* ... same logic V2.11 ... */ console.log("--- initiateRedirect called ---"); const stripeLink = paymentButton?.dataset.stripeLink; if (!stripeLink || stripeLink === '#') { console.error("Stripe link is missing or invalid for the payment button. Value:", stripeLink); showFormMessage("Payment link is currently unavailable. Please contact us.", "error", finalStepErrorMessage); scrollIntoViewIfNeeded(finalStepErrorMessage); setButtonLoading(paymentButton, false); return; } console.log("Checkboxes validated. Redirecting to Stripe:", stripeLink); setButtonLoading(paymentButton, true, "Redirecting..."); showElement(loaderOverlay); addClass(loaderOverlay, 'visible'); if(loaderText) loaderText.textContent = "Redirecting to Secure Payment..."; setTimeout(() => { window.location.href = stripeLink; }, 150); };

    // --- Event Listeners ---
    // Next Button: Validates CURRENT step, shows errors, then navigates
    nextButton?.addEventListener('click', () => { console.log("Next button clicked."); hideFormMessage(); if (validateStep(currentStepIndex, true)) { formAttemptedSubmit = true; navigateToStep(currentStepIndex + 1, true); } else { console.warn(`Next button: Validation failed for step ${currentStepIndex + 1}`); showFormMessage("Please correct the errors highlighted above.", "error"); const firstError = formSteps[currentStepIndex]?.querySelector('.input-error'); if (firstError) { firstError.focus({preventScroll: true}); scrollIntoViewIfNeeded(firstError.closest('.input-group') || firstError); } } });
    // Prev Button: Just navigates
    prevButton?.addEventListener('click', () => { console.log("Prev button clicked."); hideFormMessage(); hideFormMessage(finalStepErrorMessage); navigateToStep(currentStepIndex - 1, false); });
    // Edit Link: Just navigates
    bookingForm.addEventListener('click', (e) => { /* ... same V2.11 ... */ const target = e.target.closest('.summary-edit-link'); if (target && target.dataset.targetStep && (currentStepIndex === PENULTIMATE_VISIBLE_STEP_INDEX || currentStepIndex === PAYMENT_STEP_INDEX)) { const targetStepIndex = parseInt(target.dataset.targetStep, 10) - 1; if (!isNaN(targetStepIndex) && targetStepIndex < currentStepIndex) { console.log(`Edit link clicked, navigating to step ${targetStepIndex + 1}`); hideFormMessage(); hideFormMessage(finalStepErrorMessage); navigateToStep(targetStepIndex, false); } } });

    // Proceed Button (Step BEFORE final on 6-step forms ONLY)
    proceedToDisclaimersButton?.addEventListener('click', async () => {
         console.log("Proceed to Disclaimers button clicked.");
         if (!HAS_SEPARATE_DISCLAIMER_STEP || currentStepIndex !== PENULTIMATE_VISIBLE_STEP_INDEX) { console.warn("Proceed button clicked on wrong step/form type."); return; }
         formAttemptedSubmit = true;
         // Validate ALL previous steps, SHOW errors if invalid
         if (!handleFullFormValidation(PENULTIMATE_VISIBLE_STEP_INDEX)) {
             return; // Stop if validation fails
         }
         console.log("Proceed button: Validation passed. Navigating...");
         // Navigate to final step - NO SUBMISSION HERE
         navigateToStep(PAYMENT_STEP_INDEX, true);
     });

     // Final Payment Button (Final Step on ALL forms)
     paymentButton?.addEventListener('click', async () => {
         console.log("Final Payment button clicked.");
         if (currentStepIndex !== PAYMENT_STEP_INDEX) { console.warn("Payment button clicked on wrong step."); return; }
         formAttemptedSubmit = true; // Mark final attempt
         setButtonLoading(paymentButton, true, "Checking...");
         hideFormMessage(finalStepErrorMessage); // Clear previous final step errors

         // 1. Validate THIS step's checkboxes, SHOW errors if invalid
         let checkboxesValid = true;
         const finalStepCheckboxes = formSteps[PAYMENT_STEP_INDEX]?.querySelectorAll('input[type="checkbox"][required]');
         if (finalStepCheckboxes && finalStepCheckboxes.length > 0) {
            finalStepCheckboxes.forEach(cb => {
                 // Use validateField to check logic, use showFieldError to display UI error if needed
                 if (!validateField(cb)) {
                     checkboxesValid = false;
                     showFieldError(cb); // Explicitly show UI error on submit attempt
                 } else {
                    clearFieldError(cb); // Clear error if it was previously shown but now checked
                 }
             });
         }

         if (!checkboxesValid) {
             console.warn("Payment button: Checkbox validation failed.");
             showFormMessage("Please agree to the terms above to proceed.", "error", finalStepErrorMessage);
             scrollIntoViewIfNeeded(finalStepErrorMessage || formSteps[PAYMENT_STEP_INDEX].querySelector('.agreement-checkboxes'));
             setButtonLoading(paymentButton, false);
             return;
         }
         console.log("Payment button: Checkbox validation passed.");

         // 2. Validate ALL previous steps (show errors if any)
         if (!handleFullFormValidation(PENULTIMATE_VISIBLE_STEP_INDEX)) {
             console.warn("Payment button: Validation of previous steps failed.");
             setButtonLoading(paymentButton, false);
             return;
         }
         console.log("Payment button: Full form validation passed.");

         // 3. If ALL validation passes, SUBMIT data to Netlify (if enabled)
         setButtonLoading(paymentButton, true, "Submitting..."); // Update loading text
         const submissionSuccess = await submitToNetlify(paymentButton);

         if (submissionSuccess) {
             // 4. Redirect to Stripe
             console.log("Payment button: Submission OK. Proceeding to redirect.");
             initiateRedirect();
             // No need to restore button state as page redirects
         } else {
             // Submission failed, error message shown by submitToNetlify
             console.error("Payment button: Submission failed. Redirect aborted.");
             // Button loading state reset within submitToNetlify's finally block
             scrollIntoViewIfNeeded(formMessage); // Ensure general error msg is visible
         }
     });

    // Enter Key Handling
    bookingForm.addEventListener('keydown', (e) => { /* ... same V2.13 ... */ if (e.key === 'Enter') { const targetElement = e.target; if (targetElement.tagName === 'TEXTAREA') { return; } e.preventDefault(); if (!isTransitioning) { console.log(`Enter key pressed on step index ${currentStepIndex}. Triggering action...`); const buttonToClick = (currentStepIndex < PENULTIMATE_VISIBLE_STEP_INDEX) ? nextButton : (currentStepIndex === PENULTIMATE_VISIBLE_STEP_INDEX && HAS_SEPARATE_DISCLAIMER_STEP) ? proceedToDisclaimersButton : paymentButton; buttonToClick?.click(); } } });

    // Realtime Validation Setup
    const setupRealtimeValidation = () => {
        console.log("Setting up realtime validation listeners...");
        // Validate standard fields on blur AFTER first submit attempt or if field already has error
        bookingForm?.querySelectorAll('input:not([type=checkbox]), select, textarea').forEach(field => {
            field.addEventListener('blur', () => {
                // Only show error UI on blur if user tried proceeding OR field already had error
                if (formAttemptedSubmit || hasClass(field, 'input-error')) {
                    if (!validateField(field)) { // Check validity
                        showFieldError(field);    // Show error if invalid
                    } else {
                        clearFieldError(field);   // Clear if valid
                    }
                }
            });
            // Clear errors instantly on input/change for better UX
             const eventType = (field.tagName === 'SELECT' || ['date', 'time', 'number'].includes(field.type)) ? 'change' : 'input';
             field.addEventListener(eventType, () => { if (hasClass(field, 'input-error')) { clearFieldError(field); } });
        });
        // Checkboxes in the FINAL step ONLY update the payment button state on change
        const finalStepCheckboxes = formSteps[PAYMENT_STEP_INDEX]?.querySelectorAll('input[type="checkbox"][required]');
        if (finalStepCheckboxes && finalStepCheckboxes.length > 0) {
            finalStepCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    console.log(`Checkbox ${cb.name || cb.id} changed on final step.`);
                    updatePaymentButtonState(); // ONLY check state and toggle button
                    // Clear visual error for this specific checkbox if it's now checked
                    if(cb.checked) { clearFieldError(cb); }
                });
            });
            console.log(`Attached change listeners to ${finalStepCheckboxes.length} checkboxes in final step.`);
        } else { console.log("No required checkboxes found in the final step to attach listeners to."); }
        console.log("Realtime validation setup complete.");
    };

    // --- Scroll-to-Top Logic --- (Same)
    const handleScrollToTopVisibility = () => { /* ... */ if (!scrollToTopButton) return; if (window.scrollY > 300) { if (!hasClass(scrollToTopButton, 'visible')) { showElement(scrollToTopButton); requestAnimationFrame(() => { addClass(scrollToTopButton, 'visible'); }); } } else { if (hasClass(scrollToTopButton, 'visible')) { removeClass(scrollToTopButton, 'visible'); setTimeout(() => { if (window.scrollY <= 300) hideElement(scrollToTopButton); }, 300); } } }; const scrollToTopHandler = () => { /* ... */ gsap.to(window, { duration: 1.0, scrollTo: 0, ease: 'power2.inOut' }); };

    // --- Footer Year & Min Date --- (Same)
    const setFooterYear = () => { /* ... */ if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); } }; const setMinDate = () => { /* ... */ if (dateField) { try { const today = new Date(); const year = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0'); dateField.min = `${year}-${mm}-${dd}`; } catch (e) { console.error("Error setting min date for booking form:", e); } } };

    // --- Initialization Function ---
    const initializeBookingForm = () => { /* ... same ... */ formSteps.forEach((step, index) => { if (index === 0) { addClass(step, 'active'); setAriaAttribute(step, 'aria-hidden', 'false'); } else { removeClass(step, 'active'); setAriaAttribute(step, 'aria-hidden', 'true'); } removeClass(step, 'exiting'); }); updateStepIndicators(currentStepIndex); updateNavigationButtons(currentStepIndex); setupRealtimeValidation(); setFooterYear(); setMinDate(); handleScrollToTopVisibility(); const debouncedScrollHandler = debounce(handleScrollToTopVisibility, 100); window.addEventListener('scroll', debouncedScrollHandler); scrollToTopButton?.addEventListener('click', scrollToTopHandler); console.log("Booking form initialization complete."); };

    // --- Run Initialization ---
    initializeBookingForm();

    // --- Expose initMapAutocomplete globally ---
    // Make sure the function is defined *before* this line
    window.initMapAutocomplete = initMapAutocomplete;

}); // End DOMContentLoaded