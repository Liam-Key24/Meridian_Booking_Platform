/**
 * Pure rules for controlled Meridian client-site templates.
 * Public publishing requires an assigned template that is active.
 */

export type TemplateStatus = "draft" | "active" | "retired";

export type TemplatePublishGate = {
  hasAssignment: boolean;
  templateStatus: TemplateStatus | null;
};

export function canPreviewOrPublishTemplate(gate: TemplatePublishGate): boolean {
  return gate.hasAssignment && gate.templateStatus === "active";
}

export function describeTemplatePublishBlock(
  gate: TemplatePublishGate,
): string | null {
  if (!gate.hasAssignment) {
    return "No template assigned. Assign an active Meridian template before preview or publish.";
  }
  if (gate.templateStatus !== "active") {
    return "Assigned template is not active. Only active templates can be previewed or published.";
  }
  return null;
}
