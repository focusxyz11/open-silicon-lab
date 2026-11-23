/* Verify the agent, at the Lab: an AI proposes, a tool checks, you decide (src/v2/labs/agent.js, src/data/agent.js) */
export default {
  name: 'agent',
  challenges: [
    { id: 'agent', step: 'design', place: 'lab', kind: 'agent', grows: 'lab-desk', opens: 'idea.check', exp: 'idea-ai', after: 'jevons' }
  ]
};
