/* Labs that live in the app shell (the map page), not in a topic. Topic simulations live in
   topics/<id>/labs/ and load when their topic opens (see src/app/loader.js). */
import { init as zoom } from './zoom-rack-to-atom.js';
import { init as timeMachine } from './time-machine.js';
export const LABS = [['zoom-rack-to-atom', zoom], ['time-machine', timeMachine]];
