import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/config/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  await connectDB();

  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ status: 'failed', message: 'Token and new password are required.' }, { status: 400 });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ status: 'failed', message: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ status: 'succeeded', message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ status: 'failed', message: 'An error occurred while resetting your password.' }, { status: 500 });
  }
}