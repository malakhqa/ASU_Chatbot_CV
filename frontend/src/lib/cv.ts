export const CV_TEMPLATES = ['professional', 'modern', 'minimal', 'academic', 'creative'] as const

export type CVTemplate = (typeof CV_TEMPLATES)[number]

export function templateLabel(template: string): string {
  return template ? template.charAt(0).toUpperCase() + template.slice(1) : 'Professional'
}
