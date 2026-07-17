import path from 'node:path';
import { calculateCoverage } from '../curriculum/coverage';
import { findPrerequisiteCycles } from '../curriculum/graph';
import type {
  CollectionName,
  ContentModel,
  CoverageReport,
  SourceEntry,
  ValidationIssue,
  ValidationResult,
} from './types';

export function validateContentModel(
  model: ContentModel,
  tier: CoverageReport['tier'],
): ValidationResult {
  const issues: ValidationIssue[] = [];
  validateGlobalIds(model, issues);
  validateFilenames(model, issues);
  validateReferences(model, issues);
  validateTopicGraph(model, issues);
  validateIdentity(model, issues);
  validatePublishedPolicy(model, issues);
  validateLessonBodies(model, issues);
  validateAssessments(model, issues);

  const coverage = calculateCoverage(model, tier);
  if (tier === 'v1.0') {
    for (const item of [...coverage.domains, ...coverage.patterns]) {
      if (item.mandatory && item.status !== 'covered') {
        issues.push({
          code: 'COVERAGE_GAP',
          id: item.id,
          message: `${item.titleVi}: ${item.status}; ${item.gaps.join('; ')}`,
          recovery: 'Publish reviewed learning-loop evidence for every mandatory gap.',
        });
      }
    }
  }

  return { issues: sortIssues(issues), coverage };
}

function validateGlobalIds(model: ContentModel, issues: ValidationIssue[]) {
  const byId = new Map<string, SourceEntry[]>();
  for (const entry of allEntries(model)) {
    const matches = byId.get(entry.id) ?? [];
    matches.push(entry);
    byId.set(entry.id, matches);
  }

  for (const [id, entries] of byId) {
    if (entries.length < 2) continue;
    const paths = entries.map((entry) => entry.sourcePath).sort();
    for (const entry of entries) {
      issues.push({
        code: 'DUPLICATE_GLOBAL_ID',
        id,
        sourcePath: entry.sourcePath,
        message: `Global ID "${id}" appears in: ${paths.join(', ')}`,
        recovery: 'Rename draft IDs before publish; canonical IDs must be globally unique.',
      });
    }
  }
}

function validateFilenames(model: ContentModel, issues: ValidationIssue[]) {
  for (const entry of allEntries(model)) {
    const filenameId = path.basename(entry.sourcePath).replace(/\.(?:md|mdx|ya?ml)$/i, '');
    if (filenameId !== entry.id) {
      addIssue(
        issues,
        entry,
        'CANONICAL_ID_MISMATCH',
        `Filename "${filenameId}" does not match canonical frontmatter ID "${entry.id}".`,
        `Rename the file to ${entry.id}${path.extname(entry.sourcePath)}.`,
      );
    }
  }
}

