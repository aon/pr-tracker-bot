export interface User {
  login: string;
  id: bigint;
  avatar_url: string;
  html_url: string;
}

export interface PullRequest {
  id: bigint;
  html_url: string;
  diff_url: string;
  state: "open" | "closed";
  title: string;
  body: string;
  number: number;
  created_at: string;
  updated_at: string;
  closed_at: string;
  merged_at: string;
  assignees: User[];
  requested_reviewers: User[];
  merged: boolean;
  merged_by: User;
}

export interface Repository {
  id: bigint;
  name: string;
  full_name: string;
  html_url: string;
}

export interface Review {
  id: bigint;
  user: User;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";
}
