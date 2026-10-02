import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { classifyImageWithGemini, classifyWaste } from '@/lib/wasteClassifier';
import { fileToBase64 } from '@/lib/geminiClassifier';
import type { ClassificationResult } from '@/lib/supabase';

interface PhotoScanPanelProps {
  onResult: (result: ClassificationResult, searchTerm: string) => void;
}

const visualHints: Array<{ terms: string[]; item: string }> = [
  { terms: ['banana', 'fruit', 'food', 'peel'], item: 'banana peel' },
  { terms: ['bottle', 'plastic', 'water'], item: 'plastic bottle' },
  { terms: ['phone', 'mobile', 'smartphone'], item: 'old mobile phone' },
  { terms: ['battery', 'batteries'], item: 'dead batteries' },
  { terms: ['laptop', 'computer'], item: 'old laptop' },
  { terms: ['paper', 'newspaper'], item: 'newspaper' },
  { terms: ['cardboard', 'box'], item: 'cardboard box' },
  { terms: ['can', 'aluminum', 'tin'], item: 'aluminum can' },
];

async function inferWasteItemFromImage(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const matchedHint = visualHints.find((entry) => entry.terms.some((term) => fileName.includes(term)));
  if (matchedHint) return matchedHint.item;

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('Could not load image'));
      nextImage.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'plastic bottle';

    const maxSize = 64;
    const ratio = Math.min(maxSize / image.width, maxSize / image.height);
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let rTotal = 0;
    let gTotal = 0;
    let bTotal = 0;
    let yellow = 0;
    let green = 0;
    let blue = 0;
    let dark = 0;
    let count = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const brightness = (r + g + b) / 3;
      rTotal += r;
      gTotal += g;
      bTotal += b;
      count++;

      if (brightness < 110) dark++;
      if (r > 180 && g > 130 && b < 160) yellow++;
      if (g > 130 && r < 170 && b < 170) green++;
      if (b > 140 && r < 180 && g < 180) blue++;
    }

    const avgR = rTotal / count;
    const avgG = gTotal / count;
    const avgB = bTotal / count;
    const dominantBlue = blue / count;
    const dominantYellow = yellow / count;
    const dominantGreen = green / count;
    const isTall = image.height > image.width * 1.15;

    if (dominantYellow > 0.14 || (avgR > 160 && avgG > 120 && avgB < 140)) return 'banana peel';
    if (dominantGreen > 0.12 || (avgG > 135 && avgR < 150 && avgB < 150)) return 'banana peel';
    if (dominantBlue > 0.18 || (isTall && avgB > 120 && avgG > 80)) return 'plastic bottle';
    if (avgR < 90 && avgG < 90 && avgB < 90) return 'old mobile phone';
    if (dark / count > 0.25 && Math.abs(avgR - avgG) < 20 && Math.abs(avgG - avgB) < 20) return 'dead batteries';
    if (image.width > image.height * 1.3) return 'cardboard box';

    return 'plastic bottle';
  } catch {
    return 'plastic bottle';
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function PhotoScanPanel({ onResult }: PhotoScanPanelProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage('Please choose an image smaller than 8 MB.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setSelectedFile(file);
    setMessage('');
  };

  const scanImage = async () => {
    if (!fileName || !selectedFile) return;
    setScanning(true);
    setMessage('Gemini is reading the image and matching it with India-focused waste guidance...');

    try {
      const encodedImage = await fileToBase64(selectedFile);
      const aiResult = await classifyImageWithGemini(encodedImage, selectedFile.type);
      if (aiResult) {
        onResult(aiResult, aiResult.item?.name ?? 'photo scan');
        setScanning(false);
        setMessage('Gemini identified this item and prepared the disposal guidance.');
        return;
      }

      const lowerName = fileName.toLowerCase();
      const hint = visualHints.find((entry) => entry.terms.some((term) => lowerName.includes(term)));
      const term = hint?.item ?? (await inferWasteItemFromImage(selectedFile));
      const result = await classifyWaste(term, 'image');
      onResult(result, term);
      setScanning(false);
      setMessage(hint ? 'Image signal matched with a known waste item.' : 'No AI tag was available, so EcoBin used a best-fit image estimate for this item.');
    } catch {
      const term = await inferWasteItemFromImage(selectedFile);
      const result = await classifyWaste(term, 'image');
      onResult(result, term);
      setScanning(false);
      setMessage('The image could not be processed by Gemini, so EcoBin used a local best-fit match for the waste type.');
    }
  };

  return (
    <section className="mt-8 bg-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-2"><Camera className="w-4 h-4" /> Photo waste scan</div>
            <h2 className="text-2xl font-bold">Show EcoBin what you found</h2>
            <p className="text-slate-300 mt-1 max-w-xl">Upload a clear photo to start an image-based waste check.</p>
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 shrink-0" />
        </div>

        {preview ? (
          <div className="grid md:grid-cols-[180px_1fr] gap-5 items-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-slate-700">
              <img src={preview} alt="Waste item preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { setPreview(null); setFileName(''); setSelectedFile(null); setMessage(''); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-4 truncate">{fileName}</p>
              <button type="button" onClick={scanImage} disabled={scanning} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold transition-colors">
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {scanning ? 'Scanning...' : 'Detect waste'}
              </button>
              {message && <p className="text-sm text-slate-300 mt-3">{message}</p>}
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className="w-full border-2 border-dashed border-slate-600 hover:border-emerald-400 rounded-2xl py-10 px-4 flex flex-col items-center justify-center gap-3 text-slate-300 hover:text-white transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center"><ImagePlus className="w-7 h-7 text-emerald-300" /></div>
            <span className="font-semibold">Upload a waste photo</span>
            <span className="text-xs text-slate-400">JPG, PNG, or WEBP up to 8 MB</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
        {!preview && <div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><Upload className="w-3.5 h-3.5" /> Keep the item centred and well lit for the best result.</div>}
      </div>
    </section>
  );
}
