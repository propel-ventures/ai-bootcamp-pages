export interface CourseCatalogItem {
  slug: string;
  courseNumber: number;
  weekLabel: string;
  title: string;
  description: string;
}

export const courseCatalog: CourseCatalogItem[] = [
  {
    slug: 'course-1',
    courseNumber: 1,
    weekLabel: 'Week 1',
    title: 'Elements of AI Engineering',
    description: 'Master AI coding assistants, working with models, context engineering, MCP, and enterprise foundations.',
  },
  {
    slug: 'course-2',
    courseNumber: 2,
    weekLabel: 'Week 2',
    title: 'AI Workflows & Engineering',
    description: 'Build production-ready AI workflows with frameworks, agentic development, and human-in-the-loop patterns.',
  },
];
