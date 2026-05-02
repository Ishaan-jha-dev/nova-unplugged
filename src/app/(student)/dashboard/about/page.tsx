import AboutPage from '@/app/(public)/about/page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Dashboard',
}

export default function DashboardAbout() {
  return (
    <div className="pt-16 md:pt-0">
      <AboutPage />
    </div>
  )
}
