import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let targetPath = body.filePath || body.fileUrl || body.path;

    if (!targetPath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    // Decode URL formatting if given a file:// URL or encoded URI
    if (targetPath.startsWith('file://')) {
      targetPath = targetPath.replace('file://', '');
    }

    // Resolve relative path against project directory if not absolute
    if (!path.isAbsolute(targetPath)) {
      targetPath = path.resolve(process.cwd(), targetPath);
    }

    // If target is a file, get its directory; if directory, use directly
    let targetDir = targetPath;
    try {
      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath);
        if (stats.isFile()) {
          targetDir = path.dirname(targetPath);
        }
      } else {
        // If file doesn't exist, check parent dir
        const parent = path.dirname(targetPath);
        if (fs.existsSync(parent)) {
          targetDir = parent;
        } else {
          targetDir = process.cwd();
        }
      }
    } catch {
      targetDir = process.cwd();
    }

    const platform = os.platform();
    let command = '';

    if (platform === 'darwin') {
      // macOS: reveal file or open directory in Finder
      command = fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()
        ? `open -R "${targetPath}"`
        : `open "${targetDir}"`;
    } else if (platform === 'win32') {
      // Windows: reveal in File Explorer
      command = fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()
        ? `explorer.exe /select,"${targetPath.replace(/\//g, '\\')}"`
        : `explorer.exe "${targetDir.replace(/\//g, '\\')}"`;
    } else {
      // Linux: open directory with xdg-open
      command = `xdg-open "${targetDir}"`;
    }

    exec(command, (error) => {
      if (error) {
        console.warn(`[open-location] Command failed (${command}):`, error.message);
      }
    });

    return NextResponse.json({
      success: true,
      platform,
      command,
      path: targetPath,
      directory: targetDir,
    });
  } catch (err: any) {
    console.error('Failed to open file location:', err);
    return NextResponse.json({ error: err.message || 'Failed to open location' }, { status: 500 });
  }
}
