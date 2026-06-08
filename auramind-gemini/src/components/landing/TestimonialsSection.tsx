import { motion } from 'framer-motion';
import { StarIcon as Star, QuoteIcon as Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Medical Student',
    avatar: 'SC',
    content: 'I cut my study time by 40% while actually improving my exam scores. The AI-generated flashcards from my lecture notes save me hours every week. This is the future of studying.',
  },
  {
    name: 'Marcus Johnson',
    role: 'CS Graduate',
    avatar: 'MJ',
    content: 'FSRS scheduling alone is worth it. I used to spend 2 hours on Anki reviews daily — now I\'m done in 45 minutes with better retention. The weak-spot detection caught gaps I didn\'t know I had.',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Pre-Law Student',
    avatar: 'ER',
    content: 'The AI assistant explains concepts I\'m stuck on in seconds. Combined with the adaptive review, I went from Bs to straight As in one semester. I tell everyone in my study group to switch.',
  },
];

const starCount = 5;

const TestimonialsSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <section className={`py-24 md:py-32 relative ${className}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-24"
        >
          <span className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4 block">
            Social Proof
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">
            LOVED BY
            <br />
            <span className="text-zinc-500">STUDENTS</span>
            <span className="text-primary"> WORLDWIDE</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full p-6 md:p-8 border-2 border-zinc-800 bg-zinc-900/80 group-hover:border-zinc-700 transition-colors duration-300 flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: starCount }).map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>

                <div className="mb-4 text-zinc-400">
                  <Quote size={20} className="text-primary/40 mb-2" />
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed flex-1">
                  "{t.content}"
                </p>

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-zinc-800">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-zinc-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { TestimonialsSection };
export default TestimonialsSection;



