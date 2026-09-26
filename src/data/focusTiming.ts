// Shared by GardenView (App.tsx) and every FocusLayout* component so their
// entrance transition duration always matches the contentVisible timing
// exactly — see the two-stage reveal effect in App.tsx. One constant, not
// a copy per component, so tuning the pacing never means hunting down
// every place it's duplicated.
export const CONTENT_FADE_DURATION = 0.5; // seconds
