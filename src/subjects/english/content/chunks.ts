import type { Chunk, QA } from '../types'

// Each scene shows one situation and fits only its own chunk.
export const CHUNKS: readonly Chunk[] = [
  { id: 'hello', text: 'Hello!', scene: '👋😀' },
  { id: 'morning', text: 'Good morning!', scene: '🌅😃' },
  { id: 'night', text: 'Good night!', scene: '🌙😴' },
  { id: 'goodbye', text: 'Goodbye!', scene: '🚌👋' },
  { id: 'how-are-you', text: 'How are you?', scene: '🗣️❓😊' },
  { id: 'name', text: "What's your name?", scene: '🏷️❓' },
  { id: 'nice', text: 'Nice to meet you!', scene: '🤝🙂' },
  { id: 'thanks', text: 'Thank you!', scene: '🙏😊' },
  { id: 'please', text: 'Please.', scene: '🥺🍪' },
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
  { id: 'name', question: "What's your name?", answer: 'My name is Dan.', wrong: ["I'm eight.", 'Yes, I do.'] },
  { id: 'how', question: 'How are you?', answer: "I'm fine, thank you.", wrong: ['My name is Dan.', "It's a cat."] },
  { id: 'color', question: 'What color is it?', answer: "It's red.", wrong: ["I'm eight.", 'Good night.'] },
  { id: 'like-pizza', question: 'Do you like pizza?', answer: 'Yes, I do.', wrong: ["It's blue.", 'Three cats.'] },
  { id: 'thanks', question: 'Thank you!', answer: "You're welcome.", wrong: ['I like apples.', 'Good night.'] },
  { id: 'morning', question: 'Good morning!', answer: 'Good morning!', wrong: ['Yes, please.', "It's blue."] },
  { id: 'this', question: "What's this?", answer: "It's a cat.", wrong: ['Yes, I do.', "I'm fine, thank you."] },
  { id: 'birthday', question: 'Happy birthday!', answer: 'Thank you!', wrong: ["It's red.", 'My name is Dan.'] },
  { id: 'sorry', question: "I'm sorry.", answer: "That's OK.", wrong: ['Three cats.', 'Yes, please.'] },
  { id: 'where', question: 'Where is the cat?', answer: "It's on the bed.", wrong: ["I'm fine, thank you.", "It's blue."] },
  { id: 'help', question: 'Can I help you?', answer: 'Yes, please.', wrong: ["It's a cat.", 'Good night.'] },
  { id: 'hungry', question: 'Are you hungry?', answer: 'Yes, I am.', wrong: ['Good morning!', "It's green."] },
  { id: 'count', question: 'How many cats?', answer: 'Three cats.', wrong: ["It's green.", 'Good morning!'] },
  { id: 'likes', question: 'What do you like?', answer: 'I like apples.', wrong: ['Yes, I am.', "It's green."] },
]
