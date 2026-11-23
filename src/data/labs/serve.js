/* Serving a language model (src/v2/labs/serve.js, src/engines/aiserve.js): quantization, energy per token, prefill
   against decode */
export default {
  name: 'serve',
  challenges: [
    { id: 'quantize', step: 'use', place: 'datacentre', at: 'chip', kind: 'quantize', grows: 'dc-quant', opens: 'think.chip', exp: 'think-where' },
    { id: 'token-energy', step: 'use', place: 'datacentre', at: 'rack', kind: 'tokenenergy', grows: 'dc-token', opens: 'divide.rack', exp: 'divide-one' },
    { id: 'prefill', step: 'use', place: 'datacentre', at: 'chip', kind: 'prefill', grows: 'dc-prefill', opens: 'think.board', exp: 'think-adding' }
  ]
};
