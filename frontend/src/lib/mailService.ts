import nodemailer from 'nodemailer';

export interface OrderEmailData {
  email: string;
  orderId: string;
  customerName: string;
  total?: number | string;
  currency?: string;
}

export const sendOrderConfirmationEmail = async (data: OrderEmailData) => {
  const { email, orderId, customerName, total, currency } = data;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('Email credentials not configured, skipping email send');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"Void Esports" <${user}>`,
    to: email,
    subject: `Order Confirmation - ${orderId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #740FA8; text-align: center;">Payment Succeeded!</h2>
        <p>Hi ${customerName || 'Customer'},</p>
        <p>Thank you for your purchase from Void Esports. Your payment has been successfully processed.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order ID:</strong> <span style="font-family: monospace; font-size: 1.1em;">${orderId}</span></p>
          ${total ? `<p style="margin: 5px 0 0 0;"><strong>Total Paid:</strong> ${total} ${currency || 'USD'}</p>` : ''}
        </div>
        
        <p>You can track the status of your order using the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://voidesports.net/track-order?order=${orderId}" style="background-color: #740FA8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track My Order</a>
        </div>
        
        <p>If you have any questions, you can:</p>
        <ul style="line-height: 1.6;">
          <li>Open a support ticket on our <a href="https://discord.gg/X6y2YJbx5f" style="color: #740FA8;">Discord Server</a></li>
          <li>Contact us directly through our <a href="https://voidesports.net/contact" style="color: #740FA8;">Website</a></li>
        </ul>
        
        <p style="margin-top: 40px; font-size: 0.9em; color: #666; text-align: center;">
          © ${new Date().getFullYear()} Void Esports. All rights reserved.
        </p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};
