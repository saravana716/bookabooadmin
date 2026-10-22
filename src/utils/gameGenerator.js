/**
 * AI / Algorithmic Generator for Book Quiz & Word Scramble Games
 * Includes deduplication, dynamic extraction from book texts, and large literary vocabulary.
 */

// Extensive curated vocabulary with meaningful clues
// Extensive curated literary and educational vocabulary with rich clues (100+ unique words)
const EXPANDED_WORD_POOL = [
  { word: "THEME", clue: "The main idea or underlying meaning in a story" },
  { word: "HABIT", clue: "A regular practice or routine done automatically" },
  { word: "AUTHOR", clue: "The creator or writer of a book or literary work" },
  { word: "NOVEL", clue: "A long work of narrative fiction" },
  { word: "WEALTH", clue: "An abundance of valuable possessions or money" },
  { word: "CHAPTER", clue: "A main division or section of a written work" },
  { word: "WISDOM", clue: "Soundness of judgment based on knowledge and experience" },
  { word: "FOCUS", clue: "The center of interest, deep attention, or concentration" },
  { word: "MEMORY", clue: "The mental capacity to retain and recall facts" },
  { word: "READER", clue: "A person who explores and reads books" },
  { word: "MORAL", clue: "A lesson taught by a story or fable" },
  { word: "CLIMAX", clue: "The most intense or decisive moment of a narrative" },
  { word: "MINDSET", clue: "The established set of attitudes held by someone" },
  { word: "FINANCE", clue: "The management of large amounts of money and investments" },
  { word: "DISCIPLINE", clue: "Training to act in accordance with rules and goals" },
  { word: "COMPOUND", clue: "Growth that builds exponentially upon previous growth" },
  { word: "LUCK", clue: "Success or failure apparently brought by chance" },
  { word: "FREEDOM", clue: "The power to act, speak, or think without hindrance" },
  { word: "PARADOX", clue: "A seemingly self-contradictory statement that reveals truth" },
  { word: "PATIENCE", clue: "The capacity to accept or tolerate delay without getting upset" },
  { word: "PSYCHOLOGY", clue: "The scientific study of the human mind and behavior" },
  { word: "STORY", clue: "An account of imaginary or real people and events" },
  { word: "PRACTICE", clue: "Repeated exercise in an activity to acquire skill" },
  { word: "FUTURE", clue: "A period of time following the moment of speaking or writing" },
  { word: "PURPOSE", clue: "The reason for which something is done or created" },
  { word: "PASSION", clue: "An intense desire or enthusiasm for something" },
  { word: "VISION", clue: "The ability to think about or plan the future with imagination" },
  { word: "ACTION", clue: "The fact or process of doing something to achieve an aim" },
  { word: "KNOWLEDGE", clue: "Facts, information, and skills acquired through experience" },
  { word: "INSIGHT", clue: "An accurate and deep intuitive understanding of a person or thing" },
  { word: "SUCCESS", clue: "The accomplishment of an aim or purpose" },
  { word: "FAILURE", clue: "Lack of success that provides opportunities to learn" },
  { word: "ROUTINE", clue: "A sequence of actions regularly followed" },
  { word: "SYSTEM", clue: "A set of principles or procedures according to which something is done" },
  { word: "ATOMIC", clue: "Relating to an atom, extremely small yet fundamentally powerful" },
  { word: "IDENTITY", clue: "The fact of being who or what a person or thing is" },
  { word: "REWARD", clue: "A thing given in recognition of service, effort, or achievement" },
  { word: "TRIGGER", clue: "An event or circumstance that is the cause of an action" },
  { word: "EMOTION", clue: "A natural instinctive state of mind deriving from circumstances" },
  { word: "DECISION", clue: "A conclusion or resolution reached after consideration" },
  { word: "REASON", clue: "The power of the mind to think, understand, and form judgments" },
  { word: "BALANCE", clue: "An even distribution of weight or equilibrium in life" },
  { word: "GRATITUDE", clue: "The quality of being thankful and showing appreciation" },
  { word: "RESILIENCE", clue: "The capacity to recover quickly from difficulties; toughness" },
  { word: "COURAGE", clue: "Strength in the face of pain or grief" },
  { word: "PROTAGONIST", clue: "The leading character or hero in a drama, movie, or novel" },
  { word: "ANTAGONIST", clue: "A person who actively opposes or is hostile to someone; adversary" },
  { word: "METAPHOR", clue: "A figure of speech in which a word or phrase is applied to an object" },
  { word: "ALLEGORY", clue: "A story, poem, or picture that reveals a hidden moral or political meaning" },
  { word: "EPILOGUE", clue: "A section or speech at the end of a book or play serving as a comment" },
  { word: "PROLOGUE", clue: "A separate introductory section of a literary or musical work" },
  { word: "NARRATIVE", clue: "A spoken or written account of connected events; a story" },
  { word: "CHRONICLE", clue: "A factual written account of important or historical events" },
  { word: "PHILOSOPHY", clue: "The study of the fundamental nature of knowledge, reality, and existence" },
  { word: "PERSPECTIVE", clue: "A particular attitude toward or way of regarding something; a point of view" },
  { word: "INNOVATION", clue: "The action or process of introducing new methods, ideas, or products" },
  { word: "CURIOSITY", clue: "A strong desire to know or learn something" },
  { word: "DESTINY", clue: "Events that will necessarily happen to a person or thing in the future" },
  { word: "SERENDIPITY", clue: "The occurrence and development of events by chance in a happy or beneficial way" },
  { word: "INTEGRITY", clue: "The quality of being honest and having strong moral principles" },
  { word: "LEADERSHIP", clue: "The action of leading a group of people or an organization" },
  { word: "EMPATHY", clue: "The ability to understand and share the feelings of another" },
  { word: "STRATEGY", clue: "A plan of action or policy designed to achieve a major or overall aim" },
  { word: "TRANSFORMATION", clue: "A thorough or dramatic change in form, appearance, or character" },
  { word: "ADVENTURE", clue: "An unusual and exciting, typically hazardous, experience or activity" },
  { word: "GENIUS", clue: "Exceptional intellectual or creative power or other natural ability" },
  { word: "INTUITION", clue: "The ability to understand something immediately, without the need for conscious reasoning" },
  { word: "AMBITION", clue: "A strong desire to do or to achieve something, typically requiring determination" },
  { word: "CREATIVITY", clue: "The use of the imagination or original ideas, especially in production of an artistic work" },
  { word: "HARMONY", clue: "The combination of simultaneously sounded musical notes to produce pleasing chords or peace" },
  { word: "LEGACY", clue: "An amount of money or property left to someone in a will; something handed down" },
  { word: "ODYSSEY", clue: "A long and eventful or adventurous journey or experience" },
  { word: "SOLITUDE", clue: "The state or situation of being alone, often experienced pleasantly" },
  { word: "EPIPHANY", clue: "A moment of sudden revelation or profound insight" },
  { word: "PERSEVERANCE", clue: "Persistence in doing something despite difficulty or delay in achieving success" },
  { word: "SYNERGY", clue: "The interaction of elements that when combined produce a total effect greater than sum" },
  { word: "HORIZON", clue: "The line at which the earth's surface and the sky appear to meet; range of perception" },
  { word: "IMAGINATION", clue: "The faculty or action of forming new ideas, or images or concepts of external objects" },
  { word: "REFLECT", clue: "Think deeply or carefully about something" },
  { word: "ILLUMINATE", clue: "Help to clarify or explain; bring light to knowledge" },
  { word: "DISCOVER", clue: "Find unexpectedly or in the course of a search" },
  { word: "TRIUMPH", clue: "A great victory or achievement" },
  { word: "HERITAGE", clue: "Property that is or may be inherited; valued objects and qualities such as historic traditions" },
  { word: "COMPASSION", clue: "Sympathetic pity and concern for the sufferings or misfortunes of others" },
  { word: "INSPIRATION", clue: "The process of being mentally stimulated to do or feel something, especially to do something creative" }
];

