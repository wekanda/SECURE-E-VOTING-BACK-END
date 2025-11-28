const { query } = require('../config/database');

const getTurnout = async (req, res) => {
  try {
    const turnoutResult = await query(`
      SELECT
        COUNT(DISTINCT ev.id) as eligible_voters,
        COUNT(DISTINCT v.voter_id) as verified_voters,
        COUNT(DISTINCT b.verification_id) as voted_count
      FROM eligible_voters ev
      LEFT JOIN verifications v ON ev.id = v.voter_id AND v.verified_at IS NOT NULL
      LEFT JOIN ballots b ON v.id = b.verification_id AND b.consumed_at IS NOT NULL
      WHERE ev.status = 'ELIGIBLE'
    `);

    const turnout = turnoutResult.rows[0];

    res.json({
      eligible_voters: parseInt(turnout.eligible_voters),
      verified_voters: parseInt(turnout.verified_voters),
      voted_count: parseInt(turnout.voted_count),
      turnout_percentage: turnout.eligible_voters > 0
        ? ((turnout.voted_count / turnout.eligible_voters) * 100).toFixed(2)
        : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch turnout data' });
  }
};

const getResults = async (req, res) => {
  try {
    const resultsQuery = `
      SELECT
        p.id as position_id,
        p.name as position_name,
        p.seats,
        c.id as candidate_id,
        c.name as candidate_name,
        COUNT(v.id) as vote_count
      FROM positions p
      LEFT JOIN candidates c ON p.id = c.position_id AND c.status = 'APPROVED'
      LEFT JOIN votes v ON c.id = v.candidate_id
      GROUP BY p.id, p.name, p.seats, c.id, c.name
      ORDER BY p.name, vote_count DESC
    `;

    const results = await query(resultsQuery);

    // Group results by position
    const groupedResults = {};
    results.rows.forEach(row => {
      if (!groupedResults[row.position_id]) {
        groupedResults[row.position_id] = {
          position_id: row.position_id,
          position_name: row.position_name,
          seats: row.seats,
          candidates: []
        };
      }

      if (row.candidate_id) {
        groupedResults[row.position_id].candidates.push({
          candidate_id: row.candidate_id,
          candidate_name: row.candidate_name,
          vote_count: parseInt(row.vote_count)
        });
      }
    });

    res.json(Object.values(groupedResults));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};

const getAuditLog = async (req, res) => {
  try {
    const { limit = 100, offset = 0, action, entity } = req.query;

    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }

    if (entity) {
      sql += ' AND entity = ?';
      params.push(entity);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};

const exportData = async (req, res) => {
  try {
    const { type } = req.params;

    switch (type) {
      case 'turnout':
        const turnoutData = await query(`
          SELECT
            ev.reg_no,
            ev.name,
            ev.program,
            CASE WHEN v.verified_at IS NOT NULL THEN 'Yes' ELSE 'No' END as verified,
            CASE WHEN b.consumed_at IS NOT NULL THEN 'Yes' ELSE 'No' END as voted
          FROM eligible_voters ev
          LEFT JOIN verifications v ON ev.id = v.voter_id AND v.verified_at IS NOT NULL
          LEFT JOIN ballots b ON v.id = b.verification_id AND b.consumed_at IS NOT NULL
          WHERE ev.status = 'ELIGIBLE'
          ORDER BY ev.name
        `);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=turnout.csv');

        let csv = 'Registration Number,Name,Program,Verified,Voted\n';
        turnoutData.rows.forEach(row => {
          csv += `${row.reg_no},${row.name},${row.program},${row.verified},${row.voted}\n`;
        });

        res.send(csv);
        break;

      case 'results':
        const resultsData = await query(`
          SELECT
            p.name as position,
            c.name as candidate,
            COUNT(v.id) as votes
          FROM positions p
          LEFT JOIN candidates c ON p.id = c.position_id AND c.status = 'APPROVED'
          LEFT JOIN votes v ON c.id = v.candidate_id
          GROUP BY p.name, c.name
          ORDER BY p.name, votes DESC
        `);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=results.csv');

        let resultsCsv = 'Position,Candidate,Votes\n';
        resultsData.rows.forEach(row => {
          resultsCsv += `${row.position},${row.candidate || 'N/A'},${row.votes}\n`;
        });

        res.send(resultsCsv);
        break;

      case 'audit':
        const auditData = await query(`
          SELECT
            actor_type,
            actor_id,
            action,
            entity,
            entity_id,
            created_at
          FROM audit_log
          ORDER BY created_at DESC
        `);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit.csv');

        let auditCsv = 'Actor Type,Actor ID,Action,Entity,Entity ID,Timestamp\n';
        auditData.rows.forEach(row => {
          auditCsv += `${row.actor_type},${row.actor_id || ''},${row.action},${row.entity},${row.entity_id || ''},${row.created_at}\n`;
        });

        res.send(auditCsv);
        break;

      default:
        res.status(400).json({ error: 'Invalid export type' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
};

module.exports = { getTurnout, getResults, getAuditLog, exportData };