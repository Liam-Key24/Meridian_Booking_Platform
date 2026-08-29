import { Card } from "@/components/ui";

export function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg">
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-meridian-text">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-meridian-text-muted">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </Card>
  );
}
