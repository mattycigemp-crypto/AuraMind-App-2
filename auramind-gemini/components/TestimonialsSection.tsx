import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import avatarSarah from '@/assets/avatar-sarah.jpg';
import avatarJames from '@/assets/avatar-james.jpg';
import avatarPriya from '@/assets/avatar-priya.jpg';

const testimonials = [
  {
    name: 'Sarah Kim',
    role: 'Med Student, Johns Hopkins',
    avatar: avatarSarah,
    quote: 'I went from barely passing pharmacology to scoring in the top 10%. The spaced repetition actually adapts — it\'s not just another flashcard app.',
    rating: 5,
  },
  {
    name: 'James Okafor',
    role: 'Software Engineer',
    avatar: avatarJames,
    quote: 'Learning new frameworks used to mean forgetting the last one. Now I actually retain concepts across stacks. Worth every minute.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Language Learner',
    avatar: avatarPriya,
    quote: 'I\'m learning Mandarin and the decay curve visualization helped me understand why I kept forgetting tones. Three months in and I can hold real conversations.',
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
            <span className="text-primary">BRILLIANT MINDS.</span>
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
                {/* Avatar & Info */}
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

                {/* Quote */}
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium flex-1 italic">
                  "{t.quote}"
                </p>

                {/* Rating */}
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
      </div>
    </section>
  );
};

export default TestimonialsSection;
