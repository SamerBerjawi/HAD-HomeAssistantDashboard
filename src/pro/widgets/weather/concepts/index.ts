/** Weather in the Widget Design Studio (pilot). */
import { defineStudioEntry } from '../../../studio/types';
import { WEATHER_STATES } from '../states';
import WeatherConceptA from './WeatherConceptA';
import WeatherConceptB from './WeatherConceptB';
import WeatherConceptC from './WeatherConceptC';

export const weatherStudio = defineStudioEntry({
  widgetId: 'weather',
  title: 'Weather',
  personality: 'Atmospheric, immersive, informative',
  direction: 'Temperature first, then what the sky is doing, then what comes next. The weather supplies the colour (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: WEATHER_STATES,
  recommended: 'B',
  why: 'B passes the "no title" test from across the room: the sky alone says weather and what it is like outside, in light and dark. A and C are clearer on numbers; C\'s hour line could be borrowed for B\'s Wide size.',
  concepts: [
    {
      id: 'A',
      Component: WeatherConceptA,
      name: 'Refined & minimal',
      idea: 'Editorial: a large light temperature and quiet typographic rows on the neutral surface. Only the condition icon carries colour.',
      strengths: ['Calmest on a busy page', 'Most information per pixel', 'Works with any theme'],
      tradeoffs: ['Least recognisable without its icon', 'Looks closest to the other widgets']
    },
    {
      id: 'B',
      Component: WeatherConceptB,
      name: 'Expressive & immersive',
      idea: 'The widget is the sky: the gradient follows condition and time of day, with sun glow, stars, clouds, rain or snow. White type, forecasts on soft strips.',
      strengths: ['Recognisable at a glance', 'Condition is felt before it is read', 'Strong night/day contrast'],
      tradeoffs: ['Most colour on the page', 'Rain/snow animate (still with reduced motion)']
    },
    {
      id: 'C',
      Component: WeatherConceptC,
      name: 'Innovative: temperature as shape',
      idea: 'Temperature drives colour and form: a dial of today\'s range (Small), a line over the next hours with the conditions along it (Wide/Large), bars down the hours (Tall), a coloured week ribbon.',
      strengths: ['Shows the trend, not just the number', 'Conditions ride along the line', 'Rain chance under the line'],
      tradeoffs: ['Needs a second look to read', 'Busiest at Large']
    }
  ]
});
