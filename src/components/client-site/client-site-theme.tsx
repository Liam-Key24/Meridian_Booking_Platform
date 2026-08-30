import {
  brandingCssVariables,
  type ClientSiteBranding,
} from "@/lib/templates/branding";

export function ClientSiteTheme({
  branding,
  templateSlug,
  children,
}: {
  branding: ClientSiteBranding;
  templateSlug?: string;
  children: React.ReactNode;
}) {
  const vars = brandingCssVariables(branding, templateSlug);
  const cssText = Object.entries(vars)
    .map(([name, value]) => `${name}: ${value};`)
    .join(" ");

  return (
    <div
      data-client-site=""
      className="min-h-full"
      style={
        {
          ...vars,
          backgroundColor: branding.background_color,
          color: branding.text_color,
          fontFamily: vars["--client-font-body"],
        } as React.CSSProperties
      }
    >
      <style>{`[data-client-site]{${cssText}}`}</style>
      {children}
    </div>
  );
}
