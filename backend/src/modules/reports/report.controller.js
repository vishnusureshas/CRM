import * as reportService from './report.service.js';
import { sendSuccess } from '../../utils/response.js';

export const sales = async (req, res, next) => {
  try {
    const data = await reportService.salesReport(req.user.organizationId, req.query);
    if (req.query.format === 'csv') {
      const rows = data.byStatus.map((r) => ({ status: r.status, count: r._count.id, amount: r._sum.amount }));
      const csv = reportService.toCsv(rows, ['status', 'count', 'amount']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
      return res.send(csv);
    }
    return sendSuccess(res, 200, 'Sales report', data);
  } catch (e) { next(e); }
};

export const leads = async (req, res, next) => {
  try {
    const data = await reportService.leadsReport(req.user.organizationId, req.query);
    if (req.query.format === 'csv') {
      const rows = data.byStatus.map((r) => ({ status: r.status, count: r._count.id }));
      const csv = reportService.toCsv(rows, ['status', 'count']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads-report.csv"');
      return res.send(csv);
    }
    return sendSuccess(res, 200, 'Leads report', data);
  } catch (e) { next(e); }
};

export const activities = async (req, res, next) => {
  try {
    const data = await reportService.activitiesReport(req.user.organizationId, req.query);
    return sendSuccess(res, 200, 'Activities report', data);
  } catch (e) { next(e); }
};
