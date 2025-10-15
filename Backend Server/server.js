const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 
const swaggerUi = require('swagger-ui-express'); 

const app = express();
const port = 3000;

// ----------------------------------------------------
// PostgreSQL Connection Configuration
// ----------------------------------------------------
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Car', 
    password: '1234',
    port: 5432,
});

// Middleware
app.use(cors()); 
app.use(express.json()); 

/**
 * ฟังก์ชันสำหรับแปลงชื่อคอลัมน์จาก snake_case (Postgres)
 * เป็น camelCase (JavaScript/TypeScript)
 * *** แก้ไข: จัดการคอลัมน์ Primary Key 'financeid' ให้เป็น 'id' ในฝั่ง JS ***
 */
const toCamelCase = (row) => {
    if (!row) return null;
    const newRow = {};
    for (const key in row) {
        // หากคอลัมน์เป็น Primary Key ชื่อ 'financeid' ให้เปลี่ยนชื่อเป็น 'id'
        if (key === 'financeid') {
            newRow['id'] = row[key];
        } else {
            // แปลง 'license_plate' เป็น 'licensePlate'
            const camelCaseKey = key.replace(/_([a-z])/g, (match, char) => char.toUpperCase());
            newRow[camelCaseKey] = row[key];
        }
    }
    return newRow;
};

// ----------------------------------------------------
// CONNECTION HEALTH CHECK 
// ----------------------------------------------------
async function checkDatabaseConnection() {
    // โค้ดส่วนนี้ยังคงเดิม
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT current_database()');
        client.release(); 
        console.log(`✅ Successfully connected to database: ${result.rows[0].current_database}`);
        return true;
    } catch (err) {
        console.error('❌ FATAL CONNECTION ERROR: Check configuration or server status.');
        console.error('Detailed PostgreSQL Error:', err.message);
        console.error('---');
        if (err.code === '3D000') {
            console.error('HINT: Error 3D000 means "database does not exist". Please ensure a database named "Car" exists in your PostgreSQL server.');
        } else if (err.code === '28P01') {
            console.error('HINT: Error 28P01 means "password authentication failed". Please check the user and password.');
        } else {
            console.error('HINT: Check if your PostgreSQL server is running and accessible at localhost:5432.');
        }
        return false;
    }
}


// ----------------------------------------------------
// 1. OPENAPI / SWAGGER SPECIFICATION (Same as previous)
// ----------------------------------------------------
// โค้ดส่วน OpenAPI/Swagger ยังคงเดิม เพราะใช้ 'id' เป็นชื่อมาตรฐานใน Schema
// ----------------------------------------------------
const CarDataSchema = {
    "type": "object",
    "description": "โครงสร้างข้อมูลรถยนต์ (แปลงจาก snake_case ใน Postgres เป็น camelCase ใน API)",
    "properties": {
        "financeid": { "type": "integer", "description": "รหัสรถยนต์ที่ไม่ซ้ำกัน" },
        "licensePlate": { "type": "string", "description": "เลขทะเบียนเต็มพร้อมจังหวัด" },
        "registrationNumber": { "type": "string", "description": "หมายเลขทะเบียนรถ" },
        "brand": { "type": "string", "description": "ยี่ห้อรถ" },
        "model": { "type": "string", "description": "รุ่นรถ" },
        "color": { "type": "string", "description": "สีรถ" },
        "chassisNo": { "type": "string", "description": "เลขตัวถัง" },
        "engineNo": { "type": "string", "description": "เลขเครื่องยนต์" },
        "finance": { "type": "string", "description": "บริษัทไฟแนนซ์" },
        "financeStatus": { 
            "type": "string", 
            "description": "สถานะการเงิน",
            "enum": ["ผ่อนชำระ", "เสร็จสิ้น", "ชำระเต็ม", "กำลังผ่อน"]
        },
        "remainingAmount": { "type": "number", "format": "int32", "description": "ยอดคงเหลือ (บาท)" },
        "monthlyPayment": { "type": "number", "format": "int32", "description": "ยอดผ่อนต่อเดือน (บาท)" }
    },
    "required": ["licensePlate", "brand", "financeStatus"]
};

