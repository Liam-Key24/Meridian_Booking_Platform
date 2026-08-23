import { Badge, Card } from "@/components/ui";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-[var(--meridian-space-page)] py-16">
      <header className="space-y-3 text-center">
        <Badge tone="blue">Client access</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Sign in
        </h1>
        <p className="text-sm text-meridian-text-muted">
          Sign in with your Meridian business account. Access is limited to
          businesses you belong to.
        </p>
      </header>

      <Card>
        <LoginForm />
      </Card>
    </main>
  );
}
