import { B, Ci, Dt, El, LINE, Pa, Pair, Part, Re, Tube, mix, pal, shade, symD, tint, type Entry, type Opts } from './common'

const dark = pal('dark')
const white = pal('white')
const sky = pal('sky')

/* ---------- toys ---------- */

const ball: Entry = {
  draw: o => (
    <>
      <B><Ci cx={50} cy={50} r={38} f={tint(o, 'red')} /></B>
      <Part name="stripe"><Pa d="M13 42 Q50 62 87 42 L87 58 Q50 78 13 58 Z" f={white} w={3} /></Part>
      <B>
        <Ci cx={50} cy={50} r={38} />
        <Dt><Pa d="M25 32 Q31 23 42 20" l={white} w={5} opacity={0.8} /></Dt>
      </B>
    </>
  ),
}

const kite: Entry = {
  bb: [18, 6, 82, 98],
  draw: o => {
    const c = tint(o, 'red')
    return (
      <>
        <Part name="tail"><Re x={47} y={72} width={6} height={26} rx={3} f={pal('cream')} w={3} /></Part>
        <B>
          <Pa d="M50 6 L80 36 L50 74 L20 36 Z" f={c} />
          <Dt>
            <Pa d="M20 36 L80 36 L50 74 Z" f={shade(c, 84)} l={false} />
            <Pa d="M50 6 L50 74 M20 36 L80 36" l={LINE} w={2.5} />
          </Dt>
        </B>
        <Part name="bow">
          <Pair><Pa d="M50 83 L40 77 L40 89 Z" f={pal('yellow')} w={3} /><Pa d="M50 94 L41 89 L41 99 Z" f={pal('blue')} w={3} /></Pair>
        </Part>
      </>
    )
  },
}

const balloon: Entry = {
  bb: [14, 4, 86, 98],
  draw: o => {
    const c = tint(o, 'red')
    return (
      <>
        <Part name="string">
          <Pa d="M50 68 L43 77 L57 77 Z" f={shade(c, 85)} w={3} />
          <Pa d="M50 77 L50 98" l={LINE} w={3} />
        </Part>
        <B>
          <Pa d={symD([50, 4], [[74, 4, 86, 22, 82, 38], [78, 54, 62, 66, 50, 68]])} f={c} />
          <Dt><Pair><Pa d="M65 15 Q74 19 76 30" l={white} w={4} opacity={0.7} /></Pair></Dt>
        </B>
      </>
    )
  },
}

const teddy: Entry = {
  bb: [20, 7, 80, 96],
  draw: () => {
    const f = pal('wood')
    const tan = pal('tan')
    return (
      <>
        <Part name="ear">
          <Pair><Ci cx={30} cy={17} r={10} f={f} /><Dt><Ci cx={30} cy={17} r={5} f={tan} l={false} /></Dt></Pair>
        </Part>
        <B>
          <Pair>
            <El cx={22} cy={70} rx={8} ry={14} f={f} transform="rotate(20 22 70)" />
            <El cx={36} cy={92} rx={11} ry={6} f={f} />
          </Pair>
          <El cx={50} cy={74} rx={24} ry={22} f={f} />
          <Dt><El cx={50} cy={78} rx={13} ry={12} f={tan} l={false} /></Dt>
          <Ci cx={50} cy={36} r={22} f={f} />
          <El cx={50} cy={44} rx={11} ry={8.5} f={tan} />
          <Dt><Pa d="M50 46 L50 50 M50 50 Q46 54 43 51 M50 50 Q54 54 57 51" l={LINE} w={2.5} /></Dt>
        </B>
        <Part name="nose"><El cx={50} cy={41} rx={4.8} ry={3.4} f={dark} w={2} /></Part>
        <Part name="eye"><Dt><Pair><Ci cx={40} cy={31} r={3.8} f={dark} w={1.6} /><Ci cx={41} cy={30} r={1.2} f={white} l={false} /></Pair></Dt></Part>
        <Part name="bow">
          <Pair><Pa d="M50 59 L38 51 L38 67 Z" f={pal('red')} w={3} /></Pair>
          <Ci cx={50} cy={59} r={4.5} f={pal('red')} w={3} />
        </Part>
      </>
    )
  },
}

/* ---------- vehicles (facing right) ---------- */

