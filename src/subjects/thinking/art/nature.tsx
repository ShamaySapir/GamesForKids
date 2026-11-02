import { B, Ci, Dt, El, LINE, Pa, Pair, Part, Re, Tube, mix, pal, polar, shade, symD, tint, type Entry } from './common'

const dark = pal('dark')
const white = pal('white')

const tree: Entry = {
  bb: [6, 4, 94, 92],
  draw: () => (
    <>
      <Part name="trunk"><Re x={42} y={54} width={16} height={38} rx={3} f={pal('brown')} /></Part>
      <B><Pa d={symD([50, 6], [[62, 2, 76, 10, 74, 24], [90, 26, 94, 46, 80, 52], [84, 66, 68, 72, 58, 64], [55, 69, 50, 66]])} f={pal('green')} /></B>
      <Part name="apples">
        <Dt>
          <Ci cx={50} cy={28} r={5.5} f={pal('red')} w={2.5} />
          <Pair>
            <Ci cx={32} cy={38} r={5.5} f={pal('red')} w={2.5} />
            <Ci cx={38} cy={54} r={5.5} f={pal('red')} w={2.5} />
          </Pair>
        </Dt>
      </Part>
    </>
  ),
}

const flower: Entry = {
  bb: [10, 3, 90, 96],
  draw: o => {
    const c = tint(o, 'red')
    return (
      <>
        <B><Re x={46} y={56} width={8} height={40} rx={3} f={pal('green')} /></B>
        <B><Pa d="M50 84 Q32 70 16 76 Q24 92 50 90 Z" f={pal('leaf')} /></B>
        <Part name="leaf"><Pa d="M50 84 Q68 70 84 76 Q76 92 50 90 Z" f={pal('leaf')} /></Part>
        <Part name="petal">
          {[90, 30, 150, 210, 330, 270].map(a => {
            const [x, y] = polar(50, 36, 19, a)
            return <El key={a} cx={x} cy={y} rx={10} ry={14} f={c} transform={`rotate(${90 - a} ${x} ${y})`} />
          })}
        </Part>
        <Part name="center"><Ci cx={50} cy={36} r={11} f={pal('yellow')} /></Part>
      </>
    )
  },
}

const sun: Entry = {
  bb: [4, 4, 96, 96],
  draw: () => (
    <>
      <Part name="rays">
        {Array.from({ length: 12 }, (_, k) => (
          <Pa key={k} d="M50 5 L59 24 L41 24 Z" f={pal('orange')} transform={`rotate(${k * 30} 50 50)`} />
        ))}
      </Part>
      <B><Ci cx={50} cy={50} r={25} f={pal('yellow')} /></B>
      <Part name="face">
        <Dt>
          <Pair>
            <Ci cx={41} cy={45} r={3.6} f={dark} l={false} />
            <Ci cx={35} cy={56} r={3.6} f={pal('pink')} l={false} opacity={0.8} />
          </Pair>
          <Pa d="M40 55 Q50 66 60 55" l={LINE} w={3.5} />
        </Dt>
      </Part>
    </>
  ),
}

const cloud: Entry = {
  bb: [8, 20, 92, 97],
  draw: () => (
    <>
      <B><Pa d="M26 66 Q8 66 10 50 Q12 38 28 40 Q30 22 48 22 Q64 22 68 38 Q88 34 90 52 Q92 66 74 66 Z" f={white} /></B>
      <Part name="raindrops">
        {[[28, 80], [46, 88], [64, 80], [82, 86]].map(([x, y]) => (
          <Pa key={x} d="M0 -8 Q7 2 0 7 Q-7 2 0 -8 Z" f={pal('blue')} w={2.5} transform={`translate(${x} ${y}) scale(1.35)`} />
        ))}
      </Part>
    </>
  ),
}

const leaf: Entry = {
  bb: [14, 6, 86, 98],
  draw: o => {
    const c = tint(o, 'green')
    return (
      <>
        <Part name="stem"><Re x={47} y={82} width={6} height={16} rx={3} f={pal('brown')} /></Part>
        <B><Pa d={symD([50, 6], [[82, 22, 84, 60, 50, 86]])} f={c} /></B>
        <Part name="vein">
          <Dt><Pa d="M50 20 L50 84" l={shade(c, 55)} w={3} /><Pair><Pa d="M50 44 L64 34 M50 60 L66 50" l={shade(c, 55)} w={3} /></Pair></Dt>
        </Part>
      </>
    )
  },
}

