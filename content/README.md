# The lab, written from first principles

This folder is the content of Open Silicon Lab as documents: eleven questions, and for each one the way of seeing
it, the engine behind it, where its frontier is and what the community does there. It is written from first
principles: each document starts from what is true about chips and physics, not from what the site happened to
build. Earlier work comes back only where it fits.

It is a working document for builders, people and AI. A visitor never meets the eleven questions as a list; they
are the frame the lab is built on.

## Why a skeleton of eleven

The first document-based version of the lab had about forty topics: logic design, lithography, yield, memory,
quantum, supply chains and more. The content was good. But it grew by brainstorming, one topic at a time, so it had
no thread: nothing said why a topic was there or how it led to the next.

This time the frame comes first. Each of eleven open questions about chips is a **world**, and every world is
filled in the same five layers. When all eleven are filled, the shape of the content and the challenges should
come out of what is there, instead of being forced onto it. Connections are written down only where they are real.

## The five layers

| Layer | What it is | The test it must pass |
| --- | --- | --- |
| **The question** | An open question about chips, with the question behind it. It is open because two true things pull against each other. | Nobody can answer it with one fact. It leads to a bigger question. |
| **The visual system** | The one way of seeing that lays the question out: what goes across the picture, what you can change, what you notice. | It shows something words alone cannot. It is as strong as the dive. |
| **The engine** | The model behind the picture: physics, mathematics or economics, small enough to run in a browser, tested. It decides what is true and whether a challenge is met. | Its numbers can be checked against known cases. It is never wrong in direction. |
| **The innovation direction** | Where the frontier is: what people are trying that would change the answer, how far it has come, and what it costs. | It names real work, with sources, and its catch. |
| **The community topic** | What people and AI build, break, collect or argue about in this world, kept in the record. | Someone could add to it tomorrow, and the engine or a source can judge it. |

Inside each world there are also **smaller questions** (the doorways in), **challenges** (a target that the engine
judges), **real cases** and **figures** with their sources.

## The eleven

| | Question | Visual system | Engine | Innovation direction | Community topic |
| --- | --- | --- | --- | --- | --- |
| [think](think.md) | How does a chip think? | **Dive**: from a hall of machines to the electrons, one inside the next | **Logic**: from on and off to gates, memory and a running processor | Machines that learn instead of following written rules | **The open computer**, built piece by piece |
| [strange](strange.md) | What is the strangest thing that could compute? | **Side by side**: one small job done by many kinds of matter at once | **Substrate**: any medium as states, gain, noise, speed and energy | New media: light, spin, molecules, cells, qubits | **The strange shelf**: things that compute, each with its numbers and its catch |
| [limit](limit.md) | What could a chip never do, and could it learn to? | **Walls**: everything a chip could be, and the walls around it | **Floor**: limits from first principles | Reversible, approximate and self-changing computing | **Walls that fell**: claims of "impossible", and what moved them |
| [fail](fail.md) | Why can a perfect design fail in the real world? | **Copies**: one design as a million slightly different chips, over years | **Stress**: variation, defects, heat, wear and silent errors | Chips that check and repair themselves | **Break it**: hunting the faults in each other's designs |
| [idea](idea.md) | How could your idea become a chip? | **Forms**: one design in every form at once | **Design flow**: description, check, gates, layout, masks | AI as a co-designer; tools anyone can use | **Designs**, saying who wrote them and how AI helped |
| [make](make.md) | What would chipmaking look like if we invented it from scratch today? | **Line**: one slice of the wafer, followed through every step | **Process**: a recipe of adding, printing and removing, and whether a switch comes out | Making without masks, small factories, building up instead of carving | **Recipes**: other ways to make the same switch |
| [know](know.md) | What part of making chips can't be written down? | **Probe**: a machine known only by what you try on it | **Tune**: learning a process through noise, and what a note can pass on | AI that learns the craft from the machines | **Handover**: notes and stories from people who have made chips |
| [open](open.md) | What happens when anyone can make a chip? | **Map**: who designs, makes and packs, and who depends on whom | **Supply and cost**: flows, chokepoints and who pays what | Open hardware: RISC-V, open tools, shared runs | **The shared run**: a real community chip |
| [divide](divide.md) | How should a chip divide its work? | **Plan**: the chip as a floor plan, with what flows between its districts | **Work**: computing against moving data, and what special parts gain | Special chips, chiplets, memory beside the logic | **Benchmarks**: the same jobs on different plans |
| [life](life.md) | What new kinds of computers could brains, swarms and living cells inspire? | **Swarm**: many simple parts with local rules, and the pattern that comes out | **Swarm**: spikes, events, local learning, damage | Neuromorphic, event-driven and living computers | **The lab as a swarm**: work found with nobody assigning it |
| [scale](scale.md) | What will be the next Moore's law? | **Clock**: time at every scale, from a switch flip to fifty years | **Scaling**: what shrinking gives and costs | Stacking, new switches, and new things to double | **Forecasts**: dated claims, scored when their date comes |

One of each per question. Eleven is not a rule: it is where the layers came out when each was thought through
from its question. A layer that turns out to need a twelfth, or to need only ten, says so in its document.

## The shape of one world

Every question document has the same sections, in this order, so any world can be read the same way:

1. **The question**, and the question behind it.
2. **Why it is open**: the two true things that pull against each other.
3. **What is true**: the first principles, in plain words, with figures and their sources.
4. **The visual system**: what it lays out, what you can do in it, what it shows. A sketch.
5. **The engine**: what it computes and from what, what it decides, and what exists today.
6. **Questions inside**: the smaller questions that lead in, each with something true to notice.
7. **Challenges**: each a target the engine judges.
8. **Innovation direction**: what people are trying, how far it has come, and its catch.
9. **Community topic**: what people and AI add here, and how it is judged.
10. **Real cases.**
11. **Where it meets other questions**: only the joints that are real.
12. **From earlier work**: what the first versions had that fits here, and what does not.

## Rules kept from the lab

- Plain words first. Every term is explained the first time it is used.
- A number has a source (`src/data/facts.json`, with the date it was checked), or it comes from an engine, or it
  is physics everyone can check. Projections and claims are called so.
- Questions, not answers: a world never ends in a verdict. What is true is stated; what is open stays open.
- Universal, not only AI chips. RISC-V, open hardware and an AI-native view get special weight.

## What came out

After all eleven were filled, reading across them showed a structure nobody put there: truths as the unit, shared
truths as the only connections, two halves (what a chip is, how a chip comes to be), and challenges as four verbs
(make, find, predict, pass on) that are also the community's verbs. See [STRUCTURE.md](STRUCTURE.md).

## Status

| World | Written | Visual system | Engine |
| --- | --- | --- | --- |
| think | yes | exists (the dive) | exists |
| strange | yes | live (Side by side) | exists in part (Substrate: chain, energy, time, reset) |
| limit | yes | live (Walls) | exists |
| fail | yes | live (Copies) | exists |
| idea | yes | live (Forms) | exists |
| make | yes | exists (the line) | missing (the factory's flow exists) |
| know | yes | live, a draft (Probe) | a draft for review (Tune) |
| open | yes | exists (the supply map) | exists (the chain); the cost of making is missing |
| divide | yes | live (Plan) | exists (Work, with the Chip engine) |
| life | yes | live (Swarm) | exists in part (Swarm: trails and eyes) |
| scale | yes | live (Clock) | exists (Scaling, from open data) |
