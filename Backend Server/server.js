const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 
const swaggerUi = require('swagger-ui-express'); 

const app = express();
const port = 3000;

// ----------------------------------------------------
// PostgreSQL Connection Configuration
// user: 'postgres', host: 'localhost', database: 'Car', password: '1234', port: 5432
// ----------------------------------------------------
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Car', 
    password: '1234',
    port: 5432,
});

// Middleware
app.use(cors()); // อนุญาตให้ frontend เข้าถึง API ได้
app.use(express.json()); // สำหรับการอ่าน JSON body

/**
 * ฟังก์ชันสำหรับแปลงชื่อคอลัมน์จาก snake_case (Postgres)
 * เป็น camelCase (JavaScript/TypeScript)
 */
const toCamelCase = (row) => {
    if (!row) return null;
    const newRow = {};
    for (const key in row) {
        // แปลง 'license_plate' เป็น 'licensePlate'
        const camelCaseKey = key.replace(/_([a-z])/g, (match, char) => char.toUpperCase());
        newRow[camelCaseKey] = row[key];
    }
    return newRow;
};

// ----------------------------------------------------
// CONNECTION HEALTH CHECK 
// ----------------------------------------------------
async function checkDatabaseConnection() {
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
// 1. OPENAPI / SWAGGER SPECIFICATION 
// ----------------------------------------------------

const CarDataSchema = {
    "type": "object",
    "description": "โครงสร้างข้อมูลรถยนต์ (แปลงจาก snake_case ใน Postgres เป็น camelCase ใน API)",
    "properties": {
        "id": { "type": "integer", "description": "รหัสรถยนต์ที่ไม่ซ้ำกัน" },
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
            "enum": ["ผ่อนชำระ", "เสร็จสิ้น", "ชำระเต็ม"] 
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
                    "400": { "description": "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
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
                        "name": "id",
                        "schema": { "type": "integer" },
                        "required": true,
                        "description": "ID ของรถยนต์ที่ต้องการอัปเดต"
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
                        "name": "id",
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
        // ใช้ ILIKE สำหรับการค้นหาแบบไม่คำนึงถึงขนาดตัวอักษร
        queryText += ' WHERE license_plate ILIKE $1';
        queryParams.push(`%${plate}%`);
    }

    queryText += ' ORDER BY id ASC';
    
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
    // ดึงข้อมูลในรูปแบบ camelCase จาก Request Body
    const { 
        licensePlate, registrationNumber, brand, model, color, chassisNo, 
        engineNo, finance, financeStatus, remainingAmount, monthlyPayment 
    } = req.body;

    // ตรวจสอบข้อมูลขั้นพื้นฐาน
    if (!licensePlate || !brand || !financeStatus) {
        return res.status(400).send('Missing required fields: licensePlate, brand, and financeStatus are mandatory.');
    }
    
    // ตั้งค่า Query โดยใช้ snake_case สำหรับคอลัมน์ Postgres
    const queryText = `
        INSERT INTO cars (
            license_plate, registration_number, brand, model, color, chassis_no, 
            engine_no, finance, finance_status, remaining_amount, monthly_payment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
    `;
    const queryParams = [
        licensePlate, registrationNumber || null, brand, model || null, color || null, 
        chassisNo || null, engineNo || null, finance || null, financeStatus, 
        remainingAmount || 0, monthlyPayment || 0
    ];

    try {
        const result = await pool.query(queryText, queryParams);
        // ตอบกลับด้วยข้อมูลที่สร้างใหม่ในรูปแบบ camelCase
        res.status(201).json(toCamelCase(result.rows[0]));
    } catch (err) {
        if (err.code === '23505') { // Unique violation (e.g., duplicate license plate)
             return res.status(400).send(`License Plate '${licensePlate}' already exists.`);
        }
        console.error('❌ SQL Query Error when creating car data:', err.message);
        res.status(500).send('Server Error: Could not create car data.');
    }
});

// [U] UPDATE (Update existing car)
app.put('/api/cars/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        licensePlate, registrationNumber, brand, model, color, chassisNo, 
        engineNo, finance, financeStatus, remainingAmount, monthlyPayment 
    } = req.body;

    // ตรวจสอบข้อมูลขั้นพื้นฐาน
    if (!licensePlate || !brand || !financeStatus) {
        return res.status(400).send('Missing required fields: licensePlate, brand, and financeStatus are mandatory.');
    }

    const queryText = `
        UPDATE cars SET 
            license_plate = $1, registration_number = $2, brand = $3, model = $4, color = $5, 
            chassis_no = $6, engine_no = $7, finance = $8, finance_status = $9, 
            remaining_amount = $10, monthly_payment = $11
        WHERE id = $12
        RETURNING *;
    `;
    const queryParams = [
        licensePlate, registrationNumber || null, brand, model || null, color || null, 
        chassisNo || null, engineNo || null, finance || null, financeStatus, 
        remainingAmount || 0, monthlyPayment || 0, id
    ];

    try {
        const result = await pool.query(queryText, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).send(`Car with ID ${id} not found.`);
        }
        res.status(200).json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error('❌ SQL Query Error when updating car data:', err.message);
        res.status(500).send('Server Error: Could not update car data.');
    }
});

// [D] DELETE (Delete car by ID)
app.delete('/api/cars/:id', async (req, res) => {
    const { id } = req.params;

    const queryText = 'DELETE FROM cars WHERE id = $1 RETURNING id;';
    
    try {
        const result = await pool.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).send(`Car with ID ${id} not found.`);
        }
        // ตอบกลับด้วย 204 No Content เพื่อบอกว่าลบสำเร็จ
        res.status(204).send();
    } catch (err) {
        console.error('❌ SQL Query Error when deleting car data:', err.message);
        res.status(500).send('Server Error: Could not delete car data.');
    }
});


// Start Server
async function startServer() {
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
        app.listen(port, () => {
            console.log(`✅ Backend server running at http://localhost:${port}`);
            console.log(`📚 Swagger UI documentation available at http://localhost:${port}/api-docs`);
            console.log('---');
            console.log('HINT: For the React app to work, ensure the API URL in CarManagementApp.jsx is correct: http://192.168.1.39:3000/api/cars');
        });
    } else {
        console.log('🛑 Server startup aborted due to critical database connection error. Please fix the connection configuration.');
    }
}

startServer();

// Export pool for graceful shutdown (optional, but good practice)
module.exports = { pool };
