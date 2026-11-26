function cssString(value: string) {
  return JSON.stringify(value.replaceAll("\0", "")).replaceAll("<", "\\3c ");
}

const publicOnly = "body:not([data-cms-editor])";

function hiddenCss(selectors: string[]) {
  return selectors
    .map((selector) => `${publicOnly} ${selector}{display:none!important}`)
    .join("\n");
}

export function RemovedContentStyles({ fields }: { fields: string[] }) {
  if (!fields.length) return null;
  const selectors = fields.flatMap((id) => {
    const field = `[data-cms=${cssString(id)}]`;
    return [field, `[data-cms-hide-parent]:has(>${field})`];
  });
  return <style>{hiddenCss(selectors)}</style>;
}

export function RemovedTourText({
  tour,
}: {
  tour: { id: string; hiddenText?: string[] };
}) {
  if (!tour.hiddenText?.length) return null;
  const scope = `[data-tour-id=${cssString(tour.id)}]`;
  const selectors = tour.hiddenText.flatMap((path) => {
    const field = `[data-tour-field=${cssString(path)}]`;
    return [
      `${scope} ${field}`,
      `${scope} [data-tour-hide-parent]:has(>${field})`,
    ];
  });
  return <style>{hiddenCss(selectors)}</style>;
}
