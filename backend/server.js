// This file sets up the Express server and defines the API routes
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Import the database connection utility (db.js)

const app = express();
const PORT = 3001;

// --- Middleware Setup ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// --- Dashboard Endpoint for Summary Stats ---
// This endpoint is used to fetch the total counts for the dashboard cards.
app.get('/api/dashboard/stats', async(req, res) => {
    try {
        const memberCountResult = await db.query('SELECT COUNT(*) FROM members');
        const trainerCountResult = await db.query('SELECT COUNT(*) FROM trainers');
        const classCountResult = await db.query('SELECT COUNT(*) FROM classes');

        const stats = {
            members: memberCountResult.rows[0].count,
            trainers: trainerCountResult.rows[0].count,
            classes: classCountResult.rows[0].count,
        };

        res.json(stats);
    } catch (err) {
        console.error('❌ Error fetching dashboard stats:', err.message);
        res.status(500).json({ message: 'Failed to retrieve dashboard data.' });
    }
});

// NEW: API Endpoint to fetch recent activities
app.get('/api/dashboard/activities', async(req, res) => {
    try {
        const query = `
            SELECT 
                activity_id, 
                member_first_name, 
                member_last_name, 
                activity_type, 
                activity_description, 
                activity_timestamp 
            FROM recent_activity 
            ORDER BY activity_timestamp DESC 
            LIMIT 10
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching recent activities:', err.message);
        res.status(500).json({ message: 'Failed to retrieve recent activity data.' });
    }
});


// --- API Endpoints for Member Management ---
const MEMBER_TABLE = 'members';
const ID_COLUMN = 'member_id';

// 1. READ (GET All Members with Optional Search)
app.get('/api/members', async(req, res) => {
    try {
        const { q } = req.query;
        let query = `
            SELECT 
                ${ID_COLUMN}, 
                first_name, 
                last_name, 
                email, 
                phone_number, 
                join_date, 
                membership_status
            FROM ${MEMBER_TABLE}
        `;
        const params = [];

        if (q) {
            query += `
                WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
            `;
            params.push(`%${q}%`);
        }

        query += ` ORDER BY join_date DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching members:', err.message);
        res.status(500).json({ message: 'Failed to retrieve members from database.', details: err.message });
    }
});

// 2. CREATE (POST a New Member)
app.post('/api/members', async(req, res) => {
    const { first_name, last_name, email, phone_number, membership_status } = req.body;
    const query = `
        INSERT INTO ${MEMBER_TABLE} (first_name, last_name, email, phone_number, membership_status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`;
    const values = [first_name, last_name, email, phone_number, membership_status];
    try {
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error creating member:', err.message);
        res.status(500).json({ message: 'Failed to create member in database.', details: err.message });
    }
});

// 3. UPDATE (PUT an Existing Member)
app.put('/api/members/:id', async(req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, phone_number, membership_status } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'Member ID is required for update.' });
    }
    const query = `
        UPDATE ${MEMBER_TABLE}
        SET first_name = $1, last_name = $2, email = $3, phone_number = $4, membership_status = $5
        WHERE ${ID_COLUMN} = $6
        RETURNING *`;
    const values = [first_name, last_name, email, phone_number, membership_status, id];
    try {
        const result = await db.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Member not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error updating member:', err.message);
        res.status(500).json({ message: 'Failed to update member in database.', details: err.message });
    }
});

// 4. DELETE (DELETE a Member)
app.delete('/api/members/:id', async(req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Member ID is required for deletion.' });
    }
    try {
        const result = await db.query(`DELETE FROM ${MEMBER_TABLE} WHERE ${ID_COLUMN} = $1`, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Member not found.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('❌ Error deleting member:', err.message);
        res.status(500).json({ message: 'Failed to delete member from database.', details: err.message });
    }
});


// --- API Endpoints for Trainer Management ---
const TRAINER_TABLE = 'trainers';

// GET all trainers
app.get('/api/trainers', async(req, res) => {
    try {
        const result = await db.query(`SELECT * FROM ${TRAINER_TABLE} ORDER BY hire_date DESC`);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching trainers:', err.message);
        res.status(500).json({ message: 'Failed to retrieve trainers.' });
    }
});

