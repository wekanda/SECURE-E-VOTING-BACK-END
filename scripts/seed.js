const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const seedData = async () => {
  try {
    // Create tables first
    const schema = fs.readFileSync(path.join(__dirname, '../database/sqlite-schema.sql'), 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      await query(statement);
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminResult = await query(
      'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)',
      ['admin@evoting.com', adminPassword, 'admin', 'System Administrator']
    );

    // Create officer user
    const officerPassword = await bcrypt.hash('officer123', 12);
    const officerResult = await query(
      'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)',
      ['officer@evoting.com', officerPassword, 'officer', 'Returning Officer']
    );

    // Create positions for UCU GUILD ELECTIONS
    const positions = [
      { name: 'guild president', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament BSIT', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament BSWASA', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament BSCED', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament BAED', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament DIPLOMA', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament EVENING', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    ];

    const positionIds = [];
    for (const position of positions) {
      const result = await query(
        'INSERT INTO positions (name, seats, opens_at, closes_at, created_by) VALUES (?, ?, ?, ?, ?)',
        [position.name, 1, position.opens_at, position.closes_at, adminResult.lastID]
      );
      positionIds.push(result.lastID);
    }


    // Create eligible voters
    const programs = ['Computer Science', 'Information Technology', 'Software Engineering', 'Business Administration'];
    const ugandaNames = [
      'Nakato', 'Nalwoga', 'Ssali', 'Muwanguzi', 'Kato', 'Nabukeera', 'Mugisha', 'Tumushabe',
      'Akello', 'Achieng', 'Ochieng', 'Wanjiku', 'Kiprop', 'Chebet', 'Ruto', 'Koech',
      'Musyoka', 'Mutua', 'Kilonzo', 'Wambua', 'Njoroge', 'Kamau', 'Wairimu', 'Njeri',
      'Wanjala', 'Simiyu', 'Barasa', 'Oduya', 'Omondi', 'Adhiambo', 'Atieno', 'Akinyi',
      'Muthoni', 'Wambui', 'Nyambura', 'Wangeci', 'Mumbi', 'Kagendo', 'Waithera', 'Wairimu',
      'Kibet', 'Cheruiyot', 'Kipchoge', 'Kemboi', 'Rotich', 'Sang', 'Kiprotich', 'Biwott',
      'Koskei', 'Kirui', 'Talai', 'Yego', 'Kiprop', 'Chepkwony', 'Kipruto', 'Cherop',
      'Kipkemoi', 'Bett', 'Kipkoech', 'Kipngeno', 'Kiprop', 'Chebet', 'Ruto', 'Koech'
    ];

    for (let i = 1; i <= 1000; i++) {
      const regNo = `REG${i.toString().padStart(4, '0')}`;
      const name = ugandaNames[Math.floor(Math.random() * ugandaNames.length)] + ' ' + ugandaNames[Math.floor(Math.random() * ugandaNames.length)];
      const email = `student${i}@university.edu`;
      const phone = `+256${Math.floor(Math.random() * 900000000) + 100000000}`;
      const program = programs[Math.floor(Math.random() * programs.length)];
      
      await query(
        'INSERT INTO eligible_voters (reg_no, name, email, phone, program) VALUES (?, ?, ?, ?, ?)',
        [regNo, name, email, phone, program]
      );
    }

    console.log('Seed data created successfully!');
    console.log('Admin: admin@evoting.com / admin123');
    console.log('Officer: officer@evoting.com / officer123');
    console.log('7 positions created for UCU GUILD ELECTIONS');
    console.log('1000 eligible voters created (REG0001 to REG1000)');
    
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    process.exit();
  }
};

seedData();