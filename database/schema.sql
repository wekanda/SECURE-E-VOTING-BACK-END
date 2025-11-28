-- E-Voting System Database Schema

-- Users table (for all user types)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'officer', 'candidate', 'voter')),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Elections table
CREATE TABLE elections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Positions table
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id),
    name VARCHAR(255) NOT NULL,
    seats INTEGER DEFAULT 1,
    opens_at TIMESTAMP NOT NULL,
    closes_at TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES positions(id),
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    manifesto_url VARCHAR(500),
    photo_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eligible voters table
CREATE TABLE eligible_voters (
    id SERIAL PRIMARY KEY,
    reg_no VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    program VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ELIGIBLE' CHECK (status IN ('ELIGIBLE', 'BLOCKED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verifications table
CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER REFERENCES eligible_voters(id),
    method VARCHAR(50) NOT NULL,
    otp_hash VARCHAR(255),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    ballot_token VARCHAR(255) UNIQUE,
    consumed_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Ballots table
CREATE TABLE ballots (
    id SERIAL PRIMARY KEY,
    verification_id INTEGER REFERENCES verifications(id),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consumed_at TIMESTAMP
);

-- Votes table (no voter PII)
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    ballot_id INTEGER REFERENCES ballots(id),
    position_id INTEGER REFERENCES positions(id),
    candidate_id INTEGER REFERENCES candidates(id),
    cast_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    actor_type VARCHAR(50) NOT NULL,
    actor_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_candidates_position ON candidates(position_id);
CREATE INDEX idx_votes_position ON votes(position_id);
CREATE INDEX idx_votes_candidate ON votes(candidate_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_verifications_token ON verifications(ballot_token);
CREATE INDEX idx_eligible_voters_reg_no ON eligible_voters(reg_no);