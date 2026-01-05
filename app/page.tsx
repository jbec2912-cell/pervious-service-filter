'use client';
import { useState } from 'react';
import { convertQuoteToService } from '../utils/mapper';

export default function Converter() {
  const [file, setFile] = useState<File | null>(null);

  const handleDownload = async () => {
    if (!file) return;
    const text = await file.text();
    const csvOutput = convertQuoteToService(text);
    
    const blob = new Blob([csvOutput], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Converted_Previous_Service.csv';
    a.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-black">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Previous Service Filter</h1>
        <p className="text-sm text-gray-600 mb-4">Upload your Quote CSV to convert it for the Service Drive.</p>
        
        <input 
          type="file" 
          accept=".csv" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-6 block w-full text-sm border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
        
        <button 
          onClick={handleDownload}
          disabled={!file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          Convert & Download
        </button>
      </div>
    </div>
  );
}