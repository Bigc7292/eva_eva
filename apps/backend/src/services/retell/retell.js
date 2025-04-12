import { Retell } from 'retell-sdk';
import config from '../../config/config.js';

console.log('Initializing RetellAI service...');

class RetellService {
  constructor() {
    console.log('Creating RetellAI client with config:', {
      apiKey: config.retell.apiKey ? 'present' : 'missing',
      agentId: config.retell.agentId,
      webhookUrl: config.retell.webhookUrl
    });

    this.retell = new Retell({
      apiKey: config.retell.apiKey
    });

    this.agentId = config.retell.agentId;
    this.webhookUrl = config.retell.webhookUrl;
    console.log('RetellAI client created successfully');
  }

  async registerCall({ fromNumber, toNumber }) {
    try {
      console.log('Registering call with RetellAI:', {
        fromNumber,
        toNumber,
        agentId: this.agentId,
        webhookUrl: this.webhookUrl
      });

      const retellResponse = await this.retell.call.createPhoneCall({
        agent_id: this.agentId,
        from_number: fromNumber,
        to_number: toNumber,
        webhook_config: {
          webhook_url: this.webhookUrl,
          webhook_auth_key: config.retell.apiKey,
          events: [
            'call_started',
            'call_ended',
            'call_analyzed',
            'transcription_update',
            'stream_connected',
            'stream_disconnected'
          ]
        },
        debug_mode: true,
        recording_enabled: true,
        recording_channels: 'dual',
        voice_config: {
          voice_id: 'sophie',
          stability: 0.5,
          similarity: 0.5,
          use_voice_enhancement: true
        },
        connection_config: {
          sip_domain: config.twilio.sipDomain,
          transport: 'tcp',
          timeout_seconds: 60
        }
      });

      console.log('RetellAI registration successful:', retellResponse);
      return retellResponse;
    } catch (error) {
      console.error('RetellAI registration error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        status: error.status,
        response: error.response
      });
      throw error;
    }
  }

  generateSipUrl(callId) {
    const sipUrl = `sip:${callId}@${config.twilio.sipDomain};transport=tcp?x-retell-agent-id=${this.agentId}&x-retell-api-key=${config.retell.apiKey}`;
    console.log('Generated SIP URL:', sipUrl);
    return sipUrl;
  }

  generateTwiML(callId) {
    console.log('Generating TwiML for call:', callId);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to Eva, your AI real estate assistant.</Say>
  <Pause length="2"/>
  <Dial timeout="60" answerOnBridge="true">
    <Sip username="${config.twilio.sipUsername}" password="${config.twilio.sipPassword}">${this.generateSipUrl(callId)}</Sip>
  </Dial>
  <Say>We're sorry, but there was an error connecting to the AI assistant. Please try again later.</Say>
</Response>`;
    console.log('Generated TwiML:', twiml);
    return twiml;
  }
}

console.log('Creating RetellAI service instance...');
export const retellService = new RetellService(); 