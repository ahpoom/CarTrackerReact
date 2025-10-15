export interface CarData {
  // --- ข้อมูลระบุตัวตนและทะเบียน (Critical for Uniqueness) ---
  id?: string;               // ID ของเอกสาร/รายการ (เป็น Optional เมื่อทำการสร้าง)
  chassisNo: string;         // หมายเลขตัวถัง (สำคัญมาก! มักถูกตั้งเป็น Unique Key ใน DB)
  engineNo: string;          // หมายเลขเครื่องยนต์
  licensePlate: string;      // เลขทะเบียนรถ
  
  // --- ข้อมูลพื้นฐาน ---
  brand: string;             // ยี่ห้อรถ
  model: string;             // รุ่นรถ
  color: string;             // สีรถ
  dateOfPurchase: string;    // วันที่ซื้อรถ (แนะนำให้ใช้รูปแบบ YYYY-MM-DD)

  // --- ข้อมูลการเงิน/สถานะ ---
  finance: string;           // ชื่อสถาบันการเงิน (เช่น 'SCB', 'KBank', 'ซื้อเงินสด')
  financeStatus: 'กำลังผ่อน' | 'ปิดบัญชีแล้ว' | 'ซื้อเงินสด'; // สถานะปัจจุบัน
  
  // *** สำคัญมาก: ต้องเป็นชนิดข้อมูล number ไม่ใช่ string ***
  monthlyPayment: number;    // ยอดผ่อนต่อเดือน
  remainingAmount: number;   // ยอดคงเหลือทั้งหมด

  // --- ข้อมูลอ้างอิง (ถ้ามีการผูกกับตารางผู้ใช้งาน) ---
  ownerId: string;           // ID ผู้ใช้งาน/เจ้าของรถ (หากระบบมีการผูก User)

  // --- ข้อมูลเสริม ---
  notes?: string;            // หมายเหตุเพิ่มเติม (Optional)
}