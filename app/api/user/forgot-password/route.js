import { NextResponse } from 'next/server';
import User from '@/models/User'; // Assuming your User model is in this path
import dbConnect from '@/config/db'; // Assuming your DB connection is here
import crypto from 'crypto';
import nodemailer from 'nodemailer'; // You'll need to install nodemailer and configure it

// Configure your email transporter (replace with your actual email service details)
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Example: Use Gmail. Replace with your service.
  auth: {
    user: process.env.EMAIL_USER, // Your email address from environment variables
    pass: process.env.EMAIL_PASS, // Your email password from environment variables
  },
});

export async function POST(request) {
  await dbConnect();

  try {
    const { email } = await request.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ status: 'failed', message: 'User not found' }, { status: 404 });
    }

    // Generate a unique token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token expiration (1 hour from now)
    const resetTokenExpires = Date.now() + 3600000; // 1 hour in milliseconds

    // Save token and expiration to the user in the database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Create the reset password link (replace with your frontend URL)
    const resetUrl = `${request.headers.get('origin')}/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER, // Your email address
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ status: 'succeeded', message: 'Password reset email sent' });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ status: 'failed', message: 'An error occurred while processing your request.' }, { status: 500 });
  }
}