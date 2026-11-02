import type { TwinSet } from '../types'
import type { ArtRef } from '../../../ui/pick/types'
import { ref } from './ref'

type Props = Record<string, string | number | boolean>

/** A twin set: the sample, plus three decoys that each change one detail (leave out a part, or recolor). */
function twin(id: string, name: string, base: Props, changes: readonly [Props, Props, Props]): TwinSet {
  const [a, b, c] = changes.map((ch): ArtRef => ref(name, { ...base, ...ch })) as [ArtRef, ArtRef, ArtRef]
  return { id, sample: ref(name, Object.keys(base).length ? base : undefined), decoys: [a, b, c] }
}

const miss = (part: string): Props => ({ missing: part })

export const TWIN_SETS: readonly TwinSet[] = [
  twin('dog', 'dog', {}, [miss('tail'), miss('ear'), miss('eye')]),
  twin('cat', 'cat', {}, [miss('tail'), miss('whiskers'), miss('ear')]),
  twin('fish', 'fish', { color: 'orange' }, [miss('tail'), miss('fin'), miss('eye')]),
  twin('bird', 'bird', { color: 'blue' }, [miss('beak'), miss('wing'), miss('tail')]),
  twin('elephant', 'elephant', {}, [miss('trunk'), miss('ear'), miss('tail')]),
  twin('car', 'car', { color: 'red' }, [miss('wheel'), miss('window'), miss('light')]),
  twin('train', 'train', { color: 'green' }, [miss('chimney'), miss('wheel'), miss('window')]),
  twin('bus', 'bus', { color: 'yellow' }, [miss('wheel'), miss('door'), miss('window')]),
  twin('airplane', 'airplane', { color: 'blue' }, [miss('wing'), miss('tail'), miss('window')]),
  twin('bicycle', 'bicycle', { color: 'red' }, [miss('wheel'), miss('seat'), miss('pedal')]),
  twin('face', 'face', {}, [miss('eye'), miss('nose'), miss('mouth')]),
  twin('house', 'house', { color: 'orange' }, [miss('door'), miss('window'), miss('chimney')]),
  twin('teddy', 'teddy', {}, [miss('ear'), miss('eye'), miss('nose')]),
  twin('shirt', 'shirt', { color: 'blue' }, [miss('button'), miss('pocket'), miss('sleeve')]),
  twin('butterfly', 'butterfly', { color: 'purple' }, [miss('spots'), miss('antennae'), { color: 'orange' }]),
  twin('ball', 'ball', { color: 'red' }, [miss('stripe'), { color: 'blue' }, { color: 'green' }]),
  twin('flower', 'flower', { color: 'yellow' }, [miss('petal'), miss('leaf'), miss('center')]),
]
