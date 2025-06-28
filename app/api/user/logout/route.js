import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const response = NextResponse.json({ message: 'Logout successful', status: 'succeeded' });

    // Clear the authentication cookie
    response.cookies.set('auth_token', '', { expires: new Date(0), path: '/' });

    return response;
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json({ message: 'Logout failed', status: 'failed' }, { status: 500 });
  }
}