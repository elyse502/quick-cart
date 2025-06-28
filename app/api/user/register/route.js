import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/config/db';
import bcrypt from 'bcrypt';

export async function POST(request) {
  await connectDB();

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const response = NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
    response.cookies.set('auth_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;

  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ message: 'Error registering user', error: error.message }, { status: 500 });
  }
}