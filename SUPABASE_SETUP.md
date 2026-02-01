Supabase setup and integration notes

1) Create a Supabase project
   - Go to https://app.supabase.com/ and create a new project.
   - In the project settings → API, copy the `URL` and the `anon/public` key.
   - For server-side access copy the `service_role` key (keep it secret).

2) Create the database schema
   - Open Supabase project → SQL Editor → New Query
   - Open the file `supabase_schema.sql` in this repository and paste its contents into the SQL editor
   - Run the query. This will create tables used by the application.

3) Backend integration (server-side)
   - Install the Supabase JS client in backend:

     ```bash
     cd backend
     npm install @supabase/supabase-js
     ```

   - Set environment variables for the backend (Service Role key):

     - `SUPABASE_URL` = your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key (server only)

   - A helper client was added at `backend/config/supabase.js` with example `users` helpers. Use those in your controllers instead of raw SQL queries when migrating functionality.

   - Example usage in a controller (Node/Express):

     ```js
     const supabase = require('../config/supabase');
     // create a user
     await supabase.users.create({ user_name, email, password_hash, full_name });
     // find by email
     const user = await supabase.users.findByEmail(email);
     ```

4) Frontend integration
   - In `frontend/.env` fill the variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Install `@supabase/supabase-js` in frontend if you need client-side auth or real-time:

     ```bash
     cd frontend
     npm install @supabase/supabase-js
     ```

   - Example frontend init (Vite / React / plain JS):

     ```js
     import { createClient } from '@supabase/supabase-js'
     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
     const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
     export const supabase = createClient(supabaseUrl, supabaseAnonKey)
     ```

5) Migration notes
   - Supabase uses Postgres; MySQL-specific SQL and queries will differ. The supplied `supabase_schema.sql` is a best-effort mapping of your existing models to a Postgres schema.
   - Start by creating the schema, then update backend controllers to call `supabase` methods or write SQL using Supabase's SQL editor for complex queries.

6) Security
   - Never expose the `service_role` key to the frontend or client-side code.
   - Use Row-Level Security (RLS) and policies in Supabase for production apps; configure policies after initial migration.
