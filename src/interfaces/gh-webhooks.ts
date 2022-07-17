export interface User {
  login: string;
  id: bigint;
}

export interface PullRequestWebhook {
  action: string;
  number: number;
  pull_request: {
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
  };
  repository: {
    id: bigint;
    name: string;
    full_name: string;
    html_url: string;
  };
  organization?: object;
  sender: object;
}
