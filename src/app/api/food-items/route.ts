import { NextResponse } from 'next/server';
import { getFoodItemsFromDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const items = getFoodItemsFromDb(category);
    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error('API Error executing SQL query:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch food items from database' },
      { status: 500 }
    );
  }
}
