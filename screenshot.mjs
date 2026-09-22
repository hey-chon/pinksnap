import puppeteer from 'puppeteer';
import path from 'path';

const OUT = 'C:\\Users\\jisar\\Desktop\\pink-snap-test\\public';
const SUPABASE_URL = 'https://gthbvhefwctugvmouqrg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NjanNZBTAzuHMHUDP-4Pbw_skLn_dn7';
const EMAIL = 'ilogchon500@gmail.com';
const PASSWORD = 'chon12345';

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

async function shot(filename) {
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(OUT, filename), type: 'jpeg', quality: 93 });
  console.log('✓ ' + filename + ' — ' + page.url());
}

try {
  // 1. Load the app home first so the Supabase client is available
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // 2. Inject Supabase and sign in programmatically via the REST API
  console.log('Signing in via Supabase REST API...');
  const authResult = await page.evaluate(async (url, key, email, password) => {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.access_token) {
      // Store session in localStorage so the app picks it up
      const storageKey = `sb-gthbvhefwctugvmouqrg-auth-token`;
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        expires_in: data.expires_in,
        token_type: 'bearer',
        user: data.user,
      };
      localStorage.setItem(storageKey, JSON.stringify(session));
      return { ok: true, email: data.user?.email };
    }
    return { ok: false, error: data.error_description || data.msg || JSON.stringify(data) };
  }, SUPABASE_URL, SUPABASE_ANON_KEY, EMAIL, PASSWORD);

  console.log('Auth result:', JSON.stringify(authResult));

  if (!authResult.ok) {
    throw new Error('Login failed: ' + authResult.error);
  }

  // 3. Reload so the app picks up the session from localStorage
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  console.log('After reload URL:', page.url());

  // 4. Auth page — screenshot it (shows the login page for tutorial step 1)
  const authPage = await browser.newPage();
  await authPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await authPage.goto('http://localhost:5173/auth', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await authPage.screenshot({ path: path.join(OUT, 'ss-auth.jpg'), type: 'jpeg', quality: 93 });
  console.log('✓ ss-auth.jpg');
  await authPage.close();

  // 5. Loading/setup page
  await page.goto('http://localhost:5173/loading', { waitUntil: 'networkidle2', timeout: 20000 });
  await shot('ss-setup.jpg');

  // 6. Studio page
  await page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle2', timeout: 20000 });
  await shot('ss-studio.jpg');

  // 7. Edit page
  await page.goto('http://localhost:5173/edit', { waitUntil: 'networkidle2', timeout: 20000 });
  await shot('ss-edit.jpg');

  // 8. Gallery
  await page.goto('http://localhost:5173/gallery', { waitUntil: 'networkidle2', timeout: 20000 });
  await shot('ss-gallery.jpg');

  // 9. Home (logged in)
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 20000 });
  await shot('ss-home.jpg');

  console.log('\nAll done!');
} catch (e) {
  console.error('Error:', e.message);
  await page.screenshot({ path: path.join(OUT, 'ss-debug.jpg'), type: 'jpeg', quality: 90 });
  console.log('Debug screenshot saved.');
} finally {
  await browser.close();
}
