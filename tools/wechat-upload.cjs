const path = require('path');
const os = require('os');
const fs = require('fs');
const ci = require('miniprogram-ci');
const { RELEASE } = require('../minigame/src/version');

const appid = 'wx2ce1b5022e1d37f0';
const projectPath = path.resolve(__dirname, '../minigame');
const privateKeyPath = process.env.WECHAT_CI_KEY || path.join(os.homedir(), '.evosnake', `private.${appid}.key`);

if (!fs.existsSync(privateKeyPath)) {
  console.error('\n[缺少代码上传密钥]');
  console.error(`请把微信后台下载的密钥放到：\n${privateKeyPath}\n`);
  console.error('文件名必须保持为 private.wx2ce1b5022e1d37f0.key');
  process.exit(2);
}

const uploadVersion = RELEASE.version.replace(/^v/i, '');
const desc = `${RELEASE.title} | ${RELEASE.time}`.slice(0, 100);

const project = new ci.Project({
  appid,
  type: 'miniGame',
  projectPath,
  privateKeyPath,
  ignores: ['node_modules/**/*', '.git/**/*', 'tests/**/*', 'tools/**/*']
});

(async () => {
  console.log(`\nEvoSnake 微信小游戏上传`);
  console.log(`版本：${RELEASE.version}`);
  console.log(`时间：${RELEASE.time}`);
  console.log(`项目：${projectPath}`);

  try {
    await ci.upload({
      project,
      version: uploadVersion,
      desc,
      robot: 1,
      setting: { useProjectConfig: true },
      onProgressUpdate: (p) => {
        const pct = typeof p?.percent === 'number' ? `${Math.round(p.percent)}%` : '';
        const msg = p?.message || p?.status || '';
        if (pct || msg) console.log(`上传进度 ${pct} ${msg}`.trim());
      }
    });
    console.log(`\n✅ 上传成功：${RELEASE.version}`);
    console.log('现在去微信公众平台后台确认开发版本/体验版即可。\n');
  } catch (err) {
    console.error('\n❌ 上传失败');
    console.error(err && (err.stack || err.message || err));
    process.exit(1);
  }
})();
