import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, rm } from 'node:fs';
import glob from 'glob';
import path from 'path';
import tmp, { file } from 'tmp';
import spawn from 'cross-spawn';
import del from 'del';

tmp.setGracefulCleanup();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const files = glob.sync(resolve(__dirname, 'src/templates/*.html'));

const viteConfig = readFileSync('./vite.config.ts', { encoding: 'utf-8' });


function cleanBuildDirectory() {
    del.sync("dist/**");
}

function createTempConfig(file) {
    const newConfigFileName = `vite-config-${file.name}.ts`;
    del.sync(newConfigFileName);

    const configCopy = viteConfig.toString().replace('index.html', file.base);
    
    const tempConfigFile = tmp.fileSync({
        tmpdir: '.',
        name: newConfigFileName,
    });

    writeFileSync(tempConfigFile.fd, configCopy);
    return tempConfigFile.name;
}

function build(filePath) {
    const file = path.parse(filePath);
    console.log(`processing ${file.base} ...`);
    const tempConfigFilePath = createTempConfig(file);
    
    try {
        spawn.sync('vite', ['--config', tempConfigFilePath, 'build'], { stdio: 'inherit' });
    } catch (e) {
        console.log("Got exception during build");
    }
}

console.log('Cleaning build dir...');
cleanBuildDirectory();

console.log('Building...');

files.forEach((filePath) => {
    build(filePath);
});

console.log('Done');
