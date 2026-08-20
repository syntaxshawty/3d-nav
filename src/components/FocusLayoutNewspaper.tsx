import { type NewspaperStyleContent } from '../data/interactiveObjects'
import { CONTENT_FADE_DURATION } from '../data/focusTiming'
import './FocusLayoutNewspaper.css'

// The photo is the primary element — no title, no separate text column.
// The description floats in its own small fog pocket over the photo (see
// .focus-newspaper-text in FocusLayoutNewspaper.css) instead of a
// card/panel, positioned per-object via newspaperTextPosition since where
// the readable spot should sit depends on where blank/ad space falls in
// each individual scanned photo. overlayImage is required on
// NewspaperStyleContent (it's the layout's primary element), so no
// presence check is needed before rendering it.
export function FocusLayoutNewspaper({ focusObject, visible }: { focusObject: NewspaperStyleContent; visible: boolean }) {
  return (
    <div
      className="focus-newspaper-layout"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity ${CONTENT_FADE_DURATION}s ease, transform ${CONTENT_FADE_DURATION}s ease`,
      }}
    >
      <img className="focus-newspaper" src={focusObject.overlayImage} alt={focusObject.title} />
      <div className="focus-newspaper-text" style={focusObject.newspaperTextPosition}>
        <p className="focus-description">{focusObject.description}</p>
      </div>
    </div>
  )
}
