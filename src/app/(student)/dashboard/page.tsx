import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, User, CheckCircle, Users, Star, Megaphone, Info, FileText, Lock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Nova Unplugged' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 animate-fade-in relative overflow-y-auto custom-scrollbar">
      
      {/* Immersive background atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-2 md:grid-cols-6 grid-rows-none md:grid-rows-4 gap-4 md:gap-5 w-full max-w-7xl relative z-10 py-10">
        
        {/* ROW 1 & 2 */}
        {/* HOME */}
        <Link href="/dashboard" className="bento-item col-span-2 md:col-span-3 md:row-span-2 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 group">
          <div className="bento-icon-wrapper rounded-[2.2rem] bg-[#2a1208] border border-orange-500/40 shadow-[0_0_40px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.5)]">
            <Home size={34} className="text-orange-500" />
          </div>
          <span className="bento-title !text-orange-200/80">HOME</span>
        </Link>

        {/* PROFILE */}
        <Link href="/profile" className="bento-item col-span-2 md:col-span-1 md:row-span-2 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 group">
          <div className="bento-icon-wrapper rounded-full bg-[#1a0b2e] border border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_60px_rgba(168,85,247,0.5)]">
            <User size={34} className="text-purple-500" />
          </div>
          <span className="bento-title !text-purple-200/80">PROFILE</span>
        </Link>

        {/* FEST REGISTRATION */}
        <Link href="/dashboard/events" className="bento-item col-span-2 md:row-span-2 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 group">
          <div className="bento-icon-wrapper rounded-full bg-[#082018] border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <span className="bento-title !text-emerald-200/80 leading-tight">FEST<br/>REGISTRATION</span>
        </Link>

        {/* ROW 3 & 4 (Vertical Split) */}
        {/* TEAMS (Locked) */}
        <div className="bento-item locked col-span-2 md:col-span-1 md:row-span-2 bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20 group">
          <Lock size={14} className="absolute top-5 right-5 text-white/30" />
          <div className="bento-icon-wrapper bg-[#2a081a] border border-pink-500/40 shadow-[0_0_30px_rgba(236,72,153,0.2)] rotate-45">
            <Users size={30} className="text-pink-500 -rotate-45" />
          </div>
          <span className="bento-title !text-pink-200/80 mt-10">TEAMS</span>
        </div>

        {/* EVENTS (Locked) */}
        <div className="bento-item locked col-span-2 bg-[#1a1a1a]/40 border-white/5 flex-row justify-start gap-5 px-8 group">
          <Lock size={14} className="absolute top-5 right-5 text-white/30" />
          <Star size={34} className="text-white/40" />
          <span className="bento-title !mt-0 !mb-0">EVENTS</span>
        </div>

        {/* ANNOUNCEMENTS (Locked) */}
        <div className="bento-item locked col-span-2 md:col-span-3 bg-gradient-to-r from-red-950/20 to-transparent border-red-500/10 flex-row justify-start gap-5 px-8 group">
          <Lock size={14} className="absolute top-5 right-5 text-white/30" />
          <Megaphone size={34} className="text-red-500/60" />
          <span className="bento-title !mt-0 !mb-0 !text-red-200/60">ANNOUNCEMENTS</span>
        </div>

        {/* ROW 4 Remaining */}
        {/* ABOUT US (Locked) */}
        <div className="bento-item locked col-span-2 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 flex-row justify-start gap-5 px-8 group">
          <Lock size={14} className="absolute top-5 right-5 text-white/30" />
          <div className="bento-icon-wrapper rounded-full bg-[#0a142e] border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.2)] h-12 w-12">
            <Info size={22} className="text-blue-500" />
          </div>
          <span className="bento-title !mt-0 !mb-0 !text-blue-200/60">ABOUT US</span>
        </div>

        {/* SCHEDULE (Locked) */}
        <div className="bento-item locked col-span-2 md:col-span-3 bg-gradient-to-r from-amber-950/20 to-transparent border-amber-500/10 flex-row justify-start gap-5 px-8 group">
          <Lock size={14} className="absolute top-5 right-5 text-white/30" />
          <FileText size={34} className="text-amber-500/60" />
          <span className="bento-title !mt-0 !mb-0 !text-amber-200/60">SCHEDULE</span>
        </div>

      </div>
    </div>
  )
}
