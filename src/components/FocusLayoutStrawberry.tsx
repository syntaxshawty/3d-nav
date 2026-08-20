import { type InteractiveObjectData } from '../data/interactiveObjects';
import { CONTENT_FADE_DURATION } from '../data/focusTiming';
import { ObjectViewer } from './ObjectViewer';
import './FocusLayoutStrawberry.css';

// Three elements, nothing else: a looping gif, the 3D model viewer
// overlapping its corner (see .focus-strawberry-viewer — the viewer's own
// look is self-contained in ObjectViewer.tsx, this just positions it), and
// description text beneath. No title, no link — a fresh, minimal layout,
// not a variant of the other three. Reuses .focus-layout for the shared
// column shape (flex-direction/gap/right-anchoring) but sets its own width
// inline, directly at the point of use, rather than an override modifier
// class for the one property that differs.
export function FocusLayoutStrawberry({
  focusObject,
  visible,
}: {
  focusObject: InteractiveObjectData;
  visible: boolean;
}) {
  return (
    <div
      className="focus-strawberry-layout"
      style={{
        width: '80vw',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity ${CONTENT_FADE_DURATION}s ease, transform ${CONTENT_FADE_DURATION}s ease`,
      }}
    >
      <div className="focus-strawberry-visual">
        {focusObject.overlayImage && (
          <video
            className="focus-strawberry-gif"
            src={focusObject.overlayImage}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        {focusObject.viewerModel && (
          <div className="focus-strawberry-viewer">
            <ObjectViewer model={focusObject.viewerModel} />
          </div>
        )}
      </div>

      <p className="focus-strawberry-description">{focusObject.description}</p>
    </div>
  );
}
