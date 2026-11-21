import { Link } from "react-router";
import { useState, useEffect, type ReactNode } from "react";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { BookOpen, ArrowRight, Check, User, Moon, Sun } from "lucide-react";
import { CourseImage } from "~/components/course-image";
import { CourseStack } from "~/components/course-stack";
import { DevUI } from "~/components/dev-ui";
import { getCurrentUserId, getDevCountry } from "~/lib/session";
import { getCountryTierInfo, COUNTRIES } from "~/lib/ppp";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { users } from "~/db/schema";
import { catalog } from "~/modules/catalog/index.server";
import { catalogUrlForCategory } from "~/modules/catalog";

const FEATURED_COURSE_LIMIT = 3;

function getAllUsers() {
  return db.select().from(users).all();
}

function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

// `to` is optional so a stat whose target is not on the page (Categories when
// no category is browsable) renders as plain text, not a dead link.
function HeroStat({
  to,
  value,
  label,
}: {
  to?: string;
  value: ReactNode;
  label: string;
}) {
  const body = (
    <>
      <span className="block text-3xl font-bold tracking-tight">{value}</span>
      <span className="text-sm text-muted-foreground group-hover:text-primary">
        {label}
      </span>
    </>
  );
  return to ? (
    <Link to={to} className="group">
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  );
}

export function meta() {
  return [
    { title: "Cadence — Learn at your own pace" },
    {
      name: "description",
      content:
        "A modern course platform for developers. Browse courses, track your progress, and learn at your own pace.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const featured = catalog.listFeaturedCourses(FEATURED_COURSE_LIMIT);
  const totalCourses = catalog.countPublishedCourses();
  const categories = catalog.listBrowsableCategories();
  const users = getAllUsers();
  const currentUserId = await getCurrentUserId(request);
  const currentUser = currentUserId ? getUserById(currentUserId) : null;
  const devCountry = await getDevCountry(request);
  const countryTierInfo = getCountryTierInfo(devCountry);

  return {
    featuredCourses: featured,
    totalCourses,
    categories,
    users: users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    currentUser: currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : null,
    devCountry,
    countryTierInfo,
    countries: COUNTRIES,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    featuredCourses,
    totalCourses,
    categories,
    users,
    currentUser,
    devCountry,
    countryTierInfo,
    countries,
  } = loaderData;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDarkMode() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cadence-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Cadence
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/courses"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Courses
            </Link>
            <button
              onClick={toggleDarkMode}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
            {currentUser ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log In
                </Link>
                <Button asChild size="sm">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--color-muted),transparent_60%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Courses for developers
            </p>
            <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Learn to code,
              <br />
              <span className="text-muted-foreground">at your own pace</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Structured courses built by experienced instructors. Track your
              progress, take quizzes, and build real-world skills.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/courses">
                  Browse Courses
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              {currentUser ? (
                <Button asChild size="lg" variant="outline">
                  <Link to="/dashboard">Go to your dashboard</Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link to="/signup">Sign up free</Link>
                </Button>
              )}
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Self-paced", "Quizzes", "Progress tracking"].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-12 flex gap-10 border-t border-border pt-8">
              <HeroStat
                to="/courses"
                value={totalCourses}
                label="Available Courses"
              />
              <HeroStat
                to={categories.length > 0 ? "#categories" : undefined}
                value={categories.length}
                label="Categories"
              />
            </div>
          </div>
          {featuredCourses.length > 0 && (
            <CourseStack courses={featuredCourses} />
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section
          id="categories"
          className="mx-auto max-w-6xl scroll-mt-8 px-6 pt-20"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Browse by Category
          </h2>
          <p className="mt-2 text-muted-foreground">
            Pick a topic to see every course in it
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  to={catalogUrlForCategory(category.slug)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {category.name}
                  <span className="text-xs text-muted-foreground">
                    {category.courseCount}{" "}
                    {category.courseCount === 1 ? "course" : "courses"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featuredCourses.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Featured Courses
              </h2>
              <p className="mt-2 text-muted-foreground">
                Start learning with our most popular courses
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/courses">
                View all
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden pt-0 transition-shadow group-hover:shadow-md">
                  <CourseImage
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="aspect-video w-full object-cover"
                  />
                  <CardHeader>
                    <h3 className="font-semibold leading-snug group-hover:text-primary">
                      {course.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      {course.instructorName ?? "Instructor"}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3" />
                      {course.lessonCount} lessons
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link to="/" className="text-lg font-bold tracking-tight">
              Cadence
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Structured courses for developers, at your own pace.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link
              to="/courses"
              className="text-muted-foreground hover:text-foreground"
            >
              Courses
            </Link>
            {currentUser ? (
              <Link
                to="/dashboard"
                className="text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </footer>

      <DevUI
        users={users}
        currentUser={currentUser}
        devCountry={devCountry}
        countryTierInfo={countryTierInfo}
        countries={countries}
      />
    </div>
  );
}
