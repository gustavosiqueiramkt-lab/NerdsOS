'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  FolderKanban,
  Users,
  Wallet,
  FileText,
  Boxes,
  Truck,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/login/actions'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'CRM', icon: Kanban },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/projetos', label: 'Projetos', icon: FolderKanban },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/propostas', label: 'Propostas', icon: FileText },
  { href: '/catalogo', label: 'Catálogo', icon: Boxes },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
]

interface SidebarProps {
  userEmail: string | null
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const initial = (userEmail?.[0] || 'N').toUpperCase()

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-[var(--color-border)]">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--color-primary)] text-sm font-bold text-white">
          N
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            NERDS<span className="text-[var(--color-primary)]">®</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
            NerdsOS
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-secondary)] text-sm font-medium text-[var(--color-foreground)]">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-[var(--color-foreground)]">
              {userEmail || 'Sócio'}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Online
            </p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