const Wheel = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <>
    <Ci cx={cx} cy={cy} r={r} f={dark} />
    <Dt><Ci cx={cx} cy={cy} r={r * 0.42} f={pal('gray')} l={false} /></Dt>
  </>
)

const car: Entry = {
  bb: [6, 21, 94, 81],
  draw: o => {
    const c = tint(o, 'red')
    return (
      <>
        <B>
          <Pa d="M24 44 L33 24 Q35 21 40 21 L62 21 Q67 21 70 25 L80 44 Z" f={c} />
          <Re x={6} y={44} width={88} height={24} rx={9} f={c} />
        </B>
        <Part name="window">
          <Pa d="M31 42 L37 26 L48 26 L48 42 Z" f={sky} w={3} />
          <Pa d="M53 26 L63 26 L70 42 L53 42 Z" f={sky} w={3} />
        </Part>
        <Part name="light"><Ci cx={88} cy={54} r={5} f={pal('yellow')} w={3} /></Part>
        <B><Wheel cx={72} cy={70} r={11} /></B>
        <Part name="wheel"><Wheel cx={28} cy={70} r={11} /></Part>
      </>
    )
  },
}

const train: Entry = {
  bb: [6, 8, 94, 91],
  draw: o => {
    const c = tint(o, 'blue')
    return (
      <>
        <Part name="chimney">
          <Pa d="M62 44 L63 30 L57 24 L83 24 L77 30 L78 44 Z" f={dark} />
          <Ci cx={72} cy={14} r={6} f={white} w={2.5} /><Ci cx={82} cy={8} r={4.5} f={white} w={2.5} />
        </Part>
        <B>
          <Re x={36} y={44} width={56} height={26} rx={9} f={c} />
          <Re x={10} y={26} width={30} height={44} rx={4} f={c} />
          <Re x={5} y={19} width={40} height={9} rx={3} f={dark} />
          <Re x={5} y={67} width={90} height={8} rx={3} f={dark} />
          <Dt><Ci cx={90} cy={57} r={3.5} f={pal('yellow')} w={2.5} /></Dt>
        </B>
        <Part name="window"><Re x={16} y={32} width={18} height={17} rx={3} f={sky} w={3} /></Part>
        <B><Wheel cx={56} cy={81} r={9} /><Wheel cx={77} cy={81} r={9} /></B>
        <Part name="wheel"><Wheel cx={26} cy={79} r={11} /></Part>
      </>
    )
  },
}

const bus: Entry = {
  bb: [6, 22, 94, 87],
  draw: o => {
    const c = tint(o, 'yellow')
    return (
      <>
        <B>
          <Re x={6} y={22} width={88} height={52} rx={10} f={c} />
          <Dt><Pa d="M8 56 L92 56" l={shade(c, 70)} w={3} /><Ci cx={90} cy={64} r={3} f={white} l={false} /></Dt>
        </B>
        <Part name="window">
          {[12, 32, 52].map(x => <Re key={x} x={x} y={30} width={18} height={17} rx={3} f={sky} w={3} />)}
        </Part>
        <Part name="door">
          <Re x={74} y={30} width={14} height={42} rx={3} f={sky} w={3} />
          <Dt><Pa d="M81 30 L81 72" l={LINE} w={2.5} /></Dt>
        </Part>
        <B><Wheel cx={72} cy={76} r={11} /></B>
        <Part name="wheel"><Wheel cx={28} cy={76} r={11} /></Part>
      </>
    )
  },
}

const airplane: Entry = {
  bb: [4, 22, 94, 84],
  draw: o => {
    const c = tint(o, 'blue')
    return (
      <>
        <Part name="tail"><Pa d="M18 48 L6 22 L24 22 L38 48 Z" f={shade(c, 78)} /></Part>
        <B>
          <Pa d="M6 46 Q30 40 60 40 Q93 40 95 52 Q93 64 60 64 Q30 64 14 56 Z" f={c} />
          <Dt><Pa d="M80 46 Q88 45 91 51 L80 51 Z" f={sky} w={2.5} /></Dt>
        </B>
        <Part name="window">{[38, 50, 62].map(x => <Ci key={x} cx={x} cy={48} r={3.8} f={sky} w={2.5} />)}</Part>
        <Part name="wing"><Pa d="M44 54 L28 84 L48 84 L68 54 Z" f={shade(c, 78)} /></Part>
      </>
    )
  },
}