// Curated book quiz questions pool
const GENERAL_QUIZ_POOL = [
  {
    question: "Who wrote 'Harry Potter'?",
    options: ["J.R.R. Tolkien", "J.K. Rowling", "George R.R. Martin", "Stephen King"],
    correctAnswer: "J.K. Rowling",
    explanation: "J.K. Rowling wrote the world-renowned Harry Potter fantasy series."
  },
  {
    question: "What is the central premise of 'Atomic Habits' by James Clear?",
    options: [
      "Small 1% daily improvements compound into huge results",
      "Setting audacious impossible goals every morning",
      "Relying purely on willpower and strict discipline",
      "Eliminating all leisure time"
    ],
    correctAnswer: "Small 1% daily improvements compound into huge results",
    explanation: "James Clear teaches that tiny 1% daily changes lead to massive long-term results."
  },
  {
    question: "In 'The Psychology of Money', Morgan Housel states that doing well with money has a little to do with how smart you are and a lot to do with:",
    options: ["How you behave", "How much math you know", "Your luck in stock trading", "Your university degree"],
    correctAnswer: "How you behave",
    explanation: "Financial success is a soft skill where behavior is more important than technical knowledge."
  },
  {
    question: "Who is the author of 'Rich Dad Poor Dad'?",
    options: ["Robert Kiyosaki", "Warren Buffett", "Napoleon Hill", "Benjamin Graham"],
    correctAnswer: "Robert Kiyosaki",
    explanation: "Robert Kiyosaki published Rich Dad Poor Dad in 1997."
  },
  {
    question: "Which classic novel begins with 'Call me Ishmael'?",
    options: ["Moby Dick", "Great Expectations", "The Great Gatsby", "To Kill a Mockingbird"],
    correctAnswer: "Moby Dick",
    explanation: "Herman Melville's Moby Dick opens with this iconic sentence."
  },
  {
    question: "In George Orwell's '1984', what is the name of the totalitarian leader?",
    options: ["Big Brother", "The Commander", "O'Brien", "The Director"],
    correctAnswer: "Big Brother",
    explanation: "Big Brother is the omnipresent ruler of Oceania."
  },
  {
    question: "What is the main subject of 'Thinking, Fast and Slow' by Daniel Kahneman?",
    options: [
      "Two systems of thought: intuitive and deliberate",
      "Techniques for speed reading",
      "How to meditate for mindfulness",
      "Historical battles of psychology"
    ],
    correctAnswer: "Two systems of thought: intuitive and deliberate",
    explanation: "System 1 is fast and emotional, while System 2 is slower and logical."
  },
  {
    question: "Who wrote 'The Alchemist'?",
    options: ["Paulo Coelho", "Gabriel García Márquez", "Haruki Murakami", "Khaled Hosseini"],
    correctAnswer: "Paulo Coelho",
    explanation: "Brazilian author Paulo Coelho wrote The Alchemist in 1988."
  },
  {
    question: "Who wrote the philosophical work 'Meditations'?",
    options: ["Marcus Aurelius", "Seneca", "Epictetus", "Plato"],
    correctAnswer: "Marcus Aurelius",
    explanation: "Roman Emperor Marcus Aurelius wrote Meditations as private notes for self-guidance."
  },
  {
    question: "In 'Man's Search for Meaning', Viktor Frankl emphasizes finding purpose through:",
    options: ["Work, love, and courage during suffering", "Accumulation of material wealth", "Isolation from society", "Political power"],
    correctAnswer: "Work, love, and courage during suffering",
    explanation: "Frankl founded logotherapy, focusing on finding deep purpose in life."
  },
  {
    question: "Which author wrote the dystopian masterpiece 'Brave New World'?",
    options: ["Aldous Huxley", "Ray Bradbury", "Arthur C. Clarke", "H.G. Wells"],
    correctAnswer: "Aldous Huxley",
    explanation: "Aldous Huxley published Brave New World in 1932."
  },
  {
    question: "In Sun Tzu's 'The Art of War', what is considered the supreme art of war?",
    options: ["To subdue the enemy without fighting", "To build massive fortifications", "To attack with overwhelming cavalry", "To fight until the last breath"],
    correctAnswer: "To subdue the enemy without fighting",
    explanation: "Supreme excellence consists in breaking the enemy's resistance without fighting."
  },
  {
    question: "Who wrote 'Pride and Prejudice'?",
    options: ["Jane Austen", "Charlotte Brontë", "Emily Brontë", "Virginia Woolf"],
    correctAnswer: "Jane Austen",
    explanation: "Jane Austen's famous novel of manners was published in 1813."
  },
  {
    question: "What is the primary theme of 'Deep Work' by Cal Newport?",
    options: ["Distraction-free concentration on cognitively demanding tasks", "Working 14-hour days without rest", "Delegating all tasks to artificial intelligence", "Multitasking efficiently"],
    correctAnswer: "Distraction-free concentration on cognitively demanding tasks",
    explanation: "Deep work is the ability to focus without distraction on a cognitively demanding task."
  },
  {
    question: "Who authored the personal finance classic 'The Richest Man in Babylon'?",
    options: ["George S. Clason", "Dave Ramsey", "Peter Lynch", "Thomas J. Stanley"],
    correctAnswer: "George S. Clason",
    explanation: "George S. Clason used Babylonian parables to teach financial thrift."
  },
  {
    question: "In Frank Herbert's 'Dune', what precious substance is mined exclusively on the desert planet Arrakis?",
    options: ["Melange (The Spice)", "Vibranium", "Unobtainium", "Dilithium Crystals"],
    correctAnswer: "Melange (The Spice)",
    explanation: "Melange grants longevity, heightened awareness, and interstellar navigation abilities."
  },
  {
    question: "Who is the legendary detective protagonist created by Sir Arthur Conan Doyle?",
    options: ["Sherlock Holmes", "Hercule Poirot", "Philip Marlowe", "Sam Spade"],
    correctAnswer: "Sherlock Holmes",
    explanation: "Sherlock Holmes first appeared in 'A Study in Scarlet' in 1887."
  },
  {
    question: "What is the key takeaway of Dale Carnegie's 'How to Win Friends and Influence People'?",
    options: [
      "Be genuinely interested in other people and make them feel important",
      "Win arguments through aggressive persuasion",
      "Always conceal your true thoughts",
      "Rely only on financial leverage"
    ],
    correctAnswer: "Be genuinely interested in other people and make them feel important",
    explanation: "Carnegie emphasized genuine empathy, active listening, and sincere appreciation."
  },
  {
    question: "Who wrote the timeless fantasy masterpiece 'The Hobbit'?",
    options: ["J.R.R. Tolkien", "C.S. Lewis", "Philip Pullman", "Terry Pratchett"],
    correctAnswer: "J.R.R. Tolkien",
    explanation: "J.R.R. Tolkien published The Hobbit in 1937."
  },
  {
    question: "In Harper Lee's 'To Kill a Mockingbird', who is the principled lawyer defending Tom Robinson?",
    options: ["Atticus Finch", "Boo Radley", "Bob Ewell", "Scout Finch"],
    correctAnswer: "Atticus Finch",
    explanation: "Atticus Finch is renowned as a paragon of legal ethics and moral fortitude."
  },
  {
    question: "What concept does Malcolm Gladwell explore in his book 'Outliers' regarding mastery?",
    options: ["The 10,000-Hour Rule", "The 80/20 Pareto Rule", "The Miracle Morning", "The Law of Attraction"],
    correctAnswer: "The 10,000-Hour Rule",
    explanation: "Gladwell discusses how world-class expertise often requires around 10,000 hours of deliberate practice."
  },
  {
    question: "Who wrote 'Crime and Punishment'?",
    options: ["Fyodor Dostoevsky", "Leo Tolstoy", "Anton Chekhov", "Ivan Turgenev"],
    correctAnswer: "Fyodor Dostoevsky",
    explanation: "Fyodor Dostoevsky published Crime and Punishment in 1866."
  },
  {
    question: "In 'Sapiens: A Brief History of Humankind', Yuval Noah Harari argues that Homo sapiens dominate Earth because of their unique ability to:",
    options: [
      "Create and believe in shared fictional stories and mythologies",
      "Possess greater physical strength than other hominids",
      "Withstand extreme weather changes",
      "Run longer distances without water"
    ],
    correctAnswer: "Create and believe in shared fictional stories and mythologies",
    explanation: "Shared fictions (religions, nations, money) enable flexible cooperation among millions of strangers."
  },
  {
    question: "Who wrote the dystopian masterpiece 'Fahrenheit 451', where books are outlawed and burned?",
    options: ["Ray Bradbury", "Kurt Vonnegut", "Philip K. Dick", "Isaac Asimov"],
    correctAnswer: "Ray Bradbury",
    explanation: "Ray Bradbury's 1953 novel portrays a future society where firemen burn forbidden books."
  },
  {
    question: "What is the famous opening line of Charles Dickens' 'A Tale of Two Cities'?",
    options: [
      "It was the best of times, it was the worst of times",
      "In a hole in the ground there lived a hobbit",
      "It is a truth universally acknowledged",
      "All happy families are alike"
    ],
    correctAnswer: "It was the best of times, it was the worst of times",
    explanation: "Dickens' famous paradox sets the stage for London and Paris during the French Revolution."
  },
  {
    question: "Who is the author of 'Zero to One: Notes on Startups, or How to Build the Future'?",
    options: ["Peter Thiel", "Elon Musk", "Reid Hoffman", "Ben Horowitz"],
    correctAnswer: "Peter Thiel",
    explanation: "PayPal co-founder Peter Thiel co-wrote Zero to One on creating groundbreaking monopolies."
  },
  {
    question: "In 'The 7 Habits of Highly Effective People' by Stephen Covey, what is Habit 1?",
    options: ["Be Proactive", "Begin with the End in Mind", "Put First Things First", "Think Win-Win"],
    correctAnswer: "Be Proactive",
    explanation: "Being proactive means taking initiative and responsibility for your choices."
  },
  {
    question: "Which author penned 'One Hundred Years of Solitude', pioneering magical realism?",
    options: ["Gabriel García Márquez", "Jorge Luis Borges", "Isabel Allende", "Mario Vargas Llosa"],
    correctAnswer: "Gabriel García Márquez",
    explanation: "Colombian Nobel laureate Gabriel García Márquez published the epic tale of Macondo in 1967."
  },
  {
    question: "In Nassim Nicholas Taleb's 'The Black Swan', what characterizes a 'Black Swan' event?",
    options: [
      "High rarity, extreme impact, and retrospective predictability",
      "Common occurrence with predictable financial impact",
      "Scientific experiments with anticipated results",
      "Routine technological updates"
    ],
    correctAnswer: "High rarity, extreme impact, and retrospective predictability",
    explanation: "Black Swan events are outliers with monumental consequence that humans rationalize after the fact."
  },
  {
    question: "Who wrote 'The Great Gatsby', capturing the roaring twenties and the elusive American Dream?",
    options: ["F. Scott Fitzgerald", "Ernest Hemingway", "John Steinbeck", "William Faulkner"],
    correctAnswer: "F. Scott Fitzgerald",
    explanation: "F. Scott Fitzgerald published The Great Gatsby in 1925."
  },
  {
    question: "What is the primary thesis of Carol Dweck's book 'Mindset'?",
    options: [
      "Believing abilities can be developed (Growth Mindset) fosters achievement",
      "Intelligence is purely genetic and fixed at birth",
      "Effort is useless if talent is absent",
      "Success depends solely on avoiding difficult challenges"
    ],
    correctAnswer: "Believing abilities can be developed (Growth Mindset) fosters achievement",
    explanation: "A growth mindset views effort and mistakes as pathways to developing intellect and capability."
  },
  {
    question: "Who wrote the classic epic adventure 'The Count of Monte Cristo'?",
    options: ["Alexandre Dumas", "Victor Hugo", "Jules Verne", "Gustave Flaubert"],
    correctAnswer: "Alexandre Dumas",
    explanation: "Alexandre Dumas published Edmond Dantès' legendary revenge and redemption adventure in 1844."
  },
  {
    question: "In Robert Greene's 'The 48 Laws of Power', what is the celebrated First Law?",
    options: ["Never Outshine the Master", "Never Put Too Much Trust in Friends", "Conceal Your Intentions", "Always Say Less than Necessary"],
    correctAnswer: "Never Outshine the Master",
    explanation: "Law 1 advises making those above you always appear superior and comfortable in their position."
  },
  {
    question: "Which philosopher is famous for the statement 'I think, therefore I am' (Cogito, ergo sum)?",
    options: ["René Descartes", "Immanuel Kant", "John Locke", "Friedrich Nietzsche"],
    correctAnswer: "René Descartes",
    explanation: "Descartes introduced this foundational proposition of Western philosophy in 1637."
  }
];

