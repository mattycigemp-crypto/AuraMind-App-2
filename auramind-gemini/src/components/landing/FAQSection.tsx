import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon as ChevronDown } from '../../components/icons/CustomIcons';

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: 'Is it really free?',
    a: 'Yes — the free plan includes unlimited AI-generated flashcards from notes and PDFs, FSRS adaptive reviews, and retention tracking. Paid plans unlock advanced AI features like the assistant and priority generation.',
  },
  {
    q: 'How does the AI generate flashcards?',
    a: 'Upload your notes, PDF, or lecture recording. Our AI extracts key concepts and generates question-answer pairs that link back to the source material. You review and edit before studying.',
  },
  {
    q: 'What is FSRS and why does it matter?',
    a: 'FSRS (Free Spaced Repetition Scheduler) is the ML algorithm that models your personal forgetting curve. Unlike older methods, it adapts to your memory so you review cards at the optimal moment — up to 30% fewer reviews with higher retention.',
  },
  {
    q: 'Can I import my Anki decks?',
    a: 'Yes — you can import .apkg files directly. Your cards, scheduling, and tags come over intact. We also support CSV and JSON imports.',
  },
  {
    q: 'Is my data private?',
    a: 'Your study data is encrypted at rest and in transit. We never train AI models on your content. You can export or delete your data at any time.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'PDF, Markdown, plain text, images (PNG/JPG), and audio (MP3/WAV). We extract content from PDFs and images to generate flashcards automatically.',
  },
];

interface FAQCardProps {
  faq: FAQItem;
  index: number;
  openIndex: number | null;
  toggle: (i: number) => void;
}

const FAQCard: React.FC<FAQCardProps> = ({ faq, index, openIndex, toggle }) => {
  const isOpen = openIndex === index;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      viewport={{ once: true }}
      className="border-b border-zinc-800 last:border-b-0"
    >
      <button
        onClick={() => toggle(index)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-foreground transition-colors pr-4">
          {faq.q}
        </span>
        <ChevronDown
          size={18}
          className={`text-zinc-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <p className="text-zinc-400 pb-6 leading-relaxed max-w-2xl">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className={`py-24 md:py-32 relative ${className}`}>
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4 block">
            Questions?
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">
            <span className="text-zinc-500">YOU ASK</span>
            <br />
            <span className="text-primary">WE ANSWER</span>
          </h2>
        </motion.div>

        <div className="border-t border-zinc-800">
          {faqs.map((faq, i) => (
            <FAQCard key={i} faq={faq} index={i} openIndex={openIndex} toggle={toggle} />
          ))}
        </div>
      </div>
    </section>
  );
};

export { FAQSection };
export default FAQSection;



