'use client';

import React, { useState, useEffect, useRef, startTransition } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  GetSketchDetailResponse,
  GetSketchesResponse,
  MangaStyle,
  DrawingStyle,
  WatermarkPosition,
  Sketch,
} from '@mangasketch/shared';
import CanvasPanelError from '@/components/CanvasPanelError';
import SketchSkeletonCard from '@/components/SketchSkeletonCard';
import MangaCanvas from '@/components/MangaCanvas';
import GenerateForm from '@/components/GenerateForm';
import { ArrowLeft, MagicEdit, Trash } from 'pixelarticons/react';
import { generateSketchAction, deleteSketchAction } from '../../actions';
import { useUiStore } from '@/store/uiStore';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SketchDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading, session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  // Stable ID to keep the react-query key stable across sibling version switches
  const [familyId, setFamilyId] = useState<string>(id);
  const activeVersionId = id;
  const [prevId, setPrevId] = useState(id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to canvas when re-generation starts (centered in viewport)
  useEffect(() => {
    if (isGenerating && canvasRef.current) {
      canvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isGenerating]);

  const [sketchToDelete, setSketchToDelete] = useState<{
    sketch: Sketch;
    label: string;
    index: number;
    isOriginal: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch sketch details and history versions
  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery<GetSketchDetailResponse>({
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
      const result = (await response.json()) as GetSketchDetailResponse;

      // If we queried a child ID, resolve the root parent ID and pre-populate its cache instantly
      const rootVersion = result.versions.find((v) => v.parent_id === null);
      if (rootVersion && rootVersion.id !== familyId) {
        queryClient.setQueryData(
          ['sketch-detail', rootVersion.id, user?.id],
          result,
        );
      }

      return result;
    },
    enabled: !!session?.access_token && !!familyId,
  });

  // 1. Synchronize familyId when the URL id parameter changes (navigated to different family)
  if (id !== prevId) {
    setPrevId(id);
    if (data?.versions) {
      const isPartOfFamily = data.versions.some((v) => v.id === id);
      if (!isPartOfFamily) {
        setFamilyId(id);
      }
    } else {
      setFamilyId(id);
    }
  }

  // 2. Lock familyId to the absolute root ID when family versions data is loaded
  if (data?.versions) {
    const rootVersion = data.versions.find((v) => v.parent_id === null);
    if (rootVersion && familyId !== rootVersion.id) {
      const isRouteIdInLoadedFamily = data.versions.some((v) => v.id === id);
      if (isRouteIdInLoadedFamily) {
        setFamilyId(rootVersion.id);
      }
    }
  }

  // Redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const activeSketch =
    data?.versions.find((v) => v.id === activeVersionId) || data?.sketch;

  const sortedVersions = data?.versions
    ? [...data.versions].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
    : [];
  const activeIndex = sortedVersions.findIndex(
    (v) => v.id === activeSketch?.id,
  );
  const activeLabel = activeSketch
    ? activeSketch.parent_id === null || activeIndex === 0
      ? 'V1 (ORIGINAL)'
      : `V${activeIndex + 1}`
    : '';

  const handleVersionSelect = (verId: string) => {
    setGenerationError(null); // Clear previous generation error when switching versions
    router.replace(`/sketches/${verId}`, { scroll: false });
  };

  const handleReSketchSubmit = async (formData: {
    prompt: string;
    mangaStyle: MangaStyle;
    drawingStyle: DrawingStyle;
    watermarkText: string;
    watermarkPosition: WatermarkPosition;
    lockSeed: boolean;
  }) => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const fd = new FormData();
      fd.append('prompt', formData.prompt);
      fd.append('mangaStyle', formData.mangaStyle);
      fd.append('drawingStyle', formData.drawingStyle);
      fd.append('watermarkText', formData.watermarkText || '');
      fd.append(
        'watermarkPosition',
        formData.watermarkPosition || 'BOTTOM_RIGHT',
      );
      fd.append('parentId', familyId);

      if (formData.lockSeed && activeSketch?.seed) {
        fd.append('seed', String(activeSketch.seed));
      }

      if (session?.access_token) {
        fd.append('token', session.access_token);
      }

      const response = await generateSketchAction(
        { data: null, error: null },
        fd,
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Failed to generate new sketch version.');
      }
      // Show global success toast (no header jiggle)
      showToast('success', 'New version successfully inked!', false);

      const newId = response.data.id;

      // Settle state, navigate, and invalidate cache as a single React transition
      startTransition(() => {
        setIsGenerating(false);
        router.replace(`/sketches/${newId}`, { scroll: false });
        queryClient.invalidateQueries({
          queryKey: ['sketch-detail', familyId, user?.id],
        });
      });
    } catch (err) {
      console.error('Re-sketch error:', err);
      const errMsg =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setGenerationError(errMsg);
      setIsGenerating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sketchToDelete || !session?.access_token) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteSketchAction(
        sketchToDelete.sketch.id,
        session.access_token,
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (sketchToDelete.isOriginal) {
        // Deleted entire family
        showToast(
          'deleted',
          'SKETCH SCRAPPED! Removed from sketchbook.',
          false,
          2500,
        );
        setSketchToDelete(null);

        // Optimistically remove the deleted sketch family from the gallery query cache
        queryClient.setQueryData<GetSketchesResponse>(
          ['sketches', user?.id],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              sketches: oldData.sketches.filter(
                (s: Sketch) =>
                  s.id !== sketchToDelete.sketch.id &&
                  s.parent_id !== sketchToDelete.sketch.id,
              ),
            };
          },
        );

        // Invalidate in the background
        queryClient.invalidateQueries({ queryKey: ['sketches', user?.id] });

        router.replace('/sketches');
      } else {
        // Deleted a specific version
        showToast(
          'deleted',
          'VERSION SCRAPPED! Removed from sketchbook.',
          false,
          2500,
        );

        // 1. Calculate the latest remaining version
        const remaining = sortedVersions.filter(
          (v) => v.id !== sketchToDelete.sketch.id,
        );
        const latestRemaining = remaining[remaining.length - 1];

        // 2. Clear modal state instantly
        setSketchToDelete(null);

        // 3. Optimistically update local query cache instantly to remove the deleted version
        queryClient.setQueryData<GetSketchDetailResponse>(
          ['sketch-detail', familyId, user?.id],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              versions: remaining,
            };
          },
        );

        // 4. Select the latest remaining version and redirect to it instantly if we deleted the active version
        const isActiveDeleted = sketchToDelete.sketch.id === activeVersionId;
        if (isActiveDeleted) {
          if (latestRemaining) {
            handleVersionSelect(latestRemaining.id);
          } else {
            router.replace('/sketches');
          }
        }

        // 5. Invalidate queries in the background (no await)
        queryClient.invalidateQueries({
          queryKey: ['sketch-detail', familyId, user?.id],
        });
      }
    } catch (err) {
      console.error('Delete sketch error:', err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'An error occurred during deletion.';
      setDeleteError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle loading state
  const isPageLoading = loading || (isLoading && !data);

  if (queryError || (!isPageLoading && !data)) {
    const errorMsg =
      queryError instanceof Error ? queryError.message : 'Sketch not found';
    return (
      <div className='flex flex-col items-center justify-center p-6 border-4 border-foreground bg-background neo-shadow max-w-xl mx-auto my-12 text-center'>
        <CanvasPanelError
          error={
            errorMsg === 'SKETCH_NOT_FOUND'
              ? 'Sketch not found or access denied.'
              : errorMsg
          }
        />
        <Link
          href='/sketches'
          className='mt-6 font-display text-lg px-8 py-3 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow-sm cursor-pointer transition-all uppercase inline-block'
        >
          BACK TO SKETCHBOOK
        </Link>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 md:gap-10'>
      {/* 1. Header Navigation */}
      <section className='flex flex-col md:flex-row md:items-end justify-between border-b-4 border-foreground pb-6 mb-4 gap-4'>
        <div>
          <Link
            href='/sketches'
            className='font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-neutral hover:text-foreground transition-colors mb-3 w-fit'
          >
            <ArrowLeft className='w-4 h-4' />
            BACK TO MY SKETCHBOOK
          </Link>
          <h1 className='font-display text-4xl md:text-5xl tracking-wide uppercase mb-2'>
            PANEL #{activeSketch?.id.slice(0, 8) || id.slice(0, 8)}
            {activeSketch && (
              <span className='text-xl md:text-2xl font-mono text-neutral ml-3 lowercase normal-case font-bold tracking-normal select-none'>
                [ {activeSketch.parent_id ? `version` : 'original sketch'} ]
              </span>
            )}
          </h1>
          <p className='font-sans text-sm md:text-base text-neutral font-medium uppercase'>
            Viewing details and history versions of this sketch concept.
          </p>
        </div>
      </section>

      {/* 2. Workspace Side-by-Side Grid */}
      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Left Column: Canvas View */}
        <section
          ref={canvasRef}
          className='lg:flex-[7] flex flex-col bg-background border-4 border-foreground neo-shadow aspect-[3/4] p-4'
        >
          <MangaCanvas
            imageUrl={activeSketch?.image_url}
            isPending={isPageLoading || isGenerating}
            loadingType={isPageLoading ? 'fetch' : 'generate'}
            error={generationError}
            prompt={activeSketch?.prompt}
            sketchId={activeSketch?.id}
            mangaStyle={activeSketch?.manga_style}
            drawingStyle={activeSketch?.drawing_style}
            seed={activeSketch?.seed}
            saved={true}
          />

          {/* Active Sketch Details */}
          {activeSketch && !isPageLoading && !isGenerating && (
            <div className='mt-4 border-2 border-foreground p-4 bg-background flex flex-col gap-2'>
              <div className='flex flex-wrap items-center justify-between text-xs font-mono font-bold text-neutral'>
                <span>
                  {activeLabel} • {activeSketch.manga_style} •{' '}
                  {activeSketch.drawing_style.replace(/_/g, ' ')}
                </span>
                <span>
                  CREATED:{' '}
                  {new Date(activeSketch.created_at)
                    .toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                    .toUpperCase()}
                </span>
              </div>
              <div className='font-mono text-[10px] font-bold text-neutral'>
                SEED: {activeSketch.seed}
              </div>
              <div className='border-t-2 border-foreground/10 my-2' />
              <div className='font-sans text-sm text-foreground font-medium uppercase leading-relaxed'>
                <span className='font-mono text-xs font-bold text-neutral block mb-1'>
                  MANGAKA PROMPT:
                </span>
                <div className='h-[72px] overflow-y-auto scrollbar-custom pr-1 font-sans text-xs text-foreground/90 uppercase'>
                  {activeSketch.prompt}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Re-sketch Form */}
        <GenerateForm
          key={isPageLoading ? 'loading' : activeSketch?.id}
          sketch={activeSketch}
          mode='edit'
          isPageLoading={isPageLoading}
          isGenerating={isGenerating}
          onSubmit={handleReSketchSubmit}
        />
      </div>

      {/* 3. Sketching Process Timeline Section */}
      <section className='bg-background border-4 border-foreground p-6 neo-shadow mt-8'>
        <h3 className='font-display text-2xl uppercase tracking-wide mb-4 flex items-center gap-2'>
          <MagicEdit className='w-6 h-6' />
          SKETCHING PROCESS{' '}
          <span className='font-sans text-xs text-neutral font-medium'>
            (VERSION HISTORY)
          </span>
        </h3>
        <div className='flex gap-4 overflow-x-auto pt-2 px-2 -mx-2 pb-4 scrollbar-custom'>
          {isPageLoading ? (
            [...Array(4)].map((_, i) => (
              <SketchSkeletonCard key={i} variant='timeline' />
            ))
          ) : (
            <>
              {data?.versions && data.versions.length > 0 ? (
                [...data.versions]
                  .sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime(),
                  )
                  .map((ver, idx) => {
                    const isActive = ver.id === activeVersionId;
                    const isOriginal = ver.parent_id === null;
                    const verLabel = isOriginal
                      ? 'V1 (ORIGINAL)'
                      : `V${idx + 1}`;

                    return (
                      <div
                        key={ver.id}
                        onClick={() => handleVersionSelect(ver.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleVersionSelect(ver.id);
                          }
                        }}
                        role='button'
                        tabIndex={0}
                        className={`w-28 md:w-32 flex-shrink-0 bg-background rounded-none flex flex-col text-left transition-all cursor-pointer group/version-card relative ${
                          isActive
                            ? 'border-4 border-foreground -translate-x-0.5 -translate-y-0.5 neo-shadow-sm'
                            : 'border-2 border-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-xs active:translate-x-0 active:translate-y-0'
                        }`}
                      >
                        {/* Image Container */}
                        <div className='aspect-[3/4] border-b-2 border-foreground bg-screentone-dense relative overflow-hidden w-full'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ver.image_url}
                            alt={verLabel}
                            className='w-full h-full object-cover select-none'
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                          />
                          {isActive && (
                            <div className='absolute top-1 left-1 bg-foreground text-background px-1 py-0.5 font-mono text-[8px] font-bold border border-background flex items-center gap-0.5 select-none z-10'>
                              ★ SELECTED
                            </div>
                          )}
                        </div>

                        {/* Version Details */}
                        <div className='p-2 flex flex-col gap-0.5 bg-background justify-between flex-1 font-mono text-[8px] w-full border-t border-foreground/10'>
                          <div className='font-bold text-foreground uppercase text-[9px]'>
                            {verLabel}
                          </div>
                          <div className='text-neutral font-semibold uppercase mt-0.5'>
                            {ver.manga_style}
                          </div>
                          <div className='text-neutral font-semibold uppercase leading-tight truncate'>
                            {ver.drawing_style.replace(/_/g, ' ')}
                          </div>
                          <div className='text-neutral/80 text-[7px] uppercase mt-1 leading-none'>
                            {new Date(ver.created_at)
                              .toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })
                              .toUpperCase()}
                          </div>
                        </div>

                        {/* Trash Button */}
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSketchToDelete({
                              sketch: ver,
                              label: verLabel,
                              index: idx,
                              isOriginal: isOriginal,
                            });
                            setDeleteError(null);
                          }}
                          className='absolute bottom-1.5 right-1.5 bg-background text-foreground border border-foreground p-1 hover:text-destructive hover:scale-110 cursor-pointer z-20 flex items-center justify-center transition-all opacity-0 group-hover/version-card:opacity-100 focus:opacity-100'
                          title={
                            isOriginal
                              ? 'Delete entire sketch family'
                              : 'Delete this version'
                          }
                        >
                          <Trash className='w-3.5 h-3.5' />
                        </button>
                      </div>
                    );
                  })
              ) : (
                <div className='text-center w-full py-6 font-mono text-xs text-neutral uppercase'>
                  No versions available.
                </div>
              )}
              {isGenerating && <SketchSkeletonCard variant='timeline' />}
            </>
          )}
        </div>
      </section>

      {/* 5. Delete Confirmation Modal */}
      {sketchToDelete && (
        <DeleteConfirmationModal
          isOpen={!!sketchToDelete}
          onClose={() => setSketchToDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title={
            sketchToDelete.isOriginal
              ? 'SCRAP THIS ENTIRE SKETCH FAMILY?'
              : 'SCRAP THIS VERSION?'
          }
          description={
            sketchToDelete.isOriginal
              ? 'Are you sure you want to permanently erase this sketch family? This will erase the entire family of sketch versions.'
              : 'Are you sure you want to permanently erase this version? This will erase only this version.'
          }
          confirmText={
            sketchToDelete.isOriginal ? 'SCRAP SKETCH' : 'SCRAP VERSION'
          }
          cancelText={
            sketchToDelete.isOriginal ? 'KEEP SKETCH' : 'KEEP VERSION'
          }
          badgeText={
            sketchToDelete.isOriginal
              ? '[ ORIGINAL SKETCH ]'
              : `[ ${sketchToDelete.label} ]`
          }
          imageUrl={sketchToDelete.sketch.image_url || ''}
          mangaStyle={sketchToDelete.sketch.manga_style || ''}
          drawingStyle={sketchToDelete.sketch.drawing_style || ''}
          prompt={sketchToDelete.sketch.prompt || ''}
          createdAt={sketchToDelete.sketch.created_at || ''}
        />
      )}
    </div>
  );
}
