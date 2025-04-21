// netlify/functions/submission-created.js (V2.15 - Fix Form Name & Checkbox Logic)

const { google } = require('googleapis');

// --- Configuration ---
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// --- End Configuration ---

// Define the order of columns in your Google Sheet
const SHEET_COLUMN_ORDER = [
    'Timestamp', 'Form Name', 'Name', 'Email', 'Phone', 'Event Date', 'Event Time',
    'Estimated Duration', 'Event Type', 'Venue Name', 'Venue Address',
    'Piano Availability', 'Referral', 'Message', 'Agreed Scope Term', 'Agreed Payment Term'
];
const LAST_COLUMN_LETTER = 'P'; // Adjust if needed

// Main function handler
exports.handler = async (event, context) => {
    console.log('V2.15: Submission-created function triggered.');

    if (!GOOGLE_SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) { /* ... credentials check ... */
        const errorMsg = 'FATAL ERROR: Missing required Google credentials environment variables.'; console.error(errorMsg); return { statusCode: 200, body: `Internal configuration error.` };
    }

    let payload = {}; // To store the entire parsed payload
    let payloadData = {}; // To store the form field data

    try {
        // 1. Parse Data & Extract Form Name Correctly
        if (event.body) {
             try {
                 payload = JSON.parse(event.body)?.payload || {}; // Get the whole payload
                 payloadData = payload.data || {}; // Extract form fields
             } catch (e) {
                console.error("Error parsing JSON body, attempting URLSearchParams fallback:", e);
                payloadData = Object.fromEntries(new URLSearchParams(event.body).entries());
                // Try to get form name from hidden input if JSON parse failed
                payload.form_name = payloadData['form-name'];
             }
        } else { throw new Error("Event body is missing."); }

        // *** FIXED: Get form name from payload.form_name ***
        const formName = payload.form_name || payloadData['form-name'] || 'Unknown Form';
        console.log(`Processing submission for form: ${formName}`);
        console.log('Parsed Payload Data (payload.data):', payloadData);

        // *** Log checkbox values as received ***
        console.log("Raw Checkbox Values Received:", {
            agree_scope: payloadData['agree_scope'],
            agree_payment: payloadData['agree_payment'],
            agree_hourly_deposit: payloadData['agree_hourly_deposit'],
            agree_hourly_balance: payloadData['agree_hourly_balance']
        });

        // 2. Prepare Row
        const timestamp = new Date().toISOString();
        const dataRow = SHEET_COLUMN_ORDER.map(header => {
            const key = header.toLowerCase().replace(/ /g, '_');
            const alternativeKey = header; // Try exact match too
            let value = ''; // Default to empty string

            switch (header) {
                case 'Timestamp': value = timestamp; break;
                case 'Form Name': value = formName; break;
                case 'Event Type': value = payloadData['event_type'] || payloadData['event_type_hourly'] || ''; break;
                case 'Message': value = payloadData['message'] || payloadData['message_hourly'] || ''; break;
                case 'Estimated Duration': value = payloadData['estimated_duration'] || ''; break;
                // *** FIXED: Checkbox Logic - Check for "on" or boolean true ***
                case 'Agreed Scope Term':
                    const scopeVal = payloadData['agree_scope'] || payloadData['agree_hourly_deposit'];
                    value = (scopeVal && String(scopeVal).toLowerCase() === 'on') || scopeVal === true ? 'TRUE' : '';
                    break;
                case 'Agreed Payment Term':
                    const paymentVal = payloadData['agree_payment'] || payloadData['agree_hourly_balance'];
                    value = (paymentVal && String(paymentVal).toLowerCase() === 'on') || paymentVal === true ? 'TRUE' : '';
                    break;
                // Default lookup using derived key or original header
                default: value = payloadData[key] || payloadData[alternativeKey] || ''; break;
            }
            // Ensure value is a string for Sheets API
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
        const range = `${GOOGLE_SHEET_NAME}!A:${LAST_COLUMN_LETTER}`; // Use sheet name and column range
        const resource = { values: [dataRow] };
        console.log(`Attempting Google Sheets API call: sheets.spreadsheets.values.append to ${GOOGLE_SHEET_ID} range ${range}`);
        const response = await sheets.spreadsheets.values.append({ spreadsheetId: GOOGLE_SHEET_ID, range: range, valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS', resource: resource });
        console.log('Google Sheets API call FINISHED.'); console.log('Google Sheets API response Status:', response.status); console.log('Cells updated:', response.data?.updates?.updatedRange);

        // 6. Return success
        return { statusCode: 200, body: JSON.stringify({ message: 'Submission processed successfully and sent to Google Sheet.' }) };

    } catch (error) { /* ... Enhanced error logging ... */ console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); console.error('!!! ERROR Processing Submission:', error.message); console.error('!!! Full Error Object:', error); if (error.response?.data?.error) { console.error('!!! Google API Error Details:', error.response.data.error); } if (error.stack) { console.error('!!! Stack Trace:', error.stack); } console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); return { statusCode: 200, body: `Internal error processing submission. Check function logs. Error: ${error.message}` }; }
};