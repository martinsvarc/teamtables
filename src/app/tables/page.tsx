import { Suspense } from 'react';
import Component from './component';

async function getData() {
  try {
    // Since database is empty, we'll return an empty but properly structured data object
    return {
      teamMembers: [],  // Empty array for team members
      currentUser: null, // No current user
      recentCalls: []   // Empty array for calls
    };
  } catch (error) {
    console.error('getData Error:', error);
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
