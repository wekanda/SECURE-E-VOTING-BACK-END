const { query, db } = require('../config/database');
const { auditLog } = require('../middleware/audit');

const getBallot = async (req, res) => {
  try {
    // Get positions
    const now = new Date().toISOString();
    console.log('Fetching ballot, current time:', now);
    const positionsResult = await query(`SELECT * FROM positions WHERE opens_at <= ? AND closes_at >= ? ORDER BY name`, [now, now]);
    console.log('Active positions found:', positionsResult.rows.length);

    if (positionsResult.rows.length === 0) {
      return res.status(400).json({ error: 'No active elections at this time' });
    }

    // Get approved candidates for these positions
    const positionIds = positionsResult.rows.map(p => p.id);
    const placeholders = positionIds.map(() => '?').join(',');
    const candidatesResult = await query(`SELECT c.id, c.name, c.manifesto_url, c.photo_url, c.position_id FROM candidates c WHERE c.status = 'APPROVED' AND c.position_id IN (${placeholders}) ORDER BY c.name`, positionIds);

    // Group candidates by position
    const positions = positionsResult.rows.map(p => ({
      ...p,
      candidates: candidatesResult.rows.filter(c => c.position_id === p.id).map(c => ({
        id: c.id,
        name: c.name,
        manifesto_url: c.manifesto_url,
        photo_url: c.photo_url
      }))
    }));

    res.json({
      positions,
      verification_id: req.verification.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ballot' });
  }
};

const castVote = async (req, res) => {
  try {
    console.log('Casting vote for verification:', req.verification.id);
    console.log('Votes received:', req.body.votes);
    const now = new Date().toISOString();
    console.log('Current time for validation:', now);

    // Begin transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { votes } = req.body; // Array of { position_id, candidate_id }
    const verification = req.verification;

    // Check if ballot already consumed
    if (verification.consumed_at) {
      await new Promise((resolve, reject) => db.run('ROLLBACK', (err) => err ? reject(err) : resolve()));
      return res.status(400).json({ error: 'Ballot already used' });
    }

    // Create ballot record
    const ballotResult = await query('INSERT INTO ballots (verification_id) VALUES (?)', [verification.id]);
    const ballotId = ballotResult.lastID;

    // Validate and cast votes
    for (const vote of votes) {
      const { position_id, candidate_id } = vote;

      // Validate position is active
      const positionResult = await query(
        'SELECT * FROM positions WHERE id = ? AND opens_at <= ? AND closes_at >= ?',
        [position_id, now, now]
      );

      if (positionResult.rows.length === 0) {
        await new Promise((resolve, reject) => db.run('ROLLBACK', (err) => err ? reject(err) : resolve()));
        return res.status(400).json({ error: `Position ${position_id} is not active` });
      }

      // Validate candidate is approved for this position
      const candidateResult = await query(
        'SELECT * FROM candidates WHERE id = ? AND position_id = ? AND status = ?',
        [candidate_id, position_id, 'APPROVED']
      );

      if (candidateResult.rows.length === 0) {
        await new Promise((resolve, reject) => db.run('ROLLBACK', (err) => err ? reject(err) : resolve()));
        return res.status(400).json({ error: `Invalid candidate for position ${position_id}` });
      }

      // Cast vote
      await query('INSERT INTO votes (ballot_id, position_id, candidate_id) VALUES (?, ?, ?)', [ballotId, position_id, candidate_id]);
    }

    // Mark ballot as consumed and verification as used
    const consumedAt = new Date().toISOString();
    await query('UPDATE ballots SET consumed_at = ? WHERE id = ?', [consumedAt, ballotId]);
    await query('UPDATE verifications SET consumed_at = ? WHERE id = ?', [consumedAt, verification.id]);

    // Commit transaction
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await auditLog('voter', verification.voter_id, 'BALLOT_CAST', 'ballot', ballotId, {
      vote_count: votes.length
    });

    res.json({
      message: 'Vote cast successfully',
      ballot_id: ballotId
    });
  } catch (error) {
   console.error('Error casting vote:', error);
   // Rollback on error
   await new Promise((resolve, reject) => {
     db.run('ROLLBACK', (err) => {
       // Ignore rollback errors
       resolve();
     });
   });
   res.status(500).json({ error: 'Failed to cast vote' });
 }
};

module.exports = { getBallot, castVote };