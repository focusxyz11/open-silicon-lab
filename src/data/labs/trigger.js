/* Trust it or not (#497): an agent's adders, some hiding a trigger on one input, checked within a budget and accepted
   into your core or rejected (src/v2/labs/trigger.js, src/engines/trigger.js); at the Lab, beside Verify the agent,
   and a stepping stone on the block rung of your stack */
export default {
  name: 'trigger', css: true,
  challenges: [
    { id: 'trigger', step: 'design', place: 'lab', kind: 'trigger', grows: 'lab-trigger', opens: 'idea.check', exp: 'idea-ai' }
  ]
};
