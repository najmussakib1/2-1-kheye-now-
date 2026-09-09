import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import {
  findRiderByIdFromDb,
  updateRiderStatusInDb,
  updateRiderProfileInDb,
  getRiderDeliveriesFromDb,
  updateOrderStatusByRiderInDb,
} from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'rider') {
      return NextResponse.json({ success: false, error: 'Forbidden: Rider access required' }, { status: 403 });
    }

    const rider = findRiderByIdFromDb(session.id);
    if (!rider) {
      return NextResponse.json({ success: false, error: 'Rider not found' }, { status: 404 });
    }

    const deliveries = getRiderDeliveriesFromDb(session.id);

    return NextResponse.json({
      success: true,
      rider,
      deliveries,
    });
  } catch (error: any) {
    console.error('Error fetching rider profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'rider') {
      return NextResponse.json({ success: false, error: 'Forbidden: Rider access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, full_name, phone_number, vehicle_type, vehicle_number, address, avatar_url } = body;

    if (status !== undefined) {
      updateRiderStatusInDb(session.id, status);
    }

    const updated = updateRiderProfileInDb(session.id, {
      full_name,
      phone_number,
      vehicle_type,
      vehicle_number,
      address,
      avatar_url,
    });

    return NextResponse.json({
      success: true,
      message: 'Rider profile updated successfully',
      rider: updated,
    });
  } catch (error: any) {
    console.error('Error updating rider profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'rider') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'orderId and status are required' }, { status: 400 });
    }

    const success = updateOrderStatusByRiderInDb(Number(orderId), session.id, status);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update delivery status' }, { status: 400 });
    }

    const updatedRider = findRiderByIdFromDb(session.id);

    return NextResponse.json({
      success: true,
      message: `Delivery status changed to "${status}"`,
      rider: updatedRider,
    });
  } catch (error: any) {
    console.error('Error updating order delivery status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update delivery status' }, { status: 500 });
  }
}
