import { NextRequest, NextResponse } from 'next/server';

// Set the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

export async function GET(request: NextRequest) {
  console.log('check-email API route called');
  try {
    // Extract email from query params
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    console.log(`API route: Checking email ${email}`);
    console.log(`API_URL: ${API_URL}`);
    
    // Forward the request to the backend API
    const backendUrl = `${API_URL}/users/check-email?email=${encodeURIComponent(email)}`;
    console.log(`Forwarding to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Backend response status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Backend error:', error);
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    console.log('Backend response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return NextResponse.json({ error: 'Failed to check if user exists' }, { status: 500 });
  }
} 