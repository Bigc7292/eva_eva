/**
 * Script to analyze and optimize bundle size
 * This script will:
 * 1. Analyze the current bundle size
 * 2. Identify large dependencies
 * 3. Suggest optimizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Logger function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Run Next.js build with bundle analyzer
 * @returns {Promise<void>}
 */
async function analyzeBundleSize() {
  try {
    log('Analyzing bundle size...');
    
    // Create a temporary .env.local file to enable bundle analyzer
    const envPath = path.join('apps', 'frontend', '.env.local');
    fs.writeFileSync(envPath, 'ANALYZE=true\n', { flag: 'a' });
    
    // Run Next.js build with bundle analyzer
    execSync('cd apps/frontend && npm run build', { stdio: 'inherit' });
    
    // Remove the ANALYZE flag from .env.local
    const envContent = fs.readFileSync(envPath, 'utf8');
    fs.writeFileSync(envPath, envContent.replace('ANALYZE=true\n', ''));
    
    log('Bundle analysis completed');
  } catch (error) {
    log(`Error analyzing bundle size: ${error.message}`);
    throw error;
  }
}

/**
 * Update Next.js config for better code splitting
 * @returns {Promise<boolean>} - Success status
 */
async function optimizeCodeSplitting() {
  try {
    log('Optimizing code splitting...');
    
    const configPath = path.join('apps', 'frontend', 'next.config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check if the config already has optimized settings
    if (configContent.includes('experimental: {') && configContent.includes('optimizeCss:')) {
      log('Next.js config already has optimized settings');
      return true;
    }
    
    // Add optimized settings to the config
    const updatedConfig = configContent.replace(
      'const nextConfig = {',
      `const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', 'date-fns', 'recharts'],
  },`
    );
    
    fs.writeFileSync(configPath, updatedConfig);
    
    log('Next.js config updated with optimized settings');
    return true;
  } catch (error) {
    log(`Error optimizing code splitting: ${error.message}`);
    return false;
  }
}

/**
 * Add dynamic imports for large components
 * @returns {Promise<boolean>} - Success status
 */
async function addDynamicImports() {
  try {
    log('Adding dynamic imports for large components...');
    
    // List of components to convert to dynamic imports
    const componentsToOptimize = [
      {
        path: path.join('apps', 'frontend', 'src', 'components', 'dashboard', 'EnhancedCallTrendsWidget.tsx'),
        importPattern: "import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'",
        dynamicImport: `// Dynamically import Recharts components to reduce bundle size
const DynamicCharts = dynamic(() => import('@/components/charts/DynamicRecharts'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full flex items-center justify-center"><Skeleton className="h-[250px] w-[90%]" /></div>
});`
      },
      {
        path: path.join('apps', 'frontend', 'src', 'components', 'dashboard', 'EnhancedTeamPerformanceWidget.tsx'),
        importPattern: "import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'",
        dynamicImport: `// Dynamically import Recharts components to reduce bundle size
const DynamicCharts = dynamic(() => import('@/components/charts/DynamicRecharts'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full flex items-center justify-center"><Skeleton className="h-[250px] w-[90%]" /></div>
});`
      }
    ];
    
    // Create the dynamic imports directory and files
    const dynamicChartsDir = path.join('apps', 'frontend', 'src', 'components', 'charts');
    if (!fs.existsSync(dynamicChartsDir)) {
      fs.mkdirSync(dynamicChartsDir, { recursive: true });
    }
    
    // Create the DynamicRecharts component
    const dynamicRechartsPath = path.join(dynamicChartsDir, 'DynamicRecharts.tsx');
    const dynamicRechartsContent = `'use client'

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';

// Export all chart components
export {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter, ZAxis
};

// Default export for dynamic import
export default {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter, ZAxis
};`;
    
    fs.writeFileSync(dynamicRechartsPath, dynamicRechartsContent);
    log('Created DynamicRecharts component');
    
    // Update components to use dynamic imports
    for (const component of componentsToOptimize) {
      if (!fs.existsSync(component.path)) {
        log(`Component not found: ${component.path}`);
        continue;
      }
      
      const content = fs.readFileSync(component.path, 'utf8');
      
      // Skip if already optimized
      if (content.includes('dynamic(')) {
        log(`Component already uses dynamic imports: ${component.path}`);
        continue;
      }
      
      // Add dynamic import
      const updatedContent = content
        .replace(component.importPattern, "import dynamic from 'next/dynamic'\nimport { Skeleton } from '@/components/ui/skeleton'")
        .replace("'use client'", "'use client'\n\n" + component.dynamicImport);
      
      fs.writeFileSync(component.path, updatedContent);
      log(`Updated component with dynamic imports: ${component.path}`);
    }
    
    log('Dynamic imports added successfully');
    return true;
  } catch (error) {
    log(`Error adding dynamic imports: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting bundle size optimization...');
    
    // Optimize code splitting
    const codeSplittingOptimized = await optimizeCodeSplitting();
    
    // Add dynamic imports for large components
    const dynamicImportsAdded = await addDynamicImports();
    
    // Analyze bundle size
    await analyzeBundleSize();
    
    log('Bundle size optimization completed');
    log(`Code splitting optimized: ${codeSplittingOptimized ? 'Yes' : 'No'}`);
    log(`Dynamic imports added: ${dynamicImportsAdded ? 'Yes' : 'No'}`);
  } catch (error) {
    log(`Error optimizing bundle size: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
