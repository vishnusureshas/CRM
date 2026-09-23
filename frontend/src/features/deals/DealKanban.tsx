import { useState } from 'react';
import { useGetPipelinesQuery, useGetDealsQuery, useCreateDealMutation, useMoveDealStageMutation, useCloseDealMutation } from '../../api/salesApi.ts';
import type {} from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Plus, CheckCircle, XCircle, GripVertical, Layers, DollarSign, Briefcase } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  pipelineId: z.string().cuid(),
  stageId: z.string().cuid(),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
});

export const DealKanban = () => {
  const { data: pipelinesData } = useGetPipelinesQuery({});
  const pipelines: any[] = (pipelinesData as any)?.data || [];
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const activePipeline = pipelines.find((p) => p.id === (selectedPipeline || pipelines[0]?.id)) || pipelines[0];
  const stages: any[] = activePipeline?.stages ? [...activePipeline.stages].sort((a: any, b: any) => a.order - b.order) : [];

  const { data: dealsData, isLoading } = useGetDealsQuery(activePipeline ? { pipelineId: activePipeline.id } : undefined, { skip: !activePipeline });
  const deals: any[] = (dealsData as any)?.data || [];

  const [createDeal, { isLoading: creating }] = useCreateDealMutation();
  const [moveStage] = useMoveDealStageMutation();
  const [closeDeal] = useCloseDealMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onCreate = async (fd: any) => {
    await createDeal({ name: fd.name, pipelineId: fd.pipelineId, stageId: fd.stageId, amount: fd.amount }).unwrap();
    reset(); setShowCreate(false);
  };

  if (!pipelines.length && !isLoading) {
    return (
      <div className="p-10 text-center bg-white border rounded-xl">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><Layers className="w-6 h-6 text-slate-400" /></div>
        <div className="font-semibold">No pipelines yet</div>
        <p className="text-sm text-slate-500 mt-1">Create a pipeline first to organize your deals.</p>
        <a href="/pipelines"><Button className="mt-4 rounded-xl bg-slate-900 text-white">Go to Pipelines</Button></a>
      </div>
    );
  }

  const totalValue = deals.reduce((s: number, d: any) => s + Number(d.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header — simple and clear */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activePipeline ? `${deals.length} deals • $${totalValue.toLocaleString()} total • Drag cards to move between stages` : 'Organize your deals across pipeline stages'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={activePipeline?.id || ''} onChange={(e) => setSelectedPipeline(e.target.value)} className="h-10 rounded-xl border bg-white px-4 text-sm font-medium min-w-[180px]">
            {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name} {p.isDefault ? ' (Default)' : ''}</option>)}
          </select>
          <Button onClick={() => setShowCreate(true)} className="h-10 px-5 rounded-xl bg-slate-900 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Deal
          </Button>
        </div>
      </div>

      {/* Create Deal Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)} className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create Deal</DialogTitle>
            <DialogDescription>Add a new deal to your pipeline. Choose the starting stage.</DialogDescription>
          </DialogHeader>
          {activePipeline && (
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4 p-6 pt-0">
              <div><Label>Deal Name *</Label><Input {...register('name')} placeholder="e.g. Acme — Professional Plan" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.name && <p className="text-xs text-red-600 mt-1">{(errors.name as any).message}</p>}</div>
              <div><Label>Amount ($) *</Label><Input type="number" {...register('amount')} placeholder="50000" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.amount && <p className="text-xs text-red-600 mt-1">{(errors.amount as any).message}</p>}</div>
              <div><Label>Pipeline</Label><select {...register('pipelineId')} defaultValue={activePipeline.id} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm">{pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><Label>Stage</Label><select {...register('stageId')} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm">{stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating} className="rounded-xl bg-slate-900 text-white px-6">{creating ? 'Creating...' : 'Create Deal'}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Kanban — clean column layout */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">{[1, 2, 3, 4].map((i) => <div key={i} className="w-[300px] h-[400px] bg-slate-100 rounded-xl animate-pulse shrink-0" />)}</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {stages.map((stage: any) => {
            const stageDeals = deals.filter((d: any) => d.stageId === stage.id);
            const total = stageDeals.reduce((s: number, d: any) => s + Number(d.amount || 0), 0);
            const isDragOver = dragOverStage === stage.id;
            return (
              <div
                key={stage.id}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  const dealId = e.dataTransfer.getData('text/plain');
                  const deal = deals.find((d: any) => d.id === dealId);
                  if (deal && deal.stageId !== stage.id) {
                    try { await moveStage({ id: dealId, stageId: stage.id }).unwrap(); } catch {}
                  }
                  setDraggedDeal(null); setDragOverStage(null);
                }}
                className={`shrink-0 snap-start w-[300px] flex flex-col rounded-xl border bg-slate-50 overflow-hidden transition-colors ${isDragOver ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200'}`}
                style={{ minHeight: '480px' }}
              >
                {/* Column header */}
                <div className="bg-white border-b sticky top-0">
                  <div className="h-1 w-full" style={{ background: stage.color || '#64748b' }} />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color || '#64748b' }} />
                        {stage.name}
                      </h3>
                      <span className="text-xs bg-slate-100 border px-2 py-1 rounded-full">{stageDeals.length}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">${total.toLocaleString()} • {stage.probability}% chance</div>
                  </div>
                </div>

                {/* Cards */}
                <div className={`flex-1 p-3 space-y-3 overflow-y-auto ${isDragOver ? 'bg-violet-50/50' : ''}`}>
                  {stageDeals.length === 0 ? (
                    <div className={`text-xs text-center py-8 border-2 border-dashed rounded-xl ${isDragOver ? 'border-violet-400 bg-white text-violet-700' : 'border-slate-300 bg-white text-slate-500'}`}>
                      <div className="font-medium">{isDragOver ? 'Drop here' : 'No deals'}</div>
                      <div className="text-xs mt-1">Drag a card here</div>
                    </div>
                  ) : stageDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => { setDraggedDeal(deal.id); e.dataTransfer.setData('text/plain', deal.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDraggedDeal(null); setDragOverStage(null); }}
                      className={`p-4 rounded-xl border bg-white cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedDeal === deal.id ? 'opacity-50 shadow-lg border-violet-300' : 'shadow-sm'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm leading-tight flex-1">{deal.name}</div>
                        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-bold flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{Number(deal.amount).toLocaleString()}</span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${deal.status === 'WON' ? 'bg-green-50 text-green-700 border-green-200' : deal.status === 'LOST' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100'}`}>{deal.status}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t flex gap-1.5">
                        {deal.status === 'OPEN' ? (
                          <>
                            <Button size="sm" className="h-7 text-xs rounded-full bg-green-600 hover:bg-green-700 text-white flex-1" onClick={async () => { await closeDeal({ id: deal.id, status: 'WON' }).unwrap(); }}><CheckCircle className="w-3 h-3 mr-1" /> Won</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full flex-1" onClick={async () => { await closeDeal({ id: deal.id, status: 'LOST' }).unwrap(); }}><XCircle className="w-3 h-3 mr-1" /> Lost</Button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 w-full text-center py-1">Closed • {new Date(deal.closedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white border-t flex items-center justify-between text-xs">
                  <span className="text-slate-500">{stageDeals.length} deals</span>
                  <span className="font-semibold">${total.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-500 flex items-center gap-2 justify-center">
        <Briefcase className="w-3 h-3" /> Tip: drag a deal card to another column to move it.
      </p>
    </div>
  );
};
