import { PullRequest, Repository, Organization, Review, User } from "./gh-base";

export interface PullRequestWebhook {
  action: string;
  number: number;
  pull_request: PullRequest;
  repository: Repository;
  organization?: Organization;
  sender: User;
}

export interface PullRequestReviewWebhook {
  action: "submitted" | "edited" | "dismissed";
  pull_request: PullRequest;
  review: Review;
  repository: Repository;
  organization?: Organization;
  sender: User;
}
