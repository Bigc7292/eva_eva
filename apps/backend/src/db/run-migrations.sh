#!/bin/bash

# Load environment variables
if [ -f ../../.env ]; then
  export $(cat ../../.env | grep -v '^#' | xargs)
fi

# Run the migration script
echo "Running database migrations..."
node run-migrations.js

echo "Migrations completed."
