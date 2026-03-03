const QUOTES: { text: string; author: string }[] = [
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Every 'no' brings you closer to a 'yes'.", author: "Mark Cuban" },
  { text: "Pipeline is vanity. Revenue is sanity.", author: "Sales Wisdom" },
  { text: "The fortune is in the follow-up.", author: "Jim Rohn" },
  { text: "Your network is your net worth.", author: "Porter Gale" },
  { text: "Don't sell the product. Sell the outcome.", author: "Unknown" },
  { text: "People don't buy what you do, they buy why you do it.", author: "Simon Sinek" },
  { text: "Hustle in silence. Let success make the noise.", author: "Unknown" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
  { text: "Sales is not about selling anymore. It's about building trust.", author: "Siva Devaki" },
  { text: "Be so good they can't ignore you.", author: "Steve Martin" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Stop selling. Start helping.", author: "Zig Ziglar" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Close deals, not doors.", author: "Sales Wisdom" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Your attitude determines your direction.", author: "Unknown" },
  { text: "Revenue solves all problems.", author: "Naval Ravikant" },
  { text: "Persistence beats resistance.", author: "Unknown" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Speed is the new currency of business.", author: "Marc Benioff" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
];

export function getDailyQuote(): { text: string; author: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}
