// Import necessary dependencies
import { Suspense } from 'react';
import Component from './component';
import { QueryResultRow } from '@vercel/postgres';

async function getData() {
  try {
    // Fetch your data from the API or database
    const teamMembersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team-members`);
    const callLogsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/call-logs`);
    const currentUserRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/current-user`);

    const teamMembers = await teamMembersRes.json();
    const callLogs = await callLogsRes.json();
    const currentUser = await currentUserRes.json();

    // Transform the data to match the TeamMember interface
    const transformedTeamMembers = teamMembers.map((member: any) => ({
      user_id: member.user_id,
      user_name: member.user_name,
      user_picture_url: member.user_picture_url,
      trainings_today: member.trainingsToday || 0,
      this_week: member.thisWeek || 0,
      this_month: member.thisMonth || 0,
      total_trainings: member.total || 0,
      current_streak: member.currentStreak || 0,
      longest_streak: member.longestStreak || 0,
      avg_overall: member.avg_overall || 0,
      avg_engagement: member.avg_engagement || 0,
      avg_objection: member.avg_objection || 0,
      avg_information: member.avg_information || 0,
      avg_program: member.avg_program || 0,
      avg_closing: member.avg_closing || 0,
      avg_effectiveness: member.avg_effectiveness || 0,
      ratings_overall_summary: member.ratings_overall_summary,
      ratings_engagement_summary: member.ratings_engagement_summary,
      ratings_objection_summary: member.ratings_objection_summary,
      ratings_information_summary: member.ratings_information_summary,
      ratings_program_summary: member.ratings_program_summary,
      ratings_closing_summary: member.ratings_closing_summary,
      ratings_effectiveness_summary: member.ratings_effectiveness_summary
    }));

    // Transform currentUser if it exists
    const transformedCurrentUser = currentUser ? {
      user_id: currentUser.user_id,
      user_name: currentUser.user_name,
      user_picture_url: currentUser.user_picture_url,
      trainings_today: currentUser.trainingsToday || 0,
      this_week: currentUser.thisWeek || 0,
      this_month: currentUser.thisMonth || 0,
      total_trainings: currentUser.total || 0,
      current_streak: currentUser.currentStreak || 0,
      longest_streak: currentUser.longestStreak || 0,
      avg_overall: currentUser.avg_overall || 0,
      avg_engagement: currentUser.avg_engagement || 0,
      avg_objection: currentUser.avg_objection || 0,
      avg_information: currentUser.avg_information || 0,
      avg_program: currentUser.avg_program || 0,
      avg_closing: currentUser.avg_closing || 0,
      avg_effectiveness: currentUser.avg_effectiveness || 0,
      ratings_overall_summary: currentUser.ratings_overall_summary,
      ratings_engagement_summary: currentUser.ratings_engagement_summary,
      ratings_objection_summary: currentUser.ratings_objection_summary,
      ratings_information_summary: currentUser.ratings_information_summary,
      ratings_program_summary: currentUser.ratings_program_summary,
      ratings_closing_summary: currentUser.ratings_closing_summary,
      ratings_effectiveness_summary: currentUser.ratings_effectiveness_summary
    } : null;

    const teamData = {
      teamMembers: transformedTeamMembers,
      currentUser: transformedCurrentUser,
      recentCalls: callLogs
    };

    return teamData;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export default async function Page() {
  try {
    const teamData = await getData();

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Component initialData={teamData} />
      </Suspense>
    );
  } catch (error) {
    return <div>Error loading data</div>;
  }
}
