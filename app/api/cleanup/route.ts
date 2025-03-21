import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Cleanup API Route
 * 
 * This API performs a comprehensive cleanup of Next.js server-side caches
 * to ensure consistent application state.
 */
export async function GET() {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const results: Record<string, string> = {};
    
    // Only allow this in development mode
    if (!isDev) {
      return NextResponse.json({
        success: false, 
        message: 'Cleanup API is only available in development mode'
      }, { status: 403 });
    }
    
    // 1. Clean .next directory
    try {
      const nextDir = path.join(process.cwd(), '.next');
      
      if (fs.existsSync(nextDir)) {
        // Only delete cache directories, not the entire .next
        const cacheDir = path.join(nextDir, 'cache');
        if (fs.existsSync(cacheDir)) {
          await execAsync(`rimraf "${cacheDir}"`);
          results.nextCache = 'Cleaned';
        }
        
        const serverDir = path.join(nextDir, 'server');
        if (fs.existsSync(serverDir)) {
          // Cleaning only development server cache
          const devDir = path.join(serverDir, 'pages/dev');
          if (fs.existsSync(devDir)) {
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
      if (fs.existsSync(nodeModulesCache)) {
        await execAsync(`rimraf "${nodeModulesCache}"`);
        results.nodeModulesCache = 'Cleaned';
      }
    } catch (err) {
      results.nodeModulesCache = `Error: ${(err as Error).message}`;
    }
    
    // Return cleanup summary
    return NextResponse.json({
      success: true,
      message: 'Server-side cleanup completed',
      results,
      timestamp: new Date().toISOString(),
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'development'
    });
  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Cleanup failed',
      error: (error as Error).message
    }, { status: 500 });
  }
} 