const openApiSpec = {
    "openapi": "3.0.0",
    "info": {
        "title": "Car Data API (PostgreSQL Backend)",
        "version": "1.1.0",
        "description": "API สำหรับจัดการข้อมูลรถยนต์ (CRUD) จากฐานข้อมูล PostgreSQL"
    },
    "servers": [
        {
            "url": "http://localhost:3000/api",
            "description": "Local Development Server"
        }
    ],
    "tags": [
        {
            "name": "Cars",
            "description": "การดำเนินการที่เกี่ยวข้องกับการจัดการข้อมูลรถยนต์ (CRUD)"
        }
    ],
    "paths": {
        "/cars": {
            "get": {
                "tags": ["Cars"],
                "summary": "ดึงข้อมูลรถยนต์ทั้งหมด หรือค้นหาตามเลขทะเบียนบางส่วน",
                "operationId": "getCars",
                "parameters": [
                    {
                        "in": "query",
                        "name": "plate",
                        "schema": { "type": "string" },
                        "description": "ข้อความบางส่วนของเลขทะเบียนเพื่อใช้ค้นหา"
                    }
                ],
                "responses": {
                    "200": { "description": "ดึงข้อมูลรถยนต์สำเร็จ", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/CarData" } } } } },
                    "500": { "description": "ข้อผิดพลาดของเซิร์ฟเวอร์" }
                }
            },
            "post": {
                "tags": ["Cars"],
                "summary": "สร้างข้อมูลรถยนต์ใหม่",
                "operationId": "createCar",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": { "$ref": "#/components/schemas/CarData" }
                        }
                    }
                },
                "responses": {
                    "201": { "description": "สร้างข้อมูลสำเร็จ", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CarData" } } } },
                    "400": { "description": "ข้อมูลที่ส่งมาไม่ถูกต้อง (เช่น ข้อมูลไม่ครบ หรือ เลขทะเบียนซ้ำ)" },
                    "500": { "description": "ข้อผิดพลาดของเซิร์ฟเวอร์" }
                }
            }
        },
        "/cars/{id}": {
            "put": {
                "tags": ["Cars"],
                "summary": "อัปเดตข้อมูลรถยนต์ที่มีอยู่",
                "operationId": "updateCar",
                "parameters": [
                    {
                        "in": "path",
                        "name": "financeid",
                        "schema": { "type": "integer" },
                        "required": true,
                        "description": "financeid ของรถยนต์ที่ต้องการอัปเดต"
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": { "$ref": "#/components/schemas/CarData" }
                        }
                    }
                },
                "responses": {
                    "200": { "description": "อัปเดตข้อมูลสำเร็จ", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CarData" } } } },
                    "400": { "description": "ข้อมูลที่ส่งมาไม่ถูกต้อง (เช่น เลขทะเบียนซ้ำกับรถคันอื่น)" },
                    "404": { "description": "ไม่พบรถยนต์ตาม ID ที่ระบุ" },
                    "500": { "description": "ข้อผิดพลาดของเซิร์ฟเวอร์" }
                }
            },
            "delete": {
                "tags": ["Cars"],
                "summary": "ลบข้อมูลรถยนต์",
                "operationId": "deleteCar",
                "parameters": [
                    {
                        "in": "path",
                        "name": "financeid",
                        "schema": { "type": "integer" },
                        "required": true,
                        "description": "ID ของรถยนต์ที่ต้องการลบ"
                    }
                ],
                "responses": {
                    "204": { "description": "ลบข้อมูลสำเร็จ (ไม่มีเนื้อหาตอบกลับ)" },
                    "404": { "description": "ไม่พบรถยนต์ตาม ID ที่ระบุ" },
                    "500": { "description": "ข้อผิดพลาดของเซิร์ฟเวอร์" }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "CarData": CarDataSchema
        }
    }
};

// ----------------------------------------------------
// 2. SWAGGER UI SETUP ROUTE
// ----------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// ----------------------------------------------------
// 3. CRUD API ENDPOINTS
// ----------------------------------------------------

// [R] READ (Fetch all or search by plate)
app.get('/api/cars', async (req, res) => {
    const { plate } = req.query;
    let queryText = 'SELECT * FROM cars';
    const queryParams = [];

    if (plate) {
        queryText += ' WHERE license_plate ILIKE $1';
        queryParams.push(`%${plate}%`);
    }

    // *** แก้ไข: เปลี่ยน ORDER BY id เป็น ORDER BY financeid ***
    queryText += ' ORDER BY financeid ASC'; 
    
    try {
        const result = await pool.query(queryText, queryParams);
        const camelCaseData = result.rows.map(toCamelCase);
        res.json(camelCaseData);
    } catch (err) {
        console.error('❌ SQL Query Error when fetching car data:', err.message);
        res.status(500).send('Server Error: Could not retrieve car data from PostgreSQL.');
    }
});

// [C] CREATE (Add new car)
app.post('/api/cars', async (req, res) => {
    const { 
        licensePlate, registrationNumber, brand, model, color, chassisNo, 
        engineNo, finance, financeStatus, remainingAmount, monthlyPayment 
    } = req.body;

    // 1. ตรวจสอบข้อมูลบังคับ (ไม่มีการแก้ไข)
    if (!licensePlate || !brand || !financeStatus) {
        return res.status(400).send('Missing required fields: licensePlate, brand, and financeStatus are mandatory.');
    }
    
    // 2. Normalization ของ License Plate (ไม่มีการแก้ไข)
    const normalizedLicensePlate = licensePlate.trim().toUpperCase().replace(/\s/g, '');

    // 3. การันตีว่าเป็น Number (ไม่มีการแก้ไข)
    const amtRemaining = Number(remainingAmount) || 0;
    const amtMonthly = Number(monthlyPayment) || 0;

    try {
        // 4. ตรวจสอบความซ้ำซ้อนของเลขทะเบียน 
        // *** แก้ไข: เปลี่ยน SELECT id เป็น SELECT financeid ***
        const duplicateCheckQuery = 'SELECT financeid FROM cars WHERE UPPER(license_plate) = $1';
        const duplicateResult = await pool.query(duplicateCheckQuery, [normalizedLicensePlate]);
        
        if (duplicateResult.rows.length > 0) {
             return res.status(400).json({
                message: "Duplicate License Plate",
                detail: `เลขทะเบียน '${normalizedLicensePlate}' มีอยู่ในระบบแล้ว`,
             });
        }
        
        // 5. ตั้งค่า Query (ไม่มีการแก้ไขในคอลัมน์ INSERT)
        const queryText = `
            INSERT INTO cars (
                license_plate, registration_number, brand, model, color, chassis_no, 
                engine_no, finance, finance_status, remaining_amount, monthly_payment
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
        const queryParams = [
            normalizedLicensePlate, 
            registrationNumber || null, brand, model || null, color || null, 
            chassisNo || null, engineNo || null, finance || null, financeStatus, 
            amtRemaining, 
            amtMonthly 
        ];

        const result = await pool.query(queryText, queryParams);
        // ตอบกลับด้วยข้อมูลที่สร้างใหม่ในรูปแบบ camelCase (toCamelCase จะแปลง financeid เป็น id)
        res.status(201).json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error('❌ SQL Query Error when creating car data:', err.message);
        res.status(500).send('Server Error: Could not create car data. Check console for details.');
    }
});

// [U] UPDATE (Update existing car)
app.put('/api/cars/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        licensePlate, registrationNumber, brand, model, color, chassisNo, 
        engineNo, finance, financeStatus, remainingAmount, monthlyPayment 
    } = req.body;

    // 1. ตรวจสอบข้อมูลบังคับ (ไม่มีการแก้ไข)
    if (!licensePlate || !brand || !financeStatus) {
        return res.status(400).send('Missing required fields: licensePlate, brand, and financeStatus are mandatory.');
    }
    
    // 2. Normalization ของ License Plate (ไม่มีการแก้ไข)
    const normalizedLicensePlate = licensePlate.trim().toUpperCase().replace(/\s/g, '');
    
    // 3. การันตีว่าเป็น Number (ไม่มีการแก้ไข)
    const amtRemaining = Number(remainingAmount) || 0;
    const amtMonthly = Number(monthlyPayment) || 0;

    try {
        // 4. ตรวจสอบความซ้ำซ้อนก่อน UPDATE 
        // *** แก้ไข: เปลี่ยน SELECT id เป็น SELECT financeid และ WHERE id != $2 เป็น WHERE financeid != $2 ***
        const duplicateCheckQuery = 'SELECT financeid FROM cars WHERE UPPER(license_plate) = $1 AND financeid != $2';
        const duplicateResult = await pool.query(duplicateCheckQuery, [normalizedLicensePlate, id]);
        
        if (duplicateResult.rows.length > 0) {
             return res.status(400).json({
                message: "Duplicate License Plate",
                detail: `เลขทะเบียน '${normalizedLicensePlate}' ซ้ำกับรถคันอื่นในระบบ`,
             });
        }

        const queryText = `
            UPDATE cars SET 
                license_plate = $1, registration_number = $2, brand = $3, model = $4, color = $5, 
                chassis_no = $6, engine_no = $7, finance = $8, finance_status = $9, 
                remaining_amount = $10, monthly_payment = $11
            // *** แก้ไข: เปลี่ยน WHERE id = $12 เป็น WHERE financeid = $12 ***
            WHERE financeid = $12 
            RETURNING *;
        `;
        const queryParams = [
            normalizedLicensePlate, 
            registrationNumber || null, brand, model || null, color || null, 
            chassisNo || null, engineNo || null, finance || null, financeStatus, 
            amtRemaining, 
            amtMonthly, 
            id // id ที่รับมาจาก params จะถูกใช้เป็นค่า $12
        ];

        const result = await pool.query(queryText, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).send(`Car with ID ${id} not found.`);
        }
        res.status(200).json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error('❌ SQL Query Error when updating car data:', err.message);
        res.status(500).send('Server Error: Could not update car data. Check console for details.');
    }
});

// [D] DELETE (Delete car by ID)
app.delete('/api/cars/:id', async (req, res) => {
    const { id } = req.params;

    // *** แก้ไข: เปลี่ยน WHERE id = $1 RETURNING id; เป็น WHERE financeid = $1 RETURNING financeid; ***
    const queryText = 'DELETE FROM cars WHERE financeid = $1 RETURNING financeid;';
    
    try {
        const result = await pool.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).send(`Car with ID ${id} not found.`);
        }
        // ตอบกลับด้วย 204 No Content เพื่อบอกว่าลบสำเร็จ
        res.status(204).send();
    } catch (err) {
        console.error('❌ SQL Query Error when deleting car data:', err.message);
        res.status(500).send('Server Error: Could not delete car data. Check console for details.');
    }
});


// Start Server (โค้ดส่วนนี้ยังคงเดิม)
async function startServer() {
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
        app.listen(port, () => {
            console.log(`✅ Backend server running at http://localhost:${port}`);
            console.log(`📚 Swagger UI documentation available at http://localhost:${port}/api-docs`);
            console.log('---');
            console.log('HINT: สำหรับ Front-end (Web CRUD) ให้ตรวจสอบว่า API URL ชี้ไปที่: http://192.168.1.33:3000/api/cars');
        });
    } else {
        console.log('🛑 Server startup aborted due to critical database connection error. Please fix the connection configuration.');
    }
}

startServer();

// Export pool for graceful shutdown (optional, but good practice)
module.exports = { pool };