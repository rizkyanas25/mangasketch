'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { GetSketchDetailResponse, MangaStyle, DrawingStyle, WatermarkPosition } from '@mangasketch/shared';
import ErrorPanel from '@/components/ErrorPanel';
import SketchSkeletonCard from '@/components/SketchSkeletonCard';
import MangaCanvas from '@/components/MangaCanvas';
import StyleSelector from '@/components/StyleSelector';
import { ArrowLeft, MagicEdit } from 'pixelarticons/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SketchDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading, session } = useAuth();
  const router = useRouter();

  // Local state to track which version is currently active/selected
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  // Local state for form controls
  const [prompt, setPrompt] = useState('');
  const [mangaStyle, setMangaStyle] = useState<MangaStyle | null>(null);
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle | null>(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('BOTTOM_RIGHT');
  const [lockSeed, setLockSeed] = useState(false);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch sketch details and history versions
  const { data, isLoading, error } = useQuery<GetSketchDetailResponse>({
    queryKey: ['sketch-detail', id, user?.id],
    queryFn: async (): Promise<GetSketchDetailResponse> => {
      if (!session?.access_token) throw new Error('Unauthorized');
      const response = await fetch(`${API_BASE_URL}/api/sketches/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('SKETCH_NOT_FOUND');
        }
        throw new Error('Failed to load sketch details.');
      }
      return response.json() as Promise<GetSketchDetailResponse>;
    },
    enabled: !!session?.access_token && !!id,
  });

  // Initialize activeVersionId to the URL parameter ID on load
  useEffect(() => {
    if (data && !activeVersionId) {
      const hasUrlId = data.versions.some((v) => v.id === id);
      if (hasUrlId) {
        setActiveVersionId(id);
      } else if (data.versions.length > 0) {
        // Fallback to the latest version in chronological order (last item)
        setActiveVersionId(data.versions[data.versions.length - 1].id);
      }
    }
  }, [data, id, activeVersionId]);

  const activeSketch = data?.versions.find((v) => v.id === activeVersionId) || data?.sketch;

  // Pre-fill form fields with active sketch metadata when it changes
  useEffect(() => {
    if (activeSketch) {
      setPrompt(activeSketch.prompt);
      setMangaStyle(activeSketch.manga_style as MangaStyle);
      setDrawingStyle(activeSketch.drawing_style as DrawingStyle);
    }
  }, [activeSketch]);

  // Handle loading state
  const isPageLoading = loading || (isLoading && !data);

  if (error || (!isPageLoading && !data)) {
    const errorMsg = error instanceof Error ? error.message : 'Sketch not found';
    return (
      <div className="flex flex-col items-center justify-center p-6 border-4 border-foreground bg-background neo-shadow max-w-xl mx-auto my-12 text-center">
        <ErrorPanel error={errorMsg === 'SKETCH_NOT_FOUND' ? 'Sketch not found or access denied.' : errorMsg} />
        <Link
          href="/sketches"
          className="mt-6 font-display text-lg px-8 py-3 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow-sm cursor-pointer transition-all uppercase inline-block"
        >
          BACK TO SKETCHBOOK
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      {/* 1. Header Navigation */}
      <section className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-foreground pb-6 mb-4 gap-4">
        <div>
          <Link
            href="/sketches"
            className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-neutral hover:text-foreground transition-colors mb-3 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO MY SKETCHBOOK
          </Link>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide uppercase mb-2">
            PANEL #{activeSketch?.id.slice(0, 8) || id.slice(0, 8)}
            {activeSketch && (
              <span className="text-xl md:text-2xl font-mono text-neutral ml-3 lowercase normal-case font-bold tracking-normal select-none">
                [ {activeSketch.parent_id ? `version` : 'original sketch'} ]
              </span>
            )}
          </h1>
          <p className="font-sans text-sm md:text-base text-neutral font-medium uppercase">
            Viewing details and history versions of this sketch concept.
          </p>
        </div>
      </section>

      {/* 2. Workspace Side-by-Side Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Canvas View */}
        <section className="lg:flex-[7] flex flex-col bg-background border-4 border-foreground neo-shadow aspect-[3/4] p-4">
          <MangaCanvas
            imageUrl={activeSketch?.image_url}
            isPending={isPageLoading}
            error={null}
            prompt={activeSketch?.prompt}
          />
          
          {/* Active Sketch Details */}
          {activeSketch && !isPageLoading && (
            <div className="mt-4 border-2 border-foreground p-4 bg-background flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between text-xs font-mono font-bold text-neutral">
                <span>
                  {activeSketch.parent_id ? 'VERSION' : 'ORIGINAL'} • {activeSketch.manga_style} • {activeSketch.drawing_style.replace(/_/g, ' ')}
                </span>
                <span>
                  CREATED: {new Date(activeSketch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                </span>
              </div>
              <div className="font-mono text-[10px] font-bold text-neutral">
                SEED: {activeSketch.seed}
              </div>
              <div className="border-t-2 border-foreground/10 my-2" />
              <div className="font-sans text-sm text-foreground font-medium uppercase leading-relaxed">
                <span className="font-mono text-xs font-bold text-neutral block mb-1">MANGAKA PROMPT:</span>
                {activeSketch.prompt}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Re-ink Form */}
        <form className="lg:flex-[5] flex flex-col gap-6 bg-background border-4 border-foreground p-6 neo-shadow">
          {/* Describe prompt textarea */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-bold uppercase tracking-wider flex justify-between">
              <span>DESCRIBE YOUR SCENE</span>
              <span className="text-neutral">{prompt?.length || 0}/500</span>
            </label>
            <textarea
              disabled={isPageLoading}
              value={isPageLoading ? '' : prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isPageLoading ? 'LOADING SKETCH...' : 'DESCRIBE YOUR SCENE...'}
              className="w-full min-h-[120px] p-3 border-2 border-foreground bg-background text-foreground font-mono text-sm placeholder:font-mono placeholder:text-sm placeholder:text-neutral focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all resize-none rounded-none uppercase"
            />
          </div>

          {/* Style Selector */}
          <StyleSelector
            mangaStyle={isPageLoading ? null : mangaStyle}
            setMangaStyle={setMangaStyle || (() => {})}
            drawingStyle={isPageLoading ? null : drawingStyle}
            setDrawingStyle={setDrawingStyle || (() => {})}
            watermarkText={watermarkText}
            setWatermarkText={setWatermarkText}
            watermarkPosition={watermarkPosition}
            setWatermarkPosition={setWatermarkPosition}
            disabled={isPageLoading}
          />

          {/* Lock Seed Toggle */}
          <div className="flex items-center gap-2 font-mono text-xs border-2 border-foreground p-3 bg-background">
            <input
              type="checkbox"
              id="lockSeed"
              disabled={isPageLoading || !activeSketch}
              checked={lockSeed}
              onChange={(e) => setLockSeed(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-foreground rounded-none"
            />
            <label htmlFor="lockSeed" className="cursor-pointer uppercase font-bold flex-1 flex justify-between items-center group relative">
              <span>LOCK VARIATION SEED</span>
              <span className="text-neutral">[ SEED: {activeSketch?.seed || '...'} ]</span>
              
              {/* Tooltip */}
              <span className="absolute bottom-6 left-0 hidden group-hover:block bg-background border-2 border-foreground p-2 text-[10px] text-foreground w-64 neo-shadow-sm z-30 normal-case font-medium">
                Locks the composition seed to keep characters and layout consistent while you refine prompts or styles.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPageLoading || !prompt.trim()}
            className="w-full font-display text-lg md:text-xl py-4 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground disabled:hover:text-background disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:shadow-none uppercase flex items-center justify-center gap-2"
          >
            <MagicEdit className={`w-5 h-5 ${isPageLoading ? 'animate-sketch' : ''}`} />
            {isPageLoading ? 'LOADING SKETCH...' : 'RE-INK & RESKETCH PANEL'}
          </button>
        </form>
      </div>

      {/* 3. Sketching Process Timeline Section */}
      <section className="bg-background border-4 border-foreground p-6 neo-shadow mt-8">
        <h3 className="font-display text-2xl uppercase tracking-wide mb-4 flex items-center gap-2">
          <MagicEdit className="w-6 h-6 animate-sketch" />
          SKETCHING PROCESS <span className="font-sans text-xs text-neutral font-medium">(VERSION HISTORY)</span>
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-custom">
          {isPageLoading ? (
            [...Array(4)].map((_, i) => (
              <SketchSkeletonCard key={i} variant="timeline" />
            ))
          ) : (
            data?.versions?.map((ver, idx) => (
              <div key={ver.id} className="w-28 md:w-32 flex-shrink-0 border-2 border-foreground p-2 bg-background font-mono text-[10px] uppercase font-bold text-neutral">
                {ver.parent_id ? `VERSION ${idx + 1}` : 'ORIGINAL'}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
