import { B, Ci, Dt, El, LINE, Pa, Pair, Part, Re, Tube, mix, pal, polar, shade, tint, type Entry } from './common'

const dark = pal('dark')
const white = pal('white')

/** A round eye with a highlight. */
const Eye = ({ cx, cy, r = 4.5 }: { cx: number; cy: number; r?: number }) => (
  <>
    <Ci cx={cx} cy={cy} r={r} f={dark} w={1.6} />
    <Ci cx={cx + r * 0.3} cy={cy - r * 0.35} r={r * 0.32} f={white} l={false} />
  </>
)

const dog: Entry = {
  bb: [4, 24, 97, 90],
  draw: () => {
    const wood = pal('wood')
    return (
      <>
        <Part name="tail"><Pa d="M16 62 Q4 54 8 36 Q18 42 22 54 Z" f={wood} /></Part>
        <B>
          {[18, 30, 48, 60].map(x => <Re key={x} x={x} y={68} width={10} height={22} rx={5} f={wood} />)}
          <El cx={40} cy={62} rx={28} ry={17} f={wood} />
          <Ci cx={72} cy={42} r={16} f={wood} />
          <El cx={85} cy={48} rx={9} ry={7} f={pal('cream')} />
          <Dt><Ci cx={91} cy={46} r={3.4} f={dark} l={false} /><Pa d="M82 54 Q86 57 90 54" l={LINE} w={2.5} /></Dt>
        </B>
        <Part name="ear"><Pa d="M60 28 Q50 36 55 56 Q69 56 70 36 Z" f={pal('brown')} /></Part>
        <Part name="eye"><Dt><Eye cx={77} cy={38} r={5} /></Dt></Part>
      </>
    )
  },
}

const cat: Entry = {
  bb: [4, 12, 97, 92],
  draw: () => {
    const c = pal('orange')
    return (
      <>
        <Part name="tail"><Pa d="M20 72 Q2 68 6 44 Q10 38 15 43 Q13 58 26 62 Z" f={c} /></Part>
        <B>
          <Re x={30} y={78} width={10} height={14} rx={5} f={c} />
          <Re x={52} y={78} width={10} height={14} rx={5} f={c} />
          <El cx={40} cy={66} rx={26} ry={20} f={c} />
        </B>
        <Part name="ear">
          <Pa d="M54 34 L55 11 L70 25 Z" f={c} />
          <Pa d="M86 34 L85 11 L70 25 Z" f={c} />
          <Dt><Pa d="M58 27 L58 19 L64 24 Z" f={pal('pink')} l={false} /><Pa d="M82 27 L82 19 L76 24 Z" f={pal('pink')} l={false} /></Dt>
        </Part>
        <B>
          <Ci cx={70} cy={42} r={18} f={c} />
          <Dt>
            <Eye cx={63} cy={41} r={3.8} /><Eye cx={77} cy={41} r={3.8} />
            <Pa d="M67 47 L73 47 L70 51 Z" f={pal('pink')} w={2} />
            <Pa d="M70 51 Q67 56 63 54 M70 51 Q73 56 77 54" l={LINE} w={2.5} />
          </Dt>
        </B>
        <Part name="whiskers"><Pa d="M58 50 L40 46 M58 55 L40 58 M82 50 L98 46 M82 55 L98 58" l={LINE} w={3} /></Part>
      </>
    )
  },
}