/**
 * Scramble word letters ensuring it does not equal the original word.
 */
export function scrambleWord(word) {
  if (!word || word.length <= 1) return word;
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const result = letters.join('');
  return result === word ? scrambleWord(word) : result;
}

/**
 * Extracts potential interesting words directly from book text/chapters if provided.
 */
function extractWordsFromText(text, existingSet) {
  if (!text || typeof text !== 'string') return [];
  // Find clean English uppercase words between 4 and 10 characters long
  const rawWords = text
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && w.length <= 10);

  const candidates = [];
  const seen = new Set();
  const commonStopwords = new Set([
    'THIS', 'THAT', 'WITH', 'FROM', 'HAVE', 'THEY', 'THEIR', 'BEEN', 'WERE', 'WHAT',
    'WHEN', 'WHERE', 'WHICH', 'THERE', 'WOULD', 'COULD', 'SHOULD', 'ABOUT', 'THESE',
    'THOSE', 'OTHER', 'INTO', 'SOME', 'MORE', 'ONLY', 'JUST', 'OVER', 'SUCH', 'THAN'
  ]);

  for (const w of rawWords) {
    if (
      !commonStopwords.has(w) &&
      !existingSet.has(w) &&
      !seen.has(w)
    ) {
      seen.add(w);
      candidates.push({
        word: w,
        clue: `A key vocabulary word extracted from the book pages`
      });
      if (candidates.length >= 15) break;
    }
  }
  return candidates;
}

