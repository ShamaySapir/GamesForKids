import type { EngWord, Pattern, Topic } from '../types'

// One row per word: "word emoji pattern first rime" ('-' = no rime). The word is also its ID.
// A word has a rime only when every one-syllable word that rhymes with it is spelled with the same rime, so
// "same rime" and "rhymes" mean the same thing here. Irregular rhymes (one/sun, note/boat, chair/bear, bread/red,
// thumb/drum, mitt/hit, egg/leg, pie/bye) are left without a rime — rhyme games must use only words that have one.
// Number words (one, eight) start with a sound their first letter does not suggest; the first-letter game is not affected.
const rows = (topic: Topic, text: string): EngWord[] =>
  text.trim().split('\n').map(line => {
    const [word = '', emoji = '', pattern = '', first = '', rime] = line.trim().split(/\s+/)
    return { id: word, word, emoji, topic, pattern: pattern as Pattern, first, ...(rime && rime !== '-' ? { rime } : {}) }
  })

const colors = rows('colors', `
red 🔴 cvc r ed
blue 🔵 other b -
green 🟢 other g -
yellow 🟡 other y -
purple 🟣 other p -
orange 🟠 other o -
black ⚫ other b -
white ⚪ magic-e w ite
brown 🟤 other b -
pink 🩷 other p ink
`)

const numbers = rows('numbers', `
one 1️⃣ other w -
two 2️⃣ other t -
three 3️⃣ other th ee
four 4️⃣ other f -
five 5️⃣ magic-e f -
six 6️⃣ cvc s ix
seven 7️⃣ other s -
eight 8️⃣ other ay -
nine 9️⃣ magic-e n ine
ten 🔟 cvc t en
`)

const animals = rows('animals', `
cat 🐱 cvc k at
dog 🐶 cvc d og
pig 🐷 cvc p ig
hen 🐔 cvc h en
fox 🦊 cvc f ox
bat 🦇 cvc b at
rat 🐀 cvc r at
bug 🐛 cvc b ug
cow 🐄 other k -
frog 🐸 other f og
fish 🐟 digraph f ish
duck 🦆 other d uck
bird 🐦 other b -
horse 🐴 other h -
sheep 🐑 other sh eep
lion 🦁 other l -
bear 🐻 other b ear
monkey 🐵 other m -
rabbit 🐰 other r -
mouse 🐭 other m ouse
snake 🐍 magic-e s ake
whale 🐳 magic-e w ale
shark 🦈 other sh -
owl 🦉 other ow -
ant 🐜 other a -
bee 🐝 other b ee
goat 🐐 other g oat
crab 🦀 other k ab
chick 🐤 digraph ch ick
sloth 🦥 digraph s -
elephant 🐘 other e -
tiger 🐯 other t -
zebra 🦓 other z -
turtle 🐢 other t -
`)

const food = rows('food', `
apple 🍎 other a -
banana 🍌 other b -
bread 🍞 other b -
cake 🍰 magic-e k ake
egg 🥚 other e -
milk 🥛 other m -
cheese 🧀 other ch -
pizza 🍕 other p -
rice 🍚 other r -
pear 🍐 other p ear
peach 🍑 other p each
grape 🍇 magic-e g ape
lemon 🍋 other l -
carrot 🥕 other k -
tomato 🍅 other t -
potato 🥔 other p -
cookie 🍪 other k -
candy 🍬 other k -
juice 🧃 other j -
nut 🥜 cvc n ut
pie 🥧 other p -
corn 🌽 other k -
meat 🍖 other m eat
bean 🫘 other b -
pea 🫛 other p -
honey 🍯 other h -
sandwich 🥪 other s -
strawberry 🍓 other s -
watermelon 🍉 other w -
lunch 🍱 digraph l -
`)

const body = rows('body', `
eye 👁️ other eye -
ear 👂 other ear -
nose 👃 magic-e n ose
mouth 👄 other m -
hand ✋ other h -
foot 🦶 other f -
leg 🦵 cvc l eg
arm 💪 other ar -
tooth 🦷 other t -
tongue 👅 other t -
bone 🦴 magic-e b one
brain 🧠 other b -
heart ❤️ other h -
thumb 👍 digraph th -
sick 🤒 other s ick
pill 💊 other p ill
`)

const family = rows('family', `
mom 👩 cvc m om
dad 👨 cvc d ad
baby 👶 other b -
boy 👦 other b -
girl 👧 other g -
grandma 👵 other g -
grandpa 👴 other g -
family 👪 other f -
kid 🧒 cvc k id
vet 🧑‍⚕️ cvc v et
`)

