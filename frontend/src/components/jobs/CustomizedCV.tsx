import { Link } from 'react-router-dom'

import { Button } from '@/components/common'
import { CVPreview } from '@/components/cv'
import { emptyCVContent } from '@/lib/cv'
import type { CVResponse } from '@/types'

export interface CustomizedCVProps {
  cv: CVResponse
  downloading: boolean
  onDownload: () => void
}

/** Result of a job-tailoring run: the new CV version, previewed. */
export function CustomizedCV({ cv, downloading, onDownload }: CustomizedCVProps) {
  const version = cv.current_version
  return (
    <div className="customized-cv">
      <div className="customized-cv__head">
        <div>
          <span className="badge badge--ok">Tailored version saved</span>
          <p className="muted">
            {version?.note ?? 'Job customization'} &middot; v{cv.current_version_number}
          </p>
        </div>
        <div className="cv-actions">
          <Link to={`/cvs/${cv.id}`} className="btn btn--primary">
            Open in editor
          </Link>
          <Button variant="secondary" onClick={onDownload} loading={downloading}>
            Download PDF
          </Button>
        </div>
      </div>
      <CVPreview content={version?.content ?? emptyCVContent()} template={cv.template} />
    </div>
  )
}
