import fs from 'fs';
import { spawnSync } from 'child_process';

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');

for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        let value = values.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);

        if (key && value) {
            console.log(`Pushing ${key}...`);
            const child = spawnSync('npx', ['vercel', 'env', 'add', key.trim(), 'production'], {
                input: value,
                stdio: ['pipe', 'inherit', 'inherit'],
                shell: true
            });
            if (child.error) {
                console.error(`Failed to push ${key}`, child.error.message);
            }
        }
    }
}
