import { PullRequest, Repository, Review, User } from "./gh-base";

export interface PullRequestWebhook {
  action: string;
  number: number;
  pull_request: PullRequest;
  repository: Repository;
  organization?: User;
  sender: User;
}

export interface PullRequestReviewWebhook {
  action: "submitted" | "edited" | "dismissed";
  pull_request: PullRequest;
  review: Review;
  repository: Repository;
  organization?: User;
  sender: User;
}
