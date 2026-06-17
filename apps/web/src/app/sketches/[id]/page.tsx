'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { GetSketchDetailResponse, MangaStyle, DrawingStyle, WatermarkPosition } from '@mangasketch/shared';
import CanvasPanelError from '@/components/CanvasPanelError';
import SketchSkeletonCard from '@/components/SketchSkeletonCard';
import MangaCanvas from '@/components/MangaCanvas';
import GenerateForm from '@/components/GenerateForm';
import { ArrowLeft, MagicEdit } from 'pixelarticons/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SketchDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading, session } = useAuth();
  const router = useRouter();

  // Local state to track which version is currently active/selected
  const [activeVersionId, setActiveVersionId] = useState<string>(id);

  // Stable ID to keep the react-query key stable across sibling version switches
  const [familyId, setFamilyId] = useState<string>(id);

  // Keep track of the last URL parameter ID we saw to detect transitions
  const [prevId, setPrevId] = useState<string>(id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Fetch sketch details and history versions
  const { data, isLoading, error: queryError } = useQuery<GetSketchDetailResponse>({
    queryKey: ['sketch-detail', familyId, user?.id],
    queryFn: async (): Promise<GetSketchDetailResponse> => {
      if (!session?.access_token) throw new Error('Unauthorized');
      const response = await fetch(`${API_BASE_URL}/api/sketches/${familyId}`, {
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
    enabled: !!session?.access_token && !!familyId,
  });

  // Render-time state synchronization when the URL ID changes
  if (id !== prevId) {
    setPrevId(id);
    setActiveVersionId(id);

    // Sync familyId with URL param `id` if it's a completely new sketch family
    const isPartOfFamily = data?.versions.some((v) => v.id === id);
    if (!isPartOfFamily) {
      setFamilyId(id);
    }
  }

  // Redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const activeSketch = data?.versions.find((v) => v.id === activeVersionId) || data?.sketch;

  const handleVersionSelect = (verId: string) => {
    setActiveVersionId(verId);
    setGenerationError(null); // Clear previous generation error when switching versions
    router.replace(`/sketches/${verId}`, { scroll: false });
  };

  const handleReInkSubmit = async (formData: {
    prompt: string;
    mangaStyle: MangaStyle;
    drawingStyle: DrawingStyle;
    watermarkText: string;
    watermarkPosition: WatermarkPosition;
    lockSeed: boolean;
  }) => {
    console.log('Re-ink form submitted:', formData);
  };

  // Handle loading state
  const isPageLoading = loading || (isLoading && !data);

  if (queryError || (!isPageLoading && !data)) {
    const errorMsg = queryError instanceof Error ? queryError.message : 'Sketch not found';
    return (
      <div className="flex flex-col items-center justify-center p-6 border-4 border-foreground bg-background neo-shadow max-w-xl mx-auto my-12 text-center">
        <CanvasPanelError error={errorMsg === 'SKETCH_NOT_FOUND' ? 'Sketch not found or access denied.' : errorMsg} />
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
            isPending={isPageLoading || isGenerating}
            loadingType={isPageLoading ? 'fetch' : 'generate'}
            error={generationError}
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
        <GenerateForm
          key={isPageLoading ? 'loading' : activeSketch?.id}
          sketch={activeSketch}
          mode="edit"
          isPageLoading={isPageLoading}
          isGenerating={isGenerating}
          onSubmit={handleReInkSubmit}
        />
      </div>

      {/* 3. Sketching Process Timeline Section */}
      <section className="bg-background border-4 border-foreground p-6 neo-shadow mt-8">
        <h3 className="font-display text-2xl uppercase tracking-wide mb-4 flex items-center gap-2">
          <MagicEdit className="w-6 h-6" />
          SKETCHING PROCESS <span className="font-sans text-xs text-neutral font-medium">(VERSION HISTORY)</span>
        </h3>
        <div className="flex gap-4 overflow-x-auto pt-2 pb-4 scrollbar-custom">
          {isPageLoading ? (
            [...Array(4)].map((_, i) => (
              <SketchSkeletonCard key={i} variant="timeline" />
            ))
          ) : data?.versions && data.versions.length > 0 ? (
            [...data.versions]
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((ver, idx) => {
                const isActive = ver.id === activeVersionId;
                const isOriginal = ver.parent_id === null;
                const verLabel = isOriginal ? 'V1 (ORIGINAL)' : `V${idx + 1}`;
                
                return (
                  <button
                    key={ver.id}
                    type="button"
                    onClick={() => handleVersionSelect(ver.id)}
                    className={`w-28 md:w-32 flex-shrink-0 bg-background rounded-none flex flex-col text-left transition-all cursor-pointer group/version-card ${
                      isActive
                        ? 'border-4 border-foreground -translate-y-1 neo-shadow-sm'
                        : 'border-2 border-foreground hover:-translate-y-0.5 hover:neo-shadow-xs active:translate-y-0'
                    }`}
                  >
                    {/* Image Container */}
                    <div className="aspect-[3/4] border-b-2 border-foreground bg-screentone-dense relative overflow-hidden w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ver.image_url}
                        alt={verLabel}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/version-card:scale-102"
                      />
                      {isActive && (
                        <div className="absolute top-1 left-1 bg-foreground text-background px-1 py-0.5 font-mono text-[8px] font-bold border border-background flex items-center gap-0.5 select-none z-10">
                          ★ SELECTED
                        </div>
                      )}
                    </div>
                    
                    {/* Version Details */}
                    <div className="p-1.5 flex flex-col gap-1 bg-background justify-between flex-1 font-mono text-[9px] w-full">
                      <div className="flex items-center justify-between text-neutral font-bold w-full">
                        <span>{verLabel}</span>
                        <span className="text-[8px]">{ver.manga_style}</span>
                      </div>
                      
                      {/* Prompt without tooltip */}
                      <div className="mt-0.5 w-full">
                        <p className="line-clamp-2 text-foreground font-sans text-[9px] font-medium leading-tight uppercase">
                          {ver.prompt}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
          ) : (
            <div className="text-center w-full py-6 font-mono text-xs text-neutral uppercase">
              No versions available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