const fish: Entry = {
  bb: [4, 12, 96, 86],
  draw: o => {
    const c = tint(o, 'orange')
    const fin = shade(c, 82)
    return (
      <>
        <Part name="tail"><Pa d="M28 50 L6 26 Q13 50 6 74 Z" f={fin} /></Part>
        <Part name="fin"><Pa d="M42 34 Q46 8 70 31 Z" f={fin} /><Pa d="M46 66 Q50 88 64 69 Z" f={fin} /></Part>
        <B>
          <Pa d="M24 50 Q40 24 66 30 Q88 36 95 50 Q88 64 66 70 Q40 76 24 50 Z" f={c} />
          <Dt><Pa d="M64 36 Q55 50 64 64" l={shade(c, 60)} w={3} /><Pa d="M88 54 Q91 53 93 51" l={LINE} w={2.5} />
            <Pa d="M34 44 Q40 40 46 44 M34 56 Q40 60 46 56 M38 50 Q43 46 48 50" l={shade(c, 70)} w={2.5} />
          </Dt>
        </B>
        <Part name="eye"><Dt><Ci cx={78} cy={46} r={6.5} f={white} w={2.5} /><Ci cx={79.5} cy={46} r={3.4} f={dark} l={false} /></Dt></Part>
      </>
    )
  },
}

const bird: Entry = {
  bb: [2, 20, 97, 94],
  draw: o => {
    const c = tint(o, 'blue')
    return (
      <>
        <Part name="tail"><Pa d="M22 62 L2 52 L5 64 L2 76 L24 72 Z" f={shade(c, 80)} /></Part>
        <B>
          <Pa d="M40 80 L40 94 M54 80 L54 94" l={pal('orange')} w={5} />
          <El cx={44} cy={58} rx={28} ry={24} f={c} />
          <Ci cx={68} cy={36} r={15} f={c} />
          <Dt><El cx={46} cy={68} rx={16} ry={10} f={mix(c, white, 40)} l={false} /><Eye cx={72} cy={32} r={4} /></Dt>
        </B>
        <Part name="beak"><Pa d="M80 31 L98 38 L80 45 Z" f={pal('orange')} /></Part>
        <Part name="wing"><Pa d="M26 54 Q42 40 60 58 Q48 80 28 64 Z" f={shade(c, 74)} /></Part>
      </>
    )
  },
}

const duck: Entry = {
  bb: [2, 20, 98, 94],
  draw: () => {
    const y = pal('yellow')
    return (
      <>
        <B>
          <El cx={38} cy={90} rx={8} ry={3.5} f={pal('orange')} />
          <El cx={54} cy={90} rx={8} ry={3.5} f={pal('orange')} />
          <Pa d="M14 56 L3 42 Q16 44 24 52 Z" f={y} />
          <El cx={44} cy={66} rx={32} ry={22} f={y} />
          <Ci cx={70} cy={38} r={15} f={y} />
          <Dt><Eye cx={75} cy={34} r={3.8} /><Ci cx={78} cy={44} r={3.4} f={pal('pink')} l={false} opacity={0.7} /></Dt>
        </B>
        <Part name="beak"><Pa d="M81 37 Q99 34 97 45 Q90 49 81 46 Z" f={pal('orange')} /></Part>
        <Part name="wing"><Pa d="M26 60 Q42 46 62 62 Q50 82 30 74 Z" f={mix(y, pal('orange'), 50)} /></Part>
      </>
    )
  },
}

const turtle: Entry = {
  bb: [8, 28, 98, 90],
  draw: () => {
    const skin = pal('lime')
    const hex = [0, 60, 120, 180, 240, 300].map(a => polar(44, 54, 12, a))
    return (
      <>
        <B>
          <Re x={20} y={68} width={14} height={20} rx={6} f={skin} />
          <Re x={50} y={68} width={14} height={20} rx={6} f={skin} />
          <Pa d="M14 72 L2 78 L16 80 Z" f={skin} />
        </B>
        <Part name="head">
          <El cx={86} cy={56} rx={11} ry={10} f={skin} />
          <Dt><Eye cx={89} cy={52} r={3.2} /><Pa d="M84 61 Q89 65 94 61" l={LINE} w={2.5} /></Dt>
        </Part>
        <B><Pa d="M10 74 Q10 30 44 30 Q78 30 78 74 Z" f={pal('green')} /></B>
        <Part name="shell-pattern">
          <Dt>
            <Pa d={`M${hex.map(p => p.join(' ')).join('L')}Z`} l={shade(pal('green'), 55)} w={3} />
            {[0, 120, 180, 240, 300].map(a => {
              const [x1, y1] = polar(44, 54, 12, a)
              const [x2, y2] = polar(44, 54, 22, a)
              return <Pa key={a} d={`M${x1} ${y1} L${x2} ${y2}`} l={shade(pal('green'), 55)} w={3} />
            })}
          </Dt>
        </Part>
      </>
    )
  },
}

