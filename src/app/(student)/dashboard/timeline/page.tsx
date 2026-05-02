import TimelinePage from '@/app/(public)/timeline/page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Timeline | Dashboard',
}

export default function DashboardTimeline() {
  return (
    <div className="pt-16 md:pt-0">
      <TimelinePage />
    </div>
  )
}
