import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import avatarSarah from '@/assets/avatar-sarah.jpg';
import avatarJames from '@/assets/avatar-james.jpg';
import avatarPriya from '@/assets/avatar-priya.jpg';

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'Computer Science Student',
    avatar: avatarSarah,
    quote: 'The spaced repetition system really helped me retain complex algorithms and data structures for my technical interviews.',
    rating: 5,
  },
  {
    name: 'Jordan Martinez',
    role: 'Medical Student',
    avatar: avatarJames,
    quote: 'Being able to import my lecture notes and automatically generate flashcards saved me hours of study prep time each week.',
    rating: 5,
  },
  {
    name: 'Taylor Wilson',
    role: 'Law Student',
    avatar: avatarPriya,
    quote: 'The weak-spot analysis feature showed me exactly which legal concepts I needed to focus on before exams.',
    rating: 4,
  },
];

const ease: [number, number, number, number] = [0.65, 0.05, 0, 1];

const TestimonialsSection = () => {
  return (
    <section className="landing-section relative z-10 border-t border-border overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="text-center mb-20"
        >
          <p className="text-eyebrow mb-6">Testimonials</p>
          <h2 className="text-impact-lg text-foreground">
            TRUSTED BY<br />
            <span className="text-primary">HIGH-STAKES LEARNERS.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-[var(--gap)]">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease }}
              className="group relative"
            >
              <div className="absolute -inset-[1px] rounded-sm bg-gradient-to-b from-primary/40 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[1px]" />

              <div className="relative bg-card border border-border group-hover:border-primary/30 rounded-sm p-10 lg:p-12 flex flex-col justify-between min-h-[380px] transition-all duration-500">
                <div className="flex items-center gap-5 mb-8">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="relative"
                  >
                    <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-primary to-fuchsia-600 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="relative h-14 w-14 rounded-full object-cover"
                    />
                  </motion.div>
                  <div>
                    <p className="text-base font-black text-foreground">{t.name}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{t.role}</p>
                  </div>
                </div>

                <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium flex-1 italic">
                  "{t.quote}"
                </p>

                <div className="flex gap-1.5 mt-8">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.12 + j * 0.05 }}
                    >
                      <Star size={16} className="text-primary fill-primary" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground italic mt-8">
          * Placeholder testimonials for demonstration purposes
        </p>
      </div>
    </section>
  );
};

export default TestimonialsSection;
