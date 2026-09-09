import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import {
  toggleWishlistItemInDb,
  getWishlistItemsForUserFromDb,
  getWishlistFoodIdsForUserFromDb,
} from "@/lib/db";

function getUserIdFromRequest(req: NextRequest): number | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/kheye_now_session=([^;]+)/);
  if (!match) return null;
  const session = verifySessionToken(match[1]);
  if (!session || session.role !== "user") return null;
  return session.id;
}

/** GET /api/wishlist - returns { foodIds, items } for the logged-in customer */
export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const foodIds = getWishlistFoodIdsForUserFromDb(userId);
    const items = getWishlistItemsForUserFromDb(userId);
    return NextResponse.json({ foodIds, items });
  } catch (err) {
    console.error("GET /api/wishlist error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/wishlist - body: { food_id } - toggles item; returns { wishlisted, food_id } */
export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const foodId = Number(body.food_id);
    if (!foodId || isNaN(foodId)) {
      return NextResponse.json({ error: "food_id is required" }, { status: 400 });
    }
    const wishlisted = toggleWishlistItemInDb(userId, foodId);
    return NextResponse.json({ wishlisted, food_id: foodId });
  } catch (err) {
    console.error("POST /api/wishlist error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
