// ✅ Manual SOAP Paste Form for VetFusionAI
'use client';
import { useState } from 'react';

export default function PasteSOAPManualForm() {
  const [form, setForm] = useState({
    Name: '',
    SOAP_Date: '',
    Location: '',
    Species: '',
    Status: '',
    Weight: '',
    Recheck_Due: '',
    Current_Meds: '',
    Case_Summary: '',
    Full_SOAP: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage('');
    try {
      const payload = {
        ...form,
        Recheck_Due: form.Recheck_Due || null
      };

      const res = await fetch('/api/add-soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ SOAP submitted to Supabase!');
        setForm({ ...form, Full_SOAP: '', Case_Summary: '' });
      } else {
        setMessage(`❌ Error: ${data.error?.message || 'Submission failed'}`);
      }
    } catch (err) {
      setMessage('❌ Network error');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-white">📋 Paste Full SOAP → Submit to Tracker</h2>

      {[
        'Name',
        'SOAP_Date',
        'Location',
        'Species',
        'Status',
        'Weight',
        'Recheck_Due',
        'Current_Meds',
        'Case_Summary'
      ].map((field) => (
        <input
          key={field}
          name={field}
          placeholder={field.replaceAll('_', ' ')}
          value={form[field]}
          onChange={handleChange}
          className="w-full border rounded p-2 bg-gray-800 text-white"
        />
      ))}

      <textarea
        name="Full_SOAP"
        placeholder="Paste full SOAP text here..."
        value={form.Full_SOAP}
        onChange={handleChange}
        className="w-full h-64 border rounded p-2 font-mono bg-gray-800 text-white"
      />

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        {isSubmitting ? 'Submitting...' : '📥 Submit to Supabase'}
      </button>

      {message && <p className="mt-2 text-white">{message}</p>}
    </div>
  );
}
