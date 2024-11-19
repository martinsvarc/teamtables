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

    if (!memberId || !teamId) {
      return NextResponse.json({
        error: 'Missing required parameters',
        teamMembers: [],
        currentUser: null,
        recentCalls: []
      });
    }

    const { rows: teamStats } = await sql`
      WITH latest_user_data AS (
        SELECT DISTINCT ON (user_id)
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
        FROM call_records
        WHERE team_id = ${teamId}
        ORDER BY user_id, call_date DESC
      ),
      daily_stats AS (
        SELECT 
          cr.user_id,
          lud.user_name,
          lud.user_picture_url,
          COUNT(DISTINCT CASE 
            WHEN DATE_TRUNC('day', call_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') = 
                 DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague')
            THEN call_date 
          END) as trainings_today,
          COUNT(DISTINCT CASE 
            WHEN DATE_TRUNC('day', call_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') >= 
                 DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') 
            THEN call_date 
          END) as this_week,
          COUNT(DISTINCT CASE 
            WHEN DATE_TRUNC('day', call_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') >= 
                 DATE_TRUNC('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague')
            THEN call_date 
          END) as this_month,
          COUNT(*) as total_trainings,
          ROUND(AVG(overall_performance::numeric)) as avg_overall,
          ROUND(AVG(engagement_score::numeric)) as avg_engagement,
          ROUND(AVG(objection_handling_score::numeric)) as avg_objection,
          ROUND(AVG(information_gathering_score::numeric)) as avg_information,
          ROUND(AVG(program_explanation_score::numeric)) as avg_program,
          ROUND(AVG(closing_score::numeric)) as avg_closing,
          ROUND(AVG(effectiveness_score::numeric)) as avg_effectiveness,
          lud.ratings_overall_summary as overall_summary,
          lud.ratings_engagement_summary as engagement_summary,
          lud.ratings_objection_summary as objection_summary,
          lud.ratings_information_summary as information_summary,
          lud.ratings_program_summary as program_summary,
          lud.ratings_closing_summary as closing_summary,
          lud.ratings_effectiveness_summary as effectiveness_summary
        FROM call_records cr
        JOIN latest_user_data lud ON cr.user_id = lud.user_id
        WHERE cr.team_id = ${teamId}
        GROUP BY 
          cr.user_id, 
          lud.user_name,
          lud.user_picture_url,
          lud.ratings_overall_summary,
          lud.ratings_engagement_summary,
          lud.ratings_objection_summary,
          lud.ratings_information_summary,
          lud.ratings_program_summary,
          lud.ratings_closing_summary,
          lud.ratings_effectiveness_summary
      ),
      daily_activity AS (
        SELECT DISTINCT
          user_id,
          DATE(call_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague')::date as activity_date
        FROM call_records
        WHERE team_id = ${teamId}
        ORDER BY 1, 2
      ),
      streak_groups AS (
        SELECT
          user_id,
          activity_date,
          DATE(activity_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY activity_date))::integer) as group_id
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
      user_streaks AS (
        SELECT 
          user_id,
          MAX(CASE 
            WHEN streak_end = CURRENT_DATE
            THEN streak_length 
            ELSE 0 
          END) as current_streak,
          MAX(streak_length) as longest_streak
        FROM streaks
        GROUP BY user_id
      ),
      monthly_consistency AS (
        SELECT 
          cr.user_id,
          COUNT(DISTINCT DATE(cr.call_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague')) as practice_days,
          EXTRACT(DAY FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') as days_in_month,
          ROUND(
            (COUNT(DISTINCT DATE(cr.call_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague'))::numeric * 100.0) / 
            EXTRACT(DAY FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague')
          ) as consistency_score
        FROM call_records cr
        WHERE 
          team_id = ${teamId} AND
          DATE_TRUNC('month', cr.call_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') = 
          DATE_TRUNC('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague')
        GROUP BY cr.user_id
      ),
      final_stats AS (
        SELECT DISTINCT
          d.*,
          COALESCE(us.current_streak, 0) as current_streak,
          COALESCE(us.longest_streak, 0) as longest_streak,
          COALESCE(mc.consistency_score, 0) as consistency_this_month
        FROM daily_stats d
        LEFT JOIN user_streaks us ON d.user_id = us.user_id
        LEFT JOIN monthly_consistency mc ON d.user_id = mc.user_id
      )
      SELECT * FROM final_stats;
    `;

    const { rows: recentCalls } = await sql`
      WITH latest_user_info AS (
        SELECT DISTINCT ON (user_id)
          user_id,
          user_name,
          user_picture_url
        FROM call_records
        ORDER BY user_id, call_date DESC
      )
      SELECT 
        cr.id,
        cr.user_id,
        lui.user_name,
        lui.user_picture_url,
        cr.assistant_name,
        cr.assistant_picture_url,
        cr.recording_url,
        cr.call_date,
        cr.overall_performance,
        cr.engagement_score,
        cr.objection_handling_score,
        cr.information_gathering_score,
        cr.program_explanation_score,
        cr.closing_score,
        cr.effectiveness_score,
        cr.overall_performance_text,
        cr.engagement_text,
        cr.objection_handling_text,
        cr.information_gathering_text,
        cr.program_explanation_text,
        cr.closing_text,
        cr.effectiveness_text
      FROM call_records cr
      JOIN latest_user_info lui ON cr.user_id = lui.user_id
      WHERE cr.team_id = ${teamId}
      ORDER BY cr.call_date DESC
      LIMIT 50;
    `;

    return NextResponse.json({
      teamMembers: teamStats || [],
      currentUser: teamStats?.find(member => member.user_id === memberId) || null,
      recentCalls: recentCalls || []
    });

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
