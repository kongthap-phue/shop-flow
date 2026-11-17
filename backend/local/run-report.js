import { handler } from '../src/events/dailyReport.js';

console.log(await handler({ source: 'local' }));
