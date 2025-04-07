"use client";

import { useState } from "react";

export default function FileUploader({ animalNamePlaceholder }: { animalNamePlaceholder: string }) {
  const [animalName, setAnimalName] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (uploaded) {
      setFiles(Array.from(uploaded));
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg text-left space-y-4">
      <label className="block text-sm text-white font-medium mb-1">
        📎 Upload files for an animal
      </label>
      <input
        type="text"
        className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
        placeholder={animalNamePlaceholder}
        value={animalName}
        onChange={(e) => setAnimalName(e.target.value)}
      />
      <input
        type="file"
        multiple
        className="w-full text-sm text-white file:bg-teal-600 file:border-none file:rounded file:px-4 file:py-2 file:text-white file:cursor-pointer"
        onChange={handleUpload}
      />
      {files.length > 0 && (
        <ul className="text-sm text-gray-300 list-disc ml-5">
          {files.map((file, i) => (
            <li key={i}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
