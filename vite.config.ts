import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodemailer from 'nodemailer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/send-otp' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { email, otp } = JSON.parse(body || '{}');
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

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } catch (err: any) {
                console.error('Local API Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
