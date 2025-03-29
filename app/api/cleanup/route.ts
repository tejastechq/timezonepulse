import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { headers } from 'next/headers';
import { createSecureHash } from '@/lib/utils/security';

const execAsync = promisify(exec);

// Additional security check for admin token
async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!process.env.ADMIN_API_SECRET) return false;
  if (!token) return false;
  
  const hash = await createSecureHash(process.env.ADMIN_API_SECRET);
  return hash === token;
}

// Validate path is within project directory to prevent path traversal
function isPathWithinProject(targetPath: string): boolean {
  const normalizedTarget = path.normalize(targetPath).replace(/\\/g, '/');
  const projectRoot = path.normalize(process.cwd()).replace(/\\/g, '/');
  return normalizedTarget.startsWith(projectRoot);
}

export async function GET(request: Request) {
  try {
    // Get headers asynchronously
    const headersList = await headers();
    
    // Only allow in development mode or with admin token in production
    if (process.env.NODE_ENV === 'production') {
      const authToken = headersList.get('x-admin-token');
      if (!await validateAdminToken(authToken)) {
        return NextResponse.json({
          success: false,
          message: 'Unauthorized access'
        }, { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Security-Policy': "default-src 'none'",
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
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
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Content-Security-Policy': "default-src 'none'",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer'
      }
    });
  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Cleanup failed',
      error: 'Internal server error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'none'",
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}