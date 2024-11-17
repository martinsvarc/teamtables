// app/api/call-records/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');
  const teamId = searchParams.get('teamId');

  if (!memberId || !teamId) {
    return NextResponse.json({ error: 'Member ID and Team ID are required' }, { status: 400 });
  }

  try {
    // Get all team members' stats
    const { rows: teamStats } = await sql`
      WITH daily_stats AS (
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
          ROUND(AVG(effectiveness_score)) as avg_effectiveness,
          MAX(ratings_overall_summary) as overall_summary,
          MAX(ratings_engagement_summary) as engagement_summary,
          MAX(ratings_objection_summary) as objection_summary,
          MAX(ratings_information_summary) as information_summary,
          MAX(ratings_program_summary) as program_summary,
          MAX(ratings_closing_summary) as closing_summary,
          MAX(ratings_effectiveness_summary) as effectiveness_summary
        FROM call_records
        WHERE team_id = ${teamId}
        GROUP BY user_id, user_name, user_picture_url
      ),
      streak_calc AS (
        SELECT 
          user_id,
          DATE(call_date) as call_date,
          DATE(call_date) - 
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY DATE(call_date)) * INTERVAL '1 day' as streak_group
        FROM (
          SELECT DISTINCT user_id, DATE(call_date)
          FROM call_records
          WHERE team_id = ${teamId}
        ) distinct_dates
      ),
      streak_lengths AS (
        SELECT 
          user_id,
          streak_group,
          COUNT(*) as streak_length,
          MAX(call_date) as streak_end_date
        FROM streak_calc
        GROUP BY user_id, streak_group
      )
      SELECT 
        d.*,
        COALESCE(
          (SELECT streak_length 
           FROM streak_lengths s 
           WHERE s.user_id = d.user_id
           AND streak_end_date = CURRENT_DATE
           LIMIT 1), 0
        ) as current_streak,
        COALESCE(
          (SELECT MAX(streak_length) 
           FROM streak_lengths s 
           WHERE s.user_id = d.user_id), 0
        ) as longest_streak
      FROM daily_stats d;
    `;

    // Get recent calls for the team
    const { rows: recentCalls } = await sql`
      SELECT 
        id,
        user_id,
        user_name,
        user_picture_url,
        assistant_name,
        assistant_picture_url,
        recording_url,
        call_date,
        overall_performance,
        engagement_score,
        objection_handling_score,
        information_gathering_score,
        program_explanation_score,
        closing_score,
        effectiveness_score,
        overall_performance_text,
        engagement_text,
        objection_handling_text,
        information_gathering_text,
        program_explanation_text,
        closing_text,
        effectiveness_text
      FROM call_records
      WHERE team_id = ${teamId}
      ORDER BY call_date DESC
      LIMIT 5;
    `;

    return NextResponse.json({
      teamMembers: teamStats,
      currentUser: teamStats.find(member => member.user_id === memberId) || null,
      recentCalls
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
