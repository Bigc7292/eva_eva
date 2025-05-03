const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Install missing dependencies if needed
try {
  console.log('Checking for missing dependencies...');

  const dependencies = [
    '@radix-ui/react-popover',
    '@radix-ui/react-progress',
    '@radix-ui/react-tabs',
    'xlsx'
  ];

  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      console.log(`✅ ${dep} is already installed`);
    } catch (e) {
      console.log(`⚠️ ${dep} is missing, installing...`);
      execSync(`npm install --save ${dep}@latest`, { stdio: 'inherit' });
    }
  }
} catch (error) {
  console.error('Error checking dependencies:', error);
}

// Files to update
const filesToUpdate = [
  {
    path: 'src/components/ui/popover.tsx',
    search: "import * as PopoverPrimitive from '@radix-ui/react-popover'",
    replace: "import * as PopoverPrimitive from '@radix-ui/react-popover'"
  },
  {
    path: 'src/components/ui/progress.tsx',
    search: "import * as ProgressPrimitive from '@radix-ui/react-progress'",
    replace: "import * as ProgressPrimitive from '@radix-ui/react-progress'"
  },
  {
    path: 'src/components/ui/tabs.tsx',
    search: "import * as TabsPrimitive from '@radix-ui/react-tabs'",
    replace: "import * as TabsPrimitive from '@radix-ui/react-tabs'"
  },
  {
    path: 'src/utils/excel.ts',
    search: "import * as XLSX from 'xlsx'",
    replace: "import XLSX from 'xlsx'"
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

// Replace lodash.isequal with node:util's isDeepStrictEqual
try {
  const lodashFiles = [];
  try {
    const result = execSync('grep -r "lodash.isequal" --include="*.ts" --include="*.tsx" src', { encoding: 'utf8' });
    const lines = result.split('\n').filter(Boolean);

    for (const line of lines) {
      const [filePath] = line.split(':');
      if (!lodashFiles.includes(filePath)) {
        lodashFiles.push(filePath);
      }
    }
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    console.log('No files using lodash.isequal found');
  }

  for (const filePath of lodashFiles) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace import statement
    content = content.replace(
      /import\s+(\w+|\{\s*\w+\s*\})\s+from\s+['"]lodash\.isequal['"]/g,
      "import { isDeepStrictEqual as isEqual } from 'node:util'"
    );

    fs.writeFileSync(filePath, content);
    console.log(`Replaced lodash.isequal with isDeepStrictEqual in ${filePath}`);
  }
} catch (error) {
  console.error('Error replacing lodash.isequal:', error);
}

console.log('Import fixes completed!');
