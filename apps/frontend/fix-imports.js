const fs = require('node:fs');
const path = require('node:path');

// Files to update
const filesToUpdate = [
  {
    path: 'src/components/ui/popover.tsx',
    search: "import * as React from 'react'\nimport * as PopoverPrimitive from '@radix-ui/react-popover'",
    replace: "import * as React from 'react'\nimport { Popover as PopoverPrimitive } from '../../../src/mocks/radix-ui'"
  },
  {
    path: 'src/components/ui/progress.tsx',
    search: "import * as React from 'react'\nimport * as ProgressPrimitive from '@radix-ui/react-progress'",
    replace: "import * as React from 'react'\nimport { Progress as ProgressPrimitive } from '../../../src/mocks/radix-ui'"
  },
  {
    path: 'src/components/ui/tabs.tsx',
    search: "import * as React from 'react'\nimport * as TabsPrimitive from '@radix-ui/react-tabs'",
    replace: "import * as React from 'react'\nimport { Tabs as TabsPrimitive } from '../../../src/mocks/radix-ui'"
  },
  {
    path: 'src/components/ui/avatar.tsx',
    search: "import * as React from 'react'\nimport * as AvatarPrimitive from '@radix-ui/react-avatar'",
    replace: "import * as React from 'react'\nimport { Avatar as AvatarPrimitive } from '../../../src/mocks/radix-ui'"
  },
  {
    path: 'src/utils/excel.ts',
    search: "import * as XLSX from 'xlsx'",
    replace: "import XLSX from '../mocks/xlsx'"
  }
];

// Update each file
for (const file of filesToUpdate) {
  const filePath = path.join(process.cwd(), file.path);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }

  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import statement
  if (content.includes(file.search)) {
    content = content.replace(file.search, file.replace);
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in ${filePath}`);
  } else {
    console.log(`Import pattern not found in ${filePath}`);
  }
}

console.log('Import fixes completed!');
