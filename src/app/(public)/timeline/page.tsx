import type { Metadata } from 'next'
import { TimelineView } from '@/components/sections/TimelineView'

export const metadata: Metadata = {
  title: 'Schedule | Nova Unplugged 2025',
  description: 'Full event schedule and timeline for Nova Unplugged 2025 at IIM Bangalore.',
}

export default function TimelinePage() {
  return <TimelineView showRegisterButton={true} />
}
