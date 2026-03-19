export default function HistoryPage() {
  return (
    <div className="pt-4">
      <h1 className="text-xl font-bold text-foreground mb-1">Historico</h1>
      <p className="text-muted-foreground text-sm mb-6">Sua evolucao ao longo do tempo</p>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Nenhuma sessao registrada ainda.</p>
      </div>
    </div>
  )
}
