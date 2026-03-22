export default function StudentLoading() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-red-600/30 border-t-red-500 rounded-full animate-spin" />
        <p className="text-neutral-600 text-xs tracking-wider uppercase">Carregando</p>
      </div>
    </div>
  )
}
