import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const teamId = searchParams.get('teamId');

    console.log('Received request with params:', { memberId, teamId });

    if (!memberId || !teamId) {
      console.log('Missing required parameters');
      return NextResponse.json({
        error: 'Missing required parameters',
        teamMembers: [],
        currentUser: null,
        recentCalls: []
      });
    }

    // Updated team statistics with fixed calculations
    const { rows: teamStats } = await sql`
      WITH daily_stats AS (
        SELECT 
          user_id,
          user_name,
          user_picture_url,
          -- Today's trainings
          COUNT(*) FILTER (WHERE DATE(call_date) = CURRENT_DATE) as trainings_today,
          -- This week's trainings
          COUNT(*) FILTER (WHERE 
            DATE(call_date) >= DATE_TRUNC('week', CURRENT_DATE) AND 
            DATE(call_date) <= CURRENT_DATE
          ) as this_week,
          -- This month's trainings
          COUNT(*) FILTER (WHERE 
            DATE(call_date) >= DATE_TRUNC('month', CURRENT_DATE) AND 
            DATE(call_date) <= CURRENT_DATE
          ) as this_month,
          COUNT(*) as total_trainings,
          ROUND(AVG(overall_performance::numeric)) as avg_overall,
          ROUND(AVG(engagement_score::numeric)) as avg_engagement,
          ROUND(AVG(objection_handling_score::numeric)) as avg_objection,
          ROUND(AVG(information_gathering_score::numeric)) as avg_information,
          ROUND(AVG(program_explanation_score::numeric)) as avg_program,
          ROUND(AVG(closing_score::numeric)) as avg_closing,
          ROUND(AVG(effectiveness_score::numeric)) as avg_effectiveness,
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
      -- Improved streak calculation
      daily_activity AS (
        SELECT DISTINCT
          user_id,
          DATE(call_date) as activity_date
        FROM call_records
        WHERE team_id = ${teamId}
        ORDER BY 1, 2
      ),
      streak_groups AS (
        SELECT
          user_id,
          activity_date,
          activity_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY activity_date))::integer AS group_id
        FROM daily_activity
      ),
      streaks AS (
        SELECT
          user_id,
          COUNT(*) as streak_length,
          MIN(activity_date) as streak_start,
          MAX(activity_date) as streak_end
        FROM streak_groups
        GROUP BY user_id, group_id
      ),
      final_stats AS (
        SELECT
          d.*,
          -- Current streak (only if there's activity today)
          COALESCE((
            SELECT s.streak_length
            FROM streaks s
            WHERE s.user_id = d.user_id
            AND s.streak_end = CURRENT_DATE
            ORDER BY s.streak_length DESC
            LIMIT 1
          ), 0) as current_streak,
          -- Longest streak ever
          COALESCE((
            SELECT MAX(streak_length)
            FROM streaks s
            WHERE s.user_id = d.user_id
          ), 0) as longest_streak,
          -- Updated consistency calculation
          ROUND(
            (COUNT(DISTINCT DATE(call_date)) FILTER (WHERE 
              DATE(call_date) >= DATE_TRUNC('month', CURRENT_DATE)
            )::numeric / EXTRACT(DAY FROM CURRENT_DATE)) * 100
          ) as consistency_this_month
        FROM daily_stats d
      )
      SELECT * FROM final_stats;
    `;

    // Get recent calls
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
      LIMIT 50;
    `;

    const response = {
      teamMembers: teamStats || [],
      currentUser: teamStats?.find(member => member.user_id === memberId) || null,
      recentCalls: recentCalls || []
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch data',
      details: error?.message || 'Unknown error',
      teamMembers: [],
      currentUser: null,
      recentCalls: []
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.user_id || !data.team_id) {
      return NextResponse.json({
        error: 'Missing required fields: user_id and team_id are required'
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const { rows } = await sql`
      INSERT INTO call_records (
        user_id,
        user_name,
        user_picture_url,
        assistant_name,
        assistant_picture_url,
        recording_url,
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
        effectiveness_text,
        ratings_overall_summary,
        ratings_engagement_summary,
        ratings_objection_summary,
        ratings_information_summary,
        ratings_program_summary,
        ratings_closing_summary,
        ratings_effectiveness_summary,
        team_id,
        call_date
      ) VALUES (
        ${data.user_id},
        ${data.user_name || ''},
        ${data.user_picture_url || ''},
        ${data.assistant_name || ''},
        ${data.assistant_picture_url || ''},
        ${data.recording_url || ''},
        ${data.overall_performance || 0},
        ${data.engagement_score || 0},
        ${data.objection_handling_score || 0},
        ${data.information_gathering_score || 0},
        ${data.program_explanation_score || 0},
        ${data.closing_score || 0},
        ${data.effectiveness_score || 0},
        ${data.overall_performance_text || ''},
        ${data.engagement_text || ''},
        ${data.objection_handling_text || ''},
        ${data.information_gathering_text || ''},
        ${data.program_explanation_text || ''},
        ${data.closing_text || ''},
        ${data.effectiveness_text || ''},
        ${data.ratings_overall_summary || ''},
        ${data.ratings_engagement_summary || ''},
        ${data.ratings_objection_summary || ''},
        ${data.ratings_information_summary || ''},
        ${data.ratings_program_summary || ''},
        ${data.ratings_closing_summary || ''},
        ${data.ratings_effectiveness_summary || ''},
        ${data.team_id},
        CURRENT_TIMESTAMP
      ) RETURNING *;
    `;

    return NextResponse.json({
      message: 'Record created successfully',
      record: rows[0]
    }, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({
      error: 'Failed to create record',
      details: error?.message || 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
