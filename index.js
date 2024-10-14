import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import zlib from 'zlib';
import readline from 'readline';

const args = process.argv.slice(2);
const usernameArg = args.find((arg) => arg.startsWith('--username='));
const username = usernameArg ? usernameArg.split('=')[1] : 'User';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let currentDir = os.homedir();
console.log(`Welcome to the File Manager, ${username}!`);
console.log(`You are currently in ${currentDir}`);

rl.setPrompt('> ');
rl.prompt();

rl.on('line', async (input) => {
    const [command, ...args] = input.trim().split(' ');

    switch (command) {
        case '.exit':
            exitProgram();
            break;

        case 'up':
            navigateUp();
            break;

        case 'cd':
            await changeDirectory(args[0]);
            break;

        case 'ls':
            await listFiles();
            break;

        case 'cat':
            await readFile(args[0]);
            break;

        case 'add':
            await createFile(args[0]);
            break;

        case 'rn':
            await renameFile(args[0], args[1]);
            break;

        case 'cp':
            await copyFile(args[0], args[1]);
            break;

        case 'mv':
            await moveFile(args[0], args[1]);
            break;

        case 'rm':
            await deleteFile(args[0]);
            break;

        case 'os':
            handleOSCommand(args[0]);
            break;

        case 'hash':
            await calculateHash(args[0]);
            break;

        case 'compress':
            await compressFile(args[0], args[1]);
            break;

        case 'decompress':
            await decompressFile(args[0], args[1]);
            break;

        default:
            console.log('Invalid input');
    }

    rl.prompt();
});

process.on('SIGINT', () => {
    exitProgram();
});

function exitProgram() {
    console.log(`Thank you for using File Manager, ${username}, goodbye!`);
    rl.close();
    process.exit();
}

async function navigateUp() {
    const rootDir = path.parse(currentDir).root;
    if (currentDir !== rootDir) {
        currentDir = path.resolve(currentDir, '..');
        console.log(`You are currently in ${currentDir}`);
    } else {
        console.log('You are at the root directory.');
    }
}

async function changeDirectory(dir) {
    try {
        const newDir = path.resolve(currentDir, dir);
        const stat = await fs.lstat(newDir);
        if (stat.isDirectory()) {
            currentDir = newDir;
            console.log(`You are currently in ${currentDir}`);
        } else {
            console.log('Invalid input');
        }
    } catch (err) {
        console.log('Invalid input');
    }
}

async function listFiles() {
    try {
        const files = await fs.readdir(currentDir, { withFileTypes: true });
        const formattedFiles = files.map((file, index) => ({
            index,
            Name: file.name,
            Type: file.isDirectory() ? 'directory' : 'file'
        }));
        console.table(formattedFiles);
    } catch (err) {
        console.log('Operation failed');
    }
}

async function readFile(filePath) {
    const fullPath = path.resolve(currentDir, filePath);
    const stream = createReadStream(fullPath, 'utf-8');
    stream.on('error', () => console.log('Operation failed'));
    stream.pipe(process.stdout);
}

async function createFile(fileName) {
    const fullPath = path.resolve(currentDir, fileName);
    try {
        await fs.writeFile(fullPath, '');
        console.log('File created');
    } catch (err) {
        console.log('Operation failed');
    }
}

async function renameFile(oldPath, newPath) {
    const oldFullPath = path.resolve(currentDir, oldPath);
    const newFullPath = path.resolve(currentDir, newPath);
    try {
        await fs.rename(oldFullPath, newFullPath);
        console.log('File renamed');
    } catch (err) {
        console.log('Operation failed');
    }
}

async function copyFile(source, destination) {
    const srcFullPath = path.resolve(currentDir, source);
    const destFullPath = path.resolve(currentDir, destination);
    const readStream = createReadStream(srcFullPath);
    const writeStream = createWriteStream(destFullPath);
    readStream.on('error', () => console.log('Operation failed'));
    writeStream.on('error', () => console.log('Operation failed'));
    readStream.pipe(writeStream);
}

async function moveFile(source, destination) {
    await copyFile(source, destination);
    await deleteFile(source);
}

async function deleteFile(filePath) {
    const fullPath = path.resolve(currentDir, filePath);
    try {
        await fs.unlink(fullPath);
        console.log('File deleted');
    } catch (err) {
        console.log('Operation failed');
    }
}

function handleOSCommand(option) {
    switch (option) {
        case '--EOL':
            console.log(JSON.stringify(os.EOL));
            break;

        case '--cpus':
            const cpus = os.cpus();
            console.log(`Total CPUs: ${cpus.length}`);
            cpus.forEach((cpu, idx) => {
                console.log(
                    `CPU ${idx + 1}: ${cpu.model}, ${cpu.speed / 1000} GHz`
                );
            });
            break;

        case '--homedir':
            console.log(os.homedir());
            break;

        case '--username':
            console.log(os.userInfo().username);
            break;

        case '--architecture':
            console.log(os.arch());
            break;

        default:
            console.log('Invalid input');
    }
}

async function calculateHash(filePath) {
    const fullPath = path.resolve(currentDir, filePath);
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(fullPath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => console.log(hash.digest('hex')));
    stream.on('error', () => console.log('Operation failed'));
}

async function compressFile(source, destination) {
    const srcFullPath = path.resolve(currentDir, source);
    const destFullPath = path.resolve(currentDir, destination);
    const readStream = createReadStream(srcFullPath);
    const writeStream = createWriteStream(destFullPath);
    const brotli = zlib.createBrotliCompress();
    readStream.pipe(brotli).pipe(writeStream);
}

async function decompressFile(source, destination) {
    const srcFullPath = path.resolve(currentDir, source);
    const destFullPath = path.resolve(currentDir, destination);
    const readStream = createReadStream(srcFullPath);
    const writeStream = createWriteStream(destFullPath);
    const brotli = zlib.createBrotliDecompress();
    readStream.pipe(brotli).pipe(writeStream);
}
