import { type InteractiveContentBase } from '../data/interactiveObjects'

// Title/divider/description — the block shared by every layout except
// 'newspaper-style' (which folds the description into its own fog-pocket
// markup instead of a separate text column). Typed against the shared
// content base, not one specific layout's interface, since title/
// description are all it reads.
export function FocusText({ focusObject }: { focusObject: InteractiveContentBase }) {
  return (
    <div className="focus-text">
      <h2 className="focus-title">{focusObject.title}</h2>
      <hr className="focus-divider" />
      <p className="focus-description">{focusObject.description}</p>
    </div>
  )
}
