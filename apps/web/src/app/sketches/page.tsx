'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { deleteSketchAction } from '../actions';
import { WarningDiamond, MagicEdit } from 'pixelarticons/react';
import CanvasPanelError from '@/components/CanvasPanelError';
import SketchCard from '@/components/SketchCard';
import SketchSkeletonCard from '@/components/SketchSkeletonCard';
import { Sketch, GetSketchesResponse } from '@mangasketch/shared';
import { useUiStore } from '@/store/uiStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface GroupedSketch {
  rootId: string;
  sketches: Sketch[];
  latest: Sketch;
}

// Group sketches by root parent and sort chronologically within groups
const groupSketches = (flatSketches: Sketch[]): GroupedSketch[] => {
  if (!flatSketches || flatSketches.length === 0) return [];

  const groups: Record<string, Sketch[]> = {};

  for (const s of flatSketches) {
    const rootId = s.parent_id || s.id;
    if (!groups[rootId]) {
      groups[rootId] = [];
    }
    groups[rootId].push(s);
  }

  const result: GroupedSketch[] = [];

  for (const rootId of Object.keys(groups)) {
    const group = groups[rootId];
    // Sort each group chronologically (created_at ascending)
    group.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    // The latest variation in the group is used to render the card
    const latest = group[group.length - 1];

    result.push({
      rootId,
      sketches: group,
      latest,
    });
  }

  // Sort groups so that families with the most recent updates show first
  result.sort(
    (a, b) =>
      new Date(b.latest.created_at).getTime() -
      new Date(a.latest.created_at).getTime(),
  );

  return result;
};

