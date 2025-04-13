# Troubleshooting Guide

This guide provides solutions to common issues you might encounter when working with this Next.js project.

## Common Issues and Solutions

### 1. Symbolic Link Error

**Error**: `NewItemIOError` when trying to create a symbolic link for the "app" directory.

**Solution**: 
- Do not create a symbolic link for the "app" directory. The "app" directory should be a real directory at the project root or under the "src" directory.
- The project is already set up correctly with the "app" directory in "src/app".

### 2. Build Error: Conflicting "pages" and "app" Directories

**Error**: `Conflicting app and page file was found, please remove the conflicting files to continue`.

**Solution**:
- The "pages" directory has been removed, so this error should no longer occur.
- If you still see this error, make sure there are no files in a "pages" directory that conflict with routes in the "app" directory.

### 3. Rendering Error: Invalid Hook Call

**Error**: `Invalid hook call. Hooks can only be called inside of the body of a function component` or `Cannot read properties of null (reading 'useReducer')`.

**Solution**:
- Run the `fix-react-versions.ps1` script to fix React version inconsistencies:
  ```
  .\fix-react-versions.ps1
  ```
- Make sure you're following the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html):
  - Only call hooks at the top level of your components
  - Only call hooks from React function components or custom hooks

### 4. Missing "preview" Script

**Error**: `Missing script: "preview"`.

**Solution**:
- The "preview" script has been added to package.json.
- Use `npm run preview` to preview the built application.

### 5. Webpack Caching Warnings

**Error**: `Caching failed for pack: Error: invalid stored block lengths`.

**Solution**:
- Run the `clean-webpack-cache.ps1` script to clean the Webpack cache:
  ```
  .\clean-webpack-cache.ps1
  ```
- Use the `npm run dev:clean` script to start the development server with a clean cache.

## Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Or start with a clean cache:
   ```
   npm run dev:clean
   ```

4. Build the application:
   ```
   npm run build
   ```

5. Preview the built application:
   ```
   npm run preview
   ```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html)
