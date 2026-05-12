/**
 * Trip bus: local-only vs shared cloud (Supabase).
 * Set useCloud: true and paste your project URL + anon key from Supabase.
 * Run supabase_bus_board.sql in the Supabase SQL editor once.
 */
window.BUS_CONFIG = {
  useCloud: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  /** Same idea as results admin — only who knows PIN can start a new empty trip */
  adminPin: "shark24",
  /** How often to pull updates from cloud (ms) */
  pollMs: 40000,
};
