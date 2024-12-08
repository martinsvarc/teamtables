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
          ROUND(AVG(NULLIF(overall_performance, 'N/A')::numeric)) as avg_overall,
          ROUND(AVG(NULLIF(engagement_score, 'N/A')::numeric)) as avg_engagement,
          ROUND(AVG(NULLIF(objection_handling_score, 'N/A')::numeric)) as avg_objection,
          ROUND(AVG(NULLIF(information_gathering_score, 'N/A')::numeric)) as avg_information,
          ROUND(AVG(NULLIF(program_explanation_score, 'N/A')::numeric)) as avg_program,
          ROUND(AVG(NULLIF(closing_score, 'N/A')::numeric)) as avg_closing,
          ROUND(AVG(NULLIF(effectiveness_score, 'N/A')::numeric)) as avg_effectiveness,
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
      SELECT 
        user_id,
        user_name,
        user_picture_url,
        COALESCE(trainings_today, 0) as trainings_today,
        COALESCE(this_week, 0) as this_week,
        COALESCE(this_month, 0) as this_month,
        COALESCE(total_trainings, 0) as total_trainings,
        COALESCE(avg_overall, 0) as avg_overall,
        COALESCE(avg_engagement, 0) as avg_engagement,
        COALESCE(avg_objection, 0) as avg_objection,
        COALESCE(avg_information, 0) as avg_information,
        COALESCE(avg_program, 0) as avg_program,
        COALESCE(avg_closing, 0) as avg_closing,
        COALESCE(avg_effectiveness, 0) as avg_effectiveness,
        COALESCE(current_streak, 0) as current_streak,
        COALESCE(longest_streak, 0) as longest_streak,
        COALESCE(consistency_this_month, 0) as consistency_this_month,
        overall_summary,
        engagement_summary,
        objection_summary,
        information_summary,
        program_summary,
        closing_summary,
        effectiveness_summary
      FROM final_stats;
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
        COALESCE(NULLIF(cr.overall_performance, 'N/A'), '0') as overall_performance,
        COALESCE(NULLIF(cr.engagement_score, 'N/A'), '0') as engagement_score,
        COALESCE(NULLIF(cr.objection_handling_score, 'N/A'), '0') as objection_handling_score,
        COALESCE(NULLIF(cr.information_gathering_score, 'N/A'), '0') as information_gathering_score,
        COALESCE(NULLIF(cr.program_explanation_score, 'N/A'), '0') as program_explanation_score,
        COALESCE(NULLIF(cr.closing_score, 'N/A'), '0') as closing_score,
        COALESCE(NULLIF(cr.effectiveness_score, 'N/A'), '0') as effectiveness_score,
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
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('API Route Error:', {
      message: error?.message,
      stack: error?.stack,
      details: error?.details,
      code: error?.code
    });
    
    return NextResponse.json({
      error: 'Failed to fetch data',
      details: error?.message || 'Unknown error',
      errorCode: error?.code,
      teamMembers: [],
      currentUser: null,
      recentCalls: []
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });
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
          'Content-Type': 'application/json',
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
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('API Route Error:', {
      message: error?.message,
      stack: error?.stack,
      details: error?.details,
      code: error?.code
    });
    
    return NextResponse.json({
      error: 'Failed to create record',
      details: error?.message || 'Unknown error',
      errorCode: error?.code
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });
  }
}
