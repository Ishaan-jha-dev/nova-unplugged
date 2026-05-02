import type { Metadata } from 'next'
import { TimelineView } from '@/components/sections/TimelineView'

export const metadata: Metadata = {
  title: 'Timeline | Dashboard',
}

export default function DashboardTimeline() {
  return <TimelineView showRegisterButton={false} />
}