function validateReferences(model: ContentModel, issues: ValidationIssue[]) {
  const ids = indexIds(model);
  const topicsById = new Map(model.topics.map((entry) => [entry.id, entry]));
  const lessonsById = new Map(model.lessons.map((entry) => [entry.id, entry]));
  const assessmentsById = new Map(model.assessments.map((entry) => [entry.id, entry]));
  const manifestDomains = new Set(model.manifest.domains.map((domain) => domain.id));
  const manifestPatterns = new Set(model.manifest.patterns.map((pattern) => pattern.id));
  const tracksByTopic = new Set<string>();
  const topicsByLesson = new Set<string>();
  const topicsByProblem = new Set<string>();
  const lessonsByAssessment = new Set<string>();

  for (const track of model.tracks) {
    validateUniqueOrder(track, track.data.topicIds, 'topicIds', issues);
    for (const topicId of track.data.topicIds) {
      tracksByTopic.add(topicId);
      requireId(track, topicId, 'topics', ids, issues);
    }
  }

  for (const topic of model.topics) {
    validateUniqueOrder(topic, topic.data.lessonIds, 'lessonIds', issues);
    validateUniqueOrder(topic, topic.data.problemIds, 'problemIds', issues);
    if (!manifestDomains.has(topic.data.domain)) {
      addIssue(
        issues,
        topic,
        'UNKNOWN_DOMAIN',
        `Domain "${topic.data.domain}" is not declared in the curriculum manifest.`,
        'Declare the domain in the manifest or use an existing domain ID.',
      );
    }
    for (const prerequisiteId of topic.data.prerequisiteIds) {
      requireId(topic, prerequisiteId, 'topics', ids, issues);
    }
    for (const lessonId of topic.data.lessonIds) {
      topicsByLesson.add(lessonId);
      requireId(topic, lessonId, 'lessons', ids, issues);
    }
    for (const problemId of topic.data.problemIds) {
      topicsByProblem.add(problemId);
      requireId(topic, problemId, 'problems', ids, issues);
    }
  }

  for (const lesson of model.lessons) {
    requireId(lesson, lesson.data.topicId, 'topics', ids, issues);
    const owningTopic = topicsById.get(lesson.data.topicId);
    if (owningTopic && !owningTopic.data.lessonIds.includes(lesson.id)) {
      addIssue(
        issues,
        lesson,
        'OWNER_BACK_REFERENCE_MISSING',
        `Topic "${owningTopic.id}" does not list lesson "${lesson.id}".`,
        'Add the lesson ID to the owning topic lessonIds.',
      );
    }
    for (const patternId of lesson.data.patternIds) {
      if (!manifestPatterns.has(patternId)) {
        addIssue(
          issues,
          lesson,
          'UNKNOWN_PATTERN',
          `Pattern "${patternId}" is not declared in the curriculum manifest.`,
          'Declare the pattern in the manifest or use an existing pattern ID.',
        );
      }
    }
    for (const prerequisiteId of lesson.data.prerequisiteIds) {
      requireId(lesson, prerequisiteId, 'lessons', ids, issues);
    }
    for (const assessmentId of lesson.data.assessmentIds) {
      lessonsByAssessment.add(assessmentId);
      requireId(lesson, assessmentId, 'assessments', ids, issues);
      const assessment = assessmentsById.get(assessmentId);
      if (assessment && assessment.data.lessonId !== lesson.id) {
        addIssue(
          issues,
          lesson,
          'OWNER_BACK_REFERENCE_MISMATCH',
          `Assessment "${assessmentId}" points to lesson "${assessment.data.lessonId}", not "${lesson.id}".`,
          'Make lesson.assessmentIds and assessment.lessonId agree.',
        );
      }
    }
    for (const problemId of lesson.data.problemIds) {
      requireId(lesson, problemId, 'problems', ids, issues);
    }
  }

  for (const problem of model.problems) {
    for (const topicId of problem.data.topicIds) {
      requireId(problem, topicId, 'topics', ids, issues);
      const owningTopic = topicsById.get(topicId);
      if (owningTopic && !owningTopic.data.problemIds.includes(problem.id)) {
        addIssue(
          issues,
          problem,
          'OWNER_BACK_REFERENCE_MISSING',
          `Topic "${topicId}" does not list problem "${problem.id}".`,
          'Add the problem ID to the owning topic problemIds.',
        );
      }
    }
    for (const patternId of problem.data.patternIds) {
      if (!manifestPatterns.has(patternId)) {
        addIssue(
          issues,
          problem,
          'UNKNOWN_PATTERN',
          `Pattern "${patternId}" is not declared in the curriculum manifest.`,
          'Declare the pattern in the manifest or use an existing pattern ID.',
        );
      }
    }
  }

  for (const assessment of model.assessments) {
    requireId(assessment, assessment.data.lessonId, 'lessons', ids, issues);
    const owningLesson = lessonsById.get(assessment.data.lessonId);
    if (owningLesson && !owningLesson.data.assessmentIds.includes(assessment.id)) {
      addIssue(
        issues,
        assessment,
        'OWNER_BACK_REFERENCE_MISSING',
        `Lesson "${assessment.data.lessonId}" does not list assessment "${assessment.id}".`,
        'Add the assessment ID to the owning lesson assessmentIds.',
      );
    }
  }

  for (const glossary of model.glossary) {
    for (const topicId of glossary.data.relatedTopicIds) {
      requireId(glossary, topicId, 'topics', ids, issues);
    }
  }

  reportOrphans(model.topics, tracksByTopic, 'ORPHAN_TOPIC', 'Add the topic to a track.', issues);
  reportOrphans(
    model.lessons,
    topicsByLesson,
    'ORPHAN_LESSON',
    'Add the lesson to its topic.',
    issues,
  );
  reportOrphans(
    model.problems,
    topicsByProblem,
    'ORPHAN_PROBLEM',
    'Add the problem to a topic.',
    issues,
  );
  reportOrphans(
    model.assessments,
    lessonsByAssessment,
    'ORPHAN_ASSESSMENT',
    'Add the assessment to its lesson.',
    issues,
  );
}

