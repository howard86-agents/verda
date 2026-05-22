/**
 * Community reward rules (issue #104).
 *
 * The reward pipeline (rewards.ts → `awardPoints`) drives nutrient
 * awards off the `rewardRules` table keyed by `action`. This module is
 * the single source of truth for the three new community rules so the
 * seeder, the CMS rules editor labels, the runtime handlers, and the
 * tests all agree on the action ids, rule ids, and default amounts.
 *
 * The default amounts come from the issue body: submission +20,
 * comment +3, reaction +1. Each rule starts enabled, with a
 * `per-article` limit so a member earns the reward at most once per
 * article (the first comment, the first reaction of any kind, and the
 * first time a submission is approved).
 */

export interface CommunityRewardRuleSeed {
  /** Action string passed to `awardPoints` and stored on `behaviorLogs`. */
  action: string;
  /** Whether the rule starts enabled in the seed. */
  enabled: boolean;
  /** Stable id used as the storage key. */
  id: string;
  /** Limit guard applied by `awardPoints`; `per-article` for all three. */
  limitType: "per-article";
  /** Default points awarded per matching action. */
  points: number;
}

export const REWARD_RULE_SUBMISSION_APPROVED: CommunityRewardRuleSeed = {
  id: "rr_submission_approved",
  action: "submission_approved",
  points: 20,
  enabled: true,
  limitType: "per-article",
};

export const REWARD_RULE_COMMENT_POST: CommunityRewardRuleSeed = {
  id: "rr_comment_post",
  action: "comment_post",
  points: 3,
  enabled: true,
  limitType: "per-article",
};

export const REWARD_RULE_REACTION_REACT: CommunityRewardRuleSeed = {
  id: "rr_reaction_react",
  action: "reaction_react",
  points: 1,
  enabled: true,
  limitType: "per-article",
};

/** Convenience: the three community rules, in display order. */
export const COMMUNITY_REWARD_RULES: CommunityRewardRuleSeed[] = [
  REWARD_RULE_SUBMISSION_APPROVED,
  REWARD_RULE_COMMENT_POST,
  REWARD_RULE_REACTION_REACT,
];

/**
 * Friendly labels for the CMS rules editor. Mirrors the existing
 * `ACTION_LABELS` shape in `apps/web/app/cms/rules/page.tsx` so the
 * editor renders the new rules without falling back to the raw,
 * underscored action string.
 */
export const COMMUNITY_REWARD_RULE_LABELS: Record<
  string,
  { en: string; jp: string }
> = {
  submission_approved: { en: "Submission approved", jp: "投稿承認" },
  comment_post: { en: "Comment posted", jp: "コメント投稿" },
  reaction_react: { en: "Reaction", jp: "リアクション" },
};
