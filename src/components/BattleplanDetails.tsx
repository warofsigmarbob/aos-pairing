'use client';

import { GameMap } from '@/lib/types';
import Image from 'next/image';
import { useState } from 'react';

interface BattleplanDetailsProps {
  battleplan: GameMap;
  onClose: () => void;
}

export function BattleplanDetails({ battleplan, onClose }: BattleplanDetailsProps) {
  const [activeImage, setActiveImage] = useState<1 | 2>(1);
  const hasImages = battleplan.layoutImage1 || battleplan.layoutImage2;
  const hasDetails = battleplan.twist || battleplan.scoring;

  if (!hasDetails && !hasImages) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{battleplan.name}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <p>No details available for this battleplan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-semibold text-lg">{battleplan.name}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
          title="Back to pairing"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Images section */}
        {hasImages && (
          <div className="space-y-2">
            {/* Image tabs */}
            {battleplan.layoutImage1 && battleplan.layoutImage2 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveImage(1)}
                  className={`px-3 py-1 text-xs rounded ${
                    activeImage === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  Layout 1
                </button>
                <button
                  onClick={() => setActiveImage(2)}
                  className={`px-3 py-1 text-xs rounded ${
                    activeImage === 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  Layout 2
                </button>
              </div>
            )}

            {/* Image display */}
            <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
              {activeImage === 1 && battleplan.layoutImage1 && (
                <Image
                  src={battleplan.layoutImage1}
                  alt={`${battleplan.name} Layout 1`}
                  fill
                  className="object-contain"
                />
              )}
              {activeImage === 2 && battleplan.layoutImage2 && (
                <Image
                  src={battleplan.layoutImage2}
                  alt={`${battleplan.name} Layout 2`}
                  fill
                  className="object-contain"
                />
              )}
              {activeImage === 1 && !battleplan.layoutImage1 && battleplan.layoutImage2 && (
                <Image
                  src={battleplan.layoutImage2}
                  alt={`${battleplan.name} Layout`}
                  fill
                  className="object-contain"
                />
              )}
            </div>
          </div>
        )}

        {/* Twist section */}
        {battleplan.twist && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <h4 className="font-semibold text-amber-700 dark:text-amber-300 text-sm mb-2">
              TWIST
            </h4>
            <div className="text-xs text-amber-900 dark:text-amber-100 whitespace-pre-wrap">
              {battleplan.twist}
            </div>
          </div>
        )}

        {/* Scoring section */}
        {battleplan.scoring && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <h4 className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-2">
              SCORING
            </h4>
            <div className="text-xs text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
              {battleplan.scoring}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
