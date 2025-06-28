import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dbConnect from '@/config/db'; // Assuming you have a db connection file
import User from '@/models/User'; // Assuming your User model is in models/User.js

export async function POST(request) {
  await dbConnect();

  try {
    const { email, password } = await request.json();

    // Find the user by email
    const user = await User.findOne({ email });

    // If user not found
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If password is not valid
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // If authentication is successful, create a JWT token (or any other session identifier)
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return success response with user data and token
    const response = NextResponse.json({ success: true, message: 'Login successful', user: { id: user._id, email: user.email }, token }, { status: 200 });

    // Set a cookie named 'auth_token' with the token
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
      maxAge: 60 * 60, // 1 hour expiration
      sameSite: 'Strict',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred during login' }, { status: 500 });
  }
}