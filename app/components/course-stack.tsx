import { Link } from "react-router";
import { BookOpen } from "lucide-react";
import { CourseImage } from "~/components/course-image";

type StackedCourse = {
  id: number;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  categoryName: string;
  lessonCount: number;
};

// Back to front: the first course sits on top, the others fan out behind it.
const FAN = [
  "z-30 translate-x-0 translate-y-0 rotate-0",
  "z-20 translate-x-10 -translate-y-8 rotate-6",
  "z-10 -translate-x-10 -translate-y-14 -rotate-6",
];

export function CourseStack({ courses }: { courses: StackedCourse[] }) {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-muted to-transparent blur-2xl"
      />
      {courses.slice(0, FAN.length).map((course, index) => (
        <Link
          key={course.id}
          to={`/courses/${course.slug}`}
          className={`absolute inset-x-6 bottom-0 overflow-hidden rounded-xl border border-border bg-card shadow-xl transition-transform hover:-translate-y-2 ${FAN[index]}`}
        >
          <CourseImage
            src={course.coverImageUrl}
            alt={course.title}
            className="aspect-video w-full object-cover"
          />
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {course.categoryName}
              </p>
              <p className="truncate font-semibold">{course.title}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="size-3" />
              {course.lessonCount} lessons
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
