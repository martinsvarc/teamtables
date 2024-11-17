'use client'

import * as React from "react"
import { DateRange } from "react-day-picker"
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
import { Montserrat } from 'next/font/google'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

const montserrat = Montserrat({ subsets: ['latin'] })

const filterData = <T extends { name: string }>(data: T[], searchTerm: string): T[] => {
  if (!searchTerm) return data
  const lowercaseSearch = searchTerm.toLowerCase()
  return data.filter(item => 
    item.name.toLowerCase().includes(lowercaseSearch)
  )
}

type SortDirection = 'asc' | 'desc'
type SortType = 'standard' | 'name' | 'consistency' | 'effectiveness' | 'date'

const sortData = <T extends Record<string, any>>(
  data: T[],
  sortType: SortType,
  direction: SortDirection
): T[] => {
  const sortedData = [...data]

  switch (sortType) {
    case 'name':
      return sortedData.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name)
        return direction === 'asc' ? comparison : -comparison
      })
    
    case 'consistency':
      return sortedData.sort((a, b) => {
        const comparison = (a.consistency || 0) - (b.consistency || 0)
        return direction === 'asc' ? comparison : -comparison
      })
    
    case 'effectiveness':
      return sortedData.sort((a, b) => {
        const comparison = (a.effectiveness || 0) - (b.effectiveness || 0)
        return direction === 'asc' ? comparison : -comparison
      })
    
    case 'date':
      return sortedData.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        const comparison = dateA - dateB
        return direction === 'asc' ? comparison : -comparison
      })
    
    default:
      return sortedData
  }
}

function ScoreCell({ score, description, title, color }: { score: number; description: string; title: string; color: string }) {
  const [isHovered, setIsHovered] = useState(false)

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
  )
}

function AudioPlayer({ audioSrc, caller }: { audioSrc: string; caller: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

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
  )
}

