import { useState } from 'react';
import { useGlobalSearchQuery } from '../../api/searchApi.ts';
import { Search, Building2, Users, Kanban, CheckSquare } from 'lucide-react';
import { Input } from '../../components/ui/input.tsx';

export const SearchPage = () => {
  const [q, setQ] = useState('');
  const { data, isFetching } = useGlobalSearchQuery({ q, limit: 5 }, { skip: q.length < 2 });
  const res: any = data?.data || data;

  return (
    <div className="space-y-4 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> Global Search</h1>
        <p className="text-sm text-slate-500 mt-1">Search across leads, contacts, companies, deals, tasks — org-isolated.</p>
      </div>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type at least 2 chars… e.g., Acme" className="pl-9 h-11 bg-white" />
      </div>
      {isFetching && <div className="text-sm text-muted-foreground">Searching…</div>}
      {q.length >= 2 && res && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { k: 'leads', label: 'Leads', icon: Users, items: res.leads },
            { k: 'contacts', label: 'Contacts', icon: Users, items: res.contacts },
            { k: 'companies', label: 'Companies', icon: Building2, items: res.companies },
            { k: 'deals', label: 'Deals', icon: Kanban, items: res.deals },
            { k: 'tasks', label: 'Tasks', icon: CheckSquare, items: res.tasks },
          ].map((g) => (
            <div key={g.k} className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2 font-medium text-sm"><g.icon className="w-4 h-4 text-slate-500" />{g.label} <span className="ml-auto text-xs bg-slate-100 border px-2 py-0.5 rounded-full">{g.items?.length ?? 0}</span></div>
              <div className="mt-3 space-y-2">
                {g.items?.length ? g.items.map((it: any) => (
                  <div key={it.id} className="text-sm p-2 rounded-xl bg-slate-50 border truncate">{it.firstName || it.name || it.title || it.id}</div>
                )) : <div className="text-xs text-muted-foreground">No results</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
