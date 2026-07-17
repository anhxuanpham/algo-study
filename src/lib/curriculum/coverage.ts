import type { ContentModel, CoverageItem, CoverageReport, Lesson, Problem } from '../content/types';

export function calculateCoverage(
  model: ContentModel,
  tier: CoverageReport['tier'],
): CoverageReport {
  const domains = model.manifest.domains
    .map((requirement) => calculateDomainCoverage(model, requirement))
    .sort(byId);
  const patterns = model.manifest.patterns
    .map((requirement) => calculatePatternCoverage(model, requirement))
    .sort(byId);
  const allItems = [...domains, ...patterns];

  return {
    tier,
    domains,
    patterns,
    summary: {
      covered: allItems.filter((item) => item.status === 'covered').length,
      partial: allItems.filter((item) => item.status === 'partial').length,
      planned: allItems.filter((item) => item.status === 'planned').length,
      blocked: allItems.filter((item) => item.status === 'blocked').length,
    },
  };
}

function calculateDomainCoverage(
  model: ContentModel,
  requirement: ContentModel['manifest']['domains'][number],
): CoverageItem {
  const topics = model.topics.filter((entry) => entry.data.domain === requirement.id);
  const topicIds = new Set(topics.map((entry) => entry.id));
  const lessons = model.lessons.filter((entry) => topicIds.has(entry.data.topicId));
  const problems = model.problems.filter((entry) =>
    entry.data.topicIds.some((topicId) => topicIds.has(topicId)),
  );
  const publishedLessons = lessons.filter((entry) => entry.data.status === 'published');
  const publishedProblems = problems.filter((entry) => entry.data.status === 'published');
  const publishedLessonIds = new Set(publishedLessons.map((entry) => entry.id));
  const publishedAssessments = model.assessments.filter(
    (entry) => entry.data.status === 'published' && publishedLessonIds.has(entry.data.lessonId),
  );
  const concepts = new Set(publishedLessons.flatMap((entry) => entry.data.concepts));
  const missingConcepts = requirement.requiredConcepts.filter((concept) => !concepts.has(concept));
  const gaps: string[] = [];

  if (missingConcepts.length > 0) gaps.push(`missing concepts: ${missingConcepts.join(', ')}`);
  if (!publishedLessons.some((entry) => hasCompleteLessonEvidence(entry.data))) {
    gaps.push('missing published lesson with complete learning-loop evidence');
  }
  if (publishedAssessments.length === 0) gaps.push('missing published retrieval assessment');
  if (!publishedProblems.some((entry) => entry.data.kind === 'guided')) {
    gaps.push('missing published guided problem');
  }
  if (!publishedProblems.some((entry) => entry.data.kind === 'independent')) {
    gaps.push('missing published independent problem');
  }
  if (!publishedLessons.every((entry) => hasReviewEvidence(entry.data))) {
    gaps.push('published lessons are missing editorial/technical review evidence');
  }
  if (!publishedProblems.every((entry) => hasReviewEvidence(entry.data))) {
    gaps.push('published problems are missing editorial/technical review evidence');
  }

  const hasDraftEvidence = topics.length + lessons.length + problems.length > 0;
  const status =
    gaps.length === 0
      ? 'covered'
      : hasDraftEvidence
        ? 'partial'
        : requirement.blockedBy.length > 0
          ? 'blocked'
          : 'planned';

  return {
    id: requirement.id,
    titleVi: requirement.titleVi,
    mandatory: requirement.mandatory,
    status,
    evidence: [
      ...publishedLessons.map((entry) => `lesson:${entry.id}`),
      ...publishedAssessments.map((entry) => `assessment:${entry.id}`),
      ...publishedProblems.map((entry) => `problem:${entry.id}`),
    ].sort(),
    gaps,
  };
}

function calculatePatternCoverage(
  model: ContentModel,
  requirement: ContentModel['manifest']['patterns'][number],
): CoverageItem {
  const lessons = model.lessons.filter((entry) => entry.data.patternIds.includes(requirement.id));
  const problems = model.problems.filter((entry) => entry.data.patternIds.includes(requirement.id));
  const reviewedLesson = lessons.find(
    (entry) => entry.data.status === 'published' && hasReviewEvidence(entry.data),
  );
  const independentProblem = problems.find(
    (entry) =>
      entry.data.status === 'published' &&
      entry.data.kind === 'independent' &&
      hasReviewEvidence(entry.data),
  );
  const gaps: string[] = [];

  if (!reviewedLesson) gaps.push('missing published reviewed lesson');
  if (!independentProblem) gaps.push('missing published reviewed independent problem');

  return {
    id: requirement.id,
    titleVi: requirement.titleVi,
    mandatory: requirement.mandatory,
    status:
      gaps.length === 0 ? 'covered' : lessons.length + problems.length > 0 ? 'partial' : 'planned',
    evidence: [
      ...(reviewedLesson ? [`lesson:${reviewedLesson.id}`] : []),
      ...(independentProblem ? [`problem:${independentProblem.id}`] : []),
    ],
    gaps,
  };
}

function hasCompleteLessonEvidence(lesson: Lesson) {
  return Object.values(lesson.evidence).every(Boolean) && lesson.sources.length > 0;
}

function hasReviewEvidence(content: Lesson | Problem) {
  return Boolean(content.editorialReviewer && content.technicalReviewer && content.lastReviewedAt);
}

function byId(left: CoverageItem, right: CoverageItem) {
  return left.id.localeCompare(right.id, 'en');
}
