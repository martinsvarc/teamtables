import { sql } from '@vercel/postgres';
import { TeamMember, CallRecord } from '@/types';

export async function getTeamMembers() {
  try {
    const { rows } = await sql<TeamMember>`
      SELECT * FROM team_members
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
}

export async function getCallRecords() {
  try {
    const { rows } = await sql<CallRecord>`
      SELECT * FROM call_records
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching call records:', error);
    throw error;
  }
}

export async function getCurrentUser(userId: string) {
  try {
    const { rows } = await sql<TeamMember>`
      SELECT * FROM team_members
      WHERE user_id = ${userId}
      LIMIT 1
    `;
    return rows[0];
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
}
