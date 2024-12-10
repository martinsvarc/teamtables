'use client'
import Image from 'next/image'

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-transparent">
      <div className="relative w-24 h-24" role="status" aria-label="Loading">
        {/* Spinning loader */}
        <svg
          className="w-full h-full animate-spin"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#F5F5F5"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          {/* Two animated segments at opposite positions */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#5b06be"
            strokeWidth="12"
            fill="none"
            strokeDasharray="30 95 30 95"
            strokeDashoffset="-15"
            strokeLinecap="round"
          />
        </svg>
        {/* Center image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image 
            src="https://res.cloudinary.com/drkudvyog/image/upload/v1733356221/Colors_logo_gawxfo.png"
            alt="AI Logo"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  )
}
