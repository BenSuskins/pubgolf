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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <RouteMapCard pubs={pubs} />

      {course.length === 0 ? (
        <EmptyState icon="🍺" description="Course unavailable — reload to try again" />
      ) : (
        <CourseEditor holes={course} onSave={onSaveCourse} />
      )}
    </div>
  );
}