export default function Component() {
  const [showMoreActivity, setShowMoreActivity] = useState(false)
  const [showMoreRatings, setShowMoreRatings] = useState(false)
  const [showMoreCallLogs, setShowMoreCallLogs] = useState(false)

const [activitySort, setActivitySort] = useState<{ type: SortType; direction: SortDirection }>({
  type: 'standard',
  direction: 'asc'
})
const [ratingsSort, setRatingsSort] = useState<{ type: SortType; direction: SortDirection }>({
  type: 'standard',
  direction: 'asc'
})
const [callLogsSort, setCallLogsSort] = useState<{ type: SortType; direction: SortDirection }>({
  type: 'standard',
  direction: 'asc'
})

  const [date, setDate] = React.useState<DateRange | undefined>(undefined)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activitySearch, setActivitySearch] = useState("")
  const [ratingsSearch, setRatingsSearch] = useState("")
  const [callLogsSearch, setCallLogsSearch] = useState("")
  const [selectedAudio, setSelectedAudio] = useState<{ src: string; caller: string } | null>(null)

  const formatDateRange = (dateRange: DateRange | undefined) => {
  if (!dateRange) return "All time"
  const { from, to } = dateRange
  
  if (!from) return "All time"
  if (!to) return from.toLocaleDateString()
  
  const diffTime = Math.abs(to.getTime() - from.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 7) return "Last 7 Days"
  if (diffDays <= 14) return "Last 14 Days"
  if (diffDays <= 30) return "Last 30 Days"
  
  return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`
}

const handleQuickSelection = (days: number) => {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - days)
  setDate({ from, to })
}

const filteredActivityData = sortData(
  filterData(activityData, activitySearch),
  activitySort.type,
  activitySort.direction
)

const filteredRatingsData = sortData(
  filterData(ratingsData, ratingsSearch),
  ratingsSort.type,
  ratingsSort.direction
)

const filteredCallLogsData = sortData(
  filterData(callLogsData, callLogsSearch),
  callLogsSort.type,
  callLogsSort.direction
)

  const visibleActivityData = showMoreActivity ? filteredActivityData : filteredActivityData.slice(0, 5)
  const visibleRatingsData = showMoreRatings ? filteredRatingsData : filteredRatingsData.slice(0, 5)
  const visibleCallLogsData = showMoreCallLogs ? filteredCallLogsData : filteredCallLogsData.slice(0, 5)

  const sectionStyle = "overflow-hidden border-none bg-white shadow-sm"
  const headerStyle = "flex items-center justify-between border-b p-4"
  const buttonStyle = "flex items-center gap-2 rounded-full text-white hover:bg-opacity-90"

  return (
    <div className={`flex h-screen bg-gray-100 ${montserrat.className}`}>
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
                      <tr key={index} className="border-b">
                        <td className="flex items-center gap-2 p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>{user.avatar}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
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
                    {visibleRatingsData.map((user, index) => (
                      <tr key={index} className="border-b">
                        <td className="flex items-center gap-2 p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>{user.avatar}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={user.overall} title="Overall Performance" description="Overall performance score based on all evaluation criteria" color="[#51c1a9]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={user.engagement} title="Engagement" description="Score for engagement and interaction with customers" color="[#51c1a9]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={user.objection} title="Objection Handling" description="Effectiveness in addressing and resolving customer concerns and objections" color="[#51c1a9]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={user.information} title="Information Gathering" description="Ability to collect relevant information from customers" color="[#51c1a9]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={user.program} title="Program Explanation" description="Clarity and effectiveness in explaining programs and services" color="[#51c1a9]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={user.closing} title="Closing Skills" description="Success in closing deals and achieving sales objectives" color="[#51c1a9]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={user.effectiveness} title="Overall Effectiveness" description="Overall impact and effectiveness in customer interactions" color="[#51c1a9]" />
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
  <PopoverContent className="w-[500px] p-0 bg-white shadow-md rounded-md border" align="start">
    {/* All time button - styled as a bordered button */}
    <div className="p-2 border-b">
      <Button
        variant="outline"
        className="w-full py-2 font-normal text-base border rounded-md"
        onClick={() => setDate(undefined)}
      >
        All time
      </Button>
    </div>
    
    <div className="p-2 bg-white">
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
{/* Quick selection buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(7)}>
          This Week
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(14)}>
          Last Week
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(7)}>
          Last 7 Days
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(30)}>
          This Month
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(14)}>
          Last 14 Days
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(30)}>
          Last 30 Days
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
      
      {/* Quick selection buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(7)}>
          This Week
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(14)}>
          Last Week
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(7)}>
          Last 7 Days
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(30)}>
          This Month
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(14)}>
          Last 14 Days
        </Button>
        <Button variant="outline" className="w-full justify-center" onClick={() => handleQuickSelection(30)}>
          Last 30 Days
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
                      <DropdownMenuItem>Standard sorting</DropdownMenuItem>
                      <DropdownMenuItem>Users (A-Z)</DropdownMenuItem>
                      <DropdownMenuItem>Users (Z-A)</DropdownMenuItem>
                      <DropdownMenuItem>Date (newest first)</DropdownMenuItem>
                      <DropdownMenuItem>Date (oldest first)</DropdownMenuItem>
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
                    {visibleCallLogsData.map((log, index) => (
                      <tr key={index} className="border-b">
                        <td className="flex items-center gap-2 p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>{log.avatar}</AvatarFallback>
                          </Avatar>
                          <span>{log.name}</span>
                        </td>
                        <td className="p-2 text-center">{log.date}</td>
                        <td className="p-2 text-center">
                          <Avatar className="h-8 w-8 mx-auto">
                            <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>{log.callerAvatar}</AvatarFallback>
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
                              <AudioPlayer audioSrc={log.audioSrc} caller={log.caller} />
                            </DialogContent>
                          </Dialog>
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={log.performance} title="Overall Performance" description="Overall performance score based on the call evaluation" color="[#fbb350]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={log.engagement} title="Engagement" description="Score for engagement and interaction with the caller" color="[#fbb350]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={log.objection} title="Objection Handling" description="Effectiveness in handling objections during the call" color="[#fbb350]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={log.information} title="Information Gathering" description="Ability to gather relevant information from the caller" color="[#fbb350]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={log.program} title="Program Explanation" description="Clarity and effectiveness in explaining the program" color="[#fbb350]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={log.closing} title="Closing Skills" description="Success in closing and achieving call objectives" color="[#fbb350]" />
                        </td>
                        <td className="p-2 text-center">
                          <ScoreCell score={log.effectiveness} title="Overall Effectiveness" description="Overall effectiveness and impact of the call" color="[#fbb350]" />
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
  )
}

const activityData = [
  { name: "Sarah Johnson", avatar: "SJ", trainingsToday: 3, thisWeek: 15, thisMonth: 45, total: 180, currentStreak: 7, longestStreak: 15, consistency: 85 },
  { name: "Michael Chen", avatar: "MC", trainingsToday: 4, thisWeek: 18, thisMonth: 52, total: 195, currentStreak: 9, longestStreak: 18, consistency: 92 },
  { name: "Emma Davis", avatar: "ED", trainingsToday: 2, thisWeek: 12, thisMonth: 38, total: 165, currentStreak: 5, longestStreak: 12, consistency: 78 },
  { name: "James Wilson", avatar: "JW", trainingsToday: 5, thisWeek: 19, thisMonth: 55, total: 198, currentStreak: 10, longestStreak: 20, consistency: 95 },
  { name: "Olivia Brown", avatar: "OB", trainingsToday: 3, thisWeek: 14, thisMonth: 42, total: 175, currentStreak: 6, longestStreak: 14, consistency: 82 },
]

const ratingsData = [
  { name: "Sarah Johnson", avatar: "SJ", overall: 85, engagement: 87, objection: 83, information: 86, program: 84, closing: 82, effectiveness: 85 },
  { name: "Michael Chen", avatar: "MC", overall: 92, engagement: 93, objection: 90, information: 94, program: 91, closing: 89, effectiveness: 92 },
  { name: "Emma Davis", avatar: "ED", overall: 78, engagement: 80, objection: 77, information: 79, program: 76, closing: 75, effectiveness: 78 },
  { name: "James Wilson", avatar: "JW", overall: 95, engagement: 96, objection: 94, information: 95, program: 93, closing: 92, effectiveness: 95 },
  { name: "Olivia Brown", avatar: "OB", overall: 82, engagement: 84, objection: 81, information: 83, program: 80, closing: 79, effectiveness: 82 },
]

const callLogsData = [
  { name: "David Anderson", avatar: "DA", date: "11/13/2024", caller: "Mike", callerAvatar: "M", audioSrc: "/sample-audio.mp3", performance: 88, engagement: 90, objection: 85, information: 89, program: 87, closing: 86, effectiveness: 88 },
  { name: "Megan Taylor", avatar: "MT", date: "11/13/2024", caller: "Tison", callerAvatar: "T", audioSrc: "/sample-audio.mp3", performance: 92, engagement: 93, objection: 90, information: 94, program: 91, closing: 89, effectiveness: 92 },
  { name: "Sarah Williams", avatar: "SW", date: "11/14/2024", caller: "Chris", callerAvatar: "C", audioSrc: "/sample-audio.mp3", performance: 85, engagement: 87, objection: 83, information: 86, program: 84, closing: 82, effectiveness: 85 },
  { name: "John Martinez", avatar: "JM", date: "11/14/2024", caller: "Peter", callerAvatar: "P", audioSrc: "/sample-audio.mp3", performance: 95, engagement: 96, objection: 94, information: 95, program: 93, closing: 92, effectiveness: 95 },
  { name: "Emma Thompson", avatar: "ET", date: "11/15/2024", caller: "Steve", callerAvatar: "S", audioSrc: "/sample-audio.mp3", performance: 89, engagement: 91, objection: 87, information: 90, program: 88, closing: 86, effectiveness: 89 },
]