function validateTopicGraph(model: ContentModel, issues: ValidationIssue[]) {
  for (const topic of model.topics) {
    if (topic.data.prerequisiteIds.includes(topic.id)) {
      addIssue(
        issues,
        topic,
        'SELF_DEPENDENCY',
        `Topic "${topic.id}" depends on itself.`,
        'Remove the self-reference.',
      );
    }
  }

  for (const cycle of findPrerequisiteCycles(model.topics.map((entry) => entry.data))) {
    const entry = model.topics.find((topic) => topic.id === cycle[0]);
    issues.push({
      code: 'PREREQUISITE_CYCLE',
      ...(cycle[0] ? { id: cycle[0] } : {}),
      ...(entry ? { sourcePath: entry.sourcePath } : {}),
      message: cycle.join(' → '),
      recovery: 'Remove or redirect one prerequisite edge so the curriculum is acyclic.',
    });
  }
}

function validateIdentity(model: ContentModel, issues: ValidationIssue[]) {
  const liveIds = new Set(allEntries(model).map((entry) => entry.id));
  const redirectSources = new Set<string>();
  const tombstoneIds = new Set<string>();

  for (const redirect of model.identity.redirects) {
    if (redirectSources.has(redirect.from)) {
      issues.push(
        identityIssue('DUPLICATE_REDIRECT', redirect.from, 'Keep one redirect per retired ID.'),
      );
    }
    redirectSources.add(redirect.from);
    if (liveIds.has(redirect.from)) {
      issues.push(
        identityIssue(
          'ALIAS_SHADOWS_LIVE_ID',
          redirect.from,
          'Remove the redirect or retire the live ID.',
        ),
      );
    }
  }

  for (const redirect of model.identity.redirects) {
    if (redirectSources.has(redirect.to)) {
      issues.push(
        identityIssue(
          'REDIRECT_CHAIN',
          redirect.from,
          'Point redirects directly to a live canonical ID.',
        ),
      );
    }
    if (!liveIds.has(redirect.to)) {
      issues.push(
        identityIssue(
          'REDIRECT_TARGET_MISSING',
          redirect.from,
          `Create canonical ID "${redirect.to}" or change the target.`,
        ),
      );
    }
  }

  for (const tombstone of model.identity.tombstones) {
    if (tombstoneIds.has(tombstone.id)) {
      issues.push(
        identityIssue('DUPLICATE_TOMBSTONE', tombstone.id, 'Keep one tombstone per retired ID.'),
      );
    }
    tombstoneIds.add(tombstone.id);
    if (liveIds.has(tombstone.id) || redirectSources.has(tombstone.id)) {
      issues.push(
        identityIssue(
          'TOMBSTONE_COLLISION',
          tombstone.id,
          'An ID cannot be live, redirected, and tombstoned simultaneously.',
        ),
      );
    }
    if (tombstone.replacementId && !liveIds.has(tombstone.replacementId)) {
      issues.push(
        identityIssue(
          'TOMBSTONE_TARGET_MISSING',
          tombstone.id,
          'Point replacementId to a live canonical ID.',
        ),
      );
    }
  }
}

function validatePublishedPolicy(model: ContentModel, issues: ValidationIssue[]) {
  for (const entry of [...model.lessons, ...model.problems]) {
    if (entry.data.status !== 'published') continue;
    for (const field of ['editorialReviewer', 'technicalReviewer', 'lastReviewedAt'] as const) {
      if (!entry.data[field]) {
        addIssue(
          issues,
          entry,
          'PUBLISHED_REVIEW_MISSING',
          `Published entry is missing ${field}.`,
          `Add ${field} before publishing.`,
        );
      }
    }
  }

  for (const lesson of model.lessons) {
    if (lesson.data.status !== 'published') continue;
    for (const [key, complete] of Object.entries(lesson.data.evidence)) {
      if (!complete) {
        addIssue(
          issues,
          lesson,
          'PUBLISHED_EVIDENCE_MISSING',
          `Published lesson evidence "${key}" is false.`,
          'Complete or explicitly redesign the canonical learning-loop evidence.',
        );
      }
    }
  }
}

