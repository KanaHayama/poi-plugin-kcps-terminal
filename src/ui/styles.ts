/**
 * Styles are inlined into the bundle (rendered as a <style> tag) instead of
 * being loaded via <link href={join(__dirname, ...)}>: an external stylesheet
 * can silently fail to load depending on how poi serves its renderer, while
 * an inline tag always works.
 */
export const STYLES = `
#kcps-terminal {
  padding: 10px 14px;
}

#kcps-terminal .kcps-server-status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

#kcps-terminal .kcps-capture-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

#kcps-terminal .kcps-capture-link a {
  opacity: 0.85;
}

#kcps-terminal .kcps-settings {
  display: grid;
  grid-template-columns: max-content 240px;
  gap: 10px 16px;
  align-items: center;
  margin-bottom: 14px;
}

#kcps-terminal .kcps-label {
  opacity: 0.85;
}

/* Blueprint's CSS class prefix changes with each major version (bp5- / bp6- ...),
   so only our own class names are targeted; Blueprint controls are sized
   through their fill prop inside these fixed-width cells. */
#kcps-terminal .kcps-control {
  min-width: 0;
}

#kcps-terminal .kcps-control-slider {
  padding: 0 10px;
}

#kcps-terminal .kcps-error-log {
  margin-top: 8px;
}

#kcps-terminal .kcps-error-log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  opacity: 0.7;
}

#kcps-terminal .kcps-error-log-content {
  max-height: 150px;
  overflow-y: auto;
  font-size: 11px;
  margin: 0;
  padding: 6px 8px;
}

#kcps-terminal .kcps-error-entry {
  line-height: 1.6;
}

#kcps-terminal .kcps-error-time {
  opacity: 0.5;
}

#kcps-terminal .kcps-error-source {
  color: #d4a017;
}
`
