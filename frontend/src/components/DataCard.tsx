import { Lock } from 'lucide-react'

interface Props {
  isLoggedIn: boolean
  title: string
  children: React.ReactNode
  className?: string
}

/** Wraps any dashboard card — shows black overlay + message when not logged in */
export function DataCard({ isLoggedIn, title, children, className = '' }: Props) {
  return (
    <div className={`bg-zinc-900 rounded-2xl p-6 relative overflow-hidden ${className}`}>
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      {isLoggedIn ? (
        children
      ) : (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl z-10">
          <Lock className="w-7 h-7 text-zinc-500 mb-3" />
          <p className="text-zinc-400 text-sm font-medium">Please login to access data</p>
        </div>
      )}
    </div>
  )
}
