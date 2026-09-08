import { AnalysisPanel } from '@/components/analyzer'
import type { AnalysisResponse } from '@/types'

export interface JobAnalysisProps {
  analysis: AnalysisResponse | null
}

/** How the CV scores against a specific job (reuses the analyzer panel). */
export function JobAnalysis({ analysis }: JobAnalysisProps) {
  if (!analysis) return null
  return (
    <div className="job-analysis">
      <h2>Match analysis</h2>
      <AnalysisPanel analysis={analysis} />
    </div>
  )
}
