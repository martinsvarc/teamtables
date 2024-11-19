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

    console.log('Starting request with params:', { memberId, teamId });

    if (!memberId || !teamId) {
      return NextResponse.json({
        error: 'Missing required parameters',
        teamMembers: [],
        currentUser: null,
        recentCalls: []
      });
    }

    // Main query with proper date handling
    const { rows: teamStats } = await sql`
      WITH parsed_dates AS (
        SELECT 
          id,
          user_id,
          CAST(SUBSTRING(call_date, 1, 24) AS timestamp) as parsed_date
        FROM call_records
        WHERE team_id = ${teamId}
      ),
      user_metrics AS (
        SELECT 
          cr.user_id,
          cr.user_name,
          cr.user_picture_url,
          -- Count calculations using parsed dates
          COUNT(*) as total_trainings,
          COUNT(*) FILTER (WHERE DATE(pd.parsed_date) = CURRENT_DATE) as trainings_today,
          COUNT(*) FILTER (WHERE DATE(pd.parsed_date) >= DATE_TRUNC('week', CURRENT_DATE)) as this_week,
          COUNT(*) FILTER (WHERE DATE(pd.parsed_date) >= DATE_TRUNC('month', CURRENT_DATE)) as this_month,
          -- Score averages
          ROUND(AVG(CAST(NULLIF(cr.overall_performance, '') AS numeric))) as avg_overall,
          ROUND(AVG(CAST(NULLIF(cr.engagement_score, '') AS numeric))) as avg_engagement,
          ROUND(AVG(CAST(NULLIF(cr.objection_handling_score, '') AS numeric))) as avg_objection,
          ROUND(AVG(CAST(NULLIF(cr.information_gathering_score, '') AS numeric))) as avg_information,
          ROUND(AVG(CAST(NULLIF(cr.program_explanation_score, '') AS numeric))) as avg_program,
          ROUND(AVG(CAST(NULLIF(cr.closing_score, '') AS numeric))) as avg_closing,
          ROUND(AVG(CAST(NULLIF(cr.effectiveness_score, '') AS numeric))) as avg_effectiveness,
          -- Summaries
          MAX(cr.ratings_overall_summary) as overall_summary,
          MAX(cr.ratings_engagement_summary) as engagement_summary,
          MAX(cr.ratings_objection_summary) as objection_summary,
          MAX(cr.ratings_information_summary) as information_summary,
          MAX(cr.ratings_program_summary) as program_summary,
          MAX(cr.ratings_closing_summary) as closing_summary,
          MAX(cr.ratings_effectiveness_summary) as effectiveness_summary
        FROM call_records cr
        JOIN parsed_dates pd ON cr.id = pd.id
        WHERE cr.team_id = ${teamId}
        GROUP BY cr.user_id, cr.user_name, cr.user_picture_url
      ),
      streak_data AS (
        SELECT 
          user_id,
          DATE(parsed_date) as training_date,
          DATE(parsed_date) - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY DATE(parsed_date)))::integer AS streak_group
        FROM parsed_dates
      ),
      streak_lengths AS (
        SELECT 
          user_id,
          COUNT(*) as streak_length,
          MIN(training_date) as streak_start,
          MAX(training_date) as streak_end
        FROM streak_data
        GROUP BY user_id, streak_group
      ),
      final_streaks AS (
        SELECT
          user_id,
          MAX(CASE WHEN streak_end = CURRENT_DATE THEN streak_length ELSE 0 END) as current_streak,
          MAX(streak_length) as longest_streak
        FROM streak_lengths
        GROUP BY user_id
      )
      SELECT 
        m.*,
        COALESCE(f.current_streak, 0) as current_streak,
        COALESCE(f.longest_streak, 0) as longest_streak,
        CASE 
          WHEN m.this_month > 0 
          THEN ROUND((m.this_month::numeric / EXTRACT(DAY FROM CURRENT_DATE)) * 100)
          ELSE 0 
        END as consistency_this_month
      FROM user_metrics m
      LEFT JOIN final_streaks f ON m.user_id = f.user_id;
    `;

    // Get recent calls with proper date ordering
    const { rows: recentCalls } = await sql`
      WITH parsed_calls AS (
        SELECT 
          *,
          CAST(SUBSTRING(call_date, 1, 24) AS timestamp) as parsed_date
        FROM call_records
        WHERE team_id = ${teamId}
      )
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
      FROM parsed_calls
      ORDER BY parsed_date DESC
      LIMIT 50;
    `;

    const response = {
      teamMembers: teamStats || [],
      currentUser: teamStats?.find(member => member.user_id === memberId) || null,
      recentCalls: recentCalls || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error);

    return NextResponse.json({
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error',
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

    // Generate current date in the required format
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'GMT',
      hour12: false
    }) + ' GMT+0100 (GMT+01:00)';

    const { rows } = await sql`
      INSERT INTO call_records (
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
        effectiveness_text,
        ratings_overall_summary,
        ratings_engagement_summary,
        ratings_objection_summary,
        ratings_information_summary,
        ratings_program_summary,
        ratings_closing_summary,
        ratings_effectiveness_summary,
        team_id
      ) VALUES (
        ${data.user_id},
        ${data.user_name || ''},
        ${data.user_picture_url || ''},
        ${data.assistant_name || ''},
        ${data.assistant_picture_url || ''},
        ${data.recording_url || ''},
        ${formattedDate},
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
        ${data.team_id}
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('API Route Error:', errorMessage);
    
    return NextResponse.json({
      error: 'Failed to create record',
      details: errorMessage
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