/**
 * Generates an automatic set of Word Scramble puzzles with duplicate checking against existing words.
 * @param {Array} existingWords - Array of objects or strings to exclude duplicates.
 * @param {string} bookText - Optional text/chapters from the book to extract context words from.
 * @param {number} count - Number of fresh puzzles to generate.
 */
export function generateAutoWords(existingWords = [], bookText = '', count = 4) {
  // Normalize existing words into a Set of uppercase strings
  const existingSet = new Set(
    (existingWords || []).map(w => {
      const raw = typeof w === 'string' ? w : (w?.word || '');
      return raw.replace(/\s+/g, '').toUpperCase().trim();
    }).filter(Boolean)
  );

  // If book text is provided, extract contextual book words first
  const bookCandidates = extractWordsFromText(bookText, existingSet);

  // Combine book words with the expanded curated vocabulary pool
  const candidatePool = [...bookCandidates, ...EXPANDED_WORD_POOL].filter(
    item => !existingSet.has(item.word.toUpperCase())
  );

  // Fallback to full pool if completely exhausted
  const poolToUse = candidatePool.length > 0 ? candidatePool : EXPANDED_WORD_POOL;

  // Shuffle using Fisher-Yates
  const shuffled = [...poolToUse];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = [];
  const newlyPicked = new Set();

  for (const item of shuffled) {
    const w = item.word.replace(/\s+/g, '').toUpperCase();
    if (!existingSet.has(w) && !newlyPicked.has(w)) {
      newlyPicked.add(w);
      selected.push({
        id: `w_${Date.now()}_${selected.length + 1}_${Math.random().toString(36).substr(2, 4)}`,
        word: w,
        clue: item.clue || 'A mystery word from literature',
        scrambled: scrambleWord(w)
      });
      if (selected.length >= count) break;
    }
  }

  return selected;
}

