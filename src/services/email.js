// Email service for Batloung Farm Distribution System
import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@batloungfarm.ls';

let transporter = null;

function getTransporter() {
  if (!transporter && EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log('[Email] No email configuration - would send to:', to, 'Subject:', subject);
    return { success: false, reason: 'Email not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    console.log('[Email] Sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendVendorWelcomeEmail(vendor) {
  return sendEmail({
    to: vendor.email || 'vendor@example.com',
    subject: 'Welcome to Batloung Farm Distribution System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a3a;">Welcome to Batloung Farm!</h2>
        <p>Dear ${vendor.name},</p>
        <p>Your vendor account has been created successfully. You can now log in to view your purchases, outstanding balances, and payment history.</p>
        <p><strong>Login details:</strong></p>
        <ul>
          <li>Email: ${vendor.email}</li>
          <li>Password: (the one you set during registration)</li>
        </ul>
        <p>Visit <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Batloung Farm Portal</a> to get started.</p>
        <hr>
        <small>Batloung Farm Distribution System, Maseru, Lesotho</small>
      </div>
    `,
  });
}

export async function sendSaleConfirmationEmail(vendor, sale) {
  return sendEmail({
    to: vendor.email || 'vendor@example.com',
    subject: `Sale Confirmation - SAL-${String(sale.id).padStart(4, '0')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a3a;">Sale Confirmation</h2>
        <p>Dear ${vendor.name},</p>
        <p>Your purchase has been recorded successfully.</p>
        <p><strong>Sale Reference:</strong> SAL-${String(sale.id).padStart(4, '0')}</p>
        <p><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleDateString('en-GB')}</p>
        <p><strong>Total Amount:</strong> M ${Number(sale.totalAmount).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</p>
        <p><strong>Payment Method:</strong> ${sale.paymentMethod}</p>
        <p><strong>Payment Status:</strong> ${sale.paymentStatus}</p>
        <hr>
        <small>Batloung Farm Distribution System, Maseru, Lesotho</small>
      </div>
    `,
  });
}

export async function sendPaymentReceivedEmail(vendor, payment, sale) {
  return sendEmail({
    to: vendor.email || 'vendor@example.com',
    subject: `Payment Received - Sale SAL-${String(sale.id).padStart(4, '0')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a3a;">Payment Received</h2>
        <p>Dear ${vendor.name},</p>
        <p>We have received your payment for sale <strong>SAL-${String(sale.id).padStart(4, '0')}</strong>.</p>
        <p><strong>Amount:</strong> M ${Number(payment.amount).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</p>
        <p><strong>Method:</strong> ${payment.paymentMethod}</p>
        <p><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString('en-GB')}</p>
        <p><strong>New Balance:</strong> M ${Number(sale.paidAmount).toLocaleString('en-LS', { minimumFractionDigits: 2 })} paid of M ${Number(sale.totalAmount).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</p>
        <hr>
        <small>Batloung Farm Distribution System, Maseru, Lesotho</small>
      </div>
    `,
  });
}

export async function sendLowStockAlertEmail(adminEmails, lowStockItems) {
  if (!Array.isArray(adminEmails) || adminEmails.length === 0) return;
  
  const itemsHtml = lowStockItems.map(item => `
    <tr>
      <td>${item.fruitName}</td>
      <td>${item.packagingSize}</td>
      <td>${item.quantity}</td>
      <td>${item.threshold}</td>
    </tr>
  `).join('');

  return sendEmail({
    to: adminEmails.join(', '),
    subject: 'Low Stock Alert - Batloung Farm',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Low Stock Alert</h2>
        <p>The following items are below their restock threshold:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #ddd;">Fruit</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Package</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Current</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <p>Please record a purchase to replenish stock.</p>
        <hr>
        <small>Batloung Farm Distribution System, Maseru, Lesotho</small>
      </div>
    `,
  });
}

export async function sendOutstandingBalanceReminderEmail(vendor, balance) {
  return sendEmail({
    to: vendor.email || 'vendor@example.com',
    subject: 'Outstanding Balance Reminder - Batloung Farm',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Outstanding Balance Reminder</h2>
        <p>Dear ${vendor.name},</p>
        <p>Your account has an outstanding balance of <strong>M ${Number(balance.outstandingBalance).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</strong>.</p>
        <p>Please make a payment to avoid service interruption.</p>
        <p><strong>Total Purchased:</strong> M ${Number(balance.totalPurchased).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</p>
        <p><strong>Total Paid:</strong> M ${Number(balance.totalPaid).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</p>
        <p><strong>Outstanding:</strong> M ${Number(balance.outstandingBalance).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</p>
        <hr>
        <small>Batloung Farm Distribution System, Maseru, Lesotho</small>
      </div>
    `,
  });
}