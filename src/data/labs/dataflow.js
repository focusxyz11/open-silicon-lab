/* Keep the numbers on the chip: a model's layers laid across a chip's tiles (src/v2/labs/dataflow.js, src/engines/paradigms.js) */
export default {
  name: 'dataflow', css: true,
  challenges: [
    { id: 'dataflow', step: 'use', place: 'datacentre', at: 'chip', kind: 'dataflow', grows: 'way-dataflow', opens: 'divide.chip', growAt: 'lab', exp: 'divide-general' }
  ]
};
