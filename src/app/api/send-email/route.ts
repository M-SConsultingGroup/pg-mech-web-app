import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Imap from 'imap-simple';

const imapConfig = {
  imap: {
    user: `info@${process.env.NEXT_PUBLIC_SITE_NAME}`,
    password: process.env.EMAIL_PASSWORD || (() => { throw new Error('EMAIL_PASSWORD is not defined'); })(),
    host: 'imap.privateemail.com',
    port: 993,
    tls: true,
    authTimeout: 3000
  }
};

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 587, // Use 465 for SS,L
  secure: false, // true for 465, false for 587
  auth: {
    user: `info@${process.env.NEXT_PUBLIC_SITE_NAME}`,
    pass: process.env.EMAIL_PASSWORD,
  },
  requireTLS: true, // Ensure TLS is used if not using SSL
});

const saveToSent = async (mailOptions: nodemailer.SendMailOptions) => {
  const connection = await Imap.connect(imapConfig);
  await connection.openBox('Sent');

  const rawEmail = [
    `From: ${mailOptions.from}`,
    `To: ${mailOptions.to}`,
    `Subject: ${mailOptions.subject}`,
    '',
    mailOptions.text,
  ].join('\n');

  await new Promise<void>((resolve, reject) => {
    connection.imap.append(rawEmail, { mailbox: 'Sent' }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  connection.end();
};

export async function POST(req: NextRequest) {
  const { to, subject, message } = await req.json();

  const mailOptions = {
    from: '"PG Mechanical" <info@pgmechanical.us>', // Sender address
    to,
    subject,
    text: message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    await saveToSent(mailOptions); // Save the sent email to the "Sent" folder
    return NextResponse.json({ response: info, success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}