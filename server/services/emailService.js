const nodemailer = require("nodemailer");
const axios = require("axios");

/**
 * Email Service - Multi-provider email sending abstraction
 * Supports: SMTP, SendGrid, Postmark, Mailgun, AWS SES
 */
class EmailService {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
    this.transporter = null;
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider) {
      case "smtp":
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port || 587,
          secure: this.config.secure || false,
          auth: {
            user: this.config.user,
            pass: this.config.pass,
          },
          tls: {
            rejectUnauthorized: this.config.rejectUnauthorized !== false,
          },
        });
        break;

      case "sendgrid":
        this.apiKey = this.config.apiKey;
        this.apiUrl = "https://api.sendgrid.com/v3";
        break;

      case "postmark":
        this.apiKey = this.config.apiKey;
        this.apiUrl = "https://api.postmarkapp.com";
        break;

      case "mailgun":
        this.apiKey = this.config.apiKey;
        this.domain = this.config.domain;
        this.apiUrl = `https://api.mailgun.net/v3/${this.domain}`;
        break;

      case "ses":
        this.transporter = nodemailer.createTransport({
          SES: {
            ses: this.config.ses,
            aws: this.config.aws,
          },
        });
        break;

      default:
        throw new Error(`Unsupported email provider: ${this.provider}`);
    }
  }

  async sendEmail(emailData) {
    const { to, from, subject, html, text, replyTo, cc, bcc, attachments } = emailData;

    try {
      switch (this.provider) {
        case "smtp":
        case "ses":
          return await this.sendViaSMTP({
            to,
            from: from || this.config.from,
            subject,
            html,
            text,
            replyTo: replyTo || this.config.replyTo,
            cc,
            bcc,
            attachments,
          });

        case "sendgrid":
          return await this.sendViaSendGrid({
            to,
            from: from || this.config.from,
            subject,
            html,
            text,
            replyTo: replyTo || this.config.replyTo,
            cc,
            bcc,
            attachments,
          });

        case "postmark":
          return await this.sendViaPostmark({
            to,
            from: from || this.config.from,
            subject,
            html,
            text,
            replyTo: replyTo || this.config.replyTo,
            cc,
            bcc,
            attachments,
          });

        case "mailgun":
          return await this.sendViaMailgun({
            to,
            from: from || this.config.from,
            subject,
            html,
            text,
            replyTo: replyTo || this.config.replyTo,
            cc,
            bcc,
            attachments,
          });

        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`Email send error (${this.provider}):`, error);
      throw error;
    }
  }

  async sendViaSMTP(emailData) {
    const mailOptions = {
      from: emailData.from,
      to: Array.isArray(emailData.to) ? emailData.to.join(", ") : emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      replyTo: emailData.replyTo,
      cc: emailData.cc,
      bcc: emailData.bcc,
      attachments: emailData.attachments,
    };

    const info = await this.transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      provider: "smtp",
      response: info.response,
    };
  }

  async sendViaSendGrid(emailData) {
    const payload = {
      personalizations: [
        {
          to: Array.isArray(emailData.to)
            ? emailData.to.map((email) => ({ email }))
            : [{ email: emailData.to }],
          cc: emailData.cc
            ? Array.isArray(emailData.cc)
              ? emailData.cc.map((email) => ({ email }))
              : [{ email: emailData.cc }]
            : undefined,
          bcc: emailData.bcc
            ? Array.isArray(emailData.bcc)
              ? emailData.bcc.map((email) => ({ email }))
              : [{ email: emailData.bcc }]
            : undefined,
        },
      ],
      from: { email: emailData.from },
      subject: emailData.subject,
      content: [],
    };

    if (emailData.html) {
      payload.content.push({ type: "text/html", value: emailData.html });
    }
    if (emailData.text) {
      payload.content.push({ type: "text/plain", value: emailData.text });
    }

    if (emailData.replyTo) {
      payload.reply_to = { email: emailData.replyTo };
    }

    if (emailData.attachments) {
      payload.attachments = emailData.attachments.map((att) => ({
        content: att.content || att.path,
        filename: att.filename,
        type: att.contentType,
        disposition: att.disposition || "attachment",
      }));
    }

    const response = await axios.post(`${this.apiUrl}/mail/send`, payload, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      messageId: response.headers["x-message-id"] || response.data?.message_id,
      provider: "sendgrid",
      response: response.data,
    };
  }

  async sendViaPostmark(emailData) {
    const payload = {
      From: emailData.from,
      To: Array.isArray(emailData.to) ? emailData.to.join(",") : emailData.to,
      Subject: emailData.subject,
      HtmlBody: emailData.html,
      TextBody: emailData.text,
      ReplyTo: emailData.replyTo,
      Cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(",") : emailData.cc) : undefined,
      Bcc: emailData.bcc
        ? Array.isArray(emailData.bcc)
          ? emailData.bcc.join(",")
          : emailData.bcc
        : undefined,
    };

    if (emailData.attachments) {
      payload.Attachments = emailData.attachments.map((att) => ({
        Name: att.filename,
        Content: att.content || att.path,
        ContentType: att.contentType || "application/octet-stream",
      }));
    }

    const response = await axios.post(`${this.apiUrl}/email`, payload, {
      headers: {
        "X-Postmark-Server-Token": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      messageId: response.data.MessageID,
      provider: "postmark",
      response: response.data,
    };
  }

  async sendViaMailgun(emailData) {
    const formData = {};
    formData.from = emailData.from;
    formData.to = Array.isArray(emailData.to) ? emailData.to.join(",") : emailData.to;
    formData.subject = emailData.subject;

    if (emailData.html) {
      formData.html = emailData.html;
    }
    if (emailData.text) {
      formData.text = emailData.text;
    }
    if (emailData.replyTo) {
      formData["h:Reply-To"] = emailData.replyTo;
    }
    if (emailData.cc) {
      formData.cc = Array.isArray(emailData.cc) ? emailData.cc.join(",") : emailData.cc;
    }
    if (emailData.bcc) {
      formData.bcc = Array.isArray(emailData.bcc) ? emailData.bcc.join(",") : emailData.bcc;
    }

    const formBody = Object.keys(formData)
      .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(formData[key]))
      .join("&");

    const response = await axios.post(`${this.apiUrl}/messages`, formBody, {
      auth: {
        username: "api",
        password: this.apiKey,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return {
      success: true,
      messageId: response.data.id,
      provider: "mailgun",
      response: response.data,
    };
  }

  static create(provider, config) {
    return new EmailService(provider, config);
  }
}

module.exports = EmailService;

