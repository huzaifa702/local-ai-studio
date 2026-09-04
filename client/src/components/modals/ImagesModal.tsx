import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Copy, 
  Share2, 
  Send, 
  Upload, 
  Wand2, 
  RefreshCw, 
  Check, 
  Sliders,
  Layers,
  Eye,
  Camera
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

interface GeneratedImage {
  id: string;
  prompt: string;
  style: string;
  url: string;
  createdAt: string;
}

export const ImagesModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    sendMessage, 
    setSelectedModel,
    activeConversationId,
    activeProjectId
  } = useAppStore();

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Anime');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [recentGallery, setRecentGallery] = useState<GeneratedImage[]>([]);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'generate' | 'vision'>('generate');

  // Load saved gallery from localStorage and backend cache
  useEffect(() => {
    let localSaved: GeneratedImage[] = [];
    try {
      const saved = localStorage.getItem('guts_ai_image_gallery');
      if (saved) {
        localSaved = JSON.parse(saved);
        setRecentGallery(localSaved);
      }
    } catch (e) {}

    // Fetch server cached gallery items
    api.getImageGallery().then((serverItems) => {
      if (serverItems && serverItems.length > 0) {
        const serverMapped: GeneratedImage[] = serverItems.map((item) => ({
          id: item.id,
          prompt: 'Generated Artwork',
          style: 'Flux',
          url: item.url,
          createdAt: item.createdAt
        }));
        setRecentGallery((prev) => {
          const existingUrls = new Set(prev.map((p) => p.url));
          const additions = serverMapped.filter((s) => !existingUrls.has(s.url));
          return [...prev, ...additions].slice(0, 20);
        });
      }
    }).catch(() => {});
  }, []);

  const styles = [
    { id: 'Anime', name: 'Anime / Berserk', modifier: 'masterpiece anime style, dark fantasy manga aesthetic, high contrast dramatic lighting, highly detailed' },
    { id: 'Photorealistic', name: 'Photorealistic', modifier: 'photorealistic 8k uhd, cinematic lighting, sharp focus, octane render, raw photo' },
    { id: 'Sticker', name: 'Sticker / Vector', modifier: 'die-cut vector sticker, clean white border, vibrant colors, bold outlines, flat design illustration' },
    { id: '3D Render', name: '3D Digital Art', modifier: 'blender 3d render, claymorphism, smooth volumetric lighting, modern pixar art station' },
    { id: 'Cyberpunk', name: 'Cyberpunk', modifier: 'futuristic neon cyberpunk city, glowing holographic accents, rain soaked reflections, dark sci-fi' },
    { id: 'Fantasy', name: 'Dark Fantasy', modifier: 'epic dark fantasy landscape, mystical fog, ancient ruins, Elden Ring ethereal mood, ultra detailed' }
  ];

  const aspectDimensions = {
    '1:1': { width: 1024, height: 1024, label: 'Square (1:1)' },
    '16:9': { width: 1280, height: 720, label: 'Landscape (16:9)' },
    '9:16': { width: 720, height: 1280, label: 'Portrait (9:16)' },
    '4:3': { width: 1024, height: 768, label: 'Standard (4:3)' }
  };

  const surprisePrompts = [
    "A legendary dark warrior standing on a mountain cliff under a crimson solar eclipse, Berserk aesthetic",
    "A futuristic neon ramen shop in Tokyo in 2099 during a rainstorm, cinematic lighting",
    "A cute glowing robotic cat playing with an electric yarn ball, sticker vector style",
    "An ancient enchanted library with books floating towards an astral celestial portal",
    "Portrait of an anime swordsman with a giant iron blade and glowing mark of sacrifice"
  ];

  const handleSurprise = () => {
    const random = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
    setPrompt(random);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const result = await api.generateImage({
        prompt: prompt.trim(),
        style: selectedStyle,
        aspectRatio: aspectRatio,
      });

      const imageUrl = result.url || result.directUrl;

      // Pre-load image in browser memory for instant smooth display
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // fallback gracefully
        });
      }

      const newImg: GeneratedImage = {
        id: result.id || `img_${Date.now()}`,
        prompt: prompt.trim(),
        style: selectedStyle,
        url: imageUrl || '',
        createdAt: result.createdAt || new Date().toISOString()
      };

      setCurrentImage(newImg);
      setRecentGallery((prev) => {
        const updated = [newImg, ...prev.filter((p) => p.id !== newImg.id).slice(0, 19)];
        localStorage.setItem('guts_ai_image_gallery', JSON.stringify(updated));
        return updated;
      });
    } catch (e: any) {
      console.error('Image generation error:', e);
      alert(e?.message || 'Could not generate image. Please check your internet connection.');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleSendToChat = async (img: GeneratedImage) => {
    setActiveModal(null);
    setSelectedModel('moondream:latest', 'ollama');
    sendMessage(
      `Here is an image created with the prompt: "${img.prompt}". Analyze this image and describe its key elements and artistic composition.`,
      [{
        id: img.id,
        filename: `generated_${img.style.toLowerCase()}.jpg`,
        fileType: 'image/jpeg',
        fileSize: 1024 * 512,
        isImage: true,
        url: img.url,
        preview: img.url
      }],
      []
    );
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const uploaded = await api.uploadFiles(Array.from(files), activeConversationId || undefined, activeProjectId || undefined);
      setActiveModal(null);
      setSelectedModel('moondream:latest', 'ollama');
      sendMessage('Please analyze this uploaded image and extract all visible details, text, and objects.', uploaded, []);
    } catch (e) {
      alert('Failed to upload image.');
    }
  };

  if (activeModal !== 'images') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl bg-[var(--bg-main)] border border-[var(--border-input)] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                <span>Guts AI Images Studio</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-bold text-[10px] border border-purple-500/20">
                  Flux HD
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Create AI artwork, anime emblems, stickers, or run vision scans
              </div>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--bg-sidebar-hover)] p-0.5 rounded-full text-xs font-medium border border-[var(--border-subtle)]">
              <button
                onClick={() => setTab('generate')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  tab === 'generate'
                    ? 'bg-[var(--bg-main)] text-[var(--text-main)] shadow-sm'
                    : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                }`}
              >
                Create Art
              </button>
              <button
                onClick={() => setTab('vision')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  tab === 'vision'
                    ? 'bg-[var(--bg-main)] text-[var(--text-main)] shadow-sm'
                    : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                }`}
              >
                Vision Scan
              </button>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-full hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'generate' ? (
            <>
              {/* Prompt Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--text-main)]">
                  <span>Prompt</span>
                  <button
                    onClick={handleSurprise}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium transition cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Surprise prompt</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder="Describe what you want to create (e.g. A cybernetic swordsman in Berserk dark armor with glowing red eyes standing in rain)..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] focus:border-purple-500 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none resize-none leading-relaxed shadow-inner"
                  />
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-[var(--text-main)]">Art Style</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStyle(s.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        selectedStyle === s.id
                          ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-sm'
                          : 'bg-[var(--bg-sidebar-hover)] border-[var(--border-subtle)] text-[var(--text-sub)] hover:border-[var(--border-input)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <div className="font-semibold text-xs truncate">{s.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio & Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-xs text-[var(--text-muted)] mr-1">Aspect:</span>
                  {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        aspectRatio === ratio
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-[var(--bg-sidebar-hover)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating with Flux...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Image</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview Area */}
              {currentImage && (
                <div className="p-4 rounded-3xl bg-[var(--bg-sidebar-hover)] border border-[var(--border-subtle)] space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-main)] truncate max-w-md">
                      "{currentImage.prompt}"
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold text-[10px]">
                      {currentImage.style}
                    </span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center max-h-[380px]">
                    <img 
                      src={currentImage.url} 
                      alt={currentImage.prompt} 
                      className="max-h-[380px] w-auto object-contain rounded-2xl shadow-xl" 
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={currentImage.url}
                        target="_blank"
                        rel="noreferrer"
                        download={`guts_ai_${Date.now()}.png`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] border border-[var(--border-subtle)] text-xs font-medium transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>

                      <button
                        onClick={() => handleCopyLink(currentImage.url)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] border border-[var(--border-subtle)] text-xs font-medium transition cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleSendToChat(currentImage)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Chat (Analyze Vision)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Images Gallery */}
              {recentGallery.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Recent Creations
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {recentGallery.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setCurrentImage(item)}
                        className="group relative rounded-2xl overflow-hidden aspect-square border border-[var(--border-subtle)] bg-[var(--bg-sidebar-hover)] hover:border-purple-500 transition cursor-pointer shadow-sm"
                      >
                        <img 
                          src={item.url} 
                          alt={item.prompt} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end">
                          <p className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                            {item.prompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Vision Scan Mode */
            <div className="space-y-6 text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg">
                <Camera className="w-8 h-8" />
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-bold text-base text-[var(--text-main)]">
                  Upload Image for Moondream Vision Scan
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Extract text, describe scenery, analyze diagrams, or inspect screenshots with your private local vision model.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--border-input)] hover:border-indigo-500 rounded-3xl bg-[var(--bg-sidebar-hover)] cursor-pointer transition">
                  <Upload className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                  <span className="text-xs font-semibold text-[var(--text-main)]">
                    Click to browse or drop an image
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1">
                    Supports PNG, JPG, WebP, Screenshots
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