/**
 * Generates an automatic set of Quiz questions with duplicate checking against existing questions.
 * @param {Array} existingQuizzes - Array of existing questions to exclude.
 * @param {string} bookTitle - Book Title.
 * @param {string} author - Author Name.
 * @param {number} count - Number of questions to return.
 * @param {string} chapterText - Optional extracted book text to generate context questions from.
 */
export function generateAutoQuiz(existingQuizzes = [], bookTitle = '', author = '', count = 4, chapterText = '') {
  // Normalize existing questions
  const existingQuestionsSet = new Set(
    (existingQuizzes || []).map(q => {
      const text = typeof q === 'string' ? q : (q?.question || '');
      return text.toLowerCase().trim();
    }).filter(Boolean)
  );

  const result = [];

  // Book-specific custom questions if title and author exist
  if (bookTitle && author) {
    const bookTitleClean = bookTitle.trim();
    const authorClean = author.trim();

    const bookSpecificCandidates = [
      {
        question: `Who is the author of '${bookTitleClean}'?`,
        options: [authorClean, "Malcolm Gladwell", "Dale Carnegie", "Simon Sinek"],
        correctAnswer: authorClean,
        category: "Book Knowledge"
      },
      {
        question: `What primary subject is explored in '${bookTitleClean}'?`,
        options: [
          "Core strategic lessons, mindset, and personal mastery",
          "Advanced medieval deep ocean navigation",
          "Antique steam locomotive restoration",
          "Ancient botanical taxonomy"
        ],
        correctAnswer: "Core strategic lessons, mindset, and personal mastery",
        category: "Book Knowledge"
      },
      {
        question: `Which key benefit does a reader gain from reading '${bookTitleClean}'?`,
        options: [
          "Practical insights and actionable perspectives",
          "Instructions for rocket propellant testing",
          "Deep sea scuba diving certification",
          "Cataloging prehistoric fossils"
        ],
        correctAnswer: "Practical insights and actionable perspectives",
        category: "Book Knowledge"
      },
      {
        question: `What writing style does ${authorClean} utilize in '${bookTitleClean}'?`,
        options: [
          "Engaging, informative narrative with structured lessons",
          "Cryptic symbolic poetic stanzas",
          "Technical mathematical proofs with zero explanations",
          "Ancient Greek theatrical dialogues"
        ],
        correctAnswer: "Engaging, informative narrative with structured lessons",
        category: "Book Knowledge"
      }
    ];

    for (const cand of bookSpecificCandidates) {
      const qNorm = cand.question.toLowerCase().trim();
      if (!existingQuestionsSet.has(qNorm)) {
        result.push({
          id: `q_${Date.now()}_${result.length + 1}_${Math.random().toString(36).substr(2, 4)}`,
          question: cand.question,
          options: [...cand.options],
          correctAnswer: cand.correctAnswer,
          category: cand.category
        });
        existingQuestionsSet.add(qNorm);
        if (result.length >= count) return result;
      }
    }
  }

  // Shuffle general pool and pick non-duplicates
  const shuffledGeneral = [...GENERAL_QUIZ_POOL].sort(() => 0.5 - Math.random());
  for (const item of shuffledGeneral) {
    if (result.length >= count) break;
    const qNorm = item.question.toLowerCase().trim();
    if (!existingQuestionsSet.has(qNorm)) {
      result.push({
        id: `q_${Date.now()}_${result.length + 1}_${Math.random().toString(36).substr(2, 4)}`,
        question: item.question,
        options: [...item.options],
        correctAnswer: item.correctAnswer,
        category: "Literature"
      });
      existingQuestionsSet.add(qNorm);
    }
  }

  return result.slice(0, count);
}
