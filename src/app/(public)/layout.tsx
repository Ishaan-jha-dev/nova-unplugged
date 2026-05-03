export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full min-h-screen">
      {children}
    </main>
  )
}
