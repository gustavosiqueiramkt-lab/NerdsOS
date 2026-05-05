import { LoginForm } from './login-form'

export const metadata = {
  title: 'Entrar — NerdsOS',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--color-primary)] text-base font-bold text-white">
              N
            </span>
            <span className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
              NERDS<span className="text-[var(--color-primary)]">®</span>
            </span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
              NerdsOS
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sistema operacional interno da agência.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl shadow-black/40">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-[var(--color-muted-foreground)]">
          Acesso restrito. Apenas sócios cadastrados.
        </p>
      </div>
    </main>
  )
}