function validateLessonBodies(model: ContentModel, issues: ValidationIssue[]) {
  const requiredMarkers = [
    ['worked example', '<WorkedExample'],
    ['accessible trace', '<TraceTable'],
    ['retrieval checkpoint', '<Checkpoint'],
    ['summary', '## Tóm tắt'],
    ['sources', '<Sources'],
  ] as const;

  for (const lesson of model.lessons) {
    if (lesson.data.status === 'planned') continue;
    for (const [label, marker] of requiredMarkers) {
      if (!lesson.body?.includes(marker)) {
        addIssue(
          issues,
          lesson,
          'LESSON_BLOCK_MISSING',
          `Lesson is missing ${label} marker ${marker}.`,
          'Add the canonical block or move the lesson back to planned.',
        );
      }
    }
  }

  for (const problem of model.problems) {
    if (!problem.body?.includes(`id="${problem.data.solutionRef}"`)) {
      addIssue(
        issues,
        problem,
        'SOLUTION_REF_MISSING',
        `solutionRef "${problem.data.solutionRef}" has no matching body anchor.`,
        `Add <span id="${problem.data.solutionRef}"></span> before the solution outline.`,
      );
    }
  }
}

function validateAssessments(model: ContentModel, issues: ValidationIssue[]) {
  for (const assessment of model.assessments) {
    const optionIds = assessment.data.options.map((option) => option.id);
    if (new Set(optionIds).size !== optionIds.length) {
      addIssue(
        issues,
        assessment,
        'DUPLICATE_OPTION_ID',
        'Assessment option IDs must be unique.',
        'Rename duplicate option IDs.',
      );
    }
    if (assessment.data.kind.includes('choice')) {
      for (const expected of assessment.data.expected) {
        if (!optionIds.includes(expected)) {
          addIssue(
            issues,
            assessment,
            'EXPECTED_OPTION_MISSING',
            `Expected option "${expected}" does not exist.`,
            'Reference a defined option ID.',
          );
        }
      }
      for (const misconceptionId of Object.keys(assessment.data.feedbackByMisconception)) {
        if (!optionIds.includes(misconceptionId)) {
          addIssue(
            issues,
            assessment,
            'MISCONCEPTION_OPTION_MISSING',
            `Feedback key "${misconceptionId}" does not match an option.`,
            'Reference a defined wrong option ID.',
          );
        }
      }
    }
  }
}

function requireId(
  owner: SourceEntry,
  targetId: string,
  collection: CollectionName,
  ids: Map<CollectionName, Set<string>>,
  issues: ValidationIssue[],
) {
  if (!ids.get(collection)?.has(targetId)) {
    addIssue(
      issues,
      owner,
      'DANGLING_REFERENCE',
      `Missing ${collection} reference "${targetId}".`,
      `Create ${collection}/${targetId} or remove the reference.`,
    );
  }
}

function validateUniqueOrder(
  owner: SourceEntry,
  ids: string[],
  field: string,
  issues: ValidationIssue[],
) {
  if (new Set(ids).size !== ids.length) {
    addIssue(
      issues,
      owner,
      'DUPLICATE_ORDER_ENTRY',
      `${field} contains duplicate IDs.`,
      'Keep each ordered reference once.',
    );
  }
}

function reportOrphans<T extends SourceEntry>(
  entries: T[],
  referencedIds: Set<string>,
  code: string,
  recovery: string,
  issues: ValidationIssue[],
) {
  for (const entry of entries) {
    if (!referencedIds.has(entry.id)) {
      addIssue(
        issues,
        entry,
        code,
        `${entry.collection} entry "${entry.id}" is not referenced by its owner.`,
        recovery,
      );
    }
  }
}

function indexIds(model: ContentModel) {
  return new Map<CollectionName, Set<string>>(
    (['tracks', 'topics', 'lessons', 'problems', 'assessments', 'glossary'] as const).map(
      (collection) => [collection, new Set(model[collection].map((entry) => entry.id))],
    ),
  );
}

function allEntries(model: ContentModel): SourceEntry[] {
  return [
    ...model.tracks,
    ...model.topics,
    ...model.lessons,
    ...model.problems,
    ...model.assessments,
    ...model.glossary,
  ] as SourceEntry[];
}

function addIssue(
  issues: ValidationIssue[],
  entry: SourceEntry,
  code: string,
  message: string,
  recovery: string,
) {
  issues.push({ code, message, recovery, id: entry.id, sourcePath: entry.sourcePath });
}

function identityIssue(code: string, id: string, recovery: string): ValidationIssue {
  return { code, id, message: `Identity rule failed for "${id}".`, recovery };
}

function sortIssues(issues: ValidationIssue[]) {
  return issues.sort((left, right) =>
    [left.sourcePath ?? '', left.id ?? '', left.code, left.message]
      .join('\0')
      .localeCompare(
        [right.sourcePath ?? '', right.id ?? '', right.code, right.message].join('\0'),
      ),
  );
}
