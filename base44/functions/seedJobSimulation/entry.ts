import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { SAMPLE_SIMULATION } from '../../shared/jobSimulation.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được tạo Job Simulation' }, { status: 403 });

    const existing = await base44.asServiceRole.entities.JobSimulation.filter({ name: SAMPLE_SIMULATION.name }, { limit: 1 });
    if ((existing.items || []).length) return Response.json({ ok: true, simulation: existing.items[0], created: false });

    const simulation = await base44.asServiceRole.entities.JobSimulation.create({
      name: SAMPLE_SIMULATION.name,
      role_title: SAMPLE_SIMULATION.role_title,
      description: SAMPLE_SIMULATION.description,
      duration_min: SAMPLE_SIMULATION.duration_min,
      pass_score: SAMPLE_SIMULATION.pass_score,
      status: SAMPLE_SIMULATION.status,
      criteria: SAMPLE_SIMULATION.criteria,
      tasks: SAMPLE_SIMULATION.tasks
    });

    return Response.json({ ok: true, simulation, created: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}