export default function SketchesPage() {
  const { user, loading, session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  // Local Page States
  const [displayLimit, setDisplayLimit] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [sketchToDelete, setSketchToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Redirect to Home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Handle URL toast param on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('toast') === 'recovered') {
      showToast('success', 'SKETCH SECURED! Saved to sketchbook.', true);
      // Clean up parameter without reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [showToast]);

  // React Query Fetching
  const {
    data,
    isLoading: queryLoading,
    error,
    refetch,
  } = useQuery<GetSketchesResponse>({
    queryKey: ['sketches', user?.id],
    queryFn: async (): Promise<GetSketchesResponse> => {
      if (!session?.access_token) return { sketches: [] };
      const response = await fetch(`${API_BASE_URL}/api/sketches`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load sketches.');
      }
      return response.json() as Promise<GetSketchesResponse>;
    },
    enabled: !!session?.access_token,
  });

  const flatSketches = data?.sketches || [];
  const groupedSketches = groupSketches(flatSketches);
  const visibleSketches = groupedSketches.slice(0, displayLimit);

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!sketchToDelete || !session?.access_token) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteSketchAction(
        sketchToDelete,
        session.access_token,
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Successful deletion
      queryClient.invalidateQueries({ queryKey: ['sketches', user?.id] });
      showToast('deleted', 'SKETCH FAMILY SCRAPPED! Removed from sketchbook.', false);
      setSketchToDelete(null);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'An error occurred during deletion.';
      setDeleteError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Simulated Infinite Scroll Loader
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayLimit((prev) => prev + 12);
      setIsLoadingMore(false);
    }, 800);
  };

  // 1. Page Header Panel
  return (
    <div className='flex flex-col gap-6 md:gap-10'>
      <section className='flex flex-col md:flex-row md:items-end justify-between border-b-4 border-foreground pb-6 mb-4 gap-4'>
        <div>
          <h1 className='font-display text-4xl md:text-5xl tracking-wide uppercase mb-2'>
            MY SKETCHBOOK
          </h1>
          <p className='font-sans text-sm md:text-base text-neutral font-medium uppercase'>
            A collection of your generated sketches and visual concepts.
          </p>
        </div>
        <div className='font-mono text-sm font-bold border-2 border-foreground px-4 py-2 bg-background w-fit self-start md:self-end'>
          {loading || (queryLoading && flatSketches.length === 0) ? (
            <span className='animate-pulse'>[ ... ]</span>
          ) : (
            `[ ${groupedSketches.length} ${groupedSketches.length === 1 ? 'SKETCH' : 'SKETCHES'} ]`
          )}
        </div>
      </section>

      {/* 2. Loading State, Page-level Error, Empty State, or Content */}
      {loading || (queryLoading && flatSketches.length === 0) ? (
        /* Skeleton Grid */
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {[...Array(4)].map((_, i) => (
            <SketchSkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className='flex flex-col items-center justify-center p-6 border-4 border-foreground bg-background neo-shadow max-w-xl mx-auto my-12'>
          <CanvasPanelError error={error.message || 'Failed to fetch sketchbook'} />
          <button
            onClick={() => refetch()}
            className='mt-6 font-display text-lg px-8 py-3 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow-sm cursor-pointer transition-all uppercase'
          >
            RETRY
          </button>
        </div>
      ) : groupedSketches.length === 0 ? (
        /* Empty State */
        <section className='border-4 border-dashed border-foreground/30 p-12 text-center bg-background max-w-xl mx-auto my-12 neo-shadow-sm'>
          <h2 className='font-display text-3xl md:text-4xl tracking-wide uppercase mb-4'>
            EMPTY SKETCHBOOK
          </h2>
          <p className='font-sans text-sm text-neutral mb-8 uppercase font-medium'>
            No sketches saved yet.
            <br />
            Open the canvas to start sketching!
          </p>
          <Link
            href='/'
            className='inline-block font-display text-lg px-8 py-4 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow cursor-pointer transition-all uppercase'
          >
            START SKETCHING
          </Link>
        </section>
      ) : (
        <>
          {/* Sketches Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {visibleSketches.map(({ rootId, sketches, latest }) => (
              <SketchCard
                key={rootId}
                rootId={rootId}
                sketches={sketches}
                latest={latest}
                onSelect={(id) => router.push(`/sketches/${id}`)}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </div>

          {/* Infinite Scroll Simulator */}
          <div className='flex justify-center mt-12 mb-6'>
            {displayLimit < groupedSketches.length ? (
              isLoadingMore ? (
                <div className='flex items-center gap-2 font-mono text-xs uppercase tracking-widest animate-pulse-slow'>
                  <MagicEdit className='w-4 h-4 animate-sketch' />
                  Inking more sketches...
                </div>
              ) : (
                <button
                  onClick={handleLoadMore}
                  className='font-display text-lg px-8 py-3 border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow-sm cursor-pointer transition-all uppercase'
                >
                  INK MORE PANELS
                </button>
              )
            ) : (
              <div className='flex flex-col items-center justify-center py-4 w-full'>
                <div className='w-24 border-t-2 border-double border-foreground mb-2' />
                <span className='font-mono text-[10px] text-neutral tracking-widest uppercase'>
                  — END OF SKETCHBOOK —
                </span>
                <div className='w-24 border-t-2 border-double border-foreground mt-2' />
              </div>
            )}
          </div>
        </>
      )}

      {/* 5. Delete Confirmation Modal */}
      {sketchToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          {/* Backdrop */}
          <div
            className='fixed inset-0 bg-background/80 backdrop-blur-sm'
            onClick={() => !isDeleting && setSketchToDelete(null)}
          />

          {/* Modal Box */}
          <div className='bg-background border-4 border-foreground p-6 max-w-md w-full relative z-10 neo-shadow-lg text-center flex flex-col items-center'>
            <div className='text-destructive mb-4'>
              <WarningDiamond className='w-12 h-12' />
            </div>

            <h3 className='font-display text-2xl text-destructive uppercase tracking-wide mb-3'>
              SCRAP THIS DRAFT?
            </h3>

            <p className='font-sans text-sm text-neutral mb-6 uppercase font-medium leading-relaxed'>
              Are you sure you want to permanently erase this sketch? This
              action cannot be undone.
            </p>

            {/* Inline Error Alert */}
            {deleteError && (
              <div className='w-full border-2 border-destructive bg-destructive/10 p-3 mb-6 text-left'>
                <span className='font-mono text-xs font-bold text-destructive'>
                  [!] FAILURE: {deleteError}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className='flex flex-col sm:flex-row gap-3 w-full'>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className='flex-1 font-display py-3 border-2 border-destructive bg-destructive text-white hover:bg-background hover:text-destructive active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase cursor-pointer'
              >
                {isDeleting ? 'ERASING...' : 'SCRAP DRAFT'}
              </button>
              <button
                onClick={() => setSketchToDelete(null)}
                disabled={isDeleting}
                className='flex-1 font-display py-3 border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase cursor-pointer'
              >
                KEEP SKETCH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Trigger modal settings
  function handleDeleteClick(latest: Sketch) {
    const rootId = latest.parent_id || latest.id;
    setSketchToDelete(rootId);
    setDeleteError(null);
  }
}
