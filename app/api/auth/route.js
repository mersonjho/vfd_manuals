import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET_SALT = 'vfd-salt-2026';
const VALID_PASSWORD = '@bits123';

function computeToken(password) {
  return crypto.createHash('sha256').update(password + SECRET_SALT).digest('hex');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || password !== VALID_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = computeToken(password);

    const response = NextResponse.json({ ok: true });

    // Set httpOnly secure cookie — valid for 30 days
    response.cookies.set('vfd_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
