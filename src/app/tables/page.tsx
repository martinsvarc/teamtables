import { Suspense } from 'react';
import Component from './component';

async function getData() {
  try {
    // Default IDs for initial load - you can adjust these values
    const memberId = 'user1';  // Replace with your default user ID
    const teamId = 'team1';    // Replace with your default team ID

    // Construct the URL, accounting for different environments
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    // Call your existing API route
    const response = await fetch(
      `${baseUrl}/api/call-records?memberId=${memberId}&teamId=${teamId}`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    // This data is already transformed by your route.ts
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export default async function Page() {
  try {
    const teamData = await getData();

    return (
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      }>
        <Component initialData={teamData} />
      </Suspense>
    );
  } catch (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg font-semibold text-red-500">
          Error loading data. Please try again later.
        </div>
      </div>
    );
  }
}
