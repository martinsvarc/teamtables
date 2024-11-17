// src/app/tables/page.tsx
import { sql } from "@vercel/postgres";
import { Suspense } from "react";
import Component from "./component";

export default async function Page({
  searchParams,
}: {
  searchParams: { memberId: string };
}) {
  const memberId = searchParams.memberId;

  if (!memberId) {
    return <div>Member ID is required</div>;
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
        WHERE user_id = ${memberId}
        GROUP BY user_id, user_name, user_picture_url
      )
      SELECT * FROM user_stats;
    `;

    // Get recent calls
    const { rows: recentCalls } = await sql`
      SELECT * FROM call_records
      WHERE user_id = ${memberId}
      ORDER BY call_date DESC
      LIMIT 5;
    `;

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Component
          initialData={{
            stats: {
              trainingsToday: Number(stats[0]?.trainings_today || 0),
              thisWeek: Number(stats[0]?.this_week || 0),
              thisMonth: Number(stats[0]?.this_month || 0),
              total: Number(stats[0]?.total_trainings || 0),
              currentStreak: 0,
              longestStreak: 0,
            },
            ratings: {
              overall: {
                score: Number(stats[0]?.avg_overall || 0),
                description: "Overall performance across all calls"
              },
              engagement: {
                score: Number(stats[0]?.avg_engagement || 0),
                description: "Average engagement score"
              },
              objection: {
                score: Number(stats[0]?.avg_objection || 0),
                description: "Average objection handling score"
              },
              information: {
                score: Number(stats[0]?.avg_information || 0),
                description: "Average information gathering score"
              },
              program: {
                score: Number(stats[0]?.avg_program || 0),
                description: "Average program explanation score"
              },
              closing: {
                score: Number(stats[0]?.avg_closing || 0),
                description: "Average closing skills score"
              },
              effectiveness: {
                score: Number(stats[0]?.avg_effectiveness || 0),
                description: "Average overall effectiveness score"
              }
            },
            user: {
              id: memberId,
              name: stats[0]?.user_name || "Unknown",
              picture: stats[0]?.user_picture_url || ""
            },
            recentCalls
          }}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error:', error);
    return <div>Error loading call records</div>;
  }
}
