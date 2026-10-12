import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { LeadRepository, StoredLead } from './ports';

function toStoredLead(row: RowDataPacket): StoredLead {
  return {
    id: Number(row.id),
    notifyAttempts: Number(row.notify_attempts),
    parentName: row.parent_name as string,
    phone: row.phone as string,
    childAgeGroup: row.child_age_group as StoredLead['childAgeGroup'],
    source: row.source as StoredLead['source'],
    testLevel: row.test_level as StoredLead['testLevel'],
    consent: true,
    policyVersion: row.policy_version as StoredLead['policyVersion'],
    utm: { source: row.utm_source as string | null, medium: row.utm_medium as string | null, campaign: row.utm_campaign as string | null },
    consentAt: row.consent_at as Date,
    createdAt: row.created_at as Date,
  };
}

export function createMysqlLeadRepository(pool: Pool): LeadRepository {
  return {
    async save(record) {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO leads
          (parent_name, phone, child_age_group, source, test_level, utm_source, utm_medium, utm_campaign, consent_at, policy_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.parentName,
          record.phone,
          record.childAgeGroup,
          record.source,
          record.testLevel,
          record.utm.source,
          record.utm.medium,
          record.utm.campaign,
          record.consentAt,
          record.policyVersion,
          record.createdAt,
        ],
      );
      return result.insertId;
    },
    async deleteCreatedBefore(cutoff) {
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM leads WHERE created_at < ?', [cutoff]);
      return result.affectedRows;
    },
    async recordNotifyAttempt(id, delivered, at) {
      await pool.execute('UPDATE leads SET notify_attempts = notify_attempts + 1, notified_at = IF(?, ?, notified_at) WHERE id = ?', [delivered ? 1 : 0, at, id]);
    },
    async findPendingNotification(query) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM leads
         WHERE notified_at IS NULL AND notify_attempts < ? AND created_at <= ? AND created_at >= ?
         ORDER BY created_at ASC LIMIT ${Math.trunc(query.limit)}`,
        [query.maxAttempts, query.olderThan, query.newerThan],
      );
      return rows.map(toStoredLead);
    },
  };
}
