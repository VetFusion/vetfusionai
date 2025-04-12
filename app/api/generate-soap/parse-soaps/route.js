// ✅ API Route: /api/parse-soaps
// Parses uploaded .docx files and extracts SOAP data (Name, Date, Summary, Full SOAP)

import { NextResponse } from 'next/server';
import { read } from 'docx-parser';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false
  }
};

export async function POST(req) {
  const form = formidable({ multiples: true, uploadDir: '/tmp', keepExtensions: true });

  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });

  const results = [];

  const allFiles = Array.isArray(files.files) ? files.files : [files.files];

  for (const file of allFiles) {
    const content = await read(file.filepath);
    const nameMatch = content.match(/Name[:\-]?\s*(.*)/i);
    const dateMatch = content.match(/\b(\d{4}-\d{2}-\d{2})\b|\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/);
    const summaryMatch = content.match(/Assessment[:\-\n]*(.*?)\n\n|Summary[:\-\n]*(.*?)\n\n/i);

    results.push({
      Name: nameMatch ? nameMatch[1].trim() : 'Unknown',
      SOAP_Date: dateMatch ? dateMatch[1] || dateMatch[2] : null,
      Case_Summary: summaryMatch ? (summaryMatch[1] || summaryMatch[2]).trim() : 'No summary found.',
      Full_SOAP: content.trim().slice(0, 9999)
    });

    await fs.unlink(file.filepath); // Clean up uploaded temp file
  }

  return NextResponse.json({ parsed: results });
}
