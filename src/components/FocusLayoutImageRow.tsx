import { type ImageRowContent } from '../data/interactiveObjects'
import { CONTENT_FADE_DURATION } from '../data/focusTiming'
import { FocusText } from './FocusText'

// Main overlayImage plus any overlayImageGallery entries, shown as one
// inline row of image cards above the title/description — or no images at
// all, for objects that are just a memory in words. The interim catch-all
// layout for anything that hasn't been given its own bespoke treatment yet
// (see 'newspaper-style'/'strawberry-style' for what that looks like).
export function FocusLayoutImageRow({ focusObject, visible }: { focusObject: ImageRowContent; visible: boolean }) {
  const hasImages = focusObject.overlayImage || focusObject.overlayImageGallery?.length
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
          {focusObject.overlayImage && (
            <img className="focus-image" src={focusObject.overlayImage} alt={focusObject.title} />
          )}
          {focusObject.overlayImageGallery?.map(src => (
            <img key={src} className="focus-image" src={src} alt={focusObject.title} />
          ))}
        </div>
      )}

      <FocusText focusObject={focusObject} />
    </div>
  )
}
