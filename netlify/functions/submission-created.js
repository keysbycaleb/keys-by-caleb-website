// netlify/functions/submission-created.js (V2.12 - Enhanced API Logging)

const { google } = require('googleapis');

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const SHEET_COLUMN_ORDER = [
    'Timestamp', 'Form Name', 'Name', 'Email', 'Phone', 'Event Date', 'Event Time',
    'Estimated Duration', 'Event Type', 'Venue Name', 'Venue Address',
    'Piano Availability', 'Referral', 'Message', 'Agreed Scope Term', 'Agreed Payment Term'
];

exports.handler = async (event, context) => {
    console.log('V2.12: Submission-created function triggered.');

    if (!GOOGLE_SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        const errorMsg = 'FATAL ERROR: Missing required Google credentials environment variables.';
        console.error(errorMsg);
        return { statusCode: 200, body: `Internal configuration error.` };
    }

    let payloadData = {};
    try {
        // 1. Parse Data
        if (event.body) {
             try { payloadData = JSON.parse(event.body)?.payload?.data || {}; }
             catch (e) { payloadData = Object.fromEntries(new URLSearchParams(event.body).entries()); }
        } else { throw new Error("Event body is missing."); }
        const formName = payloadData['form-name'] || 'Unknown Form'; // Check for form-name here
        console.log(`Processing submission for form: ${formName}`);
        console.log('Parsed Payload Data:', payloadData);

        // 2. Prepare Row
        const timestamp = new Date().toISOString();
        const dataRow = SHEET_COLUMN_ORDER.map(header => {
            const key = header.toLowerCase().replace(/ /g, '_');
            const alternativeKey = header;
            switch (header) {
                case 'Timestamp': return timestamp;
                case 'Form Name': return formName;
                case 'Event Type': return payloadData['event_type'] || payloadData['event_type_hourly'] || '';
                case 'Message': return payloadData['message'] || payloadData['message_hourly'] || '';
                case 'Estimated Duration': return payloadData['estimated_duration'] || '';
                case 'Agreed Scope Term': return payloadData['agree_scope'] || payloadData['agree_hourly_deposit'] || '';
                case 'Agreed Payment Term': return payloadData['agree_payment'] || payloadData['agree_hourly_balance'] || '';
                default: return payloadData[key] || payloadData[alternativeKey] || '';
            }
        });
        console.log('Formatted Data Row:', dataRow);

        // 3. Authenticate
        console.log("Attempting Google JWT authentication...");
        const auth = new google.auth.JWT(
            GOOGLE_CLIENT_EMAIL,
            null,
            GOOGLE_PRIVATE_KEY,
            SCOPES
        );
        console.log("Google JWT Auth object created.");

        // 4. Get Sheets API client
        const sheets = google.sheets({ version: 'v4', auth });
        console.log("Google Sheets API client created.");

        // 5. Append data
        const range = `${GOOGLE_SHEET_NAME}!A1`;
        const resource = { values: [dataRow] };
        console.log(`Attempting Google Sheets API call: sheets.spreadsheets.values.append to ${GOOGLE_SHEET_ID} range ${range}`);

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: resource,
        });

         // *** ADDED LOG for success case ***
         console.log('Google Sheets API call FINISHED.');
         console.log('Google Sheets API response Status:', response.status);
         console.log('Cells updated:', response.data?.updates?.updatedRange);

        // 6. Return success
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Submission processed successfully' }),
        };

    } catch (error) {
         // *** ENHANCED ERROR LOGGING ***
         console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
         console.error('!!! ERROR Processing Submission:', error.message);
         console.error('!!! Full Error Object:', error);
         if (error.response?.data?.error) {
             console.error('!!! Google API Error Details:', error.response.data.error);
         }
         if (error.stack) {
             console.error('!!! Stack Trace:', error.stack);
         }
         console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

        return {
            statusCode: 200, // Still return 200 for background func to avoid retries
            body: `Internal error processing submission. Check function logs. Error: ${error.message}`,
        };
    }
};