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
  const separator=page.getByRole('separator',{name:'调整编辑区和预览区宽度'});
  const before=await page.locator('.editor-panel').boundingBox();
  const handle=await separator.boundingBox();
  await page.mouse.move(handle.x+handle.width/2,handle.y+100);await page.mouse.down();await page.mouse.move(handle.x+110,handle.y+100,{steps:8});await page.mouse.up();
  const after=await page.locator('.editor-panel').boundingBox();assert(after.width>before.width+50);
  await separator.focus();await page.keyboard.press('ArrowLeft');
  assert((await page.locator('.editor-panel').boundingBox()).width<after.width);
  await page.getByRole('tab',{name:'排版设置'}).click();
  const mh=page.getByRole('slider',{name:/^Momenta 图标高度/});await mh.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
  const ih=page.getByRole('slider',{name:/^图标高度/});await ih.focus();await page.keyboard.press('End');
  await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.querySelector('.resume-page .brand-momenta')).height)-7)<0.1);
  assert(Math.abs(await page.locator('.resume-page img[alt="小米"]').evaluate(e=>parseFloat(getComputedStyle(e).height))-28)<0.1);
  assert.equal(await page.locator('.print-page .brand-momenta').evaluate(e=>getComputedStyle(e).height),'7px');
  await page.getByRole('tab',{name:'内容编辑'}).click();
  const draft=await editor.inputValue();await page.waitForTimeout(650);await page.reload();
  await page.waitForFunction(value=>document.querySelector('textarea')?.value===value,draft);
  await page.getByRole('tab',{name:'排版设置'}).click();
  assert.equal(await page.getByRole('slider',{name:/^Momenta 图标高度/}).inputValue(),'7');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await separator.isVisible(),false);
  assert((await page.locator('.editor-panel').boundingBox()).width<=390);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: deleting lines, clearing all, malformed Markdown, unknown icons, multiple pages, brand insertion, draft reload; no client exceptions.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});