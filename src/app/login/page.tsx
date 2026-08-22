import { Badge, Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-[var(--meridian-space-page)] py-16">
      <header className="space-y-3 text-center">
        <Badge tone="blue">Client access</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Sign in
        </h1>
        <p className="text-sm text-meridian-text-muted">
          Placeholder login. Supabase Auth arrives in the client dashboard phase.
        </p>
      </header>

      <Card>
        <form className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@business.com"
            disabled
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            disabled
          />
          <Button type="submit" fullWidth disabled>
            Continue
          </Button>
        </form>
      </Card>
    </main>
  );
}
