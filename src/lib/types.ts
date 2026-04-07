export interface MediaItem {
  id: number
  type: 'video' | 'image'
  url: string
  title: string | null
  description: string | null
  category: string
  duration_seconds: number
  sort_order: number
  active: boolean
  created_at: string
}

export interface Announcement {
  id: number
  text: string
  priority: number
  active: boolean
  starts_at: string
  ends_at: string | null
  created_at: string
}

export interface PrayerTime {
  id: number
  name: string
  time: string
  day_of_week: string | null
  notes: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export interface DisplaySettings {
  ticker_speed: string
  slide_duration: string
  theme: string
  shul_name: string
  show_weather: string
  weather_city: string
  show_date: string
  show_zmanim: string
}
