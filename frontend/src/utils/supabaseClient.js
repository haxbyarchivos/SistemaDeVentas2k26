// /src/utils/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://malkitlwsdseqreyywzs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hbGtpdGx3c2RzZXFyZXl5d3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDkwMzUsImV4cCI6MjA3OTY4NTAzNX0.5S1Ejo9lIzYnpf8LHoaxtCh50tvm2Rtk37IFJfnpP5w";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
