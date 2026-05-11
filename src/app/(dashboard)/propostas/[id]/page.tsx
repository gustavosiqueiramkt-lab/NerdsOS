import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PropostaViewer } from '@/components/propostas/PropostaViewer'
import { PrintButton } from '@/components/propostas/PrintButton'
import { getProposal } from '../actions'
import type { ProposalContent } from '@/types/proposal'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PropostaPage({ params }: Props) {
  const { id } = await params
  const proposal = await getProposal(id)

  if (!proposal) notFound()

  const content = proposal.ai_content as ProposalContent

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-6 py-3 print:hidden">
        <Link
          href="/propostas"
          className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft size={14} />
          Propostas
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-[var(--color-foreground)]">{proposal.client_name}</p>
          <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-400">
            {proposal.status}
          </span>
        </div>
        <PrintButton />
      </div>

      <div className="-mx-6">
        <PropostaViewer content={content} />
      </div>
    </div>
  )
}
