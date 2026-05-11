'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
    >
      Imprimir / PDF
    </button>
  )
}
