'use client'

import * as React from "react"
import { DateRange } from "react-day-picker"
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from './loading'
import Image from 'next/image';
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PlayCircle, ChevronDown, BarChart2, Star, PhoneCall, ArrowUpDown, Search, CalendarIcon, Info, ChevronLeft, ChevronRight, CalendarRange, Menu, Pause, SkipBack, SkipForward } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Montserrat } from 'next/font/google'

const API_BASE_URL = 'https://teamtables-havu.vercel.app';

const montserratFont = Montserrat({ subsets: ['latin'] })

type SortDirection = 'asc' | 'desc';
type SortType = 'standard' | 'name' | 'consistency' | 'effectiveness' | 'date';

// Constants
const sectionStyle = "overflow-hidden border-none bg-white shadow-sm"
const headerStyle = "flex items-center justify-between border-b p-4"
const buttonStyle = "flex items-center gap-2 rounded-full text-white hover:bg-opacity-90"

interface TeamMember {
  user_id: string;
  user_name: string;
  user_picture_url: string;
  trainings_today: string;
  this_week: string;
  this_month: string;
  total_trainings: string;
  current_streak: string;
  longest_streak: string;
  consistency_this_month: string;
  avg_overall: string;
  avg_engagement: string;
  avg_objection: string;
  avg_information: string;
  avg_program: string;
  avg_closing: string;
  avg_effectiveness: string;
  // Rating summaries with both formats
  overall_summary?: string;
  engagement_summary?: string;
  objection_summary?: string;
  information_summary?: string;
  program_summary?: string;
  closing_summary?: string;
  effectiveness_summary?: string;
  ratings_overall_summary?: string;
  ratings_engagement_summary?: string;
  ratings_objection_summary?: string;
  ratings_information_summary?: string;
  ratings_program_summary?: string;
  ratings_closing_summary?: string;
  ratings_effectiveness_summary?: string;
}

interface CallRecord {
  id: number;
  user_id: string;
  user_name: string;
  user_picture_url: string;
  assistant_name: string;
  assistant_picture_url: string;
  recording_url: string;
  call_date: string;
  overall_performance: string;
  engagement_score: string;
  objection_handling_score: string;
  information_gathering_score: string;
  program_explanation_score: string;
  closing_score: string;
  effectiveness_score: string;
  overall_performance_text: string;
  engagement_text: string;
  objection_handling_text: string;
  information_gathering_text: string;
  program_explanation_text: string;
  closing_text: string;
  effectiveness_text: string;
}

interface DatabaseData {
  teamMembers: TeamMember[];
  currentUser: TeamMember | null;
  recentCalls: CallRecord[];
}

interface ComponentProps {
  initialData?: DatabaseData;
}

// Props interfaces
interface ScoreCellProps {
  score: number;
  description: string | undefined;
  title: string;
  color: string;
}

interface AudioPlayerProps {
  audioSrc: string;
  caller: string;
}

interface ComponentProps {
  initialData?: DatabaseData;
}
// Helper Functions
const filterData = <T extends { user_name: string }>(data: T[], searchTerm: string): T[] => {
  if (!searchTerm) return data;
  const lowercaseSearch = searchTerm.toLowerCase();
  return data.filter(item => 
    item.user_name.toLowerCase().includes(lowercaseSearch)
  );
};

const sortData = <T extends Record<string, any>>(
  data: T[],
  sortType: SortType,
  direction: SortDirection
): T[] => {
  const sortedData = [...data];

  switch (sortType) {
    case 'name':
      return sortedData.sort((a, b) => {
        const comparison = a.user_name.localeCompare(b.user_name);
        return direction === 'asc' ? comparison : -comparison;
      });
    
    case 'consistency':
      return sortedData.sort((a, b) => {
        const aConsistency = Math.round((a.this_month / 30) * 100);
        const bConsistency = Math.round((b.this_month / 30) * 100);
        const comparison = aConsistency - bConsistency;
        return direction === 'asc' ? comparison : -comparison;
      });
    
    case 'effectiveness':
      return sortedData.sort((a, b) => {
        const comparison = (a.avg_effectiveness || 0) - (b.avg_effectiveness || 0);
        return direction === 'asc' ? comparison : -comparison;
      });
    
    case 'date':
      return sortedData.sort((a, b) => {
        const dateA = new Date(a.call_date).getTime();
        const dateB = new Date(b.call_date).getTime();
        const comparison = dateA - dateB;
        return direction === 'asc' ? comparison : -comparison;
      });
    
    default:
      return sortedData;
  }
};

