#!/bin/bash

# Navigate to the project directory
PROJECT_DIR="/c/Users/Administrator/Downloads/eva_eva"
cd "$PROJECT_DIR" || exit

# Function to display Git status
show_git_status() {
  echo "--- Git Status ---"
  git status
  echo "-------------------"
}

# Fetch updates from all remotes
echo "Fetching updates from all remotes..."
git fetch --all

# Check if there are any updates on the current branch
if ! git diff --quiet HEAD origin/$(git rev-parse --abbrev-ref HEAD); then
  echo "Updates available for the current branch."

  # Attempt to merge updates
  echo "Attempting to merge updates..."
  git pull --rebase origin $(git rev-parse --abbrev-ref HEAD)

  # Check if the merge was successful
  if [ $? -eq 0 ]; then
    echo "Successfully merged updates."
    show_git_status
  else
    echo "Merge conflict detected. Please resolve conflicts manually."
    show_git_status
    exit 1
  fi
else
  echo "Your local repository is already up to date."
  show_git_status
fi

echo "Update process complete."
