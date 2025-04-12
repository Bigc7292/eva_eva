import twilio from 'twilio';
import config from '../../config/config.js';
import { retellService } from '../retell/retell.js';

console.log('Initializing Twilio service...');

class TwilioService {
  constructor() {
    console.log('Creating Twilio client with config:', {
      accountSid: config.twilio.accountSid ? 'present' : 'missing',
      authToken: config.twilio.authToken ? 'present' : 'missing',
      sipDomain: config.twilio.sipDomain,
      fromNumber: config.twilio.fromNumber
    });

    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.fromNumber = config.twilio.fromNumber;
    this.sipDomain = config.twilio.sipDomain;
    console.log('Twilio client created successfully');
  }

  async makeCall(toNumber, sipUrl) {
    try {
      console.log('Making Twilio call:', {
        to: toNumber,
        from: this.fromNumber,
        sipUrl: sipUrl
      });

      const call = await this.client.calls.create({
        to: toNumber,
        from: this.fromNumber,
        twiml: `<Response><Dial><Sip>${sipUrl}</Sip></Dial></Response>`,
      });

      console.log('Call initiated successfully:', {
        callSid: call.sid,
        status: call.status
      });

      return call;
    } catch (error) {
      console.error('Error making Twilio call:', {
        error: error.message,
        code: error.code,
        moreInfo: error.moreInfo,
        stack: error.stack
      });
      throw error;
    }
  }

  async getCallStatus(callSid) {
    try {
      console.log('Fetching call status for:', callSid);
      const call = await this.client.calls(callSid).fetch();
      console.log('Call status retrieved:', call.status);
      return call.status;
    } catch (error) {
      console.error('Error getting call status:', {
        callSid,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async monitorCall(callSid, maxAttempts = 20) {
    console.log('\nMonitoring call status...');
    let attempts = 0;
    let lastStatus = '';

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const status = await this.getCallStatus(callSid);
        
        if (status !== lastStatus) {
          console.log(`\nStatus update ${attempts}/${maxAttempts}:`, status);
          lastStatus = status;
        }

        if (status === 'completed' || status === 'failed' || 
            status === 'busy' || status === 'no-answer') {
          return status;
        }

        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Error monitoring call (attempt ${attempts}):`, error);
      }
    }

    console.log('Call monitoring timed out');
    return 'monitoring-timeout';
  }
}

console.log('Creating Twilio service instance...');
export const twilioService = new TwilioService();
export default twilioService; 