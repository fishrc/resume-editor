const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
  const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3000/');
  const editor=page.getByRole('textbox',{name:'简历 Markdown 内容'});
  await editor.waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.resume-page .r-block').length>0);
  const initial=await editor.inputValue();
  for (const value of ['# 测试\n## 经历\n- 第一条\n- 第二条','# 测试\n- 一条','', '# 未闭合 **\n`\n:constructor:\n:unknown:', '# 测试\n'+Array(180).fill('- 多页编辑测试').join('\n'), '# 最终简历\n公司']) {
   await editor.fill(value);
   await page.waitForTimeout(100);
   assert.equal(await editor.inputValue(),value);
   assert.equal(await page.getByText('This page couldn’t load').count(),0);
  }
  await page.locator('button[title=":xiaomi:"]').click();
  await page.locator('button[title=":momenta:"]').click();
  assert.match(await editor.inputValue(),/:xiaomi:/);assert.match(await editor.inputValue(),/:momenta:/);
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.resume-page img')).length===2&&Array.from(document.querySelectorAll('.resume-page img')).every(i=>i.complete&&i.naturalWidth>0));
  const draft=await editor.inputValue();await page.waitForTimeout(650);await page.reload();
  await page.waitForFunction(value=>document.querySelector('textarea')?.value===value,draft);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: deleting lines, clearing all, malformed Markdown, unknown icons, multiple pages, brand insertion, draft reload; no client exceptions.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
