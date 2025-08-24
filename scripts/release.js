#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем конфигурацию
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'release-config.json'), 'utf8'));

// Получаем текущую версию из package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Получаем последние коммиты для описания релиза
const getCommitsSinceLastTag = () => {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    return execSync(`git log ${lastTag}..HEAD --oneline --no-merges`, { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim())
      .slice(0, config.release.template.maxCommits)
      .map(line => `- ${line}`);
  } catch (error) {
    // Если нет предыдущих тегов, берем последние коммиты
    return execSync(`git log --oneline --no-merges -${config.release.template.maxCommits}`, { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim())
      .map(line => `- ${line}`);
  }
};

// Создаем описание релиза
const createReleaseNotes = () => {
  const commits = getCommitsSinceLastTag();
  const date = new Date().toISOString().split('T')[0];
  
  let notes = `## Release v${version} (${date})\n\n`;
  
  if (config.release.template.includeCommits && commits.length > 0) {
    notes += `### Changes:\n${commits.join('\n')}\n\n`;
  }
  
  if (config.release.template.includeInstallation) {
    notes += `### Installation:\n\`\`\`bash\nnpm install @gorizond/mcp-rancher-multi@${version}\n\`\`\`\n\n`;
  }
  
  if (config.release.template.includeDocker) {
    notes += `### Docker:\n\`\`\`bash\ndocker pull ${config.docker.registry}/${config.docker.image}:${version}\n\`\`\`\n\n`;
  }
  
  return notes.trim();
};

// Создаем тег и релиз
const createRelease = () => {
  try {
    console.log(`🚀 Creating release v${version}...`);
    
    // Создаем тег
    execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
    console.log(`✅ Tag v${version} created`);
    
    // Пушим тег
    execSync('git push --tags', { stdio: 'inherit' });
    console.log('✅ Tag pushed to remote');
    
    // Создаем релиз через GitHub CLI
    const releaseNotes = createReleaseNotes();
    const tempFile = path.join(__dirname, 'release-notes.md');
    fs.writeFileSync(tempFile, releaseNotes);
    
    try {
      execSync(`gh release create v${version} --title "Release v${version}" --notes-file ${tempFile}`, { stdio: 'inherit' });
      console.log('✅ GitHub release created');
    } catch (ghError) {
      console.log('⚠️  GitHub CLI not available or not authenticated');
      console.log('📝 Release notes:');
      console.log(releaseNotes);
      console.log('\n📋 Manual steps:');
      console.log(`1. Go to: ${config.repository.url}/releases/new`);
      console.log(`2. Tag: v${version}`);
      console.log(`3. Title: Release v${version}`);
      console.log('4. Copy the release notes above');
    }
    
    // Удаляем временный файл
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
    console.log(`\n🎉 Release v${version} is ready!`);
    
  } catch (error) {
    console.error('❌ Error creating release:', error.message);
    process.exit(1);
  }
};

// Запускаем создание релиза
createRelease();