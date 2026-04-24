import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'How is AuraMind different from regular flashcard apps?',
    a: 'AuraMind is built for high-stakes exam prep. It combines source-backed flashcards, weak-spot analysis, and adaptive review timing so you can focus on material you are actually at risk of forgetting.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Yes. Your study data is stored securely, we do not sell it, and you can export or delete your materials whenever you want. The product is designed as a private study workspace.',
  },
  {
    q: 'Who is AuraMind best for?',
    a: 'AuraMind is best for medical students, law students, and professional certification candidates who need to retain dense material under deadline pressure.',
  },
  {
    q: 'What kinds of content can I use?',
    a: 'You can use notes, PDFs, lecture slides, and plain text. AuraMind can turn that material into flashcards and study content with AI.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The free plan includes up to 500 active cards and access to the main study tools. Paid plans unlock more cards and more advanced features.',
  },
  {
    q: 'How long does it take to see results?',
    a: 'Most users can create a first deck and begin reviewing within minutes. Recall quality usually improves after several sessions once the review schedule starts adapting.',
  },
];

const ease: [number, number, number, number] = [0.65, 0.05, 0, 1];

const FAQSection = () => {
  return (
    <section className="landing-section relative z-10 border-t border-border">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="text-center mb-16"
        >
          <p className="text-eyebrow mb-6">FAQ</p>
          <h2 className="text-impact-md text-foreground">
            COMMON QUESTIONS.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-sm px-6 data-[state=open]:border-primary/30 transition-colors duration-300"
              >
                <AccordionTrigger className="text-sm font-bold text-foreground hover:text-primary py-5 [&[data-state=open]]:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
