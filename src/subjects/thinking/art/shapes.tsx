import { Ci, Pa, Re, polar, symD, tint, type Entry } from './common'

const starPoints = Array.from({ length: 10 }, (_, i) => polar(50, 54, i % 2 ? 19 : 44, 90 + i * 36))

export const shapes: Record<string, Entry> = {
  circle: { bb: [12, 12, 88, 88], draw: o => <Ci cx={50} cy={50} r={38} f={tint(o, 'blue')} w={5} /> },
  square: { bb: [14, 14, 86, 86], draw: o => <Re x={14} y={14} width={72} height={72} rx={9} f={tint(o, 'red')} w={5} /> },
  triangle: { bb: [8, 12, 92, 86], draw: o => <Pa d="M50 12 L92 86 L8 86 Z" f={tint(o, 'green')} w={5} /> },
  star: { bb: [6, 10, 94, 92], draw: o => <Pa d={`M${starPoints.map(p => p.join(' ')).join('L')}Z`} f={tint(o, 'yellow')} w={5} /> },
  heart: {
    bb: [10, 12, 90, 90],
    draw: o => <Pa d={symD([50, 30], [[54, 16, 68, 10, 78, 16], [92, 24, 90, 44, 78, 58], [68, 70, 56, 80, 50, 90]])} f={tint(o, 'red')} w={5} />,
  },
}
