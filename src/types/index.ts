export interface TeamMember {
  user_id: string;
  user_name: string;
  user_picture_url: string;
  trainings_today: number;
  this_week: number;
  this_month: number;
  total_trainings: number;
  current_streak: number;
  longest_streak: number;
  avg_overall: number;
  avg_engagement: number;
  avg_objection: number;
  avg_information: number;
  avg_program: number;
  avg_closing: number;
  avg_effectiveness: number;
  ratings_overall_summary?: string;
  ratings_engagement_summary?: string;
  ratings_objection_summary?: string;
  ratings_information_summary?: string;
  ratings_program_summary?: string;
  ratings_closing_summary?: string;
  ratings_effectiveness_summary?: string;
}

export interface CallRecord {
  id: number;
  user_id: string;
  user_name: string;
  user_picture_url: string;
  assistant_name: string;
  assistant_picture_url: string;
  recording_url: string;
  call_date: string;
  overall_performance: number;
  engagement_score: number;
  objection_handling_score: number;
  information_gathering_score: number;
  program_explanation_score: number;
  closing_score: number;
  effectiveness_score: number;
  overall_performance_text: string;
  engagement_text: string;
  objection_handling_text: string;
  information_gathering_text: string;
  program_explanation_text: string;
  closing_text: string;
  effectiveness_text: string;
}

export interface DatabaseData {
  teamMembers: TeamMember[];
  currentUser: TeamMember | null;
  recentCalls: CallRecord[];
}

export type SortDirection = 'asc' | 'desc';
export type SortType = 'standard' | 'name' | 'consistency' | 'effectiveness' | 'date';
