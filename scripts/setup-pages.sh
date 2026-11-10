#!/bin/sh
# One-time repository setup for hosting, kept as code (DECISIONS D20). Idempotent: safe to run again.
# Needs the GitHub CLI logged in as a repo admin: `gh auth login`.
set -e
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
url="https://$(echo "${repo%%/*}" | tr '[:upper:]' '[:lower:]').github.io/${repo#*/}/"

# GitHub Pages, published by the CI/CD workflow (not from a branch).
if gh api "repos/$repo/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$repo/pages" -f build_type=workflow >/dev/null
else
  gh api -X POST "repos/$repo/pages" -f build_type=workflow >/dev/null
fi
gh api -X PUT "repos/$repo/pages" -F https_enforced=true >/dev/null 2>&1 || true

# The site link on the repository page.
gh repo edit "$repo" --homepage "$url" >/dev/null

# Optional custom domain: CUSTOM_DOMAIN=lomdim.example ./scripts/setup-pages.sh
# (also add public/CNAME with the same name, and point the domain's DNS at GitHub Pages).
if [ -n "$CUSTOM_DOMAIN" ]; then
  gh api -X PUT "repos/$repo/pages" -f cname="$CUSTOM_DOMAIN" >/dev/null
  url="https://$CUSTOM_DOMAIN/"
fi

echo "Pages: $(gh api "repos/$repo/pages" -q '.build_type + " · " + .html_url')"
echo "Site:  $url"
