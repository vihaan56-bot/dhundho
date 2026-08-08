import type { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';

// Helper to parse POST request body
const parseBody = (req: IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { email, otp } = await parseBody(req);
    
    if (!email || !otp) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Email and OTP are required' }));
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'alokaiml.training@gmail.com',
        pass: 'lckg lliu amun akcd'.replace(/\s/g, '')
      }
    });

    await transporter.sendMail({
      from: '"Dhundho App" <alokaiml.training@gmail.com>',
      to: email,
      subject: 'Your Dhundho Login OTP',
      text: `Your OTP is: ${otp}. Do not share this with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #6366f1; text-align: center;">Dhundho Login OTP</h2>
          <p>Hello,</p>
          <p>We received a request to login to your Dhundho account. Use the following One-Time Password (OTP) to complete the login process:</p>
          <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 20px 0; color: #1e1b4b;">
            ${otp}
          </div>
          <p>This OTP is valid for 5 minutes. If you did not request this, you can safely ignore this email.</p>
          <p>Cheers,<br/>The Dhundho Team</p>
        </div>
      `
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to send OTP email: ' + error.message }));
  }
}
