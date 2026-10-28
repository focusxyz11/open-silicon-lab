/* Where the project lives. Feedback links on the site point here. */
export const REPO = 'focusxyz11/open-silicon-lab';
export const REPO_URL = 'https://github.com/' + REPO;

/* A link that opens a ready-made GitHub issue form, with the topic and page filled in. */
export function issueURL(template, { title = '', topic = '', where = '' } = {}) {
  const q = new URLSearchParams({ template: template + '.yml' });
  if (title) q.set('title', title);
  if (topic) q.set('topic', topic);
  if (where) q.set('where', where);
  return REPO_URL + '/issues/new?' + q.toString();
}
