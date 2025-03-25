import { NextRequest, NextResponse } from 'next/server';

// Set the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const userData = await request.json();
    
    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
} 