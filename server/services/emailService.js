const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';

const emailTemplates = {

  welcome: (data) => ({
    subject: '🕐 Welcome to "🤝 TalentTrade" AI',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;">⏱️ TalentTradeAI</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Exchange services, not money</p>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 12px 12px;border:1px solid #eee;">
          <h2 style="color:#333;">Welcome, ${data.name}! 🎉</h2>
          <p style="color:#666;line-height:1.7;">You've joined a community where skills and time are the currency.</p>
          <ul style="color:#555;line-height:2.2;">
            <li>🔍 Browse services offered by community members</li>
            <li>💼 List your own skills and services</li>
            <li>⭐ Earn time credits by helping others</li>
            <li>🤖 Get AI-powered recommendations</li>
          </ul>
          <div style="text-align:center;margin-top:25px;">
            <a href="${process.env.FRONTEND_URL}/explore"
               style="background:#667eea;color:white;padding:12px 32px;border-radius:25px;text-decoration:none;font-weight:bold;">
              Start Exploring →
            </a>
          </div>
        </div>
      </div>`,
  }),

  bookingConfirmation: (data) => ({
    subject: `✅ Booking Confirmed: ${data.serviceName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#10b981;padding:25px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;">✅ Booking Confirmed!</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 12px 12px;border:1px solid #eee;">
          <h2 style="color:#333;">Hi ${data.requesterName},</h2>
          <p style="color:#666;">Your booking has been confirmed!</p>
          <div style="background:#f0fdf4;padding:20px;border-radius:8px;border-left:4px solid #10b981;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#666;font-weight:bold;width:120px;">Service:</td><td style="color:#333;">${data.serviceName}</td></tr>
              <tr><td style="padding:6px 0;color:#666;font-weight:bold;">Provider:</td><td style="color:#333;">${data.providerName}</td></tr>
              <tr><td style="padding:6px 0;color:#666;font-weight:bold;">Date:</td><td style="color:#333;">${data.scheduledDate}</td></tr>
              <tr><td style="padding:6px 0;color:#666;font-weight:bold;">Credits:</td><td style="color:#764ba2;font-weight:bold;">${data.credits} credits</td></tr>
            </table>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL}/bookings/${data.bookingId}"
               style="background:#667eea;color:white;padding:12px 28px;border-radius:25px;text-decoration:none;font-weight:bold;">
              View Booking
            </a>
          </div>
        </div>
      </div>`,
  }),

  bookingRequest: (data) => ({
    subject: `🔔 New Booking Request: ${data.serviceName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#f59e0b;padding:25px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;">🔔 New Booking Request!</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 12px 12px;border:1px solid #eee;">
          <h2 style="color:#333;">Hi ${data.providerName},</h2>
          <p style="color:#666;">Someone wants to book your service!</p>
          <div style="background:#fffbeb;padding:20px;border-radius:8px;border-left:4px solid #f59e0b;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#666;font-weight:bold;width:120px;">Service:</td><td style="color:#333;">${data.serviceName}</td></tr>
              <tr><td style="padding:6px 0;color:#666;font-weight:bold;">Requester:</td><td style="color:#333;">${data.requesterName}</td></tr>
              <tr><td style="padding:6px 0;color:#666;font-weight:bold;">Date:</td><td style="color:#333;">${data.scheduledDate}</td></tr>
              <tr><td style="padding:6px 0;color:#666;font-weight:bold;">Credits:</td><td style="color:#764ba2;font-weight:bold;">${data.credits} credits</td></tr>
            </table>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL}/bookings/${data.bookingId}?action=accept"
               style="background:#10b981;color:white;padding:12px 24px;border-radius:25px;text-decoration:none;font-weight:bold;">
              ✅ Accept
            </a>
            <a href="${process.env.FRONTEND_URL}/bookings/${data.bookingId}?action=decline"
               style="background:#ef4444;color:white;padding:12px 24px;border-radius:25px;text-decoration:none;font-weight:bold;margin-left:10px;">
              ❌ Decline
            </a>
          </div>
        </div>
      </div>`,
  }),

  newMessage: (data) => ({
    subject: `💬 New message from ${data.senderName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#3b82f6;padding:25px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;">💬 New Message</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 12px 12px;border:1px solid #eee;">
          <h2 style="color:#333;">Hi ${data.recipientName},</h2>
          <p style="color:#666;"><strong>${data.senderName}</strong> ne message bheja:</p>
          <div style="background:#eff6ff;padding:20px;border-radius:8px;border-left:4px solid #3b82f6;margin:20px 0;">
            <p style="color:#333;margin:0;font-style:italic;">"${data.messagePreview}..."</p>
          </div>
          <div style="text-align:center;margin-top:20px;">
            <a href="${process.env.FRONTEND_URL}/messages/${data.conversationId}"
               style="background:#3b82f6;color:white;padding:12px 28px;border-radius:25px;text-decoration:none;font-weight:bold;">
              Reply Now →
            </a>
          </div>
        </div>
      </div>`,
  }),

  creditAlert: (data) => ({
    subject: `${data.type === 'earned' ? '💰 Credits Earned' : '💸 Credits Deducted'}: ${data.amount}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:${data.type === 'earned' ? '#10b981' : '#f59e0b'};padding:25px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:36px;">
            ${data.type === 'earned' ? '💰 +' : '💸 -'}${data.amount}
          </h1>
          <p style="color:rgba(255,255,255,0.9);margin:5px 0 0;">Credits ${data.type === 'earned' ? 'Earned' : 'Spent'}</p>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 12px 12px;border:1px solid #eee;">
          <h2 style="color:#333;">Hi ${data.userName},</h2>
          <p style="color:#666;">${data.reason}</p>
          <div style="background:#f8fafc;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
            <p style="color:#999;margin:0;font-size:13px;">New Balance</p>
            <p style="color:#764ba2;font-size:40px;font-weight:bold;margin:8px 0;">${data.newBalance}</p>
            <p style="color:#999;margin:0;font-size:13px;">time credits</p>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL}/wallet"
               style="background:#667eea;color:white;padding:12px 28px;border-radius:25px;text-decoration:none;font-weight:bold;">
              View Wallet
            </a>
          </div>
        </div>
      </div>`,
  }),

  reviewReminder: (data) => ({
    subject: `⭐ How was your experience with ${data.providerName}?`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:25px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;">⭐ Share Your Experience</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 12px 12px;border:1px solid #eee;">
          <h2 style="color:#333;">Hi ${data.reviewerName},</h2>
          <p style="color:#666;">You recently used <strong>${data.serviceName}</strong> by <strong>${data.providerName}</strong>.</p>
          <p style="color:#666;">Your review helps the community!</p>
          <div style="text-align:center;margin-top:25px;">
            <a href="${process.env.FRONTEND_URL}/review/${data.bookingId}"
               style="background:#f59e0b;color:white;padding:12px 28px;border-radius:25px;text-decoration:none;font-weight:bold;">
              ✍️ Write Review
            </a>
          </div>
        </div>
      </div>`,
  }),
};

// ─── Send function ─────────────────────────────────────────────────────────────
const sendEmail = async (to, templateName, templateData) => {
  try {
    const template = emailTemplates[templateName](templateData);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      console.error(`❌ Email failed: [${templateName}] → ${to}`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent: [${templateName}] → ${to} | ID: ${data.id}`);
    return { success: true, id: data.id };

  } catch (error) {
    console.error(`❌ Email failed: [${templateName}] → ${to}`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };