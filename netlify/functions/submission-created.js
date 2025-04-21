// netlify/functions/submission-created.js (Temporary Simple Test)

exports.handler = async (event, context) => {
    // This function just logs a message to confirm it was detected and ran.
    const formName = JSON.parse(event.body)?.payload?.data?.form_name || 'Unknown Form';
    console.log(`SIMPLE TEST: Submission-created function ran for form: ${formName}`);
  
    return {
      statusCode: 200, // Must return 200 to Netlify
      body: "Function acknowledged submission.", // Optional response body
    };
  };