const seed: Entry = {
  bb: [26, 8, 74, 92],
  draw: () => (
    <g transform="rotate(14 50 50)">
      <Pa d="M50 8 Q76 38 68 66 Q60 92 44 90 Q28 86 32 58 Q34 32 50 8 Z" f={pal('brown')} />
      <Dt><Pa d="M53 26 Q65 46 61 68 M45 34 Q39 52 41 72" l={mix(pal('tan'), pal('brown'), 80)} w={4} /></Dt>
    </g>
  ),
}

const sprout: Entry = {
  bb: [8, 28, 92, 92],
  draw: () => (
    <>
      <B>
        <Re x={47} y={46} width={6} height={34} rx={3} f={pal('green')} />
        <Pair><Pa d="M50 54 Q30 26 8 36 Q16 60 50 56 Z" f={pal('leaf')} /></Pair>
        <Pa d="M10 92 Q14 74 50 74 Q86 74 90 92 Z" f={pal('brown')} />
        <Dt><Ci cx={34} cy={84} r={2} f={shade(pal('brown'), 60)} l={false} /><Ci cx={64} cy={82} r={2} f={shade(pal('brown'), 60)} l={false} /><Ci cx={50} cy={86} r={2} f={shade(pal('brown'), 60)} l={false} /></Dt>
      </B>
    </>
  ),
}

/* ---------- body, buildings, clothes ---------- */

const face: Entry = {
  bb: [15, 10, 85, 88],
  draw: () => {
    const skin = pal('skin')
    return (
      <>
        <Part name="ear">
          <Ci cx={84} cy={56} r={10} f={skin} /><Dt><Ci cx={84} cy={56} r={4.5} f={pal('pink')} l={false} /></Dt>
        </Part>
        <B><Ci cx={16} cy={56} r={10} f={skin} /><Dt><Ci cx={16} cy={56} r={4.5} f={pal('pink')} l={false} /></Dt></B>
        <B>
          <El cx={50} cy={52} rx={33} ry={36} f={skin} />
          <Dt><Pair><Ci cx={29} cy={66} r={4.5} f={pal('pink')} l={false} opacity={0.6} /></Pair></Dt>
        </B>
        <Part name="hair"><Pa d="M16 46 Q12 8 50 10 Q88 8 84 46 Q70 28 50 28 Q30 28 16 46 Z" f={pal('brown')} /></Part>
        <Part name="eye">
          <Dt><Pair><El cx={37} cy={52} rx={6.5} ry={7.5} f={white} w={2.5} /><Ci cx={38} cy={53} r={3.6} f={dark} l={false} /></Pair></Dt>
        </Part>
        <Part name="nose"><Ci cx={50} cy={63} r={4.5} f={pal('pink')} w={3} /></Part>
        <Part name="mouth"><Pa d="M36 74 Q50 90 64 74 Z" f={pal('red')} w={3.5} /></Part>
      </>
    )
  },
}

const house: Entry = {
  bb: [8, 4, 92, 92],
  draw: o => (
    <>
      <Part name="chimney">
        <Re x={42} y={9} width={16} height={26} f={pal('gray')} />
        <Re x={39} y={4} width={22} height={7} rx={2} f={pal('gray')} />
      </Part>
      <B><Re x={18} y={50} width={64} height={42} f={tint(o, 'yellow')} /></B>
      <Part name="roof"><Pa d="M8 54 L50 20 L92 54 Z" f={pal('brown')} /></Part>
      <Part name="door"><Pa d="M42 92 L42 72 Q42 63 50 63 Q58 63 58 72 L58 92 Z" f={pal('red')} /></Part>
      <B>
        <Re x={62} y={60} width={14} height={14} rx={2} f={pal('sky')} w={3} />
        <Dt><Pa d="M69 60 L69 74 M62 67 L76 67" l={LINE} w={2.5} /></Dt>
      </B>
      <Part name="window">
        <Re x={24} y={60} width={14} height={14} rx={2} f={pal('sky')} w={3} />
        <Dt><Pa d="M31 60 L31 74 M24 67 L38 67" l={LINE} w={2.5} /></Dt>
      </Part>
    </>
  ),
}

