import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { updateAddonInDb, deleteAddonInDb, getAddonByIdFromDb } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const addonId = Number(resolvedParams.id);
    if (!addonId) {
      return NextResponse.json({ success: false, error: 'Valid addon id is required' }, { status: 400 });
    }

    const existing = getAddonByIdFromDb(addonId);
    if (!existing || existing.restaurant_id !== session.id) {
      return NextResponse.json({ success: false, error: 'Add-on not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { name, price, image_url, is_available } = body;

    const updated = updateAddonInDb(addonId, session.id, {
      name: name !== undefined ? name.trim() : undefined,
      price: price !== undefined ? Number(price) : undefined,
      image_url: image_url !== undefined ? image_url.trim() : undefined,
      is_available: is_available !== undefined ? is_available : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Add-on updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/addons/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update add-on' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const addonId = Number(resolvedParams.id);
    if (!addonId) {
      return NextResponse.json({ success: false, error: 'Valid addon id is required' }, { status: 400 });
    }

    const success = deleteAddonInDb(addonId, session.id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Add-on not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Add-on deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/addons/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete add-on' }, { status: 500 });
  }
}
