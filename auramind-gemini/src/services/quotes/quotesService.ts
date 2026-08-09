const QUOTES = [
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { content: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { content: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { content: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { content: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { content: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { content: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { content: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { content: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { content: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { content: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.", author: "Abigail Adams" },
  { content: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { content: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats" },
  { content: "The only source of knowledge is experience.", author: "Albert Einstein" },
  { content: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { content: "The more I read, the more I acquire, the more certain I am that I know nothing.", author: "Voltaire" },
  { content: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { content: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
  { content: "The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn.", author: "Alvin Toffler" },
];

export interface Quote {
  _id: string;
  content: string;
  author: string;
  authorSlug: string;
  length: number;
  tags: string[];
}

class QuotesService {
  async getRandomQuote(): Promise<Quote | null> {
    try {
      const randomIndex = Math.floor(Math.random() * QUOTES.length);
      const quote = QUOTES[randomIndex];
      // eslint-disable-next-line no-console -- legacy debug output
      console.log('Selected quote:', quote);
      
      return {
        _id: randomIndex.toString(),
        content: quote.content,
        author: quote.author,
        authorSlug: quote.author.toLowerCase().replace(/\s+/g, '-'),
        length: quote.content.length,
        tags: ['inspiration', 'learning', 'education'],
      };
    } catch (error) {
      console.error('Error fetching random quote:', error);
      return null;
    }
  }

  async getQuoteByTag(_tag: string): Promise<Quote | null> {
    return this.getRandomQuote();
  }

  async getQuoteOfTheDay(): Promise<Quote | null> {
    const daysSinceEpoch = Math.floor(Date.now() / 86400000);
    const index = daysSinceEpoch % QUOTES.length;
    const quote = QUOTES[index];
    return {
      _id: index.toString(),
      content: quote.content,
      author: quote.author,
      authorSlug: quote.author.toLowerCase().replace(/\s+/g, '-'),
      length: quote.content.length,
      tags: ['inspiration', 'learning', 'education'],
    };
  }
}

export const quotesService = new QuotesService();



