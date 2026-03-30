import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Copy, Check, AlertCircle, Loader2, Sparkles, Volume2, VolumeX, Download, Edit3, Video, Clapperboard } from "lucide-react";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface Script {
  title: string;
  hook: string;
  script: string;
  duration: string;
  viralScore: string;
  hashtags: string[];
  broll?: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [niche, setNiche] = useState('personal finance');
  const [format, setFormat] = useState('YouTube Shorts (60 sec)');
  const [hookStyle, setHookStyle] = useState('bold controversial claim');
  const [tone, setTone] = useState('chaotic Gen Z brainrot energy — fast, funny, surprising');
  const [customPrompt, setCustomPrompt] = useState('');
  const [count, setCount] = useState(3);
  const [includeBroll, setIncludeBroll] = useState('yes');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [audioData, setAudioData] = useState<(string | null)[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [ttsLoading, setTtsLoading] = useState<number | null>(null);
  const [videoLoading, setVideoLoading] = useState<number | null>(null);
  const [videoMessage, setVideoMessage] = useState<string>('');
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([]);
  const [hasKey, setHasKey] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleGenerate = async () => {
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      setError('Please enter your Google AI Studio API key first.');
      return;
    }

    setLoading(true);
    setError(null);
    setScripts([]);
    setAudioData([]);

    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    
    const systemInstruction = `You are a viral brainrot video script writer. You understand the formula for viral short-form and long-form content deeply.

CRITICAL: DO NOT WRITE LIKE AN AI. 
- Avoid "AI slop" words: delve, tapestry, unleash, unlock, comprehensive, robust, navigate, landscape, testament, elevate, game-changer, revolutionary.
- Use human-like sentence structures: fragments, punchy one-liners, conversational slang, and rhetorical questions.
- Write like a real person who spends 12 hours a day on TikTok/Reels.
- Use current internet trends and real-world examples from the internet.

THE VIRAL BRAINROT FORMULA:
1. HOOK (first 3 seconds): Use a ${hookStyle}. No intros. No greetings. Start mid-energy.
2. DOPAMINE SPLIT: The content runs on top of gameplay footage — write with that in mind. Keep sentences punchy.
3. PACE: No dead air. Every sentence earns its place. Pattern interrupt every 5–8 seconds (cut cue, sound effect note, zoom cue).
4. AUDIO LAYER: Conversational voiceover tone. Mark key words with [SFX] for sound effect punches.
5. CAPTIONS: Write caption text in brackets [CAPTION: ...] at key moments.
6. STRUCTURE: Hook → Surprising Fact → Relatable Moment → Value Bomb → CTA
7. TONE: ${tone}
${niche === 'powerful Christian prayer' ? 'SPECIAL RULE: For Christian Prayer niche, the CTA MUST be extremely high-engagement. Use phrases like "Comment AMEN if you believe", "Share this with someone who needs a miracle", and "Subscribe for daily blessings".' : ''}
${niche === 'real reddit stories modified' ? 'SPECIAL RULE: For Real Reddit Stories niche, use Google Search to find actual trending or classic Reddit stories (AITA, TIFU, RelationshipAdvice, etc.). CRITICAL: You MUST modify the story details—change names, locations, and specific identifying details—to create a "remixed" version that avoids copyright issues while keeping the core drama and viral hook intact.' : ''}
${includeBroll === 'yes' ? '8. B-ROLL: After each script, suggest specific gameplay footage type + visual b-roll to use.' : ''}

OUTPUT FORMAT:
Return a JSON object with a "scripts" array. Each script object must follow the schema provided.`;

    const userPrompt = `Generate ${count} unique brainrot video script(s) for the ${niche === 'custom' ? customPrompt : niche} niche.
Format: ${format}
${customPrompt && niche !== 'custom' ? `Extra context: ${customPrompt}` : ''}

Make each script genuinely different — different hook styles, different angles on the topic. Make them feel real and human, not AI-generated. Use real-time data if relevant.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userPrompt,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scripts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    hook: { type: Type.STRING },
                    script: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    viralScore: { type: Type.STRING },
                    hashtags: { 
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    broll: { type: Type.STRING }
                  },
                  required: ["title", "hook", "script", "duration", "viralScore", "hashtags"]
                }
              }
            },
            required: ["scripts"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setScripts(result.scripts || []);
      setAudioData(new Array((result.scripts || []).length).fill(null));
      setVideoUrls(new Array((result.scripts || []).length).fill(null));
      
      // Scroll to output
      setTimeout(() => {
        document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating scripts.');
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async (index: number) => {
    if (playingIndex === index) {
      stopTTS();
      return;
    }

    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      setError('Please enter your Google AI Studio API key for TTS.');
      return;
    }

    const script = scripts[index];
    const fullText = `${script.hook}. ${script.script}`.replace(/\[.*?\]/g, ''); // Remove markers for speech

    setTtsLoading(index);
    stopTTS();

    try {
      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this in a fast, energetic, slightly chaotic brainrot style: ${fullText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Zephyr is energetic
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const newAudioData = [...audioData];
        newAudioData[index] = base64Audio;
        setAudioData(newAudioData);
        await playAudio(base64Audio, index);
      } else {
        throw new Error('No audio data received');
      }
    } catch (err: any) {
      console.error(err);
      setError('TTS Error: ' + (err.message || 'Failed to generate speech'));
    } finally {
      setTtsLoading(null);
    }
  };

  const playAudio = async (base64: string, index: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Int16Array(len / 2);
      for (let i = 0; i < len; i += 2) {
        bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
      }

      const audioBuffer = ctx.createBuffer(1, bytes.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < bytes.length; i++) {
        channelData[i] = bytes[i] / 32768;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setPlayingIndex(null);
      
      sourceNodeRef.current = source;
      source.start();
      setPlayingIndex(index);
    } catch (err) {
      console.error('Audio Playback Error:', err);
      setError('Failed to play audio');
    }
  };

  const stopTTS = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    setPlayingIndex(null);
  };

  const downloadAudio = (index: number) => {
    const base64 = audioData[index];
    if (!base64) return;

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a WAV file from the raw PCM data
    // The Gemini TTS returns raw PCM 16-bit LE, 24kHz
    const wavHeader = createWavHeader(len, 24000);
    const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainrot_voiceover_${index + 1}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createWavHeader = (dataLength: number, sampleRate: number) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + dataLength, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, dataLength, true);

    return buffer;
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const updateScriptField = (index: number, field: 'hook' | 'script', value: string) => {
    const newScripts = [...scripts];
    newScripts[index] = { ...newScripts[index], [field]: value };
    setScripts(newScripts);
    
    // Clear audio data if script changes
    const newAudioData = [...audioData];
    newAudioData[index] = null;
    setAudioData(newAudioData);

    // Clear video data if script changes
    const newVideoUrls = [...videoUrls];
    newVideoUrls[index] = null;
    setVideoUrls(newVideoUrls);
  };

  const REASSURING_MESSAGES = [
    "Cooking up your viral masterpiece...",
    "Injecting maximum brainrot energy...",
    "Consulting the TikTok algorithm gods...",
    "Generating high-dopamine visuals...",
    "Almost there, don't close the tab!",
    "Polishing the pixels for peak engagement...",
    "Finalizing the dopamine hits...",
    "Simulating 10 million views...",
    "Optimizing for the FYP...",
  ];

  const handleGenerateVideo = async (index: number) => {
    if (!hasKey) {
      await handleSelectKey();
      return;
    }

    setVideoLoading(index);
    setVideoMessage(REASSURING_MESSAGES[0]);
    setError(null);

    // Message cycler
    const messageInterval = setInterval(() => {
      setVideoMessage(prev => {
        const currentIndex = REASSURING_MESSAGES.indexOf(prev);
        return REASSURING_MESSAGES[(currentIndex + 1) % REASSURING_MESSAGES.length];
      });
    }, 8000);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const script = scripts[index];
      // Use script, hook and broll for a more detailed prompt
      const videoPrompt = `Create a high-energy viral video for: ${script.title}. 
Hook: ${script.hook}. 
Main Story: ${script.script.substring(0, 300)}...
Visual style and B-roll suggestions: ${script.broll || 'Cinematic, fast-paced, engaging, high-contrast'}.
The video should be visually stimulating and optimized for social media engagement.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.API_KEY || '',
          },
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const newVideoUrls = [...videoUrls];
        newVideoUrls[index] = url;
        setVideoUrls(newVideoUrls);
      } else {
        throw new Error('Video generation failed to return a link');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        setError("API Key session expired. Please select your key again.");
      } else {
        setError('Video Generation Error: ' + (err.message || 'Failed to generate video'));
      }
    } finally {
      setVideoLoading(null);
      setVideoMessage('');
      clearInterval(messageInterval);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-border px-6 py-5 md:px-10 flex items-center justify-between bg-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="logo font-display text-3xl tracking-[3px]">
          BRAINROT<span className="text-accent">AI</span>
        </div>
        <div className="badge font-mono text-[10px] bg-accent text-black px-2.5 py-1 tracking-[2px] uppercase font-bold">
          MVP v1.0
        </div>
      </header>

      <main className="container max-w-[900px] mx-auto px-6 pt-10 md:pt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-5xl md:text-8xl leading-[0.95] tracking-[2px] mb-3">
            GENERATE<br /><em className="text-accent not-italic">VIRAL</em><br />SCRIPTS DAILY
          </h1>
          <p className="text-muted font-mono text-sm">
            // powered by Google Gemini · built on the viral brainrot formula
          </p>
        </motion.div>

        {/* Step 1: API Key */}
        <section className="bg-surface border border-border p-5 md:p-6 mb-8 relative">
          <div className="font-mono text-[10px] text-accent tracking-[3px] mb-2 uppercase">STEP 01</div>
          <label className="block font-mono text-xs text-muted mb-3 uppercase">
            GOOGLE AI STUDIO API KEY — get yours at aistudio.google.com
          </label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={process.env.GEMINI_API_KEY ? "Using environment key..." : "AIza..."}
            className="w-full bg-bg border border-border text-[#f0f0f0] font-mono text-sm p-3 outline-none focus:border-accent transition-colors"
          />
        </section>

        {/* Step 2: Config */}
        <section className="bg-surface border border-border p-6 mb-8">
          <div className="font-mono text-[10px] text-accent tracking-[3px] mb-5 uppercase">STEP 02 — VIDEO CONFIG</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-muted tracking-[1px] uppercase">Niche / Topic</label>
              <select 
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="bg-bg border border-border text-[#f0f0f0] font-mono text-sm p-3 outline-none focus:border-accent cursor-pointer"
              >
                <option value="personal finance">💰 Personal Finance</option>
                <option value="crypto and Web3">🪙 Crypto & Web3</option>
                <option value="side hustles and making money online">💻 Side Hustles</option>
                <option value="investing for beginners">📈 Investing</option>
                <option value="financial freedom and FIRE movement">🔥 Financial Freedom</option>
                <option value="Nigerian money and business">🇳🇬 Nigerian Business</option>
                <option value="unexpected wtf pov stories">🤯 Unexpected WTF POV</option>
                <option value="powerful Christian prayer">🙏 Powerful Christian Prayer</option>
                <option value="dark psychology dating tips and tricks">🖤 Dark Psychology Dating</option>
                <option value="hilarious outrageous life advice">🤣 Outrageous Life Advice</option>
                <option value="deep Christian redemption, salvation and unbelievable insights">🙏 Christian Insights</option>
                <option value="unsolved internet mysteries">🔍 Internet Mysteries</option>
                <option value="real time crime stories">🚨 Real-time Crime Stories</option>
                <option value="weirdest history facts ever">🕰️ Weirdest History Facts</option>
                <option value="deep sea horrors">🐙 Deep Sea Horrors</option>
                <option value="liminal spaces and backrooms">🏢 Liminal Spaces & Backrooms</option>
                <option value="AITA brainrot edition">⚖️ AITA Brainrot</option>
                <option value="uncanny valley creepypasta">👻 Uncanny Creepypasta</option>
                <option value="reddit stories with subway surfers">🛹 Reddit + Subway Surfers</option>
                <option value="real reddit stories modified">👽 Real Reddit Stories (Modified)</option>
                <option value="custom">✏️ Custom (type below)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-muted tracking-[1px] uppercase">Video Format</label>
              <select 
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="bg-bg border border-border text-[#f0f0f0] font-mono text-sm p-3 outline-none focus:border-accent cursor-pointer"
              >
                <option value="YouTube Shorts (60 sec)">YouTube Shorts (60s)</option>
                <option value="Long-form YouTube (8–12 min)">Long-form YouTube (8–12 min)</option>
                <option value="TikTok (30–45 sec)">TikTok (30–45s)</option>
                <option value="Instagram Reels (30 sec)">Instagram Reels (30s)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-muted tracking-[1px] uppercase">Hook Style</label>
              <select 
                value={hookStyle}
                onChange={(e) => setHookStyle(e.target.value)}
                className="bg-bg border border-border text-[#f0f0f0] font-mono text-sm p-3 outline-none focus:border-accent cursor-pointer"
              >
                <option value="bold controversial claim">Bold Claim</option>
                <option value="shocking statistic">Shocking Stat</option>
                <option value="relatable pain point">Pain Point</option>
                <option value="mid-action — no intro">Mid-Action Drop</option>
                <option value="question that creates tension">Tension Question</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-muted tracking-[1px] uppercase">Tone</label>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-bg border border-border text-[#f0f0f0] font-mono text-sm p-3 outline-none focus:border-accent cursor-pointer"
              >
                <option value="chaotic Gen Z brainrot energy — fast, funny, surprising">Brainrot Chaos</option>
                <option value="confident and slightly aggressive, like a street-smart mentor">Street Smart</option>
                <option value="calm but urgent, like a financial insider sharing secrets">Insider Secret</option>
                <option value="relatable and self-aware, like talking to a friend">Bestie Mode</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-mono text-[10px] text-muted tracking-[1px] uppercase">Custom Niche / Extra Instructions (optional)</label>
              <textarea 
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. 'Focus on the Nigerian market, mention Naira inflation, use Gen Z slang...'"
                className="bg-bg border border-border text-[#f0f0f0] font-mono text-sm p-3 outline-none focus:border-accent min-h-[80px] resize-y"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-muted tracking-[1px] uppercase">Videos to Generate</label>
              <select 
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="bg-bg border border-border text-[#f0f0f0] font-mono text-sm p-3 outline-none focus:border-accent cursor-pointer"
              >
                <option value="1">1 video</option>
                <option value="3">3 videos</option>
                <option value="5">5 videos</option>
                <option value="7">7 videos (weekly batch)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-muted tracking-[1px] uppercase">Include B-Roll Suggestions</label>
              <select 
                value={includeBroll}
                onChange={(e) => setIncludeBroll(e.target.value)}
                className="bg-bg border border-border text-[#f0f0f0] font-mono text-sm p-3 outline-none focus:border-accent cursor-pointer"
              >
                <option value="yes">Yes — suggest gameplay + visuals</option>
                <option value="no">No — script only</option>
              </select>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {!hasKey && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent/10 border border-accent/20 p-4 mb-8 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Clapperboard className="text-accent w-5 h-5" />
                <div className="text-xs font-mono">
                  <span className="text-accent font-bold">VIDEO GEN ENABLED:</span> Select your API key to generate Veo videos.
                  <br />
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline opacity-60 hover:opacity-100">Billing info</a>
                </div>
              </div>
              <button 
                onClick={handleSelectKey}
                className="bg-accent text-black font-mono text-[10px] px-4 py-2 font-bold tracking-[1px] hover:bg-accent/80 transition-colors"
              >
                SELECT KEY
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-accent text-black font-display text-2xl tracking-[4px] py-4 cursor-pointer hover:bg-[#ff5520] active:translate-y-[1px] disabled:bg-[#333] disabled:text-muted disabled:cursor-not-allowed transition-all mb-10 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-6 h-6" />
              GENERATING...
            </>
          ) : (
            <>
              <Zap className="w-6 h-6 fill-current" />
              GENERATE TODAY'S SCRIPTS
            </>
          )}
        </button>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#1a0000] border border-[#550000] p-4 text-[#ff6666] font-mono text-xs mb-6 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div id="output-section" className="space-y-10">
          {scripts.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <div className="font-mono text-[10px] text-accent tracking-[3px] uppercase">GENERATED SCRIPTS</div>
                <div className="flex-1 h-[1px] bg-border" />
              </div>

              <div className="space-y-6">
                {scripts.map((script, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card border border-border overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface">
                      <div className="font-display text-sm tracking-[2px] text-accent2">
                        VIDEO {idx + 1} — {script.title.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        {audioData[idx] && (
                          <button 
                            onClick={() => downloadAudio(idx)}
                            className="font-mono text-[10px] px-3 py-1 border border-border text-muted hover:border-accent hover:text-accent tracking-[1px] transition-all flex items-center gap-2"
                          >
                            <Download className="w-3 h-3" />
                            DOWNLOAD AUDIO
                          </button>
                        )}
                        <button 
                          onClick={() => handleGenerateVideo(idx)}
                          disabled={videoLoading !== null}
                          className={`font-mono text-[10px] px-3 py-1 border border-border tracking-[1px] transition-all flex items-center gap-2 ${videoLoading === idx ? 'border-accent text-accent' : 'text-muted hover:border-accent hover:text-accent'} disabled:opacity-50 relative`}
                        >
                          {videoLoading === idx ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 text-[8px] text-accent border border-accent/20 z-10">
                                {videoMessage}
                              </span>
                            </>
                          ) : (
                            <>
                              <Video className="w-3 h-3" />
                              GENERATE VIDEO
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleTTS(idx)}
                          disabled={ttsLoading !== null && ttsLoading !== idx}
                          className={`font-mono text-[10px] px-3 py-1 border border-border tracking-[1px] transition-all flex items-center gap-2 ${playingIndex === idx ? 'border-accent text-accent' : 'text-muted hover:border-accent hover:text-accent'} disabled:opacity-50`}
                        >
                          {ttsLoading === idx ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : playingIndex === idx ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              STOP
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              PLAY VOICE
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(`${script.hook}\n\n${script.script}\n\n${script.broll || ''}`, idx)}
                          className={`font-mono text-[10px] px-3 py-1 border border-border tracking-[1px] transition-all flex items-center gap-2 ${copiedIndex === idx ? 'border-green text-green' : 'text-muted hover:border-accent2 hover:text-accent2'}`}
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3" />
                              COPIED!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              COPY
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="relative group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-block bg-accent text-black font-mono text-[10px] px-2 py-0.5 tracking-[1px] font-bold">HOOK</span>
                          <Edit3 className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <textarea 
                          value={script.hook}
                          onChange={(e) => updateScriptField(idx, 'hook', e.target.value)}
                          className="w-full bg-transparent border-none text-sm leading-relaxed text-[#ccc] p-0 outline-none resize-none focus:ring-0"
                          rows={2}
                        />
                      </div>
                      <div className="relative group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-block bg-surface border border-border text-muted font-mono text-[10px] px-2 py-0.5 tracking-[1px] font-bold uppercase">Main Script</span>
                          <Edit3 className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <textarea 
                          value={script.script}
                          onChange={(e) => updateScriptField(idx, 'script', e.target.value)}
                          className="w-full bg-transparent border-none text-sm leading-relaxed text-[#ccc] p-0 outline-none resize-none focus:ring-0"
                          rows={8}
                        />
                      </div>
                      {videoUrls[idx] && (
                        <div className="mt-4 border border-border bg-black aspect-[9/16] max-w-[300px] mx-auto overflow-hidden relative group">
                          <video 
                            src={videoUrls[idx]!} 
                            controls 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={videoUrls[idx]!} 
                              download={`brainrot_video_${idx + 1}.mp4`}
                              className="bg-accent text-black p-2 rounded-full shadow-lg block"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )}
                      {script.broll && (
                        <div className="mt-4 p-4 bg-[#0d1a0d] border-l-2 border-green text-green font-mono text-xs leading-relaxed">
                          <div className="text-[10px] tracking-[2px] mb-1.5 text-[#006633] uppercase">B-ROLL / GAMEPLAY NOTES</div>
                          {script.broll}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-6 px-5 py-4 border-t border-border bg-bg">
                      <div className="flex flex-col">
                        <span className="font-display text-xl text-accent2 leading-none">{script.viralScore}</span>
                        <span className="font-mono text-[9px] text-muted tracking-[1px] uppercase">Viral Score</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-display text-xl text-accent2 leading-none">{script.duration}</span>
                        <span className="font-mono text-[9px] text-muted tracking-[1px] uppercase">Est. Duration</span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-[150px]">
                        <span className="font-mono text-[11px] text-[#888] leading-tight mt-1">
                          {script.hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}
                        </span>
                        <span className="font-mono text-[9px] text-muted tracking-[1px] uppercase">Hashtags</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="font-mono text-[10px] text-accent tracking-[3px] uppercase">FORMULA APPLIED</div>
                  <div className="flex-1 h-[1px] bg-border" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Hook (<3 sec)', 'Dopamine Split', 'Pattern Interrupts', 'SFX Markers', 'Caption Cues', 'Hook → Payoff Loop', 'CTA Included'].map((item, i) => (
                    <div key={i} className="font-mono text-[10px] px-3 py-1.5 border border-green text-green tracking-[1px] flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
