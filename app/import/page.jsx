// ✅ VetFusionAI Bulk Import – Clean Final Version (with Submit All + Lab/Image Upload)
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

export default function ImportSOAPPage() {
  const [files, setFiles] = useState([]);
  const [parsed, setParsed] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDrop = async (e) => {
    e.preventDefault();
    const incoming = Array.from(e.dataTransfer.files);
    const labs = incoming.filter(f => f.type.includes('pdf') || f.type.includes('image'));
    const soaps = incoming.filter(f => f.name.endsWith('.docx'));

    if (labs.length > 0) {
      const newUploads = [];
      for (const file of labs) {
        const path = `labwork/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from('vetfusion-uploads').upload(path, file);

        if (error) {
          toast.error(`❌ Failed to upload ${file.name}`);
        } else {
          const publicUrl = supabase.storage.from('vetfusion-uploads').getPublicUrl(path).data.publicUrl;
          const filename = file.name;
          const filetype = file.type;
          const createdAt = new Date().toISOString();
          const nameMatch = filename.match(/([A-Za-z0-9_-]+)/);

          const metadata = {
            File_Name: filename,
            File_Type: filetype,
            File_URL: publicUrl,
            Uploaded_At: createdAt,
            Linked_Animal: nameMatch ? nameMatch[1] : null
          };

          const insert = await supabase.from('attachments').insert([metadata]);
          if (insert.error) {
            toast.error(`❌ Metadata save failed for ${filename}`);
          } else {
            toast.success(`📎 Uploaded & linked: ${filename}`);
          }
          newUploads.push({ ...file, path });
        }
      }
      setUploads(prev => [...prev, ...newUploads]);
    }

    if (soaps.length > 0) setFiles(prev => [...prev, ...soaps]);
  };

  const handleParse = async () => {
    if (files.length === 0) return;
    setLoading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('/api/parse-soaps', {
        method: 'POST',
        body: formData
      });
      const { parsed } = await response.json();

      const enriched = parsed.map(entry => {
        const baseDate = entry.SOAP_Date ? new Date(entry.SOAP_Date) : new Date();
        const recheckDate = new Date(baseDate.getTime() + 14 * 86400000).toISOString().split('T')[0];

        return {
          ...entry,
          Location: 'Unknown',
          Weight: '',
          Species: 'Feline',
          Status: 'Imported SOAP',
          Recheck_Due: recheckDate,
          Current_Meds: '',
          Case_Summary: entry.Case_Summary || 'Summary unavailable',
          Full_SOAP: entry.Full_SOAP || 'SOAP content unavailable'
        };
      });

      setParsed(enriched);
      toast.success('🧠 Parsed + enriched!');
    } catch (err) {
      toast.error('❌ Failed to parse files');
    }
    setLoading(false);
  };

  const handleSubmit = async (entry) => {
    const { error } = await supabase.from('master_tracker').upsert([entry], { onConflict: ['Name', 'SOAP_Date'] });
    if (error) toast.error(`❌ Failed to save ${entry.Name}`);
    else toast.success(`✅ Saved ${entry.Name}`);
  };

  const handleSubmitAll = async () => {
    if (!parsed.length) return;
    const { error } = await supabase.from('master_tracker').upsert(parsed, { onConflict: ['Name', 'SOAP_Date'] });
    if (error) toast.error('❌ Failed to submit all');
    else toast.success('✅ All SOAPs submitted!');
  };

  const handleChange = (index, field, value) => {
    const updated = [...parsed];
    updated[index][field] = value;
    setParsed(updated);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-3xl font-bold mb-4 mt-10">📎 Upload Labwork or Images</h2>
      <div className="border-4 border-dashed border-indigo-400 p-8 rounded-xl text-center bg-white/50 mb-10">
        <p className="text-lg">Drop PDFs, X-rays, or wound images here</p>
        {uploads.length > 0 && (
          <div className="mt-4 text-left text-sm text-gray-800">
            <p className="font-semibold">📂 Files detected:</p>
            <ul className="list-disc ml-6">
              {uploads.map((file, i) => (
                <li key={i}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <h1 className="text-4xl font-bold mb-6">📥 Bulk SOAP Import</h1>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-dashed border-4 border-teal-400 rounded-xl p-12 text-center text-gray-600 bg-white/50 mb-6"
      >
        <p className="text-xl">Drag & drop your .docx SOAP files here</p>
        <p className="text-sm mt-2">(Multiple files supported)</p>
      </div>

      <button
        onClick={handleParse}
        disabled={files.length === 0 || loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg mb-6"
      >
        {loading ? '🌀 Parsing...' : `🧠 Parse ${files.length} File${files.length !== 1 ? 's' : ''}`}
      </button>

      {parsed.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">📝 Parsed SOAP Preview</h2>
            <button
              onClick={handleSubmitAll}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
            >
              📦 Submit All
            </button>
          </div>

          {parsed.map((entry, idx) => (
            <div key={idx} className="border p-4 rounded bg-white/80 space-y-2">
              <input className="w-full border rounded p-2" value={entry.Name} onChange={(e) => handleChange(idx, 'Name', e.target.value)} placeholder="Name" />
              <input className="w-full border rounded p-2" value={entry.SOAP_Date || ''} onChange={(e) => handleChange(idx, 'SOAP_Date', e.target.value)} placeholder="SOAP Date (YYYY-MM-DD)" />
              <input className="w-full border rounded p-2" value={entry.Recheck_Due || ''} onChange={(e) => handleChange(idx, 'Recheck_Due', e.target.value)} placeholder="Recheck Due (YYYY-MM-DD)" />
              <input className="w-full border rounded p-2" value={entry.Status || ''} onChange={(e) => handleChange(idx, 'Status', e.target.value)} placeholder="Status" />
              <textarea className="w-full border rounded p-2" value={entry.Case_Summary || ''} onChange={(e) => handleChange(idx, 'Case_Summary', e.target.value)} placeholder="Case Summary" />
              <textarea className="w-full border rounded p-2 text-xs" rows={6} value={entry.Full_SOAP || ''} onChange={(e) => handleChange(idx, 'Full_SOAP', e.target.value)} placeholder="Full SOAP Note" />
              <button onClick={() => handleSubmit(entry)} className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded">📤 Submit</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}