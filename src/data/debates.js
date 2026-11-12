/* Debates: open questions where informed people disagree, from the earlier site, now placed where they
   arise: each sits at the depths, stations and studio stations (at) where a visitor meets the thing it
   is about. Words: debate.<id>.t (title), .q (the question), .v<n>.t / .claim / .assumes for each view.

   Each view says what it claims and what it assumes, because the assumptions are where the disagreement
   really lives. No view is marked right: the visitor weighs them. A debate needs at least two views,
   each written the way its best defender would; when something new is claimed or found, add or sharpen
   a view rather than declaring a winner. One debate per place. */
export const DEBATES = [
  { id: 'memory', views: 3, at: ['board', 'pkg'] },
  { id: 'power', views: 3, at: ['building', 'rack'] },
  { id: 'shrink', views: 3, at: ['switch', 'print'] },
  { id: 'designcost', views: 2, at: ['logic'] },
  { id: 'open', views: 2, at: ['need', 'layout'] },
  { id: 'supply', views: 2, at: ['ship'] },
  { id: 'signoff', views: 2, at: ['check'] },
  { id: 'paradigm', views: 2, at: ['soc'] },
  { id: 'mature', views: 2, at: ['mcu', 'car'] },
  { id: 'quantum', views: 2, at: ['atom'] },
  { id: 'bigdie', views: 2, at: ['test', 'wafer', 'chip'] },
  { id: 'skills', views: 2, at: ['gates'] }
];
export const debateAt = id => DEBATES.find(d => d.at.includes(id)) || null;
