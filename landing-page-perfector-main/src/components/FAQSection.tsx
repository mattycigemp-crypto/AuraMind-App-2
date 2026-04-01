import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'How does AuraMind differ from regular flashcard apps?',
    a: 'AuraMind uses adaptive neural decay models that learn your personal forgetting curve — not a one-size-fits-all schedule. The system continuously recalibrates review timing based on your real-time performance, not static intervals.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'All data is end-to-end encrypted and stored on SOC 2 compliant infrastructure. We never sell user data or use it to train external models. You can export or delete your data at any time.',
  },
  {
    q: 'Can I use AuraMind for professional certifications?',
    a: 'Absolutely. Many users prepare for medical boards, bar exams, and technical certifications. The Exam mode aggressively optimizes review cadence for short-term high-stakes performance.',
  },
  {
    q: 'What content formats are supported?',
    a: 'You can import notes, PDFs, lecture slides, and plain text. AuraMind automatically generates high-signal memory nodes from your content using AI extraction.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes — the free tier includes up to 500 active memory nodes and full access to the core spacing engine. Premium unlocks unlimited nodes, the Neural Forecast lab, and priority sync across devices.',
  },
  {
    q: 'How long before I see results?',
    a: 'Most users report noticeable retention improvements within 5–7 days of consistent use. The system needs at least 3 review cycles to calibrate to your personal decay profile.',
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
