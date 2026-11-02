import type { Chunk, QA } from '../types'

// Each scene shows one situation and fits only its own chunk.
export const CHUNKS: readonly Chunk[] = [
  { id: 'hello', text: 'Hello!', scene: '🙋😀' },
  { id: 'morning', text: 'Good morning!', scene: '🌅😃' },
  { id: 'night', text: 'Good night!', scene: '🌙😴' },
  { id: 'goodbye', text: 'Goodbye!', scene: '🚌👋' },
  { id: 'how-are-you', text: 'How are you?', scene: '🗣️❓😊' },
  { id: 'name', text: "What's your name?", scene: '🏷️❓' },
  { id: 'nice', text: 'Nice to meet you!', scene: '🤝🙂' },
  { id: 'thanks', text: 'Thank you!', scene: '🎁😊' },
  { id: 'please', text: 'Please.', scene: '🙏🍪' },
  { id: 'sorry', text: 'Sorry!', scene: '🙇😔' },
  { id: 'birthday', text: 'Happy birthday!', scene: '🎂🎉' },
  { id: 'luck', text: 'Good luck!', scene: '🍀🤞' },
  { id: 'sit', text: 'Sit down, please.', scene: '🪑⬇️' },
  { id: 'stand', text: 'Stand up, please.', scene: '🧍⬆️' },
  { id: 'open', text: 'Open your book.', scene: '📖👐' },
  { id: 'listen', text: 'Listen, please.', scene: '👂🔊' },
  { id: 'look', text: 'Look!', scene: '👀👉' },
  { id: 'help', text: 'Can you help me?', scene: '🆘🤲' },
  { id: 'hungry', text: "I'm hungry.", scene: '🍴😋' },
  { id: 'thirsty', text: "I'm thirsty.", scene: '🥵🥤' },
  { id: 'bathroom', text: 'Can I go to the bathroom?', scene: '🚻❓' },
  { id: 'play', text: "Let's play!", scene: '⚽🧒🧒' },
  { id: 'quiet', text: 'Be quiet, please.', scene: '🤫' },
  { id: 'wash', text: 'Wash your hands.', scene: '🧼🖐️' },
  { id: 'clap', text: 'Clap your hands!', scene: '👏🎶' },
]

// answer = the sensible reply; wrong = two replies that clearly don't answer the question.
export const QAS: readonly QA[] = [
  { id: 'age', question: 'How old are you?', answer: "I'm eight.", wrong: ["It's red.", 'I like apples.'] },
  { id: 'name', question: "What's your name?", answer: 'My name is Dan.', wrong: ["I'm eight.", "I'm fine."] },
  { id: 'how', question: 'How are you?', answer: "I'm fine, thank you.", wrong: ['My name is Dan.', "It's a cat."] },
  { id: 'color', question: 'What color is it?', answer: "It's red.", wrong: ["I'm eight.", "It's a cat."] },
  { id: 'like-pizza', question: 'Do you like pizza?', answer: 'Yes, I do.', wrong: ["It's blue.", "I'm eight."] },
  { id: 'thanks', question: 'Thank you!', answer: "You're welcome.", wrong: ["I'm eight.", 'Good night.'] },
  { id: 'morning', question: 'Good morning!', answer: 'Good morning!', wrong: ["I'm eight.", "It's red."] },
  { id: 'this', question: "What's this?", answer: "It's a cat.", wrong: ["I'm eight.", 'Good morning!'] },
  { id: 'birthday', question: 'Happy birthday!', answer: 'Thank you!', wrong: ["It's red.", 'I like apples.'] },
  { id: 'sorry', question: "I'm sorry.", answer: "That's OK.", wrong: ["I'm eight.", "It's red."] },
  { id: 'where', question: 'Where is the cat?', answer: "It's on the bed.", wrong: ["I'm eight.", 'I like apples.'] },
  { id: 'help', question: 'Can I help you?', answer: 'Yes, please.', wrong: ['My name is Dan.', "I'm eight."] },
  { id: 'hungry', question: 'Are you hungry?', answer: 'Yes, I am.', wrong: ["It's red.", 'My name is Dan.'] },
  { id: 'count', question: 'How many cats?', answer: 'Three cats.', wrong: ["It's red.", "I'm fine."] },
  { id: 'likes', question: 'What do you like?', answer: 'I like apples.', wrong: ["I'm eight.", 'Good night.'] },
]
