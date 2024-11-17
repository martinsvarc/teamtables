'use client'

import * as React from "react"
import { DateRange } from "react-day-picker"
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
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

const montserratFont = Montserrat({ subsets: ['latin'] })

// Constants
const sectionStyle = "overflow-hidden border-none bg-white shadow-sm"
const headerStyle = "flex items-center justify-between border-b p-4"
const buttonStyle = "flex items-center gap-2 rounded-full text-white hover:bg-opacity-90"

interface TeamMember {
  user_id: string;
  user_name: string;
  user_picture_url: string;
  trainingsToday: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  currentStreak: number;
  longestStreak: number;
  avg_overall: number;
  avg_engagement: number;
  avg_objection: number;
  avg_information: number;
  avg_program: number;
  avg_closing: number;
  avg_effectiveness: number;
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
  description: string;
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

// Sub-components
const ScoreCell: React.FC<ScoreCellProps> = ({ score, description, title, color }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="px-2 py-2 text-center hover:cursor-pointer group w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className={`inline-flex items-center gap-1 ${isHovered ? `text-${color}` : ''}`}>
            {score}/100
            {isHovered && <Info className={`h-4 w-4 text-${color}`} />}
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

  // State declarations
  const [data, setData] = useState<DatabaseData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

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
    if ((!initialData && memberId && teamId) || searchParams.get('refresh')) {
      fetchData();
    }
  }, [memberId, teamId, initialData]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/call-records?memberId=${memberId}&teamId=${teamId}`
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      const newData = await response.json();
      setData(newData);
      setError(null);
    } catch (err) {
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

  // Data processing
  const processTeamData = () => {
    if (!data) return {
      filteredActivityData: [],
      filteredRatingsData: [],
      filteredCallLogsData: []
    };

    // Process Activity Data
    const activityData = data.teamMembers.map(member => ({
      user_id: member.user_id,
      user_name: member.user_name,
      user_picture_url: member.user_picture_url,
      trainingsToday: member.trainings_today,
      thisWeek: member.this_week,
      thisMonth: member.this_month,
      total: member.total_trainings,
      currentStreak: member.current_streak,
      longestStreak: member.longest_streak,
      consistency: Math.round((member.this_month / 30) * 100)
    }));

    // Process Ratings Data
    const ratingsData = data.teamMembers.map(member => ({
      user_id: member.user_id,
      user_name: member.user_name,
      user_picture_url: member.user_picture_url,
      overall: member.avg_overall,
      engagement: member.avg_engagement,
      objection: member.avg_objection,
      information: member.avg_information,
      program: member.avg_program,
      closing: member.avg_closing,
      effectiveness: member.avg_effectiveness,
      descriptions: {
        overall: member.overall_summary,
        engagement: member.engagement_summary,
        objection: member.objection_summary,
        information: member.information_summary,
        program: member.program_summary,
        closing: member.closing_summary,
        effectiveness: member.effectiveness_summary
      }
    }));

    // Process Call Logs
    const callLogsData = data.recentCalls;

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

  // Visible data
  const visibleActivityData = showMoreActivity ? filteredActivityData : filteredActivityData.slice(0, 5);
  const visibleRatingsData = showMoreRatings ? filteredRatingsData : filteredRatingsData.slice(0, 5);
  const visibleCallLogsData = showMoreCallLogs ? filteredCallLogsData : filteredCallLogsData.slice(0, 5);

  // Loading and error states
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;
// ... (continuing from the previous part)

  return (
    <div className={`flex h-screen bg-gray-100 ${montserrat.className}`}>
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

      <div className="flex-1 overflow-auto p-4 font-medium">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {/* Activity View */}
            <Card className={sectionStyle}>
              <div className={headerStyle}>
                <div className="flex items-center gap-2 text-[#556bc7]">
                  <BarChart2 className="h-5 w-5" />
                  <h2 className="text-lg font-extrabold tracking-normal">Table Activity Team View</h2>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-[#556bc7]`}>
                        <ArrowUpDown className="h-4 w-4" />
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
                      <Button size="sm" className={`${buttonStyle} bg-[#556bc7]`}>
                        <Search className="h-4 w-4" />
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
                <button
                  className="flex w-full items-center justify-center gap-2 p-2 text-sm text-gray-500 hover:bg-gray-50"
                  onClick={() => setShowMoreActivity(!showMoreActivity)}
                >
                  {showMoreActivity ? "Show Less" : "Show More"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMoreActivity ? "rotate-180" : ""}`} />
                </button>
              </div>
            </Card>

            {/* We'll continue with Ratings View and Call Logs in the next parts */}
{/* Ratings View */}
            <Card className={sectionStyle}>
              <div className={headerStyle}>
                <div className="flex items-center gap-2 text-[#51c1a9]">
                  <Star className="h-5 w-5" />
                  <h2 className="text-lg font-extrabold">Ratings Team's View</h2>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-[#51c1a9]`}>
                        <ArrowUpDown className="h-4 w-4" />
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
                        Overall Effectiveness (highest first)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingsSort({ type: 'effectiveness', direction: 'asc' })}>
                        Overall Effectiveness (lowest first)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-[#51c1a9]`}>
                        <Search className="h-4 w-4" />
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
                      <th className="p-2 text-center font-extrabold">Overall Effectiveness</th>
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
                            description={user.descriptions.overall} 
                            color="[#51c1a9]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.engagement} 
                            title="Engagement" 
                            description={user.descriptions.engagement} 
                            color="[#51c1a9]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.objection} 
                            title="Objection Handling" 
                            description={user.descriptions.objection} 
                            color="[#51c1a9]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.information} 
                            title="Information Gathering" 
                            description={user.descriptions.information} 
                            color="[#51c1a9]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.program} 
                            title="Program Explanation" 
                            description={user.descriptions.program} 
                            color="[#51c1a9]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.closing} 
                            title="Closing Skills" 
                            description={user.descriptions.closing} 
                            color="[#51c1a9]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={user.effectiveness} 
                            title="Overall Effectiveness" 
                            description={user.descriptions.effectiveness} 
                            color="[#51c1a9]" 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="flex w-full items-center justify-center gap-2 p-2 text-sm text-gray-500 hover:bg-gray-50"
                  onClick={() => setShowMoreRatings(!showMoreRatings)}
                >
                  {showMoreRatings ? "Show Less" : "Show More"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMoreRatings ? "rotate-180" : ""}`} />
                </button>
              </div>
            </Card>

            {/* Next we'll add the Call Logs table */}
{/* Call Logs */}
            <Card className={sectionStyle}>
              <div className={headerStyle}>
                <div className="flex items-center gap-2 text-[#fbb350]">
                  <PhoneCall className="h-5 w-5" />
                  <h2 className="text-lg font-extrabold">Team Call Logs</h2>
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className={`${buttonStyle} bg-[#fbb350]`}>
                        <CalendarIcon className="h-4 w-4" />
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
                      <Button size="sm" className={`${buttonStyle} bg-[#fbb350]`}>
                        <ArrowUpDown className="h-4 w-4" />
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
                      <Button size="sm" className={`${buttonStyle} bg-[#fbb350]`}>
                        <Search className="h-4 w-4" />
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
                      <th className="p-2 text-center font-extrabold">Overall Effectiveness</th>
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
                                <PlayCircle className="h-5 w-5 text-[#fbb350]" />
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
                            description={log.overall_performance_text} 
                            color="[#fbb350]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.engagement_score} 
                            title="Engagement" 
                            description={log.engagement_text} 
                            color="[#fbb350]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.objection_handling_score} 
                            title="Objection Handling" 
                            description={log.objection_handling_text} 
                            color="[#fbb350]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.information_gathering_score} 
                            title="Information Gathering" 
                            description={log.information_gathering_text} 
                            color="[#fbb350]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.program_explanation_score} 
                            title="Program Explanation" 
                            description={log.program_explanation_text} 
                            color="[#fbb350]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.closing_score} 
                            title="Closing Skills" 
                            description={log.closing_text} 
                            color="[#fbb350]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell 
                            score={log.effectiveness_score} 
                            title="Overall Effectiveness" 
                            description={log.effectiveness_text} 
                            color="[#fbb350]" 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
  );
};

export default Component;
