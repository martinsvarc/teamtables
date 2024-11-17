// app/api/call-records/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const {
      memberId,
      userName,
      userPicture,
      assistantName,
      assistantPicture,
      recordingUrl,
      scores,
      descriptions
    } = await request.json();

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
        ratings_effectiveness_summary
      ) VALUES (
        ${memberId},
        ${userName},
        ${userPicture},
        ${assistantName},
        ${assistantPicture},
        ${recordingUrl},
        ${scores.overall},
        ${scores.engagement},
        ${scores.objection},
        ${scores.information},
        ${scores.program},
        ${scores.closing},
        ${scores.effectiveness},
        ${descriptions.overall},
        ${descriptions.engagement},
        ${descriptions.objection},
        ${descriptions.information},
        ${descriptions.program},
        ${descriptions.closing},
        ${descriptions.effectiveness},
        ${descriptions.overallSummary},
        ${descriptions.engagementSummary},
        ${descriptions.objectionSummary},
        ${descriptions.informationSummary},
        ${descriptions.programSummary},
        ${descriptions.closingSummary},
        ${descriptions.effectivenessSummary}
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: rows[0].id });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
}
