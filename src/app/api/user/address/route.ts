import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { updateUserAddressInDb, findUserByIdFromDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { address } = body;

    if (!address || !address.trim()) {
      return NextResponse.json({ success: false, error: 'Address cannot be empty' }, { status: 400 });
    }

    updateUserAddressInDb(session.id, address.trim());
    const updatedUser = findUserByIdFromDb(session.id);

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update address' },
      { status: 500 }
    );
  }
}
