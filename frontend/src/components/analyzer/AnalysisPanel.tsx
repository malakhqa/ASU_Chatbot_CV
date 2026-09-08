import { formatDate } from '@/lib/format'
import type { AnalysisResponse } from '@/types'

import { AnalysisResult } from './AnalysisResult'
import { Recommendations } from './Recommendations'
import { ScoreCard } from './ScoreCard'

export interface AnalysisPanelProps {
  analysis: AnalysisResponse
}

export function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  const r = analysis.results
  return (
    <div className="analysis-panel">
      <div className="analysis-panel__top">
        <ScoreCard score={analysis.score} />
        <p className="muted">
          {analysis.cv_version_number != null ? `CV version ${analysis.cv_version_number} · ` : ''}
          {formatDate(analysis.created_at)}
        </p>
      </div>
      <AnalysisResult
        strengths={r.strengths ?? []}
        weaknesses={r.weaknesses ?? []}
        missing={r.missing ?? []}
      />
      <Recommendations items={analysis.recommendations ?? r.recommendations ?? []} />
    </div>
  )
}
