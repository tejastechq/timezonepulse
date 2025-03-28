import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Validate path is within project directory to prevent path traversal
function isPathWithinProject(targetPath: string): boolean {
  const normalizedTarget = path.normalize(targetPath);
  const projectRoot = path.normalize(process.cwd());
  return normalizedTarget.startsWith(projectRoot);
}

/**
 * Cleanup API Route
 * 
 * This API performs a comprehensive cleanup of Next.js server-side caches
 * to ensure consistent application state.
 */
export async function GET() {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: false,
        message: 'Cleanup API is only available in development mode'
      }, { 
        status: 403,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'none'",
        }
      });
    }

    const results: Record<string, string> = {};
    
    // 1. Clean .next directory
    try {
      const nextDir = path.join(process.cwd(), '.next');
      
      // Validate paths before operations
      if (!isPathWithinProject(nextDir)) {
        throw new Error('Invalid path detected');
      }
      
      if (fs.existsSync(nextDir)) {
        const cacheDir = path.join(nextDir, 'cache');
        if (fs.existsSync(cacheDir) && isPathWithinProject(cacheDir)) {
          await execAsync(`rimraf "${cacheDir}"`);
          results.nextCache = 'Cleaned';
        }
        
        const serverDir = path.join(nextDir, 'server');
        if (fs.existsSync(serverDir) && isPathWithinProject(serverDir)) {
          const devDir = path.join(serverDir, 'pages/dev');
          if (fs.existsSync(devDir) && isPathWithinProject(devDir)) {
            await execAsync(`rimraf "${devDir}"`);
            results.serverCache = 'Cleaned';
          }
        }
      }
    } catch (err) {
      results.nextCache = `Error: ${(err as Error).message}`;
    }
    
    // 2. Clean node_modules/.cache
    try {
      const nodeModulesCache = path.join(process.cwd(), 'node_modules/.cache');
      if (fs.existsSync(nodeModulesCache) && isPathWithinProject(nodeModulesCache)) {
        await execAsync(`rimraf "${nodeModulesCache}"`);
        results.nodeModulesCache = 'Cleaned';
      }
    } catch (err) {
      results.nodeModulesCache = `Error: ${(err as Error).message}`;
    }

    // Return cleanup summary with security headers
    return NextResponse.json({
      success: true,
      message: 'Server-side cleanup completed',
      results,
      timestamp: new Date().toISOString(),
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'development'
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'none'",
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Cleanup failed',
      error: 'Internal server error'  // Don't expose internal error details
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'none'",
      }
    });
  }
}