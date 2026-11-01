'use client';

import type { PubLocation, RouteHole } from '@/lib/types';
import { CourseEditor } from './CourseEditor';
import { RouteMapCard } from './RouteMapCard';
import { EmptyState } from './ui/EmptyState';

interface HostCourseTabProps {
  pubs: PubLocation[];
  course: RouteHole[];
  onSaveCourse: (holes: RouteHole[]) => Promise<void>;
}

/**
 * Course setup: the route map, the drinks assigned per route, and the shared par -
 * previously three separate destinations a host had to hunt for.
 */
export function HostCourseTab({ pubs, course, onSaveCourse }: HostCourseTabProps) {
  return (
    <div className="grid min-h-0 min-w-0 flex-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <RouteMapCard pubs={pubs} />

      {course.length === 0 ? (
        <EmptyState icon="🍺" description="Course unavailable — reload to try again" />
      ) : (
        <div className="min-w-0 space-y-4">
          <CourseEditor holes={course} onSave={onSaveCourse} />
        </div>
      )}
    </div>
  );
}
