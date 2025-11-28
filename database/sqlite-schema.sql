-- E-Voting System SQLite Schema

-- Users table (for all user types)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'officer', 'candidate', 'voter')),
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id INTEGER REFERENCES elections(id),
    name TEXT NOT NULL,
    seats INTEGER DEFAULT 1,
    opens_at DATETIME NOT NULL,
    closes_at DATETIME NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER REFERENCES positions(id),
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    manifesto_url TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Eligible voters table
CREATE TABLE IF NOT EXISTS eligible_voters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reg_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    program TEXT,
    status TEXT DEFAULT 'ELIGIBLE' CHECK (status IN ('ELIGIBLE', 'BLOCKED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Verifications table
CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voter_id INTEGER REFERENCES eligible_voters(id),
    method TEXT NOT NULL,
    otp_hash TEXT,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    ballot_token TEXT UNIQUE,
    consumed_at DATETIME,
    expires_at DATETIME
);

-- Ballots table
CREATE TABLE IF NOT EXISTS ballots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verification_id INTEGER REFERENCES verifications(id),
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    consumed_at DATETIME
);

-- Votes table (no voter PII)
CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ballot_id INTEGER REFERENCES ballots(id),
    position_id INTEGER REFERENCES positions(id),
    candidate_id INTEGER REFERENCES candidates(id),
    cast_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_type TEXT NOT NULL,
    actor_id INTEGER,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER,
    payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position_id);
CREATE INDEX IF NOT EXISTS idx_votes_position ON votes(position_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_verifications_token ON verifications(ballot_token);
CREATE INDEX IF NOT EXISTS idx_eligible_voters_reg_no ON eligible_voters(reg_no);