const school = rows('school', `
book 📖 other b -
pen 🖊️ cvc p en
pencil ✏️ other p -
bag 🎒 cvc b ag
school 🏫 other s -
ruler 📏 other r -
paint 🎨 other p -
brush 🖌️ digraph b ush
map 🗺️ cvc m ap
teacher 🧑‍🏫 other t -
note 📝 magic-e n -
pin 📌 cvc p in
computer 💻 other k -
paper 📄 other p -
chess ♟️ digraph ch ess
plan 📋 other p an
pad 🗒️ cvc p ad
tape 📼 magic-e t ape
tube 🧪 magic-e t ube
globe 🌍 magic-e g -
cut ✂️ cvc k ut
flag 🚩 other f ag
`)

const toys = rows('toys', `
ball ⚽ other b all
kite 🪁 magic-e k ite
game 🎮 magic-e g -
robot 🤖 other r -
bike 🚲 magic-e b -
car 🚗 other k ar
bus 🚌 cvc b us
train 🚂 other t -
plane ✈️ magic-e p ane
boat ⛵ other b oat
drum 🥁 other d -
guitar 🎸 other g -
teddy 🧸 other t -
van 🚐 cvc v an
truck 🚚 other t uck
cab 🚕 cvc k ab
ship 🚢 digraph sh -
balloon 🎈 other b -
gift 🎁 other g -
`)

const clothes = rows('clothes', `
hat 🎩 cvc h at
cap 🧢 cvc k ap
shirt 👕 other sh -
shorts 🩳 other sh -
shoe 👟 other sh -
sock 🧦 other s ock
dress 👗 other d ess
coat 🧥 other k oat
jeans 👖 other j -
glasses 👓 other g -
scarf 🧣 other s -
boot 🥾 other b -
crown 👑 other k -
ring 💍 other r ing
cape 🦸 magic-e k ape
vest 🦺 other v -
mitt 🧤 other m -
heel 👠 other h -
umbrella ☂️ other u -
`)

const actions = rows('actions', `
run 🏃 cvc r un
hug 🤗 cvc h ug
dig ⛏️ cvc d ig
hop 🦘 cvc h op
win 🏆 cvc w in
hit 🥊 cvc h it
not 🚫 cvc n ot
sad 😢 cvc s ad
mad 😡 cvc m ad
bad 👎 cvc b ad
stop 🛑 other s op
sleep 😴 other s eep
swim 🏊 other s im
dance 💃 other d -
sing 🎤 other s ing
clap 👏 other k ap
walk 🚶 other w -
wash 🧼 digraph w -
think 💭 digraph th ink
chat 💬 digraph ch at
drink 🥤 other d ink
cute 🥰 magic-e k -
hope 🤞 magic-e h ope
wish 🌠 digraph w ish
grin 😁 other g in
bye 👋 other b ye
`)

const nature = rows('nature', `
sun ☀️ cvc s un
moon 🌙 other m oon
star ⭐ other s ar
tree 🌳 other t ee
rose 🌹 magic-e r ose
lake 🏞️ magic-e l ake
wave 🌊 magic-e w -
rain 🌧️ other r -
snow ❄️ other s -
cloud ☁️ other k -
flower 🌸 other f -
leaf 🍃 other l -
rock 🪨 other r ock
log 🪵 cvc l og
web 🕸️ cvc w eb
pine 🌲 magic-e p ine
beach 🏖️ other b each
hill ⛰️ other h ill
west 🧭 other w -
heat 🔥 other h eat
wet 💦 cvc w et
water 💧 other w -
shell 🐚 digraph sh ell
`)

const home = rows('home', `
bed 🛏️ cvc b ed
chair 🪑 other ch -
door 🚪 other d -
house 🏠 other h ouse
clock 🕐 other k ock
key 🔑 other k -
tap 🚰 cvc t ap
tub 🛁 cvc t ub
bin 🗑️ cvc b in
mop 🧹 cvc m op
wall 🧱 other w all
sofa 🛋️ other s -
box 📦 cvc b ox
bell 🔔 other b ell
pane 🪟 magic-e p ane
can 🥫 cvc k an
cup ☕ cvc k up
pot 🍲 cvc p ot
pan 🍳 cvc p an
spoon 🥄 other s oon
dish 🍽️ digraph d ish
bath 🛀 digraph b -
bill 💵 other b ill
kit 🧰 cvc k it
dim 🔅 cvc d im
dime 🪙 magic-e d -
cane 🦯 magic-e k ane
shop 🏪 digraph sh op
`)

export const WORDS: readonly EngWord[] = [
  ...colors, ...numbers, ...animals, ...food, ...body, ...family, ...school, ...toys, ...clothes, ...actions, ...nature, ...home,
]
