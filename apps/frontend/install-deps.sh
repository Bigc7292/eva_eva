#!/bin/bash

# Install UI component dependencies
npm install --save @radix-ui/react-avatar@latest
npm install --save @radix-ui/react-dialog@latest
npm install --save @radix-ui/react-dropdown-menu@latest
npm install --save @radix-ui/react-popover@latest
npm install --save @radix-ui/react-progress@latest
npm install --save @radix-ui/react-separator@latest
npm install --save @radix-ui/react-slot@latest
npm install --save @radix-ui/react-tabs@latest
npm install --save @radix-ui/react-toast@latest
npm install --save @radix-ui/react-tooltip@latest

# Install data and utility libraries
npm install --save date-fns@latest
npm install --save react-day-picker@latest
npm install --save chart.js@latest
npm install --save react-chartjs-2@latest
npm install --save xlsx@latest

# Install styling libraries
npm install --save class-variance-authority@latest
npm install --save clsx@latest
npm install --save tailwind-merge@latest
npm install --save tailwindcss-animate@latest

# Install TypeScript type definitions
npm install --save-dev @types/uuid
npm install --save-dev @types/react@latest
npm install --save-dev @types/react-dom@latest
npm install --save-dev @types/node@latest

echo "All dependencies installed successfully!"
