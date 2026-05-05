import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/lib/utils'
import type { Service } from '@/types/database'

export const dynamic = 'force-dynamic'

const CATEGORY_LABEL: Record<string, string> = {
  spot: 'Pontual',
  content: 'Conteúdo',
  performance: 'Performance',
}

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('category')
    .order('subcategory', { nullsFirst: true })
    .order('price')

  const services = (data as Service[]) || []
  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const key = `${s.category}:${s.subcategory ?? '—'}`
    ;(acc[key] ||= []).push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de serviços"
        subtitle="Tabela de valores 2025/2026."
      />
      <div className="space-y-6">
        {Object.entries(grouped).map(([key, items]) => {
          const [category, sub] = key.split(':')
          return (
            <section
              key={key}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {sub === '—' ? CATEGORY_LABEL[category] : sub}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {CATEGORY_LABEL[category] || category}
                  </p>
                </div>
                <Badge variant="outline">{items.length} itens</Badge>
              </div>
              <ul className="divide-y divide-[var(--color-border)]">
                {items.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-foreground)]">
                        {s.name}
                      </p>
                      {s.description ? (
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {s.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-semibold text-[var(--color-primary)]">
                      {formatBRL(s.price)}
                      {s.is_recurring ? (
                        <span className="text-xs font-normal text-[var(--color-muted-foreground)]">
                          {' '}
                          / {s.billing_period}
                        </span>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
