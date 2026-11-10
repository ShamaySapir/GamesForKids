#!/bin/sh
# Prints, per group, lemmas checked against the Academy, still NOT SEARCHED, and findings rows. Run from the repo root.
cd "$(dirname "$0")"
for g in A B C D; do
  total=$(($(wc -l < "$g-checked.tsv") - 1)); left=$(grep -ci "not searched" "$g-checked.tsv"); found=$(($(wc -l < "$g-findings.tsv") - 1))
  echo "$g: $total lemmas, $left NOT SEARCHED, $found findings rows"
done