const formatDateRange = (dateRange: DateRange | undefined) => {
  if (!dateRange) return "All time";
  const { from, to } = dateRange;
  
  if (!from) return "All time";
  if (!to) return from.toLocaleDateString();
  
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return "Last 7 Days";
  if (diffDays <= 14) return "Last 14 Days";
  if (diffDays <= 30) return "Last 30 Days";
  
  return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
};

const ScoreCell: React.FC<ScoreCellProps> = ({ score, description, title, color }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="px-2 py-2 text-center w-full group"
        >
          <span className="inline-flex items-center gap-1 transition-colors">
            <span className={`group-hover:text-${color}`}>{score}/100</span>
            <Info className={`h-4 w-4 group-hover:text-${color}`} />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4 bg-white shadow-md rounded-md border">
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <span className={`text-2xl font-bold text-${color}`}>{score}/100</span>
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSrc, caller }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <h3 className="text-lg font-semibold">Call with {caller}</h3>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={togglePlayPause}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-full flex items-center space-x-2">
        <span className="text-sm">{formatTime(currentTime)}</span>
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSliderChange}
          className="w-full"
        />
        <span className="text-sm">{formatTime(duration)}</span>
      </div>
    </div>
  );
};

const Component: React.FC<ComponentProps> = ({ initialData }) => {
  const searchParams = useSearchParams();
  const memberId = searchParams.get('memberId');
  const teamId = searchParams.get('teamId');

  console.log('Starting component with params:', { memberId, teamId });

  // State declarations
const [data, setData] = useState<DatabaseData | null>(() => {
    const defaultData = {
      currentUser: null,
      teamMembers: [],
      recentCalls: []
    };
    return initialData || defaultData;
  });
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  console.log('2. Data State:', {
    hasData: !!data,
    teamMembersCount: data?.teamMembers?.length,
    callsCount: data?.recentCalls?.length,
    rawData: data
  });

  // UI States
  const [showMoreActivity, setShowMoreActivity] = useState(false);
  const [showMoreRatings, setShowMoreRatings] = useState(false);
  const [showMoreCallLogs, setShowMoreCallLogs] = useState(false);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [ratingsSearch, setRatingsSearch] = useState("");
  const [callLogsSearch, setCallLogsSearch] = useState("");
  const [selectedAudio, setSelectedAudio] = useState<{ src: string; caller: string } | null>(null);

  // Sort states
  const [activitySort, setActivitySort] = useState<{ type: SortType; direction: SortDirection }>({
    type: 'standard',
    direction: 'asc'
  });
  const [ratingsSort, setRatingsSort] = useState<{ type: SortType; direction: SortDirection }>({
    type: 'standard',
    direction: 'asc'
  });
  const [callLogsSort, setCallLogsSort] = useState<{ type: SortType; direction: SortDirection }>({
    type: 'standard',
    direction: 'asc'
  });

  // Data fetching
useEffect(() => {
    if (memberId && teamId) {
      console.log('Initiating fetch with:', { memberId, teamId });
      fetchData();
    } else {
      console.log('Missing required parameters:', { memberId, teamId });
    }
  }, [memberId, teamId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('3. Fetching with params:', { memberId, teamId });
      
      const url = `${API_BASE_URL}/api/call-records?memberId=${memberId}&teamId=${teamId}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newData = await response.json();
      console.log('Raw API Response:', newData);
      
      const processedData = {
        currentUser: newData.currentUser || null,
        teamMembers: Array.isArray(newData.teamMembers) ? newData.teamMembers : [],
        recentCalls: Array.isArray(newData.recentCalls) ? newData.recentCalls : []
      };
      
      console.log('4. Processed API Response:', {
        hasCurrentUser: !!processedData.currentUser,
        teamMembersCount: processedData.teamMembers.length,
        callsCount: processedData.recentCalls.length
      });
      
      setData(processedData);
      setError(null);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler functions
  const handleQuickSelection = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    setDate({ from, to });
  };

const processTeamData = () => {
  if (!data || !Array.isArray(data.teamMembers)) {
    console.log('No valid data to process');
    return {
      filteredActivityData: [],
      filteredRatingsData: [],
      filteredCallLogsData: []
    };
  }

  // Process Activity Data
  const activityData = data.teamMembers.map(member => {
  return {
    user_id: member.user_id,
    user_name: member.user_name,
    user_picture_url: member.user_picture_url,
    trainingsToday: Number(member.trainings_today) || 0,
    thisWeek: Number(member.this_week) || 0,
    thisMonth: Number(member.this_month) || 0,
    total: Number(member.total_trainings) || 0,
    currentStreak: Number(member.current_streak) || 0,
    longestStreak: Number(member.longest_streak) || 0,
      consistency: Number(member.consistency_this_month) || 0
  };
});

  // Process Ratings Data
  const ratingsData = data.teamMembers.map(member => ({
    user_id: member.user_id,
    user_name: member.user_name,
    user_picture_url: member.user_picture_url,
    overall: Number(member.avg_overall) || 0,
    engagement: Number(member.avg_engagement) || 0,
    objection: Number(member.avg_objection) || 0,
    information: Number(member.avg_information) || 0,
    program: Number(member.avg_program) || 0,
    closing: Number(member.avg_closing) || 0,
    effectiveness: Number(member.avg_effectiveness) || 0,
    descriptions: {
      overall: member.overall_summary || member.ratings_overall_summary || '',
      engagement: member.engagement_summary || member.ratings_engagement_summary || '',
      objection: member.objection_summary || member.ratings_objection_summary || '',
      information: member.information_summary || member.ratings_information_summary || '',
      program: member.program_summary || member.ratings_program_summary || '',
      closing: member.closing_summary || member.ratings_closing_summary || '',
      effectiveness: member.effectiveness_summary || member.ratings_effectiveness_summary || ''
    }
  }));

  // Process Call Logs
const callLogsData = Array.isArray(data.recentCalls) ? data.recentCalls
    .filter(log => {
      if (!date?.from) return true; // If no date selected, show all
      
      const callDate = new Date(log.call_date);
      const fromDate = new Date(date.from);
      const toDate = date.to ? new Date(date.to) : new Date();
      
      // Set times to midnight for accurate date comparison
      callDate.setHours(0, 0, 0, 0);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      return callDate >= fromDate && callDate <= toDate;
    })
    .map(log => ({
      ...log,
      overall_performance: Number(log.overall_performance) || 0,
      engagement_score: Number(log.engagement_score) || 0,
      objection_handling_score: Number(log.objection_handling_score) || 0,
      information_gathering_score: Number(log.information_gathering_score) || 0,
      program_explanation_score: Number(log.program_explanation_score) || 0,
      closing_score: Number(log.closing_score) || 0,
      effectiveness_score: Number(log.effectiveness_score) || 0
    })) : [];

  // Apply filters and sorting
 const filteredActivityData = sortData(
    filterData(activityData, activitySearch),
    activitySort.type,
    activitySort.direction
  );

  const filteredRatingsData = sortData(
    filterData(ratingsData, ratingsSearch),
    ratingsSort.type,
    ratingsSort.direction
  );

  const filteredCallLogsData = sortData(
    filterData(callLogsData, callLogsSearch),
    callLogsSort.type,
    callLogsSort.direction
  );

  return {
    filteredActivityData,
    filteredRatingsData,
    filteredCallLogsData
  };
};

  // Get processed data
  const { filteredActivityData, filteredRatingsData, filteredCallLogsData } = processTeamData();

  const visibleActivityData = showMoreActivity ? filteredActivityData.slice(0, 15) : filteredActivityData.slice(0, 5);
  const visibleRatingsData = showMoreRatings ? filteredRatingsData.slice(0, 15) : filteredRatingsData.slice(0, 5);
  const visibleCallLogsData = showMoreCallLogs ? filteredCallLogsData.slice(0, 15) : filteredCallLogsData.slice(0, 5);

  // Loading and error states
  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;
// ... (continuing from the previous part)

 console.log('4. Processed data:', {
    activityData: visibleActivityData,
    ratingsData: visibleRatingsData,
    callLogsData: visibleCallLogsData
  });

 return (
  <>
    <div className={`fixed inset-0 flex bg-[#f0f1f7] ${montserratFont.className}`}>
      {/* Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="font-extrabold">Dashboard Navigation</SheetTitle>
            <SheetDescription>
              Quick access to all dashboard sections
            </SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-2 mt-4">
            <Button variant="ghost" className="justify-start">
              <BarChart2 className="mr-2 h-4 w-4" />
              Activity View
            </Button>
            <Button variant="ghost" className="justify-start">
              <Star className="mr-2 h-4 w-4" />
              Ratings View
            </Button>
            <Button variant="ghost" className="justify-start">
              <PhoneCall className="mr-2 h-4 w-4" />
              Call Logs
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1 fixed inset-0 overflow-hidden p-4 font-medium">
  <ScrollArea className="absolute inset-0">
          <div className="space-y-4">
            {/* Activity View */}
            <Card className={sectionStyle}>
              <div className={headerStyle}>
                <div className="flex items-center gap-2 text-[#000000]">
                  <Image 
                    src="https://res.cloudinary.com/drkudvyog/image/upload/v1733765915/Table_Activity_Team_View_icon_duha_zby14j.png" 
                    alt="Activity Chart" 
                    width={20} 
                    height={20} 
                  />
                  <h2 className="text-lg font-extrabold tracking-normal">Table Activity Team View</h2>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-white text-black`}>
                        <img 
                          src="https://res.cloudinary.com/drkudvyog/image/upload/v1733923436/Sort_icon_duha_askm6d.png" 
                          alt="Sort"
                          className="h-4 w-4"
                        />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setActivitySort({ type: 'standard', direction: 'asc' })}>
                        Standard sorting
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActivitySort({ type: 'name', direction: 'asc' })}>
                        Users (A-Z)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActivitySort({ type: 'name', direction: 'desc' })}>
                        Users (Z-A)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActivitySort({ type: 'consistency', direction: 'desc' })}>
                        Consistency (highest first)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActivitySort({ type: 'consistency', direction: 'asc' })}>
                        Consistency (lowest first)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-white text-black`}>
                        <img 
                          src="https://res.cloudinary.com/drkudvyog/image/upload/v1733923435/Search_icon_duha_hshj5m.png" 
                          alt="Search"
                          className="h-4 w-4"
                        />
                        Search
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Input 
                        placeholder="Search users..." 
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={activitySearch}
                        onChange={(e) => setActivitySearch(e.target.value)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="table-container">
                  <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="p-2 text-left font-extrabold">Users</th>
                      <th className="p-2 text-center font-extrabold">Trainings Today</th>
                      <th className="p-2 text-center font-extrabold">This Week</th>
                      <th className="p-2 text-center font-extrabold">This Month</th>
                      <th className="p-2 text-center font-extrabold">Total</th>
                      <th className="p-2 text-center font-extrabold">Current Streak</th>
                      <th className="p-2 text-center font-extrabold">Longest Streak</th>
                      <th className="p-2 text-center font-extrabold">Consistency this Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleActivityData.map((user, index) => (
                      <tr key={user.user_id} className="border-b">
                        <td className="flex items-center gap-2 p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.user_picture_url || `/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>{user.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{user.user_name}</span>
                        </td>
                        <td className="p-2 text-center">{user.trainingsToday}</td>
                        <td className="p-2 text-center">{user.thisWeek}</td>
                        <td className="p-2 text-center">{user.thisMonth}</td>
                        <td className="p-2 text-center">{user.total}</td>
                        <td className="p-2 text-center">{user.currentStreak}</td>
                        <td className="p-2 text-center">{user.longestStreak}</td>
                        <td className="p-2 text-center">{user.consistency}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <button
                  className="flex w-full items-center justify-center gap-2 p-2 text-sm text-gray-500 hover:bg-gray-50"
                  onClick={() => setShowMoreActivity(!showMoreActivity)}
                >
                  {showMoreActivity ? "Show Less" : "Show More"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMoreActivity ? "rotate-180" : ""}`} />
                </button>
              </div>
            </Card>

            {/* Ratings View */}
            <Card className={sectionStyle}>
              <div className={headerStyle}>
                <div className="flex items-center gap-2 text-[#000000]">
                  <Image 
                    src="https://res.cloudinary.com/drkudvyog/image/upload/v1733765915/Rating_s_Teams_View_icon_duha_wdkysv.png" 
                    alt="Star Rating" 
                    width={20} 
                    height={20} 
                  />
                  <h2 className="text-lg font-extrabold">Ratings Team's View</h2>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-white text-black`}>
                        <img 
                          src="https://res.cloudinary.com/drkudvyog/image/upload/v1733923436/Sort_icon_duha_askm6d.png" 
                          alt="Sort"
                          className="h-4 w-4"
                        />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setRatingsSort({ type: 'standard', direction: 'asc' })}>
                        Standard sorting
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingsSort({ type: 'name', direction: 'asc' })}>
                        Users (A-Z)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingsSort({ type: 'name', direction: 'desc' })}>
                        Users (Z-A)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingsSort({ type: 'effectiveness', direction: 'desc' })}>
                        Effectiveness (highest first)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingsSort({ type: 'effectiveness', direction: 'asc' })}>
                        Effectiveness (lowest first)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-white text-black`}>
                        <img 
                          src="https://res.cloudinary.com/drkudvyog/image/upload/v1733923435/Search_icon_duha_hshj5m.png" 
                          alt="Search"
                          className="h-4 w-4"
                        />
                        Search
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Input 
                        placeholder="Search users..." 
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={ratingsSearch}
                        onChange={(e) => setRatingsSearch(e.target.value)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="table-container">
                  <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="p-2 text-left font-extrabold">Users</th>
                      <th className="p-2 text-center font-extrabold">Overall Performance</th>
                      <th className="p-2 text-center font-extrabold">Engagement</th>
                      <th className="p-2 text-center font-extrabold">Objection Handling</th>
                      <th className="p-2 text-center font-extrabold">Information Gathering</th>
                      <th className="p-2 text-center font-extrabold">Program Explanation</th>
                      <th className="p-2 text-center font-extrabold">Closing Skills</th>
                      <th className="p-2 text-center font-extrabold">Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRatingsData.map((user) => (
                      <tr key={user.user_id} className="border-b">
                        <td className="flex items-center gap-2 p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.user_picture_url || `/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>{user.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{user.user_name}</span>
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.overall} 
                            title="Overall Performance" 
                            description={user.descriptions?.overall || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.engagement} 
                            title="Engagement" 
                            description={user.descriptions?.engagement || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.objection} 
                            title="Objection Handling" 
                            description={user.descriptions?.objection || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.information} 
                            title="Information Gathering" 
                            description={user.descriptions?.information || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.program} 
                            title="Program Explanation" 
                            description={user.descriptions?.program || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.closing} 
                            title="Closing Skills" 
                            description={user.descriptions?.closing || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.effectiveness} 
                            title="Effectiveness" 
                            description={user.descriptions?.effectiveness || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <button
                  className="flex w-full items-center justify-center gap-2 p-2 text-sm text-gray-500 hover:bg-gray-50"
                  onClick={() => setShowMoreRatings(!showMoreRatings)}
                >
                  {showMoreRatings ? "Show Less" : "Show More"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMoreRatings ? "rotate-180" : ""}`} />
                </button>
              </div>
            </Card>

            {/* Call Logs */}
            <Card className={sectionStyle}>
              <div className={headerStyle}>
                <div className="flex items-center gap-2 text-[#000000]">
                  <Image 
                    src="https://res.cloudinary.com/drkudvyog/image/upload/v1733765915/Team_Call_Logs_icon_duha_d0wkpd.png" 
                    alt="Phone" 
                    width={20} 
                    height={20} 
                  />
                  <h2 className="text-lg font-extrabold">Team Call Logs</h2>
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-white text-black`}>
                        <img 
                          src="https://res.cloudinary.com/drkudvyog/image/upload/v1733925261/Calendar_icon_duha_iecanm.png" 
                          alt="Calendar"
                          className="h-4 w-4"
                        />
                        {formatDateRange(date)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-4 bg-white shadow-md rounded-md border" align="start">
                      <div className="space-y-4">
                        <Button
                          variant="outline"
                          className="w-full py-2 font-normal text-base border rounded-md"
                          onClick={() => setDate(undefined)}
                        >
                          All time
                        </Button>
                        
                        <Calendar
                          mode="range"
                          selected={date}
                          onSelect={setDate}
                          className="w-full bg-white"
                          numberOfMonths={2}
                          showOutsideDays={false}
                          classNames={{
                            months: "flex space-x-2",
                            month: "space-y-4",
                            caption: "flex justify-between pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "w-9 font-normal text-[0.8rem] text-muted-foreground",
                            row: "flex w-full mt-2",
                            cell: "w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100",
                            day_range_start: "bg-blue-50 text-blue-600",
                            day_range_end: "bg-blue-50 text-blue-600",
                            day_selected: "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600",
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(7)}>
                            Last 7 Days
                          </Button>
                          <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(14)}>
                            Last 14 Days
                          </Button>
                          <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(30)}>
                            Last 30 Days
                          </Button>
                          <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(90)}>
                            Last 90 Days
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-white text-black`}>
                        <img 
                          src="https://res.cloudinary.com/drkudvyog/image/upload/v1733923436/Sort_icon_duha_askm6d.png" 
                          alt="Sort"
                          className="h-4 w-4"
                        />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setCallLogsSort({ type: 'standard', direction: 'asc' })}>
                        Standard sorting
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCallLogsSort({ type: 'name', direction: 'asc' })}>
                        Users (A-Z)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCallLogsSort({ type: 'name', direction: 'desc' })}>
                        Users (Z-A)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCallLogsSort({ type: 'date', direction: 'desc' })}>
                        Date (newest first)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCallLogsSort({ type: 'date', direction: 'asc' })}>
                        Date (oldest first)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-white text-black`}>
                        <img 
                          src="https://res.cloudinary.com/drkudvyog/image/upload/v1733923435/Search_icon_duha_hshj5m.png" 
                          alt="Search"
                          className="h-4 w-4"
                        />
                        Search
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Input 
                        placeholder="Search users..." 
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={callLogsSearch}
                        onChange={(e) => setCallLogsSearch(e.target.value)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="table-container">
                  <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="p-2 text-left font-extrabold">Users</th>
                      <th className="p-2 text-center font-extrabold">Date</th>
                      <th className="p-2 text-center font-extrabold">Caller</th>
                      <th className="p-2 text-center font-extrabold">Play</th>
                      <th className="p-2 text-center font-extrabold">Overall Performance</th>
                      <th className="p-2 text-center font-extrabold">Engagement</th>
                      <th className="p-2 text-center font-extrabold">Objection Handling</th>
                      <th className="p-2 text-center font-extrabold">Information Gathering</th>
                      <th className="p-2 text-center font-extrabold">Program Explanation</th>
                      <th className="p-2 text-center font-extrabold">Closing Skills</th>
                      <th className="p-2 text-center font-extrabold">Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCallLogsData.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="flex items-center gap-2 p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.user_picture_url || `/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>{log.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{log.user_name}</span>
                        </td>
                        <td className="p-2 text-center">{new Date(log.call_date).toLocaleDateString()}</td>
                        <td className="p-2 text-center">
                          <Avatar className="h-8 w-8 mx-auto">
                            <AvatarImage src={log.assistant_picture_url || `/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>{log.assistant_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </td>
                        <td className="p-2 text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mx-auto">
                                <PlayCircle className="h-5 w-5 text-[#5b06be]" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Call Recording</DialogTitle>
                              </DialogHeader>
                              <AudioPlayer audioSrc={log.recording_url} caller={log.assistant_name} />
                            </DialogContent>
                          </Dialog>
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.overall_performance} 
                            title="Overall Performance" 
                            description={log.overall_performance_text || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.engagement_score} 
                            title="Engagement" 
                            description={log.engagement_text || 'No description available'}
                            color="[#5b06be]"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.objection_handling_score} 
                            title="Objection Handling" 
                            description={log.objection_handling_text || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.information_gathering_score} 
                            title="Information Gathering" 
                            description={log.information_gathering_text || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.program_explanation_score} 
                            title="Program Explanation" 
                            description={log.program_explanation_text || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.closing_score} 
                            title="Closing Skills" 
                            description={log.closing_text || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.effectiveness_score} 
                            title="Effectiveness" 
                            description={log.effectiveness_text || 'No description available'}
                            color="[#5b06be]" 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <button
                  className="flex w-full items-center justify-center gap-2 p-2 text-sm text-gray-500 hover:bg-gray-50"
                  onClick={() => setShowMoreCallLogs(!showMoreCallLogs)}
                >
                  {showMoreCallLogs ? "Show Less" : "Show More"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMoreCallLogs ? "rotate-180" : ""}`} />
                </button>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
    <style jsx global>{`
  html, body {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  #__next {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  .scroll-area-viewport {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .table-container {
    max-height: calc(48px * 15); /* 48px is approximate height of each row */
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #5b06be #f0f0f0;
  }

  .table-container::-webkit-scrollbar {
    width: 8px;
  }

  .table-container::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 4px;
  }

  .table-container::-webkit-scrollbar-thumb {
    background: #5b06be;
    border-radius: 4px;
  }

  .table-container::-webkit-scrollbar-thumb:hover {
    background: #4a05a0;
  }
`}</style>
  </>
);
};

export default Component;
