import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Opportunity, Place, ShendamEvent, Booking, PendingBusinessSubmission } from '../types';

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row: Opportunity;
        Insert: Partial<Opportunity> & { title: string; organization: string; category: string };
        Update: Partial<Opportunity>;
      };
      jobs: {
        Row: Opportunity;
        Insert: Partial<Opportunity> & { title: string; organization: string; category: string };
        Update: Partial<Opportunity>;
      };
      places: {
        Row: Place;
        Insert: Partial<Place> & { name: string; category: string; address: string };
        Update: Partial<Place>;
      };
      events: {
        Row: ShendamEvent;
        Insert: Partial<ShendamEvent> & { title: string; date: string; location: string };
        Update: Partial<ShendamEvent>;
      };
      bookings: {
        Row: Booking;
        Insert: Partial<Booking> & { placeId: string; customerName: string; customerPhone: string };
        Update: Partial<Booking>;
      };
      submissions: {
        Row: PendingBusinessSubmission;
        Insert: Partial<PendingBusinessSubmission> & { businessName: string; contactName: string; phone: string };
        Update: Partial<PendingBusinessSubmission>;
      };
    };
  };
}

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project')
);

/**
 * Native Supabase Client instance.
 * If credentials are provided in .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY),
 * this connects directly to your live Supabase cloud database.
 * If credentials are not yet set, it provides a safe fallback that queries the local API.
 */
function createSafeSupabaseClient(): SupabaseClient<Database> {
  if (isSupabaseConfigured) {
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  // Safe client fallback when Supabase credentials are not yet configured
  // This allows queries like `await supabase.from('opportunities').select('*')` to work seamlessly
  const dummyClient = {
    from: (table: string) => {
      let queryUrl = '';
      if (table === 'opportunities' || table === 'jobs') {
        queryUrl = '/api/opportunities';
      } else if (table === 'places' || table === 'businesses') {
        queryUrl = '/api/places';
      } else if (table === 'events') {
        queryUrl = '/api/events';
      }

      // Helper state for query execution
      const executeQuery = async (filters: {
        eqs: Array<{ column: string; value: any }>;
        ins: Array<{ column: string; values: any[] }>;
        orderBy?: { column: string; ascending: boolean };
        limitCount?: number;
      }) => {
        if (!queryUrl) return { data: [], error: null };
        try {
          const res = await fetch(queryUrl);
          const json = await res.json();
          let list: any[] = json.opportunities || json.places || json.events || (Array.isArray(json) ? json : []);

          // Apply .eq filters
          for (const { column, value } of filters.eqs) {
            list = list.filter((item: any) => item[column] === value);
          }

          // Apply .in filters
          for (const { column, values } of filters.ins) {
            list = list.filter((item: any) => values.includes(item[column]));
          }

          // Apply .order
          if (filters.orderBy) {
            const { column, ascending } = filters.orderBy;
            list.sort((a, b) => {
              const valA = a[column] || '';
              const valB = b[column] || '';
              if (valA < valB) return ascending ? -1 : 1;
              if (valA > valB) return ascending ? 1 : -1;
              return 0;
            });
          }

          // Apply limit
          if (filters.limitCount && filters.limitCount > 0) {
            list = list.slice(0, filters.limitCount);
          }

          return { data: list, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      };

      const createQueryBuilder = (state: {
        eqs: Array<{ column: string; value: any }>;
        ins: Array<{ column: string; values: any[] }>;
        orderBy?: { column: string; ascending: boolean };
        limitCount?: number;
      }) => {
        return {
          eq: (column: string, value: any) => createQueryBuilder({ ...state, eqs: [...state.eqs, { column, value }] }),
          in: (column: string, values: any[]) => createQueryBuilder({ ...state, ins: [...state.ins, { column, values }] }),
          order: (column: string, opts?: { ascending?: boolean }) =>
            createQueryBuilder({
              ...state,
              orderBy: { column, ascending: opts?.ascending !== false }
            }),
          limit: (limitCount: number) => createQueryBuilder({ ...state, limitCount }),
          single: () => ({
            then: async (resolve: (val: { data: any | null; error: any | null }) => void) => {
              const res = await executeQuery(state);
              if (res.error) return resolve({ data: null, error: res.error });
              return resolve({ data: res.data && res.data.length > 0 ? res.data[0] : null, error: null });
            }
          }),
          then: async (resolve: (val: { data: any[] | null; error: any | null }) => void) => {
            const res = await executeQuery(state);
            return resolve(res);
          }
        };
      };

      const chainable = {
        select: (columns: string = '*') => createQueryBuilder({ eqs: [], ins: [] }),
        insert: (rows: any) => ({
          then: async (resolve: (val: { data: any | null; error: any | null }) => void) => {
            return resolve({ data: rows, error: null });
          }
        }),
        update: (values: any) => ({
          eq: () => ({
            then: async (resolve: (val: { data: any | null; error: any | null }) => void) => {
              return resolve({ data: values, error: null });
            }
          })
        }),
        delete: () => ({
          eq: () => ({
            then: async (resolve: (val: { data: any | null; error: any | null }) => void) => {
              return resolve({ data: null, error: null });
            }
          })
        })
      };

      return chainable as any;
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: new Error('Configure Supabase credentials') }),
      signOut: async () => ({ error: null })
    }
  };

  return dummyClient as unknown as SupabaseClient<Database>;
}

export const supabase = createSafeSupabaseClient();
export default supabase;
