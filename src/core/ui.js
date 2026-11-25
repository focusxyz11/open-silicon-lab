/* The small checks every view asks: whether the visitor asked for less motion (still), whether the screen is a
   phone's width (phone: 720 px or less, the same line as the sheets' @media), and whether the lab is in day or night
   (theme: the bar's choice, data-theme on <html>, or else the system's). No imports, so any page can load it, the
   first one too; each check reads the browser when asked, and answers false (or dark) where there is none. */
const mq = q => typeof matchMedia === 'function' && matchMedia(q).matches;
export const still = () => mq('(prefers-reduced-motion: reduce)');
export const phone = () => mq('(max-width: 720px)');
export const theme = () => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || (mq('(prefers-color-scheme: light)') ? 'light' : 'dark');