const boat: Entry = {
  bb: [4, 2, 96, 90],
  draw: o => {
    const c = tint(o, 'red')
    return (
      <>
        <B><Pa d="M50 18 L50 62" l={LINE} w={4} /></B>
        <Part name="sail">
          <Pa d="M54 22 L54 58 L88 58 Z" f={white} />
          <Pa d="M46 30 L46 58 L22 58 Z" f={white} />
        </Part>
        <Part name="flag"><Pa d="M50 3 L69 10 L50 17 Z" f={pal('yellow')} /></Part>
        <B>
          <Pa d="M8 62 L92 62 Q88 78 76 84 L22 84 Q12 78 8 62 Z" f={c} />
          <Dt>
            <Pa d="M14 70 L86 70" l={white} w={3} opacity={0.8} />
          </Dt>
          <Pa d="M2 91 Q12 85 22 91 T42 91 T62 91 T82 91 T98 91" l={pal('blue')} w={4} />
        </B>
      </>
    )
  },
}

const bicycle: Entry = {
  bb: [4, 26, 96, 88],
  draw: o => {
    const c = tint(o, 'red')
    return (
      <>
        <B>
          <Ci cx={76} cy={66} r={20} w={5} />
        </B>
        <Part name="wheel">
          <Ci cx={24} cy={66} r={20} w={5} />
        </Part>
        <B>
          <Tube d="M24 66 L40 40 L66 40 L76 66 M24 66 L48 66 L40 40 M48 66 L66 40" f={c} w={5} />
          <Tube d="M66 40 L62 27 L72 25" f={dark} w={4} />
        </B>
        <Part name="seat"><Re x={28} y={33} width={24} height={7} rx={3.5} f={dark} /></Part>
        <Part name="pedal">
          <Pa d="M48 66 L54 76" l={LINE} w={4} />
          <Re x={49} y={75} width={13} height={5} rx={2} f={dark} />
        </Part>
      </>
    )
  },
}

/* ---------- food ---------- */

const Stem = ({ d }: { d: string }) => <Pa d={d} f={pal('brown')} />
const LeafShape = ({ d, vein }: { d: string; vein?: string }) => (
  <>
    <Pa d={d} f={pal('leaf')} />
    {vein && <Dt><Pa d={vein} l={shade(pal('leaf'), 55)} w={2.5} /></Dt>}
  </>
)

const apple: Entry = {
  bb: [8, 8, 92, 90],
  draw: o => (
    <>
      <Part name="stem"><Stem d="M47 32 Q46 18 52 8 L59 11 Q54 20 55 32 Z" /></Part>
      <B>
        <Pa d="M50 30 Q36 22 22 32 Q8 44 14 66 Q22 90 40 88 Q46 87 50 89 Q54 87 60 88 Q78 90 86 66 Q92 44 78 32 Q64 22 50 30 Z" f={tint(o, 'red')} />
        <Dt><Pa d="M24 44 Q21 55 27 66" l={white} w={4} opacity={0.7} /></Dt>
      </B>
      <Part name="leaf"><LeafShape d="M56 22 Q68 6 88 12 Q82 30 56 22 Z" vein="M60 22 Q72 17 82 14" /></Part>
    </>
  ),
}

const pear: Entry = {
  bb: [14, 6, 88, 92],
  draw: () => (
    <>
      <Part name="stem"><Stem d="M48 26 Q48 14 54 6 L60 9 Q54 16 54 26 Z" /></Part>
      <B>
        <Pa d="M50 22 Q60 22 62 36 Q64 46 72 58 Q84 78 70 90 Q50 100 30 90 Q16 78 28 58 Q36 46 38 36 Q40 22 50 22 Z" f={pal('lime')} />
        <Dt><Pa d="M33 66 Q30 76 36 84" l={white} w={4} opacity={0.7} /></Dt>
      </B>
      <Part name="leaf"><LeafShape d="M56 16 Q68 2 88 8 Q82 26 56 16 Z" vein="M60 16 Q72 11 82 10" /></Part>
    </>
  ),
}

