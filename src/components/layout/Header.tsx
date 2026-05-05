'use client'

import { usePathname } from 'next/navigation'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/crm': 'CRM',
  '/agenda': 'Agenda',
  '/projetos': 'Projetos',
  '/clientes': 'Clientes',
  '/financeiro': 'Financeiro',
  '/propostas': 'Propostas',
  '/catalogo': 'Catálogo',
  '/fornecedores': 'Fornecedores',
}

function titleFor(pathname: string) {
  const match = Object.keys(TITLES)
    .sort((a, b) => b.length - a.length)
    .find((p) => pathname === p || pathname.startsWith(p + '/'))
  return match ? TITLES[match] : 'NerdsOS'
}

const FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

export function Header() {
  const pathname = usePathname()
  const today = FORMATTER.format(new Date())

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-6 backdrop-blur">
      <p className="text-sm font-medium text-[var(--color-foreground)]">
        {titleFor(pathname)}
      </p>
      <p className="text-xs capitalize text-[var(--color-muted-foreground)]">
        {today}
      </p>
    </header>
  )
}
