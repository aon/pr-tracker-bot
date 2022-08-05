# PR Tracker Discord Bot

I've built this bot to satisfy a very particular need we had with my team: track our PRs on Discord. Unfortunately, the existing ones weren't really up to the task.

## Showcase

So why not show how PRs are tracked?

<!-- basic image of PR -->

This is an image of the message the bot sends when there's a new PR.

<!-- show PR but purple -->

When the PR is merged it will be shown like this

<!--  -->

The slash commands will quickly help you understand how to use this bot: just register the repos/organizations you'll be listening to and you're ready to go! If you'd like, you can instruct your team to register your discord user so that it pings you anytime you're assigned as reviewer or assignee.

## Functions

So as you can see, this bot lets you:

- Keep track of PRs in multiple repositories and organizations per channel
- Print all related data including description in full markdown, assigness left, reviewers, PR status and author

## Deploying

If you're sold this far and want to try it on your own, this is self-hosted, so you'll need: a database and somewhere to host it, with a public and static url so that github can point to for sending PRs data.

### Database

First, you'll need a database. I'm using [PlanetScale](https://planetscale.com/), and that's why you'll find in my `schema.prisma` the following lines:

```prisma
generator client {
  previewFeatures = ["referentialIntegrity"]
}
datasource db {
  referentialIntegrity = "prisma"
}
```

which allows the usage of Prisma + PlanetScale, as you can check out in the [docs](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity).


