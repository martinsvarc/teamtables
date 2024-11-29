import { Suspense } from 'react';
import Component from './component';
import { headers } from 'next/headers';

async function getData() {
  try {
    const headersList = headers();
    const referer = headersList.get('referer') || '';
    let memberId, teamId;
    
    try {
      const url = new URL(referer);
      memberId = url.searchParams.get('memberId');
      teamId = url.searchParams.get('teamId');
      console.log('URL Parameters:', { memberId, teamId });
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

    const apiUrl = `https://teamtables-havu.vercel.app/api/call-records?memberId=${memberId}&teamId=${teamId}`;
    console.log('Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store',
    });

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
  const teamData = await getData();
  
  return (
    <div className="min-h-screen bg-[#f0f1f7]">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      }>
        <Component initialData={teamData} />
      </Suspense>
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
