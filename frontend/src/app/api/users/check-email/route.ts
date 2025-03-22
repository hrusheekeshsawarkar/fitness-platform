import { NextRequest, NextResponse } from 'next/server';

// Set the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

export async function GET(request: NextRequest) {
  try {
    // Extract email from query params
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/users/check-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return NextResponse.json({ error: 'Failed to check if user exists' }, { status: 500 });
  }
} 