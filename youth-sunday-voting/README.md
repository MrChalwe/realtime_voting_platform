# Youth Sunday Live Voting

Pages: `index.html` (voters) · `admin.html` (admin) · `screen.html` (big projector screen)

## Setup (about 15 minutes)

1. **Create a Supabase project** at supabase.com (free plan is fine).
2. **Run the database**: Dashboard → SQL Editor → paste all of `schema.sql` → Run.
3. **Turn on anonymous sign-ins**: Authentication → Sign In / Providers → enable **Anonymous sign-ins**. (This is how voters stay anonymous with no sign-up form.)
4. **Create your admin login**: Authentication → Users → Add user (email + password, tick *Auto Confirm*). Then in SQL Editor run:
   ```sql
   insert into admins (user_id) select id from auth.users where email = 'you@example.com';
   ```
5. **Add your keys** in `config.js` (Project Settings → API → Project URL + anon public key).
6. **Host it**: drag the folder onto Netlify Drop, or use GitHub Pages / Vercel. All files must sit in the same folder.

## Using it on the day

1. Open `admin.html` → log in → **New session** (title + description).
2. Add each participant (name, project, short description).
3. Press **Open voting**. Show the **QR code** on the projector or send the link on WhatsApp.
4. Open **big-screen results** on the projector if you want the live leaderboard displayed.
5. When all presentations are done, press **Close voting & reveal winner**.

## Important notes

- **One vote per person**, changeable until you close voting. Counts update live on every phone.
- **Anonymity**: the database never stores names for voters, and nobody (including admin) can read who voted for whom. Admin only sees totals.
- **WiFi limit**: Supabase limits anonymous sign-ins to about 30 per hour per IP by default. If many people use the *same church WiFi*, raise this under Authentication → Rate Limits, or ask people to use mobile data.
- **Test first**: do a dry run with 2–3 phones the day before, then press *Reset all votes*.
- A person who clears their browser data or uses a second phone could vote twice. For a one-day church event this is usually fine; tell members to vote once.
