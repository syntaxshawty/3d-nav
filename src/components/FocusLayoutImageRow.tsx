import { type PlaceholderOverlay } from '../data/interactiveObjects'
import { CONTENT_FADE_DURATION } from '../data/focusTiming'
import { FocusText } from './FocusText'

// Main overlayImage plus any overlayImageGallery entries, shown as one
// inline row of image cards above the title/description — or no images at
// all, for objects that are just a memory in words. The interim catch-all
// layout for anything that hasn't been given its own bespoke treatment yet
// (see 'newspaper-style'/'strawberry-style' for what that looks like).
// title comes from the outer InteractiveObject, overlay from action.overlay
// — passed as two separate props since App.tsx's data has them split now.
export function FocusLayoutImageRow({ title, overlay, visible }: { title: string; overlay: PlaceholderOverlay; visible: boolean }) {
  const hasImages = overlay.overlayImage || overlay.overlayImageGallery?.length
  return (
    <div
      className="focus-layout focus-layout--image-row"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity ${CONTENT_FADE_DURATION}s ease, transform ${CONTENT_FADE_DURATION}s ease`,
      }}
    >
      {hasImages && (
        <div className="focus-images">
          {overlay.overlayImage && (
            <img className="focus-image" src={overlay.overlayImage} alt={title} />
          )}
          {overlay.overlayImageGallery?.map(src => (
            <img key={src} className="focus-image" src={src} alt={title} />
          ))}
        </div>
      )}

      <FocusText title={title} description={overlay.description} />
    </div>
  )
}
