export default function TodayPage() {
  return (
    <div className="pt-4">
      <h1 className="text-xl font-bold text-foreground mb-1">Treino de Hoje</h1>
      <p className="text-muted-foreground text-sm mb-6">Seu treino prescrito pelo Victor</p>

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhum treino prescrito para hoje. Entre em contato com seu personal.
        </p>
      </div>
    </div>
  )
}
