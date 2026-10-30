/* Case files: real chips that passed their checks and still failed in the real world.
   gap: which kind of reality gap it was (one of GAPS). facts: ids in facts.json that carry the
   figures and their sources. topic: where on the map to see the mechanism. */
export const GAPS = [
  { id: 'design', t: 'The design was wrong', d: 'A bug that verification missed.' },
  { id: 'margin', t: 'Too little margin', d: 'Fine on average, failing at the edges of speed, heat or voltage.' },
  { id: 'wear', t: 'Wear-out over time', d: 'Worked when new, got worse with use.' },
  { id: 'radiation', t: 'Radiation', d: 'A particle flipped a bit.' },
  { id: 'escape', t: 'Defects the test missed', d: 'Flawed chips that passed the factory test.' },
  { id: 'use', t: 'A use nobody planned for', d: 'Correct by design, broken by how it was used or attacked.' }
];

export const CASES = [
  { id: 'fdiv', year: 1994, t: 'The Pentium that could not divide', gap: 'design', topic: 'design', facts: ['fdiv-charge'],
    what: 'A mathematics professor noticed that Intel\'s new Pentium sometimes gave wrong answers when dividing. The error was rare: Byte magazine estimated about one in 9 billion random divisions.',
    why: 'Five entries were missing from a lookup table inside the divider. The chip did exactly what its design said; the design was wrong, and testing never hit those inputs.',
    after: 'Intel replaced the chips. The industry turned to formal verification: mathematical proof that a circuit is right for every input, not only the inputs someone thought to test.',
    url: 'https://en.wikipedia.org/wiki/Pentium_FDIV_bug', src: 'Wikipedia: Pentium FDIV bug' },
  { id: 'p3', year: 2000, t: 'The fastest chip of 2000', gap: 'margin', topic: 'design', facts: ['p3-recall'],
    what: 'Weeks after launch, reviewers found that Intel\'s 1.13 GHz Pentium III crashed in some workloads, such as compiling the Linux kernel. Intel reproduced the problem and recalled the chip.',
    why: 'Intel said it had found "marginalities": pushed to that clock speed, some chips had too little timing margin under certain conditions. Most worked; the edge cases did not.',
    after: 'A speed grade has to hold for the slowest chip, the hottest day and the lowest supply, not for the average. Chips are sorted by tested speed and sold with a guardband.',
    url: 'https://www.theregister.com/2000/08/28/intel_recalls_1_13ghz_pentium', src: 'The Register, August 2000' },
  { id: 'vote', year: 2003, t: 'An election with 4,096 extra votes', gap: 'radiation', topic: 'physics', facts: ['schaerbeek-votes'],
    what: 'In a Belgian election, one party in Schaerbeek received more preferential votes than were possible. A recount found 4,096 votes too many.',
    why: '4,096 is exactly 2¹²: a single bit in memory had flipped from 0 to 1. The official explanation was a spontaneous bit flip; a cosmic-ray particle is the suspected cause, never proven.',
    after: 'It became the classic example of a soft error, and of why error-correcting memory (ECC) belongs wherever a wrong number matters: servers, cars, aircraft and voting machines.',
    url: 'https://en.wikipedia.org/wiki/Electronic_voting_in_Belgium', src: 'Wikipedia: Electronic voting in Belgium' },
  { id: 'cougar', year: 2011, t: 'Disk ports that slowly died', gap: 'wear', topic: 'transistor', facts: ['cougar-cost'],
    what: 'Shortly after launch, Intel found that a support chip for its new Sandy Bridge processors had disk-drive (SATA) ports that "may degrade over time". New chips passed every test.',
    why: 'A design error put a circuit under too much stress, so it would wear out over years of use. Nothing was wrong on day one, which is exactly why the factory tests could not see it.',
    after: 'Intel stopped shipments, fixed the silicon and replaced the chips. Checking how every circuit ages over its whole life is now a standard step before a design is sent to the fab.',
    url: 'https://www.intc.com/news-events/press-releases/detail/688/intel-identifies-chipset-design-error-implementing-solution', src: 'Intel press release, January 2011' },
  { id: 'spectre', year: 2018, t: 'Processors that leaked secrets', gap: 'use', topic: 'architecture', facts: [],
    what: 'Researchers showed that almost every fast processor of the time could be tricked into leaking secrets, such as passwords, from other programs. The attacks were named Spectre and Meltdown.',
    why: 'To run faster, processors guess ahead and run instructions before they know they are needed. That worked as designed. Nobody had imagined an attacker reading the faint traces those guesses leave in the cache.',
    after: 'Software and microcode patches first, then changes in new chips. Security became a design goal next to speed, power and cost, and security researchers now test chips the way attackers would.',
    url: 'https://meltdownattack.com/', src: 'Meltdown and Spectre (Graz University of Technology and others)' },
  { id: 'sdc', year: 2021, t: 'Cores that quietly compute wrong answers', gap: 'escape', topic: 'datacenter', facts: ['sdc-rate'],
    what: 'Google and Meta reported processors in their data centers that occasionally produced wrong results, with no crash and no warning. Google called them "mercurial cores".',
    why: 'Tiny manufacturing defects that the factory test did not catch, some showing up only with certain instructions, temperatures or after some aging. Rare per chip, but a fleet has millions of cores.',
    after: 'Large data centers now keep testing chips while they are in service and retire the bad ones. At fleet scale, one in a thousand becomes every day.',
    url: 'https://arxiv.org/abs/2203.08989', src: 'Meta: Detecting silent data corruptions in the wild (2022)' },
  { id: 'raptor', year: 2024, t: 'Desktop chips that grew unstable', gap: 'wear', topic: 'transistor', facts: ['raptor-warranty'],
    what: 'Owners of high-end Intel 13th and 14th Gen desktop processors reported crashes that appeared after months of use and got worse.',
    why: 'Intel traced it to a clock circuit in each core that ages faster under high voltage and heat. Firmware and some motherboards were asking for more voltage than the circuit could take over time.',
    after: 'Microcode updates capped the voltage, and Intel added two years to the warranty. An update can stop further aging, but it cannot undo damage already done.',
    url: 'https://community.intel.com/t5/Blogs/Tech-Innovation/Client/Intel-Core-13th-and-14th-Gen-Desktop-Instability-Root-Cause/post/1705129', src: 'Intel: root cause of the instability (September 2024)' }
];