const strawberry: Entry = {
  bb: [14, 12, 86, 90],
  draw: () => (
    <>
      <B>
        <Pa d="M50 90 Q20 72 16 44 Q16 28 34 28 Q42 28 50 32 Q58 28 66 28 Q84 28 84 44 Q80 72 50 90 Z" f={pal('red')} />
      </B>
      <Part name="seeds">
        <Dt>
          {[[33, 46], [50, 48], [67, 46], [40, 62], [60, 62], [50, 75], [28, 58], [72, 58]].map(([x, y]) => (
            <El key={`${x}-${y}`} cx={x} cy={y} rx={2.4} ry={3.4} f={pal('yellow')} l={false} />
          ))}
        </Dt>
      </Part>
      <Part name="leaves"><Pa d="M28 32 L22 20 L38 26 L42 12 L50 26 L58 12 L62 26 L78 20 L72 32 Q50 40 28 32 Z" f={pal('leaf')} /></Part>
    </>
  ),
}

const icecream: Entry = {
  bb: [22, 12, 78, 96],
  draw: o => {
    const c = tint(o, 'pink')
    return (
      <>
        <B>
          <Pa d="M26 56 L74 56 L50 96 Z" f={pal('tan')} />
          <Dt><Pair><Pa d="M31 62 L55 90 M42 58 L62 82" l={pal('brown')} w={2.5} /></Pair></Dt>
          <Pa d={symD([50, 22], [[68, 22, 78, 30, 78, 44], [84, 56, 72, 56], [62, 62, 50, 56]])} f={c} />
        </B>
        <Part name="sprinkles">
          <Dt>
            <Pair>
              <Re x={32} y={38} width={8} height={3.6} rx={1.8} f={pal('yellow')} l={false} transform="rotate(30 36 40)" />
              <Re x={42} y={30} width={8} height={3.6} rx={1.8} f={pal('blue')} l={false} transform="rotate(-30 46 32)" />
              <Re x={34} y={48} width={8} height={3.6} rx={1.8} f={white} l={false} transform="rotate(-20 38 50)" />
            </Pair>
          </Dt>
        </Part>
        <Part name="cherry"><Ci cx={50} cy={19} r={7.5} f={pal('red')} w={3} /></Part>
      </>
    )
  },
}

const cupcake: Entry = {
  bb: [12, 2, 88, 94],
  draw: o => {
    const c = tint(o, 'pink')
    return (
      <>
        <Part name="candle">
          <Re x={46} y={13} width={8} height={20} rx={2} f={sky} w={3} />
          <El cx={50} cy={7} rx={3.8} ry={6} f={pal('orange')} w={2.5} />
        </Part>
        <B>
          <Pa d="M24 60 L76 60 L68 94 L32 94 Z" f={pal('tan')} />
          <Dt><Pair><Pa d="M50 62 L50 92 M38 62 L41 92" l={pal('brown')} w={2.5} /></Pair></Dt>
          <Pa d={symD([50, 36], [[72, 36, 88, 46, 88, 60], [50, 60]])} f={c} />
          <Dt><Pair><Pa d="M64 46 Q74 48 78 55" l={white} w={3.5} opacity={0.75} /></Pair></Dt>
        </B>
        <Part name="cherry"><Ci cx={50} cy={34} r={8} f={pal('red')} w={3} /></Part>
      </>
    )
  },
}

const carrot: Entry = {
  bb: [20, 2, 80, 96],
  draw: () => (
    <g transform="rotate(35 50 50)">
      <Part name="leaves">
        <Pa d="M46 24 Q44 8 50 0 Q56 8 54 24 Z" f={pal('leaf')} />
        <Pa d="M46 24 Q34 20 31 8 Q46 8 48 22 Z" f={pal('leaf')} />
        <Pa d="M54 24 Q66 20 69 8 Q54 8 52 22 Z" f={pal('leaf')} />
      </Part>
      <B>
        <Pa d="M42 24 Q50 20 58 24 Q64 58 52 94 Q50 97 48 94 Q36 58 42 24 Z" f={pal('orange')} />
        <Dt><Pa d="M43 40 L50 40 M52 54 L58 54 M44 66 L50 66 M50 78 L53 78" l={shade(pal('orange'), 60)} w={3} /></Dt>
      </B>
    </g>
  ),
}

/* ---------- furniture and objects ---------- */

const chair: Entry = {
  bb: [18, 8, 76, 90],
  draw: o => {
    const c = tint(o, 'wood')
    return (
      <>
        <B><Re x={22} y={54} width={9} height={36} rx={3} f={c} /></B>
        <Part name="leg"><Re x={65} y={54} width={9} height={36} rx={3} f={c} /></Part>
        <B><Re x={20} y={44} width={56} height={12} rx={4} f={c} /></B>
        <Part name="back"><Re x={18} y={8} width={14} height={48} rx={5} f={c} /></Part>
      </>
    )
  },
}

