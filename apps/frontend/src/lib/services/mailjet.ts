/**
 * Mailjet Service
 *
 * This service provides methods for sending emails using the Mailjet API.
 */

// Mailjet API configuration
const MAILJET_API_KEY = process.env.MAILJET_API_KEY || '';
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY || '';
const MAILJET_SENDER_EMAIL = process.env.MAILJET_SENDER_EMAIL || 'noreply@toploaderagent.ai';
const MAILJET_SENDER_NAME = process.env.MAILJET_SENDER_NAME || 'Top Loader Agent AI';

// Email types
export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded content
  contentType: string;
}

export interface EmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
  customId?: string;
  templateId?: number;
  templateLanguage?: boolean;
  templateVariables?: Record<string, unknown>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Mailjet Service class for sending emails
 */
export class MailjetService {
  private apiKey: string;
  private secretKey: string;
  private senderEmail: string;
  private senderName: string;

  constructor(
    apiKey = MAILJET_API_KEY,
    secretKey = MAILJET_SECRET_KEY,
    senderEmail = MAILJET_SENDER_EMAIL,
    senderName = MAILJET_SENDER_NAME
  ) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.senderEmail = senderEmail;
    this.senderName = senderName;
  }

  /**
   * Send an email using Mailjet
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      // Check if we're in a server context
      if (typeof window !== 'undefined') {
        throw new Error('Mailjet service can only be used on the server side');
      }

      // Prepare the email data
      const emailData: {
        Messages: Array<{
          From: { Email: string; Name: string };
          To: Array<{ Email: string; Name: string }>;
          Subject: string;
          HTMLPart: string;
          TextPart: string;
          CustomID: string;
          Cc?: Array<{ Email: string; Name: string }>;
          Bcc?: Array<{ Email: string; Name: string }>;
          ReplyTo?: { Email: string; Name: string };
          Attachments?: Array<{ ContentType: string; Filename: string; Base64Content: string }>;
          TemplateID?: number;
          TemplateLanguage?: boolean;
          Variables?: Record<string, unknown>;
        }>;
      } = {
        Messages: [
          {
            From: {
              Email: this.senderEmail,
              Name: this.senderName
            },
            To: options.to.map(recipient => ({
              Email: recipient.email,
              Name: recipient.name || recipient.email
            })),
            Subject: options.subject,
            HTMLPart: options.htmlContent,
            TextPart: options.textContent || '',
            CustomID: options.customId || '',
          }
        ]
      };

      // Add CC recipients if provided
      if (options.cc && options.cc.length > 0) {
        emailData.Messages[0].Cc = options.cc.map(recipient => ({
          Email: recipient.email,
          Name: recipient.name || recipient.email
        }));
      }

      // Add BCC recipients if provided
      if (options.bcc && options.bcc.length > 0) {
        emailData.Messages[0].Bcc = options.bcc.map(recipient => ({
          Email: recipient.email,
          Name: recipient.name || recipient.email
        }));
      }

      // Add reply-to if provided
      if (options.replyTo) {
        emailData.Messages[0].ReplyTo = {
          Email: options.replyTo.email,
          Name: options.replyTo.name || options.replyTo.email
        };
      }

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        emailData.Messages[0].Attachments = options.attachments.map(attachment => ({
          ContentType: attachment.contentType,
          Filename: attachment.filename,
          Base64Content: attachment.content
        }));
      }

      // Add template information if provided
      if (options.templateId) {
        emailData.Messages[0].TemplateID = options.templateId;
        emailData.Messages[0].TemplateLanguage = options.templateLanguage || true;

        if (options.templateVariables) {
          emailData.Messages[0].Variables = options.templateVariables;
        }
      }

      // Make the API request
      const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64')}`
        },
        body: JSON.stringify(emailData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Mailjet API error:', data);
        return {
          success: false,
          error: data.ErrorMessage || data.message || 'Failed to send email'
        };
      }

      return {
        success: true,
        messageId: data.Messages?.[0]?.To?.[0]?.MessageID || ''
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a singleton instance
export const mailjetService = new MailjetService();
