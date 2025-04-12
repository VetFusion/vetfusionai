'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Clipboard, Check, Save, History, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
const html2pdf = typeof window !== 'undefined' ? require('html2pdf.js') : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Animal {
  Name: string;
  Location: string;
  Species: string;
  Weight: string;
  Case_Summary: string;
}

interface SOAPHistory {
  id: number;
  animal_name: string;
  soap_text: string;
  created_at: string;
}

export default function SOAPGenerator() {
  const [animalList, setAnimalList] = useState<Animal[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [soapNote, setSoapNote] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [soapHistory, setSoapHistory] = useState<SOAPHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai' | 'history'>('manual');
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    const fetchAnimals = async () => {
      const { data, error } = await supabase
        .from('master_tracker')
        .select('Name, Location, Species, Weight, Case_Summary')
        .order('Name');
      if (!error && data) setAnimalList(data);
    };
    fetchAnimals();
  }, []);

  const fetchSOAPHistory = async (name: string) => {
    const { data } = await supabase
      .from('soap_history')
      .select('*')
      .ilike('animal_name', name)
      .order('created_at', { ascending: false });
    setSoapHistory(data || []);
  };

  const handleSelect = (animal: Animal) => {
    setSelectedAnimal(animal);
    setSoapNote('');
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setCopied(false);
    setSaveMessage('');
    fetchSOAPHistory(animal.Name);
  };

  const handleGenerateSOAP = async () => {
    setIsLoading(true);

    const prompt = selectedAnimal
      ? `Create a SOAP note for a ${selectedAnimal.Species} named ${selectedAnimal.Name}, located in ${selectedAnimal.Location}, weighing ${selectedAnimal.Weight}. Current status: ${selectedAnimal.Case_Summary}. Format the SOAP using emojis, section breaks, and Delta Rescue formatting.`
      : 'Create a generic SOAP note template for a veterinary patient. Format it using emojis, section breaks, and best practice structure.';

    const response = await fetch('/api/generate-soap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    const text = data?.text || 'Error generating SOAP';
    setSoapNote(text);

    const parseSection = (label: string) => {
  const pattern = `${label}:\n([\s\S]*?)(?=\n[🟣🔵🧠🛠️]|$)`;
  const match = text.match(new RegExp(pattern, 'u'));
  return match?.[1]?.trim() || '';
};

    setSubjective(parseSection('🟣 Subjective'));
    setObjective(parseSection('🔵 Objective'));
    setAssessment(parseSection('🧠 Assessment'));
    setPlan(parseSection('🛠️ Plan'));
    setIsLoading(false);
    setActiveTab('manual');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSOAP());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!selectedAnimal || !fullSOAP().trim()) return;

    const { error } = await supabase
      .from('soap_history')
      .insert({
        animal_name: selectedAnimal.Name,
        soap_text: fullSOAP()
      });

    setSaveMessage(error ? '❌ Error saving note' : '✅ SOAP saved');
    fetchSOAPHistory(selectedAnimal.Name);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleExportPDF = () => {
    if (!pdfRef.current) return;
    html2pdf().from(pdfRef.current).save(`${selectedAnimal?.Name || 'SOAP'}_note.pdf`);
  };

  const fullSOAP = () => [
    subjective && `🟣 Subjective:
${subjective}`,
    objective && `🔵 Objective:
${objective}`,
    assessment && `🧠 Assessment:
${assessment}`,
    plan && `🛠️ Plan:
${plan}`
  ].filter(Boolean).join('\n\n');

  const filteredAnimals = animalList.filter((a) =>
    a.Name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-sky-50 dark:from-gray-900 dark:to-black px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
          🧠 VetFusionAI SOAP Generator
        </h1>

        <Input
          placeholder="🔍 Search for a patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-lg px-4 py-3 mb-6"
        />

        {filteredAnimals.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredAnimals.slice(0, 12).map((animal) => (
              <motion.div
                key={animal.Name}
                onClick={() => handleSelect(animal)}
                whileHover={{ scale: 1.02 }}
                className={`cursor-pointer p-4 rounded-xl border shadow hover:bg-blue-100 dark:hover:bg-gray-800 transition ${
                  selectedAnimal?.Name === animal.Name ? 'ring-2 ring-blue-600' : 'bg-white dark:bg-gray-900'
                }`}
              >
                <p className="font-semibold text-lg text-gray-900 dark:text-white">{animal.Name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{animal.Location} • {animal.Species}</p>
              </motion.div>
            ))}
          </div>
        )}

        {selectedAnimal && (
          <div className="mb-4 flex gap-4">
            <Button variant={activeTab === 'manual' ? 'default' : 'outline'} onClick={() => setActiveTab('manual')}>✍️ Manual Entry</Button>
            <Button variant={activeTab === 'ai' ? 'default' : 'outline'} onClick={() => setActiveTab('ai')}>🤖 AI Generator</Button>
            <Button variant={activeTab === 'history' ? 'default' : 'outline'} onClick={() => setActiveTab('history')}>📚 History</Button>
          </div>
        )}

        <div ref={pdfRef} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl">
          {selectedAnimal && (
            <p className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Generating SOAP for: <span className="text-blue-600 dark:text-blue-400">{selectedAnimal.Name}</span>
            </p>
          )}

          {activeTab === 'manual' && (
            <>
              <Textarea value={subjective} onChange={(e) => setSubjective(e.target.value)} className="mt-2 text-sm min-h-[80px]" placeholder="🟣 Subjective..." />
              <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} className="mt-2 text-sm min-h-[80px]" placeholder="🔵 Objective..." />
              <Textarea value={assessment} onChange={(e) => setAssessment(e.target.value)} className="mt-2 text-sm min-h-[80px]" placeholder="🧠 Assessment..." />
              <Textarea value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-2 text-sm min-h-[80px]" placeholder="🛠️ Plan..." />
            </>
          )}

          {activeTab === 'ai' && (
            <Textarea value={soapNote} onChange={(e) => setSoapNote(e.target.value)} className="mt-2 text-sm min-h-[300px] whitespace-pre-line" placeholder="AI-generated SOAP note will appear here..." />
          )}

          {activeTab === 'history' && soapHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Previous SOAPs</h3>
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {soapHistory.map((entry) => (
                  <li key={entry.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-sm">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{entry.soap_text}</p>
                    {isClient && (
                      <p className="text-xs text-gray-400 mt-2">🕓 {new Date(entry.created_at).toLocaleString()}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedAnimal && (
            <div className="flex flex-wrap gap-4 mt-6">
              <Button onClick={handleGenerateSOAP} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : '📝 Generate SOAP'}
              </Button>
              <Button onClick={handleCopy} variant="secondary">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}Copy
              </Button>
              <Button onClick={handleExportPDF} variant="outline">
                <FileText className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button onClick={handleSave} variant="outline">
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
              {saveMessage && <p className="text-sm text-green-500 mt-2">{saveMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
