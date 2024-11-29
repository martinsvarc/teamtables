import { Suspense } from 'react';
import Component from './component';
import { headers } from 'next/headers';
import AutoHeightContainer from '@/components/AutoHeightContainer';

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
    console.log('API Response Data:', {
      hasData: !!data,
      teamMembersCount: data?.teamMembers?.length,
      callsCount: data?.recentCalls?.length,
      rawData: data
    });
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
    console.log('Page Data:', {
      hasData: !!teamData,
      teamMembersCount: teamData?.teamMembers?.length,
      callsCount: teamData?.recentCalls?.length,
      rawData: teamData
    });
    
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      }>
        <AutoHeightContainer>
          <Component initialData={teamData} />
        </AutoHeightContainer>
      </Suspense>
    );
  } catch (error) {
    console.error('Page Error:', error);
    return (
      <div className="flex items-center justify-center">
        <div className="text-lg font-semibold text-red-500">
          Something went wrong. Please try again later.
        </div>
      </div>
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
