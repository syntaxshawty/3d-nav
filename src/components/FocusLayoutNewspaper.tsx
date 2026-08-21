import { type NewspaperOverlay } from '../data/interactiveObjects'
import { CONTENT_FADE_DURATION } from '../data/focusTiming'
import './FocusLayoutNewspaper.css'

// The photo is the primary element — no title, no separate text column.
// The description floats in its own small fog pocket over the photo (see
// .focus-newspaper-text in FocusLayoutNewspaper.css) instead of a
// card/panel — positioning lives entirely in that CSS file now, not in
// data, since it's this layout's own presentation concern. overlayImage
// is required on NewspaperOverlay (it's the layout's primary element), so
// no presence check is needed before rendering it. title (from the outer
// InteractiveObject) is only used for the image's alt text here — this
// layout doesn't render a visible title.
export function FocusLayoutNewspaper({ title, overlay, visible }: { title: string; overlay: NewspaperOverlay; visible: boolean }) {
  return (
    <div
      className="focus-newspaper-layout"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity ${CONTENT_FADE_DURATION}s ease, transform ${CONTENT_FADE_DURATION}s ease`,
      }}
    >
      <img className="focus-newspaper" src={overlay.overlayImage} alt={title} />
      <div className="focus-newspaper-text">
        <p className="focus-description">{overlay.description}</p>
      </div>
    </div>
  )
}
