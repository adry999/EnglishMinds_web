import type { Pool, ResultSetHeader } from 'mysql2/promise';
import type { LeadRepository } from './ports';

export function createMysqlLeadRepository(pool: Pool): LeadRepository {
  return {
    async save(record) {
      await pool.execute(
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
    },
    async deleteCreatedBefore(cutoff) {
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM leads WHERE created_at < ?', [cutoff]);
      return result.affectedRows;
    },
  };
}
