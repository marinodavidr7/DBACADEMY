import type { Certificate, Course, Enrollment } from '../types';

export interface PrerequisiteStatus {
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
  progressPercent: number;
  hasCertificate: boolean;
}

export interface CoursePrerequisiteEvaluation {
  hasPrerequisites: boolean;
  allCompleted: boolean;
  unmetPrerequisites: PrerequisiteStatus[];
  prerequisites: PrerequisiteStatus[];
  firstUnmetCourse: Course | null;
}

/**
 * Checks whether all prerequisite courses for a given course have been completed (100% progress or certificate).
 * Admin bypasses checks unless viewAsStudent is enabled.
 */
export function checkCoursePrerequisites(params: {
  course: Course | null | undefined;
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  isAdmin?: boolean;
  viewAsStudent?: boolean;
}): CoursePrerequisiteEvaluation {
  const {
    course,
    courses,
    enrollments,
    certificates,
    isAdmin = false,
    viewAsStudent = false,
  } = params;

  if (!course || !course.prerequisites || course.prerequisites.length === 0) {
    return {
      hasPrerequisites: false,
      allCompleted: true,
      unmetPrerequisites: [],
      prerequisites: [],
      firstUnmetCourse: null,
    };
  }

  const effectiveAdmin = isAdmin && !viewAsStudent;

  const prerequisites: PrerequisiteStatus[] = course.prerequisites.map((prereqId) => {
    const prereqCourse = courses.find((c) => c.id === prereqId);
    const enrollment = enrollments.find((e) => e.courseId === prereqId);
    const hasCertificate = certificates.some((c) => c.courseId === prereqId);
    const progressPercent = enrollment?.progressPercent ?? 0;
    const isCompleted = effectiveAdmin || hasCertificate || progressPercent >= 100;

    return {
      courseId: prereqId,
      courseTitle: prereqCourse?.title || prereqId,
      isCompleted,
      progressPercent,
      hasCertificate,
    };
  });

  const unmetPrerequisites = prerequisites.filter((p) => !p.isCompleted);
  const firstUnmet = unmetPrerequisites[0];

  return {
    hasPrerequisites: true,
    allCompleted: unmetPrerequisites.length === 0,
    unmetPrerequisites,
    prerequisites,
    firstUnmetCourse: firstUnmet
      ? courses.find((c) => c.id === firstUnmet.courseId) || null
      : null,
  };
}
