import { useState, useEffect } from 'react';
import { useGetPipelinesQuery, useCreatePipelineMutation, useCreateStageMutation, useDeletePipelineMutation, useReorderStagesMutation } from '../../api/salesApi.ts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Plus, Trash2, Layers, GripVertical, Target, Palette, Lock, Unlock, ChevronDown, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const pipelineSchema = z.object({ name: z.string().min(1, 'Name is required').max(100), description: z.string().max(500).optional(), isDefault: z.boolean().optional() });
const stageSchema = z.object({ name: z.string().min(1, 'Name is required').max(50), order: z.coerce.number().int().min(1), probability: z.coerce.number().int().min(0).max(100).optional().default(0), color: z.string().optional(), isClosed: z.boolean().optional().default(false) });

export const PipelineList = () => {
  const { data, isLoading } = useGetPipelinesQuery({});
  const pipelines: any[] = (data as any)?.data || [];
  const [createPipeline, { isLoading: creating }] = useCreatePipelineMutation();
  const [createStage] = useCreateStageMutation();
  const [deletePipeline] = useDeletePipelineMutation();
  const [reorderStages] = useReorderStagesMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showStageFor, setShowStageFor] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingPipeline, setDraggingPipeline] = useState<string | null>(null);

  useEffect(() => {
    if (pipelines.length && !expanded) setExpanded(pipelines[0].id);
  }, [pipelines]);

  const { register: regP, handleSubmit: hP, reset: rP, formState: { errors: eP } } = useForm({ resolver: zodResolver(pipelineSchema) });
  const { register: regS, handleSubmit: hS, reset: rS } = useForm({ resolver: zodResolver(stageSchema) });

  const onCreatePipeline = async (fd: any) => {
    await createPipeline({ name: fd.name, description: fd.description || undefined, isDefault: fd.isDefault || false }).unwrap();
    rP(); setShowCreate(false);
  };
  const onCreateStage = async (pipelineId: string, fd: any) => {
    const nextOrder = fd.order || (pipelines.find((p) => p.id === pipelineId)?.stages?.length || 0) + 1;
    await createStage({ pipelineId, name: fd.name, order: nextOrder, probability: fd.probability ?? 0, color: fd.color || undefined, isClosed: fd.isClosed || false }).unwrap();
    rS(); setShowStageFor(null);
  };

  const handleDragStart = (e: React.DragEvent, stageId: string, pipelineId: string) => {
    setDraggedId(stageId); setDraggingPipeline(pipelineId);
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', stageId);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); setDraggingPipeline(null); };
  const handleDragOver = (e: React.DragEvent, stageId: string) => { e.preventDefault(); if (draggedId !== stageId) setDragOverId(stageId); };
  const handleDragLeave = () => setDragOverId(null);
  const handleDrop = async (e: React.DragEvent, targetId: string, pipelineId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || draggingPipeline !== pipelineId) return;
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return;
    const stages = [...(pipeline.stages || [])].sort((a: any, b: any) => a.order - b.order);
    const draggedIdx = stages.findIndex((s: any) => s.id === draggedId);
    const targetIdx = stages.findIndex((s: any) => s.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const [dragged] = stages.splice(draggedIdx, 1);
    stages.splice(targetIdx, 0, dragged);
    const reordered = stages.map((s: any, idx: number) => ({ id: s.id, order: idx + 1 }));
    setDraggedId(null); setDragOverId(null);
    try { await reorderStages({ pipelineId, stages: reordered }).unwrap(); } catch {}
  };

  const defaultPipeline = pipelines.find((p: any) => p.isDefault);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header — clean, user-friendly */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Pipelines</h1>
          <p className="text-sm text-slate-500 mt-1">Create pipelines and organize stages. Drag stages to change their order.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="h-10 px-5 rounded-xl bg-slate-900 text-white">
          <Plus className="w-4 h-4 mr-2" /> New Pipeline
        </Button>
      </div>

      {/* Simple stats */}
      {pipelines.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center"><Layers className="w-4 h-4" /></div>
            <div><div className="text-slate-500 text-xs">Pipelines</div><div className="font-semibold">{pipelines.length}</div></div>
          </div>
          <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center"><Target className="w-4 h-4" /></div>
            <div><div className="text-slate-500 text-xs">Total Stages</div><div className="font-semibold">{pipelines.reduce((a: number, p: any) => a + (p.stages?.length || 0), 0)}</div></div>
          </div>
          <div className="bg-white border rounded-xl p-4 flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center"><Star className="w-4 h-4" /></div>
            <div className="min-w-0"><div className="text-slate-500 text-xs">Default Pipeline</div><div className="font-semibold truncate">{defaultPipeline?.name || 'Not set'}</div></div>
          </div>
        </div>
      )}

      {/* Create Pipeline Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)} className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create Pipeline</DialogTitle>
            <DialogDescription>Give your pipeline a name. You can add stages after creation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={hP(onCreatePipeline)} className="space-y-4 p-6 pt-0">
            <div><Label>Name *</Label><Input {...regP('name')} placeholder="e.g. Sales Pipeline" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{eP.name && <p className="text-xs text-red-600 mt-1">{(eP.name as any).message}</p>}</div>
            <div><Label>Description</Label><Input {...regP('description')} placeholder="e.g. Main sales process for new customers" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
            <label className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50 cursor-pointer">
              <input type="checkbox" {...regP('isDefault')} className="w-4 h-4" />
              <span className="text-sm font-medium">Set as default pipeline</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="rounded-xl bg-slate-900 text-white px-6">{creating ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pipelines */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : pipelines.length === 0 ? (
        <Card className="p-10 text-center border-dashed bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center mx-auto mb-3"><Layers className="w-6 h-6 text-slate-400" /></div>
          <div className="font-semibold">No pipelines yet</div>
          <p className="text-sm text-slate-500 mt-1">Create your first pipeline to start managing deals.</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl bg-slate-900 text-white"><Plus className="w-4 h-4 mr-2" /> Create Pipeline</Button>
        </Card>
      ) : (
        pipelines.map((p: any) => {
          const isExpanded = expanded === p.id;
          const sortedStages = [...(p.stages || [])].sort((a: any, b: any) => a.order - b.order);
          return (
            <Card key={p.id} className="overflow-hidden border shadow-sm bg-white">
              <div className={`h-1 w-full ${p.isDefault ? 'bg-amber-500' : 'bg-slate-200'}`} />
              <CardHeader className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${p.isDefault ? 'bg-amber-500' : 'bg-slate-900'}`}><Layers className="w-5 h-5" /></div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {p.name} {p.isDefault && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Default</span>}
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 border">{sortedStages.length} stages</span>
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{p.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setExpanded(isExpanded ? null : p.id)}>
                      {isExpanded ? 'Hide' : 'Manage'} <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                    {!p.isDefault && (
                      <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-red-600" onClick={async () => { if (confirm(`Delete "${p.name}"?`)) await deletePipeline(p.id).unwrap(); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Stages</h4>
                      <p className="text-xs text-slate-500">Drag to reorder • Order decides the column order in Deals</p>
                    </div>
                    <Button size="sm" className="rounded-xl bg-slate-900 text-white" onClick={() => setShowStageFor(p.id)}><Plus className="w-4 h-4 mr-1" /> Add Stage</Button>
                  </div>

                  <Dialog open={showStageFor === p.id} onOpenChange={(o) => setShowStageFor(o ? p.id : null)}>
                    <DialogContent onClose={() => setShowStageFor(null)} className="max-w-[480px]">
                      <DialogHeader>
                        <DialogTitle>Add Stage to {p.name}</DialogTitle>
                        <DialogDescription>Stages are shown as columns. The order controls their left-to-right position.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={hS((fd) => onCreateStage(p.id, fd))} className="space-y-4 p-6 pt-0">
                        <div><Label>Stage Name *</Label><Input {...regS('name')} placeholder="e.g. Negotiation" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><Label>Order</Label><Input type="number" {...regS('order')} placeholder={`${sortedStages.length + 1}`} className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
                          <div><Label>Win Chance %</Label><Input type="number" {...regS('probability')} placeholder="60" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
                        </div>
                        <div><Label>Color</Label><Input {...regS('color')} placeholder="#8b5cf6" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...regS('isClosed')} /> This is a closing stage (Won / Lost)</label>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowStageFor(null)}>Cancel</Button>
                          <Button type="submit" className="rounded-xl bg-slate-900 text-white">Add Stage</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {sortedStages.length === 0 ? (
                    <div className="text-sm text-slate-500 p-8 text-center border border-dashed rounded-xl bg-white">No stages yet. Add a stage to get started.</div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {sortedStages.map((s: any) => {
                        const isDragging = draggedId === s.id;
                        const isOver = dragOverId === s.id && draggingPipeline === p.id;
                        return (
                          <div
                            key={s.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, s.id, p.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, s.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, s.id, p.id)}
                            className={`group relative flex flex-col rounded-xl border bg-white overflow-hidden transition-all cursor-grab active:cursor-grabbing
                              ${isDragging ? 'opacity-50 border-violet-300' : 'hover:shadow-md hover:border-slate-300'}
                              ${isOver ? 'border-violet-400 ring-2 ring-violet-200 bg-violet-50' : ''}`}
                          >
                            <div className="h-1.5 w-full" style={{ background: s.color || '#64748b' }} />
                            <div className="p-4 flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: s.color || '#64748b' }}>{s.order}</div>
                                <span className={`text-xs px-2 py-1 rounded-full border ${s.isClosed ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>{s.isClosed ? <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Closed</span> : <span className="flex items-center gap-1"><Unlock className="w-3 h-3" /> Open</span>}</span>
                                <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{s.name}</div>
                                <div className="text-xs text-slate-500">Step {s.order} • {s.probability}% chance to win</div>
                              </div>
                              <div className="space-y-1">
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.probability}%`, background: s.color || '#64748b' }} /></div>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> {s.color || 'Default'}</span>
                                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {s.probability}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 flex items-center gap-1"><GripVertical className="w-3 h-3" /> Tip: drag a stage card to change its position. The first stage appears as the left-most column.</p>
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
};
