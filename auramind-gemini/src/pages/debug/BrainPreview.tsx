import NeuralBrainSection from "../../components/landing/NeuralBrainSection";

export default function BrainPreview() {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="p-6 text-center">
        <h1 className="text-[#F0EFFE] text-lg font-medium mb-2">NeuralBrain Section Preview</h1>
        <p className="text-[#7A7A96] text-xs">Scroll to trigger the 3D brain assembly animation.</p>
      </div>
      <NeuralBrainSection />
      <div className="p-6 text-center">
        <p className="text-[#7A7A96] text-xs">↑ Section ends here ↑</p>
      </div>
    </div>
  );
}