const tent: Entry = {
  bb: [8, 2, 92, 90],
  draw: o => (
    <>
      <Part name="flag">
        <Pa d="M50 28 L50 8" l={LINE} w={3} />
        <Pa d="M50 2 L59 10 L50 18 L41 10 Z" f={pal('red')} w={3} />
      </Part>
      <B><Pa d="M50 28 L92 90 L8 90 Z" f={tint(o, 'orange')} /></B>
      <Part name="door">
        <Pa d="M50 56 L68 90 L32 90 Z" f={dark} />
        <Dt><Pair><Pa d="M50 56 L38 90" l={white} w={2.5} /></Pair></Dt>
      </Part>
    </>
  ),
}

const shirt: Entry = {
  bb: [2, 12, 98, 92],
  draw: o => {
    const c = tint(o, 'blue')
    return (
      <>
        <B><Pa d="M30 16 L4 32 L10 54 L30 44 Z" f={c} /></B>
        <Part name="sleeve"><Pa d="M70 16 L96 32 L90 54 L70 44 Z" f={c} /></Part>
        <B>
          <Pa d="M38 14 Q50 6 62 14 Q50 28 38 14 Z" f={shade(c, 70)} w={3} />
          <Pa d={symD([50, 26], [[58, 26, 62, 14], [70, 16], [70, 92], [50, 92]])} f={c} />
        </B>
        <Part name="button">
          <Dt>{[40, 54, 68].map(y => <Ci key={y} cx={50} cy={y} r={3.4} f={white} w={2} />)}</Dt>
        </Part>
        <B><Dt><Re x={31} y={56} width={13} height={13} rx={2} w={3} l={shade(c, 60)} /></Dt></B>
        <Part name="pocket"><Dt><Re x={56} y={56} width={13} height={13} rx={2} w={3} l={shade(c, 60)} /></Dt></Part>
      </>
    )
  },
}

/** A short bar across the shoe's slope at parameter t of its quadratic curve. */
const lace = (t: number) => {
  const u = 1 - t
  const x = u * u * 38 + 2 * u * t * 40 + t * t * 64
  const y = u * u * 26 + 2 * u * t * 48 + t * t * 54
  return `M${(x - 9).toFixed(1)} ${(y + 8).toFixed(1)} L${(x - 1.4).toFixed(1)} ${(y + 0.6).toFixed(1)}`
}

const shoe: Entry = {
  bb: [8, 26, 98, 88],
  draw: o => (
    <>
      <B>
        <Pa d="M12 26 L38 26 Q40 48 64 54 Q94 58 94 76 L12 76 Z" f={tint(o, 'red')} />
        <Dt><Pa d="M74 60 Q80 68 78 76" l={shade(tint(o, 'red'), 60)} w={2.5} /></Dt>
      </B>
      <Part name="lace"><Dt>{[0.28, 0.5, 0.72].map(t => <Tube key={t} d={lace(t)} f={white} w={3} />)}</Dt></Part>
      <Part name="sole"><Re x={8} y={74} width={90} height={14} rx={7} f={white} /></Part>
    </>
  ),
}

const hat: Entry = {
  bb: [6, 24, 94, 84],
  draw: o => {
    const c = tint(o, 'yellow')
    return (
      <>
        <B>
          <El cx={50} cy={72} rx={44} ry={12} f={shade(c, 88)} />
          <Pa d="M26 72 Q24 24 50 24 Q76 24 74 72 Z" f={c} />
        </B>
        <Part name="ribbon"><Pa d="M25.4 56 L74.6 56 L75 68 L25 68 Z" f={white} /></Part>
      </>
    )
  },
}

const glasses: Entry = {
  bb: [2, 30, 98, 70],
  draw: () => {
    return (
      <>
        <Part name="lens">
          <Pair><Ci cx={31} cy={58} r={15} f={pal('sky')} w={5} /><Dt><Pa d="M22 53 Q25 47 31 46" l={white} w={3.5} /></Dt></Pair>
        </Part>
        <B><Pa d="M46 54 Q50 48 54 54" l={LINE} w={5} /></B>
        <Part name="arm"><Pair><Pa d="M17 50 L4 28" l={LINE} w={5} /></Pair></Part>
      </>
    )
  },
}

export const nature: Record<string, Entry> = {
  tree, flower, sun, cloud, leaf, seed, sprout, face, house, tent, shirt, shoe, hat, glasses,
}