// POST a new trainer
app.post('/api/trainers', async(req, res) => {
    const { first_name, last_name, email, specialty } = req.body;
    const query = `INSERT INTO ${TRAINER_TABLE} (first_name, last_name, email, specialty) VALUES ($1, $2, $3, $4) RETURNING *`;
    try {
        const result = await db.query(query, [first_name, last_name, email, specialty]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error creating trainer:', err.message);
        res.status(500).json({ message: 'Failed to create trainer.' });
    }
});

// PUT (Update) a trainer
app.put('/api/trainers/:id', async(req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, specialty } = req.body;
    const query = `UPDATE ${TRAINER_TABLE} SET first_name = $1, last_name = $2, email = $3, specialty = $4 WHERE trainer_id = $5 RETURNING *`;
    try {
        const result = await db.query(query, [first_name, last_name, email, specialty, id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Trainer not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error updating trainer:', err.message);
        res.status(500).json({ message: 'Failed to update trainer.' });
    }
});

// DELETE a trainer
app.delete('/api/trainers/:id', async(req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`DELETE FROM ${TRAINER_TABLE} WHERE trainer_id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Trainer not found.' });
        res.status(204).send();
    } catch (err) {
        console.error('❌ Error deleting trainer:', err.message);
        res.status(500).json({ message: 'Failed to delete trainer.' });
    }
});

// --- API Endpoints for Classes & Schedules ---
const CLASS_TABLE = 'classes';
const SCHEDULE_TABLE = 'schedules';

// GET all classes with their trainer and schedule details
app.get('/api/classes', async(req, res) => {
    try {
        const query = `
            SELECT
                c.class_id,
                c.class_name,
                c.description,
                c.duration_minutes,
                s.schedule_id,
                s.schedule_date,
                s.start_time,
                s.end_time,
                t.first_name AS trainer_first_name,
                t.last_name AS trainer_last_name
            FROM ${CLASS_TABLE} c
            LEFT JOIN ${SCHEDULE_TABLE} s ON c.class_id = s.class_id
            LEFT JOIN trainers t ON s.trainer_id = t.trainer_id
            ORDER BY s.schedule_date, s.start_time
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching classes:', err.message);
        res.status(500).json({ message: 'Failed to retrieve class schedules.' });
    }
});

// POST a new class
app.post('/api/classes', async(req, res) => {
    const { class_name, description, duration_minutes } = req.body;
    const query = `INSERT INTO ${CLASS_TABLE} (class_name, description, duration_minutes) VALUES ($1, $2, $3) RETURNING *`;
    try {
        const result = await db.query(query, [class_name, description, duration_minutes]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error creating class:', err.message);
        res.status(500).json({ message: 'Failed to create class.' });
    }
});

// PUT (Update) a class
app.put('/api/classes/:id', async(req, res) => {
    const { id } = req.params;
    const { class_name, description, duration_minutes } = req.body;
    const query = `UPDATE ${CLASS_TABLE} SET class_name = $1, description = $2, duration_minutes = $3 WHERE class_id = $4 RETURNING *`;
    try {
        const result = await db.query(query, [class_name, description, duration_minutes, id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Class not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error updating class:', err.message);
        res.status(500).json({ message: 'Failed to update class.' });
    }
});

// DELETE a class
app.delete('/api/classes/:id', async(req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`DELETE FROM ${CLASS_TABLE} WHERE class_id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Class not found.' });
        res.status(204).send();
    } catch (err) {
        console.error('❌ Error deleting class:', err.message);
        res.status(500).json({ message: 'Failed to delete class.' });
    }
});


// POST a new schedule for an existing class
app.post('/api/schedules', async(req, res) => {
    const { class_id, trainer_id, schedule_date, start_time, end_time } = req.body;
    const query = `INSERT INTO ${SCHEDULE_TABLE} (class_id, trainer_id, schedule_date, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    try {
        const result = await db.query(query, [class_id, trainer_id, schedule_date, start_time, end_time]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error creating schedule:', err.message);
        res.status(500).json({ message: 'Failed to create schedule.' });
    }
});

// --- API Endpoints for Payments ---
const PAYMENTS_TABLE = 'payments';
const MEMBERSHIPS_TABLE = 'memberships';

// GET all payments with member and membership details
app.get('/api/payments', async(req, res) => {
    try {
        const query = `
            SELECT
                p.payment_id,
                p.amount,
                p.payment_date,
                p.payment_method,
                m.first_name AS member_first_name,
                m.last_name AS member_last_name,
                mem.plan_name AS membership_plan
            FROM ${PAYMENTS_TABLE} p
            JOIN members m ON p.member_id = m.member_id
            JOIN ${MEMBERSHIPS_TABLE} mem ON p.membership_id = mem.membership_id
            ORDER BY p.payment_date DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching payments:', err.message);
        res.status(500).json({ message: 'Failed to retrieve payments.' });
    }
});

// GET all memberships for the payment form dropdown
app.get('/api/memberships', async(req, res) => {
    try {
        const result = await db.query('SELECT membership_id, plan_name, price FROM memberships');
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching memberships:', err.message);
        res.status(500).json({ message: 'Failed to retrieve membership plans.' });
    }
});

// POST a new payment
app.post('/api/payments', async(req, res) => {
    const { member_id, membership_id, amount, payment_method } = req.body;
    const query = `INSERT INTO ${PAYMENTS_TABLE} (member_id, membership_id, amount, payment_method) VALUES ($1, $2, $3, $4) RETURNING *`;
    try {
        const result = await db.query(query, [member_id, membership_id, amount, payment_method]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error creating payment:', err.message);
        res.status(500).json({ message: 'Failed to create payment.' });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`🚀 Gym Management Backend API listening at http://localhost:${PORT}`);
});