// app/api/call-records/route.ts
import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const pool = createPool({
      connectionString: process.env.POSTGRES_URL
    });

    // Get today's date info
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    // Get all stats and latest rating summaries
    const { rows: stats } = await pool.sql`
      WITH user_stats AS (
        SELECT 
          user_id,
          user_name,
          user_picture_url,
          COUNT(*) FILTER (WHERE DATE(call_date) = CURRENT_DATE) as trainings_today,
          COUNT(*) FILTER (WHERE call_date >= ${startOfWeekStr}::date) as this_week,
          COUNT(*) FILTER (WHERE call_date >= ${startOfMonthStr}::date) as this_month,
          COUNT(*) as total_trainings,
          -- Averages for Ratings View
          ROUND(AVG(overall_performance)) as avg_overall,
          ROUND(AVG(engagement_score)) as avg_engagement,
          ROUND(AVG(objection_handling_score)) as avg_objection,
          ROUND(AVG(information_gathering_score)) as avg_information,
          ROUND(AVG(program_explanation_score)) as avg_program,
          ROUND(AVG(closing_score)) as avg_closing,
          ROUND(AVG(effectiveness_score)) as avg_effectiveness,
          -- Latest rating summaries
          ratings_overall_summary,
          ratings_engagement_summary,
          ratings_objection_summary,
          ratings_information_summary,
          ratings_program_summary,
          ratings_closing_summary,
          ratings_effectiveness_summary
        FROM call_records
        WHERE user_id = ${memberId}
        GROUP BY 
          user_id, 
          user_name, 
          user_picture_url,
          ratings_overall_summary,
          ratings_engagement_summary,
          ratings_objection_summary,
          ratings_information_summary,
          ratings_program_summary,
          ratings_closing_summary,
          ratings_effectiveness_summary
        ORDER BY call_date DESC
        LIMIT 1
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
          WHERE user_id = ${memberId}
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
        s.*,
        COALESCE(
          (SELECT streak_length 
           FROM streak_lengths 
           WHERE streak_end_date = CURRENT_DATE
           LIMIT 1), 0
        ) as current_streak,
        COALESCE(
          (SELECT MAX(streak_length) 
           FROM streak_lengths), 0
        ) as longest_streak
      FROM user_stats s;
    `;

    // Get recent calls with individual descriptions
    const { rows: recentCalls } = await pool.sql`
      SELECT 
        id,
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
      WHERE user_id = ${memberId}
      ORDER BY call_date DESC
      LIMIT 5;
    `;

    return NextResponse.json({
      user: {
        id: memberId,
        name: stats[0]?.user_name,
        picture: stats[0]?.user_picture_url
      },
      stats: {
        trainingsToday: parseInt(stats[0]?.trainings_today || '0'),
        thisWeek: parseInt(stats[0]?.this_week || '0'),
        thisMonth: parseInt(stats[0]?.this_month || '0'),
        total: parseInt(stats[0]?.total_trainings || '0'),
        currentStreak: parseInt(stats[0]?.current_streak || '0'),
        longestStreak: parseInt(stats[0]?.longest_streak || '0')
      },
      ratings: {
        overall: {
          score: parseInt(stats[0]?.avg_overall || '0'),
          description: stats[0]?.ratings_overall_summary
        },
        engagement: {
          score: parseInt(stats[0]?.avg_engagement || '0'),
          description: stats[0]?.ratings_engagement_summary
        },
        objection: {
          score: parseInt(stats[0]?.avg_objection || '0'),
          description: stats[0]?.ratings_objection_summary
        },
        information: {
          score: parseInt(stats[0]?.avg_information || '0'),
          description: stats[0]?.ratings_information_summary
        },
        program: {
          score: parseInt(stats[0]?.avg_program || '0'),
          description: stats[0]?.ratings_program_summary
        },
        closing: {
          score: parseInt(stats[0]?.avg_closing || '0'),
          description: stats[0]?.ratings_closing_summary
        },
        effectiveness: {
          score: parseInt(stats[0]?.avg_effectiveness || '0'),
          description: stats[0]?.ratings_effectiveness_summary
        }
      },
      recentCalls
    });

  } catch (error) {
    console.error('Error fetching call records:', error);
    return NextResponse.json({ error: 'Failed to fetch call records' }, { status: 500 });
  }
}