const snail: Entry = {
  bb: [4, 14, 96, 88],
  draw: () => {
    const skin = pal('skin')
    return (
      <>
        <B>
          <Pa d="M12 86 Q5 86 5 79 Q5 72 14 72 L66 72 Q68 44 80 40 Q94 38 94 56 L94 80 Q94 86 88 86 Z" f={skin} />
          <Dt><Pa d="M82 62 Q87 66 91 62" l={LINE} w={2.5} /></Dt>
        </B>
        <Part name="shell">
          <Ci cx={38} cy={50} r={27} f={pal('orange')} />
          <Dt><Pa d="M38 50 Q43 50 43 45 Q43 38 36 38 Q27 38 27 48 Q27 60 39 60 Q52 60 52 46 Q52 32 36 31" l={pal('brown')} w={4} /></Dt>
        </Part>
        <Part name="antennae">
          <Pa d="M80 42 L72 22 M90 42 L95 22" l={LINE} w={4} />
          <Ci cx={71} cy={20} r={5} f={skin} />
          <Ci cx={95} cy={20} r={5} f={skin} />
          <Dt><Ci cx={72} cy={20} r={2} f={dark} l={false} /><Ci cx={94} cy={20} r={2} f={dark} l={false} /></Dt>
        </Part>
      </>
    )
  },
}

const elephant: Entry = {
  bb: [4, 24, 100, 94],
  draw: () => {
    const g = pal('gray')
    return (
      <g transform="translate(-1 3) scale(0.94)">
        <Part name="tail"><Tube d="M20 54 Q6 60 9 78" f={g} w={4} /><Dt><Ci cx={9} cy={80} r={3} f={dark} l={false} /></Dt></Part>
        <B>
          {[18, 32, 52, 66].map(x => <Re key={x} x={x} y={66} width={12} height={26} rx={5} f={g} />)}
          <El cx={44} cy={58} rx={30} ry={22} f={g} />
          <Ci cx={76} cy={42} r={17} f={g} />
        </B>
        <Part name="trunk"><Tube d="M88 50 Q99 58 95 74 Q93 86 85 85" f={g} w={11} /></Part>
        <Part name="ear">
          <El cx={62} cy={46} rx={12} ry={17} f={shade(g, 90)} />
          <Dt><El cx={62} cy={47} rx={6} ry={10} f={pal('pink')} l={false} opacity={0.8} /></Dt>
        </Part>
        <B><Dt><Eye cx={81} cy={37} r={3.6} /></Dt></B>
      </g>
    )
  },
}

const rabbit: Entry = {
  bb: [4, 5, 96, 96],
  draw: () => {
    const w = white
    return (
      <>
        <Part name="ear">
          <El cx={62} cy={24} rx={7} ry={18} f={w} transform="rotate(-8 62 24)" />
          <El cx={78} cy={24} rx={7} ry={18} f={w} transform="rotate(8 78 24)" />
          <Dt>
            <El cx={62} cy={25} rx={3} ry={11} f={pal('pink')} l={false} transform="rotate(-8 62 25)" />
            <El cx={78} cy={25} rx={3} ry={11} f={pal('pink')} l={false} transform="rotate(8 78 25)" />
          </Dt>
        </Part>
        <Part name="tail"><Ci cx={14} cy={68} r={10} f={w} /></Part>
        <B>
          <El cx={32} cy={90} rx={16} ry={6} f={w} />
          <El cx={62} cy={90} rx={10} ry={5.5} f={w} />
          <El cx={40} cy={70} rx={26} ry={20} f={w} />
          <Ci cx={70} cy={48} r={16} f={w} />
          <Dt>
            <Eye cx={76} cy={45} r={3.6} />
            <Ci cx={83.5} cy={51} r={3.2} f={pal('pink')} />
            <Pa d="M85 55 Q82 59 78 58" l={LINE} w={2.5} />
          </Dt>
        </B>
      </>
    )
  },
}

