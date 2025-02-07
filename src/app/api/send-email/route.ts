import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Imap, { ImapSimple } from 'imap-simple';

const imapConfig = {
  imap: {
    user: `info@${process.env.NEXT_PUBLIC_SITE_NAME}`,
    password: process.env.EMAIL_PASSWORD || "",
    host: 'imap.privateemail.com',
    port: 993,
    tls: true,
    authTimeout: 3000,
  },
};

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 587, // Use 465 for SSL
  secure: true, // true for 465, false for 587
  auth: {
    user: `info@${process.env.NEXT_PUBLIC_SITE_NAME}`,
    pass: process.env.EMAIL_PASSWORD,
  },
  authMethod: 'LOGIN',
});

const saveToSent = async (mailOptions: nodemailer.SendMailOptions) => {
  let connection: ImapSimple | null = null;
  try {
    connection = await Imap.connect(imapConfig);
    await connection.openBox('Sent');

    const rawEmail = [
      `From: ${mailOptions.from}`,
      `To: ${mailOptions.to}`,
      `Subject: ${mailOptions.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      mailOptions.text,
    ].join('\r\n');

    await new Promise<void>((resolve, reject) => {
      connection!.imap.append(rawEmail, { mailbox: 'Sent' }, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("Error saving email to Sent folder:", error);
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    const { to, subject, message } = await req.json();

    // Input validation
    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: '"PG Mechanical" <info@pgmechanical.us>', // Sender address
      to,
      subject,
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);
    await saveToSent(mailOptions); // Save the sent email to the "Sent" folder

    return NextResponse.json({ response: info, success: true }, { status: 200 });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
