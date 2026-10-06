import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const outputDir = path.resolve(__dirname, '../media');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('[RECORDER] Launching Chrome in high-definition 1280x720 video recording mode...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    console.log('[RECORDER] 1. Visiting Landing Page...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
    await sleep(2000);

    // Scroll down slowly to show live vitals showcase & pillars
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
    await sleep(2500);

    await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
    await sleep(2500);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1500);

    // Toggle Language to Amharic
    console.log('[RECORDER] 2. Demonstrating Bilingual Switcher (Amharic)...');
    const langBtn = await page.locator('button:has-text("አማርኛ"), button:has-text("English")');
    if (await langBtn.count() > 0) {
      await langBtn.first().click();
      await sleep(2500);
      // Toggle back to English for navigation
      await langBtn.first().click();
      await sleep(1500);
    }

    // Go to Login
    console.log('[RECORDER] 3. Navigating to Login Page...');
    await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle' });
    await sleep(1500);

    // Click demo patient login
    console.log('[RECORDER] 4. Selecting John Doe (Patient) Demo Profile...');
    const patientDemoBtn = await page.locator('button:has-text("John Doe")');
    if (await patientDemoBtn.count() > 0) {
      await patientDemoBtn.first().click();
      await sleep(1000);
    }

    // Submit Sign In
    const signInBtn = await page.locator('button[type="submit"]');
    await signInBtn.click();
    await sleep(3000);

    // Patient Dashboard Demonstration
    console.log('[RECORDER] 5. Exploring Patient Dashboard...');
    await page.waitForURL('**/patient', { timeout: 10000 }).catch(() => {});
    await sleep(2000);

    // Scroll to show vitals monitor & health simulator
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await sleep(2000);

    // Start Live Health Stream
    console.log('[RECORDER] 6. Starting Smart Health Device Stream...');
    const startStreamBtn = await page.locator('button:has-text("Start Live Health Stream"), button:has-text("የቀጥታ የጤና ስርጭት ጀምር")');
    if (await startStreamBtn.count() > 0) {
      await startStreamBtn.first().click();
      await sleep(3000);

      // Select Tachycardia scenario to trigger real-time alert
      const tachBtn = await page.locator('button:has-text("Tachycardia"), button:has-text("ፈጣን የልብ ምት")');
      if (await tachBtn.count() > 0) {
        await tachBtn.first().click();
        await sleep(3000);
      }
    }

    // Toggle to Amharic on Patient Dashboard to show full translation
    console.log('[RECORDER] 7. Showcasing Full Amharic Dashboard View...');
    const dashLangBtn = await page.locator('nav button:has-text("አማርኛ"), nav button:has-text("English")');
    if (await dashLangBtn.count() > 0) {
      await dashLangBtn.first().click();
      await sleep(3000);
    }

    // Scroll to see official EHR records
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
    await sleep(2500);

    // Switch to Doctor view
    console.log('[RECORDER] 8. Navigating to Doctor Clinic Dashboard...');
    await page.goto('http://127.0.0.1:3000/doctor', { waitUntil: 'networkidle' });
    await sleep(2500);

    // Scroll to show doctor view
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await sleep(2000);

    // Navigate to Admin Governance Dashboard
    console.log('[RECORDER] 9. Navigating to Admin Compliance Center...');
    await page.goto('http://127.0.0.1:3000/admin', { waitUntil: 'networkidle' });
    await sleep(2000);

    // Click Verify Cryptographic Integrity
    const verifyBtn = await page.locator('button:has-text("Verify Record History Integrity"), button:has-text("የመዝገቦችን ትክክለኛነት አረጋግጥ")');
    if (await verifyBtn.count() > 0) {
      console.log('[RECORDER] 10. Verifying Cryptographic Audit Trail...');
      await verifyBtn.first().click();
      await sleep(3000);
    }

    // Switch to System Services tab
    const servicesTab = await page.locator('button:has-text("System Services"), button:has-text("የሲስተም አገልግሎቶች")');
    if (await servicesTab.count() > 0) {
      await servicesTab.first().click();
      await sleep(2500);
    }

    // Back to Landing Page finale
    console.log('[RECORDER] 11. Concluding Video on Landing Page...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
    await sleep(2500);

    console.log('[RECORDER] Walkthrough sequence completed.');
  } catch (err) {
    console.error('[RECORDER] Error during recording:', err);
  } finally {
    // Save video
    const videoObj = page.video();
    await context.close();
    await browser.close();

    if (videoObj) {
      const videoPath = await videoObj.path();
      const finalVideoPath = path.resolve(outputDir, 'telehealth_hub_walkthrough.webm');
      fs.copyFileSync(videoPath, finalVideoPath);
      console.log(`[RECORDER] SUCCESS! Video recorded and saved at: ${finalVideoPath}`);
    }
  }
}

run();