const mouse: Entry = {
  bb: [2, 30, 98, 96],
  draw: () => {
    const g = pal('gray')
    return (
      <>
        <Part name="tail"><Tube d="M14 78 Q2 78 3 88 Q6 97 16 94" f={pal('pink')} w={3} /></Part>
        <Part name="ear">
          <Ci cx={42} cy={44} r={11} f={g} />
          <Ci cx={62} cy={44} r={12} f={g} />
          <Dt><Ci cx={62} cy={45} r={6.5} f={pal('pink')} l={false} /><Ci cx={42} cy={45} r={5.5} f={pal('pink')} l={false} /></Dt>
        </Part>
        <B>
          <Pa d="M12 80 Q6 56 32 50 Q54 46 68 54 L96 66 Q92 82 72 84 L22 84 Q14 84 12 80 Z" f={g} />
          <Ci cx={95} cy={66} r={4.5} f={pal('pink')} />
          <Dt><Eye cx={76} cy={62} r={3.8} /><Pa d="M82 70 L96 72 M82 66 L98 62" l={LINE} w={2} /></Dt>
        </B>
      </>
    )
  },
}

const butterfly: Entry = {
  bb: [4, 6, 96, 90],
  draw: o => {
    const c = tint(o, 'orange')
    return (
      <>
        <B><Pair>
          <Pa d="M52 46 Q64 4 92 16 Q98 40 52 52 Z" f={c} />
          <Pa d="M52 52 Q96 56 84 82 Q68 92 52 62 Z" f={shade(c, 88)} />
        </Pair></B>
        <Part name="spots">
          <Dt><Pair><Ci cx={78} cy={28} r={6} f={white} w={2.5} /><Ci cx={72} cy={72} r={5} f={white} w={2.5} /></Pair></Dt>
        </Part>
        <B><El cx={50} cy={54} rx={5.5} ry={26} f={dark} /><Ci cx={50} cy={26} r={6.5} f={dark} /></B>
        <Part name="antennae">
          <Pair><Pa d="M47 22 Q44 10 36 7" l={LINE} w={3.5} /><Ci cx={35} cy={6} r={3.2} f={LINE} l={false} /></Pair>
        </Part>
      </>
    )
  },
}

const ladybug: Entry = {
  bb: [4, 6, 96, 92],
  draw: () => (
    <>
      <B><Pair><Pa d="M22 46 L6 38 M18 62 L3 62 M24 78 L8 88" l={LINE} w={4} /></Pair></B>
      <Part name="antennae"><Pair><Pa d="M44 16 Q41 7 32 6" l={LINE} w={4} /></Pair></Part>
      <B>
        <Ci cx={50} cy={28} r={14} f={dark} />
        <El cx={50} cy={58} rx={36} ry={34} f={pal('red')} />
        <Dt>
          <Pa d="M50 26 L50 92" l={LINE} w={3} />
          <Pair><Ci cx={44} cy={25} r={3.2} f={white} l={false} /></Pair>
        </Dt>
      </B>
      <Part name="spots"><Dt><Pair><Ci cx={31} cy={50} r={7} f={dark} l={false} /><Ci cx={35} cy={74} r={6} f={dark} l={false} /></Pair></Dt></Part>
    </>
  ),
}

export const animals: Record<string, Entry> = { dog, cat, fish, bird, duck, turtle, snail, elephant, rabbit, mouse, butterfly, ladybug }