const table: Entry = {
  bb: [8, 34, 92, 90],
  draw: () => (
    <>
      <B><Re x={74} y={44} width={10} height={46} rx={3} f={pal('brown')} /></B>
      <Part name="leg"><Re x={16} y={44} width={10} height={46} rx={3} f={pal('brown')} /></Part>
      <B><Re x={8} y={32} width={84} height={14} rx={5} f={pal('wood')} /></B>
    </>
  ),
}

const bed: Entry = {
  bb: [6, 26, 96, 88],
  draw: () => {
    const wood = pal('wood')
    return (
      <>
        <B><Re x={12} y={66} width={9} height={22} rx={3} f={pal('brown')} /></B>
        <Part name="leg"><Re x={80} y={66} width={9} height={22} rx={3} f={pal('brown')} /></Part>
        <B>
          <Re x={10} y={54} width={82} height={14} rx={4} f={wood} />
          <Re x={18} y={40} width={72} height={18} rx={7} f={pal('blue')} />
          <Dt><Pa d="M52 42 L52 56 M64 42 L64 56 M76 42 L76 56" l={white} w={3} opacity={0.8} /></Dt>
          <Re x={6} y={26} width={12} height={44} rx={4} f={pal('brown')} />
          <Re x={88} y={42} width={8} height={28} rx={3} f={pal('brown')} />
        </B>
        <Part name="pillow"><El cx={35} cy={38} rx={13} ry={8} f={white} /></Part>
      </>
    )
  },
}

const lamp: Entry = {
  bb: [20, 6, 80, 96],
  draw: o => {
    const c = tint(o, 'yellow')
    return (
      <>
        <Part name="cord"><Re x={40} y={6} width={20} height={7} rx={3} f={pal('gray')} /><Pa d="M50 13 L50 38" l={LINE} w={4} /></Part>
        <B>
          <El cx={50} cy={74} rx={10} ry={9} f={pal('cream')} />
          <Pair><Pa d="M26 82 L17 88 M34 90 L27 97" l={pal('yellow')} w={4} /></Pair><Pa d="M50 90 L50 98" l={pal('yellow')} w={4} />
        </B>
        <Part name="shade">
          <Pa d={symD([50, 34], [[70, 34, 80, 48, 84, 70], [50, 70]])} f={c} />
          <Dt><Pair><Pa d="M62 44 Q68 52 70 62" l={white} w={4} opacity={0.7} /></Pair></Dt>
        </Part>
      </>
    )
  },
}

const box: Entry = {
  bb: [8, 26, 92, 88],
  draw: o => {
    const c = tint(o, 'wood')
    return (
      <>
        <B>
          <Re x={14} y={40} width={72} height={48} rx={4} f={c} />
          <Dt><Re x={42} y={40} width={16} height={48} f={pal('cream')} l={LINE} w={2.5} /></Dt>
        </B>
        <Part name="lid">
          <Re x={8} y={26} width={84} height={17} rx={4} f={shade(c, 88)} />
          <Dt><Re x={42} y={26} width={16} height={17} f={pal('cream')} l={LINE} w={2.5} /></Dt>
        </Part>
      </>
    )
  },
}

const cup: Entry = {
  bb: [16, 25, 92, 88],
  draw: (o: Opts) => {
    const c = tint(o, 'blue')
    return (
      <>
        <Part name="handle"><Tube d="M64 40 Q90 38 88 56 Q86 72 60 68" f={c} w={7} /></Part>
        <B>
          <Pa d="M16 30 L66 30 Q64 78 52 86 Q41 90 30 86 Q18 78 16 30 Z" f={c} />
          <Dt>
            <Pa d="M17 52 Q41 59 65 52" l={mix(white, c, 70)} w={5} />
            <El cx={41} cy={34} rx={22} ry={3.6} f={shade(c, 60)} w={2.5} />
          </Dt>
        </B>
      </>
    )
  },
}

export const objects: Record<string, Entry> = {
  ball, kite, balloon, teddy, car, train, bus, airplane, boat, bicycle,
  apple, pear, strawberry, icecream, cupcake, carrot,
  chair, table, bed, lamp, box, cup,
}
