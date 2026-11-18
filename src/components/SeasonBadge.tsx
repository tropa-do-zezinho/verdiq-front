import { seloClass, seloLabel } from '../api/client'

export function SeasonBadge({ selo }: { selo?: string | null }) {
  return (
    <span className={seloClass(selo)}>{seloLabel(selo)}</span>
  )
}
