/* Where the project lives. Feedback links on the site point here. */
export const REPO = 'focusxyz11/open-silicon-lab';
export const REPO_URL = 'https://github.com/' + REPO;

/* A link that opens a ready-made GitHub issue form, with its fields filled in. Each key is a field id
   in that form (.github/ISSUE_TEMPLATE/<template>.yml), such as topic, where, wall or lens. */
export function issueURL(template, fields = {}) {
  const q = new URLSearchParams({ template: template + '.yml' });
  for (const [k, v] of Object.entries(fields)) if (v) q.set(k, v);
  return REPO_URL + '/issues/new?' + q.toString();
}

/* The proposals people have opened, newest first. */
export const proposalsURL = kind => REPO_URL + '/issues?q=' + encodeURIComponent('is:issue is:open in:title "[' + kind + ']"');   // i18n-ok: GitHub search syntax
