# Security Policy

## Reporting a vulnerability

Report security issues privately through
[GitHub's private vulnerability reporting](https://github.com/zoenetic/infill/security/advisories/new).
Please don't open a public issue for anything exploitable.

Useful to include: affected path (`ts/`, `spec/`, or CI), a description of
the impact, and the smallest reproduction you can manage.

I'll acknowledge within a week. This is a personal project — I can't offer
a bounty or a guaranteed fix timeline, but I will credit you in the advisory
unless you'd rather I didn't.

## Scope

`infill` is pre-release. There are no supported older versions; only `main`
is in scope.

## Out of scope

- Scanner output with no demonstrated impact
- Dependency advisories with no reachable path from this codebase —
  Dependabot already tracks those
- Anything requiring a compromised maintainer account or self-XSS
