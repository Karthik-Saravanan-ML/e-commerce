const sendSMS = async ({ to, body }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.includes('xxxx')) {
    console.log(`📱 [DEV] SMS skipped (no Twilio): ${body?.slice(0, 50)}`);
    return;
  }
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({ body, from: process.env.TWILIO_PHONE, to });
    console.log(`📱 SMS sent to ${to}: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`❌ SMS failed to ${to}:`, err.message);
  }
};

const makeCall = async ({ to, message }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.includes('xxxx')) {
    console.log(`📞 [DEV] Call skipped (no Twilio)`);
    return;
  }
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
      twiml: `<Response><Say voice="alice">${message}</Say></Response>`,
      from: process.env.TWILIO_PHONE, to,
    });
    return call;
  } catch (err) {
    console.error(`❌ Call failed:`, err.message);
  }
};

module.exports = { sendSMS, makeCall };
