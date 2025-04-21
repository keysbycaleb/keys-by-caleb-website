// netlify/functions/submission-created.js (FINAL VERSION with Google Sheets Logic)

// Import the Google APIs client library
const { google } = require('googleapis');

// --- Configuration - Read from Netlify Environment Variables ---
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
// Handle escaped newlines in the private key environment variable
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1'; // Default to 'Sheet1' if not set
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// --- End Configuration ---

// Define the order of columns in your Google Sheet (MUST MATCH YOUR SHEET EXACTLY)
// Use the version you confirmed was correct for your Sheet
const SHEET_COLUMN_ORDER = [
    'Timestamp', 'Form Name', 'Name', 'Email', 'Phone', 'Event Date', 'Event Time',
    'Estimated Duration', 'Event Type', 'Venue Name', 'Venue Address',
    'Piano Availability', 'Referral', 'Message', 'Agreed Scope Term', 'Agreed Payment Term'
];

// Main function handler triggered by Netlify 'submission-created' event
exports.handler = async (event, context) => {
    console.log('Submission-created function triggered.');

    // Basic check for required environment variables
    if (!GOOGLE_SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        const errorMsg = 'FATAL ERROR: Missing required Google credentials environment variables.';
        console.error(errorMsg);
        // Return 200 to Netlify so it doesn't retry, but log the critical failure
        return { statusCode: 200, body: `Internal configuration error.` };
    }

    try {
        // 1. Parse the submission data from the event body
        // The actual submission data is nested under 'payload' for submission-created events
        let payloadData = {};
        if (event.body) {
            try {
                payloadData = JSON.parse(event.body)?.payload?.data || {};
                 console.log('Parsed Payload Data:', payloadData);
            } catch (parseError) {
                console.error("Error parsing event body JSON:", parseError);
                // Attempt fallback parsing if not JSON (though submission-created usually is)
                const submissionData = new URLSearchParams(event.body);
                payloadData = Object.fromEntries(submissionData.entries());
                console.log('Fallback Parsed Data (URLSearchParams):', payloadData);
                if (!payloadData['form-name']) { // If still can't get form name, fail gracefully
                     throw new Error("Could not parse form data from event body.");
                }
            }
        } else {
             throw new Error("Event body is missing.");
        }

        // Get form name
        const formName = payloadData['form-name'] || 'Unknown Form';
        console.log(`Processing submission for form: ${formName}`);

        // 2. Prepare data row for Google Sheets
        const timestamp = new Date().toISOString();
        const dataRow = SHEET_COLUMN_ORDER.map(header => {
            // Map known header names to potential form field names
            // Handles case variations and minor differences automatically if possible
            const key = header.toLowerCase().replace(/ /g, '_');
            const alternativeKey = header; // Try exact match too

            switch (header) {
                case 'Timestamp': return timestamp;
                case 'Form Name': return formName;
                // Handle fields that might have different names across forms
                case 'Event Type': return payloadData['event_type'] || payloadData['event_type_hourly'] || '';
                case 'Message': return payloadData['message'] || payloadData['message_hourly'] || '';
                case 'Estimated Duration': return payloadData['estimated_duration'] || ''; // Only on hourly
                case 'Agreed Scope Term': return payloadData['agree_scope'] || payloadData['agree_hourly_deposit'] || '';
                case 'Agreed Payment Term': return payloadData['agree_payment'] || payloadData['agree_hourly_balance'] || '';
                // Default lookup
                default: return payloadData[key] || payloadData[alternativeKey] || '';
            }
        });

        console.log('Formatted Data Row:', dataRow);

        // 3. Authenticate with Google
        const auth = new google.auth.JWT(
            GOOGLE_CLIENT_EMAIL,
            null,
            GOOGLE_PRIVATE_KEY,
            SCOPES
        );

        // 4. Get Google Sheets API client
        const sheets = google.sheets({ version: 'v4', auth });

        // 5. Append data to the sheet
        const range = GOOGLE_SHEET_NAME; // Correct version
        const resource = {
            values: [dataRow], // Data needs to be an array of arrays
        };

        console.log(`Attempting to append to Sheet ID: ${GOOGLE_SHEET_ID}, Range: ${range}`);

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED', // Interpret values like user typing
            insertDataOption: 'INSERT_ROWS', // Add new row(s)
            resource: resource,
        });

        console.log('Google Sheets API response:', response.status, response.statusText);
        console.log('Cells updated:', response.data?.updates?.updatedRange);

        // 6. Return success response to Netlify
        return {
            statusCode: 200, // IMPORTANT: Return 200 even on success for background funcs
            body: JSON.stringify({ message: 'Submission processed and sent to Google Sheet.' }),
        };

    } catch (error) {
        console.error('Error processing submission:', error);
         // Log specific Google API errors if available
         if (error.response?.data?.error) {
            console.error('Google API Error Details:', error.response.data.error);
        }
        // Still return 200 to Netlify for background functions to prevent retries,
        // but log the error thoroughly. You could use external logging too.
        return {
            statusCode: 200, // Return 200 even on internal error for background funcs
            body: `Internal error processing submission. Check function logs. Error: ${error.message}`,
        };
    }
};
