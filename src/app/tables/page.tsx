import { Suspense } from 'react';
import Component from './component';
import { headers } from 'next/headers';

async function getData() {
  try {
    // Get URL parameters from the request headers
    const headersList = headers();
    const referer = headersList.get('referer') || '';
    let memberId, teamId;
    
    try {
      const url = new URL(referer);
      memberId = url.searchParams.get('memberId');
      teamId = url.searchParams.get('teamId');
    } catch (e) {
      console.error('Error parsing URL:', e);
    }

    if (!memberId || !teamId) {
      console.log('Missing required parameters');
      return {
        teamMembers: [],
        currentUser: null,
        recentCalls: []
      };
    }

    // Fetch data from your API
    const response = await fetch(
      `https://teamtables-havu.vercel.app/api/call-records?memberId=${memberId}&teamId=${teamId}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('getData Error:', error);
    return {
      teamMembers: [],
      currentUser: null,
      recentCalls: []
    };
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
    console.error('Page Error:', error);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg font-semibold text-red-500">
          Something went wrong. Please try again later.
        </div>
      </div>
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
