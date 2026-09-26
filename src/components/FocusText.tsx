// Title/divider/description — the block shared by every layout except
// 'newspaper-style' (which folds the description into its own fog-pocket
// markup instead of a separate text column). Two flat string props, not
// one content object, since title (InteractiveObject) and description
// (inside action.overlay) live on genuinely separate parts of the data now.
export function FocusText({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="focus-text">
      <h2 className="focus-title">{title}</h2>
      <hr className="focus-divider" />
      <p className="focus-description">{description}</p>
    </div>
  );
}
