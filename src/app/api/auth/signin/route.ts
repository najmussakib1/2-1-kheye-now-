import { NextResponse } from 'next/server';
import { findUserByEmailOrPhoneFromDb, findRestaurantByEmailOrPhoneOrNameFromDb } from '@/lib/db';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, role } = body;

    // 1. Validation
    if (!identifier || !identifier.trim()) {
      return NextResponse.json({ success: false, error: 'Email, Phone Number or Name is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    // Check restaurant login if explicitly role === 'restaurant' or if identifier matches basic_restaurant
    if (role === 'restaurant') {
      const rest = findRestaurantByEmailOrPhoneOrNameFromDb(identifier.trim());
      if (!rest) {
        return NextResponse.json(
          { success: false, error: 'No restaurant account found with this credential.' },
          { status: 401 }
        );
      }

      const isValid = verifyPassword(password, rest.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password for restaurant account.' },
          { status: 401 }
        );
      }

      const token = createSessionToken({
        id: rest.id,
        full_name: rest.name,
        email: rest.email,
        phone_number: rest.phone_number,
        role: 'restaurant',
      });

      const safeRest = {
        id: rest.id,
        name: rest.name,
        owner_name: rest.owner_name,
        email: rest.email,
        phone_number: rest.phone_number,
        address: rest.address,
        trade_licence_url: rest.trade_licence_url,
        categories: rest.categories,
        image_url: rest.image_url,
        rating: rest.rating,
      };

      const response = NextResponse.json({
        success: true,
        role: 'restaurant',
        message: 'Signed in as restaurant successfully!',
        restaurant: safeRest,
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // Default: Customer/User login
    const user = findUserByEmailOrPhoneFromDb(identifier.trim());
    
    // If not found in users, check if it's a restaurant partner trying to sign in
    if (!user) {
      const rest = findRestaurantByEmailOrPhoneOrNameFromDb(identifier.trim());
      if (rest) {
        const isValid = verifyPassword(password, rest.password_hash);
        if (isValid) {
          const token = createSessionToken({
            id: rest.id,
            full_name: rest.name,
            email: rest.email,
            phone_number: rest.phone_number,
            role: 'restaurant',
          });

          const response = NextResponse.json({
            success: true,
            role: 'restaurant',
            message: 'Signed in as restaurant partner!',
            restaurant: {
              id: rest.id,
              name: rest.name,
              owner_name: rest.owner_name,
              email: rest.email,
              phone_number: rest.phone_number,
              address: rest.address,
              trade_licence_url: rest.trade_licence_url,
              categories: rest.categories,
              image_url: rest.image_url,
              rating: rest.rating,
            },
          });

          response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
          });

          return response;
        }
      }

      return NextResponse.json(
        { success: false, error: 'No account found with this E-mail or Phone Number.' },
        { status: 401 }
      );
    }

    // Verify user password
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = createSessionToken({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      role: 'user',
    });

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      address: user.address,
      gender: user.gender,
      avatar_url: user.avatar_url,
    };

    const response = NextResponse.json({
      success: true,
      role: 'user',
      message: 'Signed in successfully!',
      user: safeUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error in signin API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during sign in' },
      { status: 500 }
    );
  }
}
