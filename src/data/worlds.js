/* The eleven worlds as the site shows them (content/README.md). The words of each world live in its document,
   content/<id>.md, and nowhere else: a world's page is made from that document (src/v2/worlds.js). What lives here is
   only what the documents cannot say: which live picture shows each world today, and where each challenge the
   document names can be played on the site.

   lens: the world's visual system as it can be shown now.
     copies   drawn live on the page from its engine (src/v2/copies.js)
     walls    drawn live from the Floor engine (src/v2/walls.js), with any tries named in probes under it
     forms    one design in all its forms at once, from the Design flow engine (src/v2/forms.js)
     plan     your chip as a floor plan, fed or waiting, with a special district (src/v2/plan.js)
     clock    time at every length, and fifty years of processors fitted (src/v2/clock.js)
     probes   tries of its engine on the page (src/v2/probes.js)
     view     a view of the site that already draws it (href), opened from the page
     (none)   its sketch only, until it is built (content/img/)
   play: the document's challenge name (its bold words) -> the address where it is played, or 'here' when it is
   played in the world's own picture. A challenge with no entry is not playable yet, and says so. */
export const WORLD_IDS = ['think', 'strange', 'limit', 'fail', 'idea', 'make', 'know', 'open', 'divide', 'life', 'scale'];

export const WORLDS = {
  think: { lens: 'view', href: '#/dive/chip', sketch: 'dive',
    play: { 'Make a bit remember.': '#/build/computer/regbit', 'Count.': '#/build/computer/timer', 'Your slice, 32 times.': '#/build/computer/slice' } },
  strange: { lens: 'side', sketch: 'side', play: { 'Keep the 1.': 'here' } },
  limit: { lens: 'walls', probes: ['limit-cold'], sketch: 'walls', play: { 'Close to the floor.': 'here', 'Cold that pays.': 'here' } },
  fail: { lens: 'copies', sketch: 'copies',
    play: { "Through a phone's life.": '#/do/phone', "Through a car's life.": '#/do/car', "Through a data centre's life.": '#/do/dclife', 'Find the broken copy.': '#/do/spot', 'How much margin?': 'here' } },
  idea: { lens: 'forms', href: '#/bench/logic', hrefKey: 'world.studio', sketch: 'forms',
    play: { 'Fix the half adder': '#/do/half', 'Smaller, or faster?': 'here', 'Check the agent.': '#/build', 'A piece of the computer.': '#/build' } },
  make: { lens: 'view', href: '#/line/crystal', sketch: 'line', play: { 'Through in time.': '#/do/months', 'Fewer layers.': '#/do/quick' } },
  know: { lens: 'tune', sketch: 'probe', play: { 'Three dials.': 'here', 'The note.': 'here', 'The twin.': 'here', 'You or the program.': 'here' } },
  open: { lens: 'view', href: '#/supply', sketch: 'map', play: { 'Close one place.': '#/supply' } },
  divide: { lens: 'plan', sketch: 'plan', play: { 'Feed the cores.': '#/do/fed', 'More cores, still cheap.': '#/do/cores', 'Keep the chef busy.': '#/do/chef' } },
  life: { lens: 'swarm', sketch: 'swarm', play: { 'Quiet costs nothing.': 'here', 'Survive the damage.': 'here' } },
  scale: { lens: 'clock', sketch: 'clock', play: { 'One generation smaller.': '#/ask/scale/switch', 'Half as fast again': '#/do/fast' } }
};
/* a challenge's name as the documents write it: the bold words at the start of its first cell */
export const challengeName = cell => ((/\*\*([^*]+)\*\*/.exec(cell) || [])[1] || cell).trim();
