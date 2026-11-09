# Youth Sunday Live Voting (a Get Kreative Media project)

Pages: `index.html` (voters) · `admin.html` (admin) · `screen.html` (big projector screen)
Supporting files: `style.css` (the bento look) · `ui.js` (shared leaderboard code) · `config.js` (your Supabase keys) · `schema.sql` (database) · `fonts/` (the typeface, so nothing loads from outside)

## Already set up the first version?
Replace `index.html`, `admin.html`, `screen.html` and `style.css`, and add the new `ui.js` and `fonts/` folder.
**Keep your own `config.js`** (it holds your Supabase keys). Nothing changes in the database.

## Setup (about 15 minutes)

1. **Create a Supabase project** at supabase.com (free plan is fine).
2. **Run the database**: Dashboard → SQL Editor → paste all of `schema.sql` → Run.
3. **Turn on anonymous sign-ins**: Authentication → Sign In / Providers → enable **Anonymous sign-ins**. (This is how voters stay anonymous with no sign-up form.)
4. **Create your admin login**: Authentication → Users → Add user (email + password, tick *Auto Confirm*). Then in SQL Editor run:
   ```sql
   insert into admins (user_id) select id from auth.users where email = 'you@example.com';
   ```
5. **Add your keys** in `config.js` (Project Settings → API Keys → Project URL + anon public key).
6. **Host it**: drag the folder onto Netlify Drop, or use GitHub Pages / Vercel. All files and the `fonts` folder must stay together.

## Make it yours
- **Logo**: save your logo as `logo.png` in the same folder. It shows up next to "Get Kreative Media" on every page. No file, no problem.
- **Colours**: change `--brand` (the purple) at the top of `style.css`. The pastel tile colours live in the `PALETTE` list at the top of `ui.js`.

## Using it on the day

1. Open `admin.html`, log in, and create a **New session** (title + description).
2. Add each participant (name, project, short description).
3. Press **Open voting**. Show the **QR code** on the projector or send the link on WhatsApp.
4. Open **the big-screen results** on the projector if you want the live leaderboard displayed.
5. When all presentations are done, press **Close voting and show winner**.

## Important notes

- **One vote per person**, changeable until you close voting. Counts update live on every phone.
- **Anonymity**: the database never stores names for voters, and nobody (including admin) can read who voted for whom. Admin only sees totals.
- **WiFi limit**: Supabase limits anonymous sign-ins to about 30 per hour per IP by default. If many people use the *same church WiFi*, raise this under Authentication → Rate Limits, or ask people to use mobile data.
- **Test first**: do a dry run with 2–3 phones the day before, then press *Reset all votes to 0*.
- A person who clears their browser data or uses a second phone could vote twice. For a one-day church event this is usually fine; tell members to vote once.
