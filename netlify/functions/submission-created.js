// netlify/functions/submission-created.js (V2.18 - Corrected Contact Form Mapping)

const { google } = require('googleapis');

// --- Configuration ---
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// --- End Configuration ---

// Define the order of columns in your Google Sheet
// ** IMPORTANT: Ensure this order EXACTLY matches your Google Sheet columns **
const SHEET_COLUMN_ORDER = [
    'Timestamp', 'Form Name', 'Name', 'Email', 'Phone', 'Event Date', 'Event Time',
    'Estimated Duration', 'Event Type', 'Venue Name', 'Venue Address',
    'Piano Availability', 'Referral', 'Message', 'Agreed Scope Term', 'Agreed Payment Term'
];
const LAST_COLUMN_LETTER = 'P'; // Keep this updated if columns change (P is 16th letter)
const range = `${GOOGLE_SHEET_NAME}!A:${LAST_COLUMN_LETTER}`; // Use sheet name var

// Main function handler
exports.handler = async (event, context) => {
    console.log('V2.18 Corrected Contact Mapping: Submission-created function triggered.'); // Updated log version

    if (!GOOGLE_SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) { /* ... credentials check ... */
        const errorMsg = 'FATAL ERROR: Missing required Google credentials environment variables.'; console.error(errorMsg); return { statusCode: 200, body: `Internal configuration error.` };
    }

    let payload = {};
    let payloadData = {};

    try {
        // 1. Parse Data
        console.log("Raw event body:", event.body);
        if (event.body) {
             try {
                 payload = JSON.parse(event.body)?.payload || {};
                 payloadData = payload.data || {};
             } catch (e) {
                console.error("Error parsing JSON body, attempting URLSearchParams fallback:", e);
                payloadData = Object.fromEntries(new URLSearchParams(event.body).entries());
                payload.form_name = payloadData['form-name']; // Get form name from fallback too
             }
        } else { throw new Error("Event body is missing."); }

        // Determine Form Name robustly
        const formName = payload.form_name || payloadData['form-name'] || 'Unknown Form';
        const isBookingForm = formName.startsWith('booking-'); // Check if it's a booking form

        console.log(`Processing submission for form: ${formName} (Is Booking Form: ${isBookingForm})`);
        console.log('Parsed Payload Data (payload.data):', payloadData);
        console.log("Raw Checkbox Values Received:", { agree_scope: payloadData['agree_scope'], agree_payment: payloadData['agree_payment'], agree_hourly_deposit: payloadData['agree_hourly_deposit'], agree_hourly_balance: payloadData['agree_hourly_balance'] });

        // 2. Prepare Row - CORRECTED MAPPING
        const timestamp = new Date().toISOString();
        const dataRow = SHEET_COLUMN_ORDER.map(header => {
            const key = header.toLowerCase().replace(/ /g, '_'); // e.g., 'event_date'
            const alternativeKey = header; // e.g., 'Event Date'
            let value = '';

            switch (header) {
                case 'Timestamp':
                    value = timestamp;
                    break;
                case 'Form Name':
                    value = formName;
                    break;
                case 'Event Type':
                    // Handles 'event_type' from booking forms OR 'contact_event_type' from contact form
                    value = payloadData['event_type'] || payloadData['event_type_hourly'] || payloadData['event_type'] || ''; // Adjusted to check 'event_type' twice, assuming contact form uses name="event_type"
                    break;
                case 'Message':
                    // All forms use name="message" for the main text area
                    value = payloadData['message'] || '';
                    break;
                case 'Estimated Duration':
                    // Only relevant for booking-hourly form
                    value = payloadData['estimated_duration'] || '';
                    break;
                case 'Agreed Scope Term':
                     // Only populate if it's a booking form AND checkbox exists/checked
                     value = isBookingForm && (payloadData['agree_scope'] || payloadData['agree_hourly_deposit']) ? 'TRUE' : '';
                    break;
                case 'Agreed Payment Term':
                    // Only populate if it's a booking form AND checkbox exists/checked
                    value = isBookingForm && (payloadData['agree_payment'] || payloadData['agree_hourly_balance']) ? 'TRUE' : '';
                    break;
                // Default handles most standard fields by matching keys
                default:
                    // Use lowercase_key first, fallback to Header Case Key if needed
                    value = payloadData[key] || payloadData[alternativeKey] || '';
                    // Specific fix for contact form date field if needed (assuming name="event_date")
                    if (formName === 'contact' && header === 'Event Date') {
                       value = payloadData['event_date'] || ''; // Ensure contact form date maps correctly if name is event_date
                    }
                    // Note: The 'Event Type' case above should handle the contact form's event type if named correctly.
                    break;
            }
            // Ensure the final value is a string for the Sheets API
            return String(value);
        });
        console.log('Formatted Data Row:', dataRow);

        // 3. Authenticate
        console.log("Attempting Google JWT authentication...");
        const auth = new google.auth.JWT( GOOGLE_CLIENT_EMAIL, null, GOOGLE_PRIVATE_KEY, SCOPES );
        console.log("Google JWT Auth object created.");

        // 4. Get Sheets API client
        const sheets = google.sheets({ version: 'v4', auth });
        console.log("Google Sheets API client created.");

        // 5. Append data
        const resource = { values: [dataRow] };
        console.log(`Attempting Google Sheets API call: sheets.spreadsheets.values.append to ${GOOGLE_SHEET_ID} range ${range}`);
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: range, // Use the range defined using GOOGLE_SHEET_NAME
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: resource,
        });
        console.log('Google Sheets API call FINISHED.');
        console.log('Google Sheets API response Status:', response.status);
        console.log('Cells updated:', response.data?.updates?.updatedRange);

        // 6. Return success
        return { statusCode: 200, body: JSON.stringify({ message: 'Submission processed successfully and sent to Google Sheet.' }) };

    } catch (error) { /* ... Enhanced error logging ... */ console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); console.error('!!! ERROR Processing Submission:', error.message); console.error('!!! Full Error Object:', error); if (error.response?.data?.error) { console.error('!!! Google API Error Details:', error.response.data.error); } if (error.stack) { console.error('!!! Stack Trace:', error.stack); } console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); return { statusCode: 200, body: `Internal error processing submission. Check function logs. Error: ${error.message}` }; }
};