// src/app/tables/page.tsx
import { sql } from "@vercel/postgres";
import { Suspense } from "react";
import Component from "./component";

export default async function Page({
  searchParams,
}: {
  searchParams: { memberId: string; teamId: string };
}) {
  const memberId = searchParams.memberId;
  const teamId = searchParams.teamId;

  if (!memberId || !teamId) {
    return <div>Member ID and Team ID are required</div>;
  }

  try {
    // Get user stats
    const { rows: stats } = await sql`
      WITH user_stats AS (
        SELECT 
          user_id,
          user_name,
          user_picture_url,
          COUNT(*) FILTER (WHERE DATE(call_date) = CURRENT_DATE) as trainings_today,
          COUNT(*) FILTER (WHERE call_date >= CURRENT_DATE - INTERVAL '7 days') as this_week,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', call_date) = DATE_TRUNC('month', CURRENT_DATE)) as this_month,
          COUNT(*) as total_trainings,
          ROUND(AVG(overall_performance)) as avg_overall,
          ROUND(AVG(engagement_score)) as avg_engagement,
          ROUND(AVG(objection_handling_score)) as avg_objection,
          ROUND(AVG(information_gathering_score)) as avg_information,
          ROUND(AVG(program_explanation_score)) as avg_program,
          ROUND(AVG(closing_score)) as avg_closing,
          ROUND(AVG(effectiveness_score)) as avg_effectiveness
        FROM call_records
        WHERE team_id = ${teamId}
        GROUP BY user_id, user_name, user_picture_url
      )
      SELECT * FROM user_stats;
    `;

    // Get recent calls
    const { rows: recentCalls } = await sql`
      SELECT *
      FROM call_records
      WHERE team_id = ${teamId}
      ORDER BY call_date DESC
      LIMIT 5;
    `;

    const teamData = {
      teamMembers: stats.map(member => ({
        user_id: member.user_id,
        user_name: member.user_name,
        user_picture_url: member.user_picture_url,
        trainingsToday: Number(member.trainings_today),
        thisWeek: Number(member.this_week),
        thisMonth: Number(member.this_month),
        total: Number(member.total_trainings),
        currentStreak: 0, // You'll need to calculate this
        longestStreak: 0, // You'll need to calculate this
        avg_overall: Number(member.avg_overall),
        avg_engagement: Number(member.avg_engagement),
        avg_objection: Number(member.avg_objection),
        avg_information: Number(member.avg_information),
        avg_program: Number(member.avg_program),
        avg_closing: Number(member.avg_closing),
        avg_effectiveness: Number(member.avg_effectiveness),
      })),
      currentUser: stats.find(member => member.user_id === memberId),
      recentCalls: recentCalls.map(call => ({
        ...call,
        call_date: call.call_date.toISOString(),
      }))
    };

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Component initialData={teamData} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error:', error);
    return <div>Error loading data</div>;
  }
}
